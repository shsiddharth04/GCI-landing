-- GCI Music Academy — Scheduling Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)
-- Project: tyxioxfmkflzokzvfaxc

-- ─── 1. Tables ──────────────────────────────────────────────────────────────

create table if not exists instructors (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  bio        text,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists courses (
  id     uuid primary key default gen_random_uuid(),
  name   text not null,
  status text not null default 'active' check (status in ('active', 'archived'))
);

create table if not exists sessions (
  id                 uuid primary key default gen_random_uuid(),
  instructor_id      uuid not null references instructors(id),
  session_type       text not null check (session_type in ('masterclass', 'course_class')),
  course_id          uuid references courses(id),
  session_date       date not null,
  start_time         time not null,
  end_time           time not null,
  location           text not null,
  capacity           int not null check (capacity > 0),
  seats_booked       int not null default 0 check (seats_booked >= 0),
  status             text not null default 'open' check (status in ('open', 'full', 'cancelled', 'rescheduled')),
  rescheduled_from_id uuid references sessions(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists registrations (
  id                 uuid primary key default gen_random_uuid(),
  session_id         uuid not null references sessions(id),
  name               text not null,
  email              text not null,
  phone              text not null,
  status             text not null default 'confirmed' check (status in ('confirmed', 'waitlisted', 'cancelled')),
  cancellation_token uuid not null default gen_random_uuid(),
  reminder_sent_24h  boolean not null default false,
  reminder_sent_1h   boolean not null default false,
  created_at         timestamptz not null default now()
);

-- Prevent duplicate phone per session
create unique index if not exists registrations_phone_session_unique
  on registrations(session_id, phone)
  where status != 'cancelled';

-- ─── 2. Row-level security ───────────────────────────────────────────────────

alter table instructors enable row level security;
alter table courses enable row level security;
alter table sessions enable row level security;
alter table registrations enable row level security;

-- Instructors: public read
create policy "instructors_read" on instructors for select using (true);

-- Courses: public read (active only)
create policy "courses_read" on courses for select using (status = 'active');

-- Sessions: public read (non-cancelled)
create policy "sessions_read" on sessions for select using (status != 'cancelled');

-- Registrations: no direct public access — insert only via RPC (security definer)
-- Admin reads handled by service_role key
create policy "registrations_cancel_self" on registrations
  for update using (cancellation_token = current_setting('app.cancellation_token', true)::uuid);

-- ─── 3. RPC: book a seat (atomic, handles waitlist) ─────────────────────────

create or replace function book_session_seat(
  p_session_id uuid,
  p_name       text,
  p_email      text,
  p_phone      text
) returns json
language plpgsql
security definer
as $$
declare
  v_capacity int;
  v_booked   int;
  v_reg_id   uuid;
  v_status   text;
begin
  select capacity, seats_booked
    into v_capacity, v_booked
    from sessions
   where id = p_session_id
     and status != 'cancelled'
  for update;

  if not found then
    return json_build_object('error', 'session_not_found');
  end if;

  if v_booked < v_capacity then
    v_status := 'confirmed';
    update sessions
       set seats_booked = seats_booked + 1,
           status       = case when seats_booked + 1 >= v_capacity then 'full' else 'open' end,
           updated_at   = now()
     where id = p_session_id;
  else
    v_status := 'waitlisted';
  end if;

  insert into registrations (session_id, name, email, phone, status)
    values (p_session_id, p_name, p_email, p_phone, v_status)
    returning id into v_reg_id;

  return json_build_object('registration_id', v_reg_id, 'status', v_status);
end;
$$;

-- ─── 4. RPC: swap two registrants between sessions ──────────────────────────

create or replace function admin_swap_registrations(
  p_registration_id_1 uuid,
  p_registration_id_2 uuid
) returns void
language plpgsql
security definer
as $$
declare
  v_session_1 uuid;
  v_session_2 uuid;
begin
  select session_id into v_session_1 from registrations where id = p_registration_id_1 for update;
  select session_id into v_session_2 from registrations where id = p_registration_id_2 for update;

  update registrations set session_id = v_session_2 where id = p_registration_id_1;
  update registrations set session_id = v_session_1 where id = p_registration_id_2;
end;
$$;

-- ─── 5. RPC: move a single registrant to a different session ─────────────────

create or replace function admin_reassign_registration(
  p_registration_id uuid,
  p_new_session_id  uuid,
  p_force           boolean default false
) returns json
language plpgsql
security definer
as $$
declare
  v_old_session_id uuid;
  v_capacity       int;
  v_booked         int;
begin
  select session_id into v_old_session_id
    from registrations where id = p_registration_id for update;

  select capacity, seats_booked
    into v_capacity, v_booked
    from sessions where id = p_new_session_id for update;

  if v_booked >= v_capacity and not p_force then
    return json_build_object('success', false, 'reason', 'target session full');
  end if;

  update sessions set seats_booked = seats_booked - 1, updated_at = now() where id = v_old_session_id;
  update sessions set seats_booked = seats_booked + 1, updated_at = now() where id = p_new_session_id;
  update registrations set session_id = p_new_session_id where id = p_registration_id;

  return json_build_object('success', true);
end;
$$;

-- ─── 6. RPC: reschedule a session ────────────────────────────────────────────

create or replace function admin_reschedule_session(
  p_session_id     uuid,
  p_new_date       date,
  p_new_start_time time,
  p_new_end_time   time
) returns void
language plpgsql
security definer
as $$
begin
  update sessions
     set session_date = p_new_date,
         start_time   = p_new_start_time,
         end_time     = p_new_end_time,
         status       = 'rescheduled',
         updated_at   = now()
   where id = p_session_id;
end;
$$;

-- ─── 7. RPC: cancel a registration (self-serve via token) ───────────────────

create or replace function cancel_registration(
  p_cancellation_token uuid
) returns json
language plpgsql
security definer
as $$
declare
  v_reg_id     uuid;
  v_session_id uuid;
  v_status     text;
begin
  select id, session_id, status
    into v_reg_id, v_session_id, v_status
    from registrations
   where cancellation_token = p_cancellation_token
     and status != 'cancelled'
  for update;

  if not found then
    return json_build_object('success', false, 'reason', 'invalid_or_already_cancelled');
  end if;

  update registrations set status = 'cancelled' where id = v_reg_id;

  -- Only decrement if they held a confirmed seat
  if v_status = 'confirmed' then
    update sessions
       set seats_booked = greatest(0, seats_booked - 1),
           status       = case when status = 'full' then 'open' else status end,
           updated_at   = now()
     where id = v_session_id;
  end if;

  return json_build_object('success', true);
end;
$$;

-- ─── 8. Seed: initial instructor ─────────────────────────────────────────────

insert into instructors (name, bio, active)
values (
  'Divith Chowdhary',
  'Performing as UNTITLED. Trained under the founder of The Music Academy. Founder, Gig Culture India.',
  true
)
on conflict do nothing;

-- ─── Done. ───────────────────────────────────────────────────────────────────
-- After running:
-- 1. Copy the instructor UUID from: SELECT id FROM instructors;
-- 2. Create your first session in the admin Schedule page.
-- 3. Confirm pg_cron is available if you want automated reminders (Dashboard → Extensions).
