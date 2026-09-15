-- 013: Capture live schema for masterclass_bookings and masterclass_slot_overrides
--
-- These two tables and the book_masterclass_slot() RPC were applied directly to
-- the live database (outside version control) and are the active booking system
-- as of 2026-09-15. This migration reproduces the live state exactly so the
-- migration history is complete. It is idempotent — safe to re-run.
--
-- The older registrations / book_session_seat() system (created in 001) still
-- exists in the live DB but is unreferenced dead code (see note at bottom).

-- ── masterclass_bookings ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS masterclass_bookings (
  id                uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_date         date        NOT NULL,
  slot_start_time   time        NOT NULL,
  slot_end_time     time        NOT NULL,
  name              text        NOT NULL,
  email             text        NOT NULL,
  phone             text        NOT NULL,
  status            text        NOT NULL DEFAULT 'confirmed',
  cancellation_token uuid       DEFAULT gen_random_uuid(),
  created_at        timestamptz DEFAULT now(),

  CONSTRAINT masterclass_bookings_status_check
    CHECK (status IN ('confirmed', 'waitlisted', 'cancelled'))
);

ALTER TABLE masterclass_bookings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'masterclass_bookings'
      AND policyname = 'mc_bookings_insert'
  ) THEN
    CREATE POLICY mc_bookings_insert ON masterclass_bookings
      FOR INSERT TO public WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'masterclass_bookings'
      AND policyname = 'mc_bookings_select'
  ) THEN
    CREATE POLICY mc_bookings_select ON masterclass_bookings
      FOR SELECT TO public USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'masterclass_bookings'
      AND policyname = 'mc_bookings_update'
  ) THEN
    CREATE POLICY mc_bookings_update ON masterclass_bookings
      FOR UPDATE TO public USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── masterclass_slot_overrides ───────────────────────────────────────────────
-- Allows admin to manually block or force-open individual time slots.
-- Unique on (slot_date, slot_start) — one override per slot.

CREATE TABLE IF NOT EXISTS masterclass_slot_overrides (
  id         uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_date  date        NOT NULL,
  slot_start time        NOT NULL,
  slot_end   time        NOT NULL,
  override   text        NOT NULL,    -- 'blocked' | 'open'
  reason     text,
  created_at timestamptz DEFAULT now(),

  CONSTRAINT masterclass_slot_overrides_slot_date_slot_start_key
    UNIQUE (slot_date, slot_start)
);

ALTER TABLE masterclass_slot_overrides ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'masterclass_slot_overrides'
      AND policyname = 'overrides_all'
  ) THEN
    CREATE POLICY overrides_all ON masterclass_slot_overrides
      FOR ALL TO public USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── book_masterclass_slot() RPC ──────────────────────────────────────────────
--
-- Called by SessionPicker.tsx → bookMasterclassSlot() in src/lib/db.ts.
--
-- Logic summary:
--   1. Check masterclass_slot_overrides: if 'blocked' → reject immediately.
--   2. Unless override = 'open', check sessions table for a course_class that
--      overlaps the requested window → reject if found (admin blocks practice
--      slots during course classes; same logic applies to masterclasses).
--   3. Count confirmed bookings for this slot. If >= p_slot_capacity → waitlist.
--   4. INSERT into masterclass_bookings with derived status, return {id, status}.
--
-- NOTE: capacity check is NOT guarded with FOR UPDATE (not valid on aggregates),
-- so under concurrent load two requests could both read count < capacity and
-- both get 'confirmed'. This is acceptable at current traffic volumes but is a
-- known race condition. Phase 2 will address this.

CREATE OR REPLACE FUNCTION public.book_masterclass_slot(
  p_date          date,
  p_start_time    time,
  p_end_time      time,
  p_name          text,
  p_email         text,
  p_phone         text,
  p_slot_capacity integer DEFAULT 3
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  v_confirmed_count INT;
  v_manual_override TEXT;
  v_class_blocked   BOOL;
  v_status          TEXT;
  v_id              UUID;
BEGIN
  -- Check manual override first
  SELECT override INTO v_manual_override
  FROM masterclass_slot_overrides
  WHERE slot_date  = p_date
    AND slot_start = p_start_time
  LIMIT 1;

  IF v_manual_override = 'blocked' THEN
    RETURN json_build_object('error', 'slot_blocked');
  END IF;

  -- Check course-class conflict (skip if admin forced open)
  IF v_manual_override IS DISTINCT FROM 'open' THEN
    SELECT EXISTS (
      SELECT 1 FROM sessions
      WHERE session_type = 'course_class'
        AND session_date  = p_date
        AND status NOT IN ('cancelled')
        AND start_time    < p_end_time
        AND end_time      > p_start_time
    ) INTO v_class_blocked;

    IF v_class_blocked THEN
      RETURN json_build_object('error', 'slot_blocked');
    END IF;
  END IF;

  -- Count confirmed bookings for this slot
  SELECT COUNT(*) INTO v_confirmed_count
  FROM masterclass_bookings
  WHERE slot_date       = p_date
    AND slot_start_time = p_start_time
    AND status          = 'confirmed';

  v_status := CASE
    WHEN v_confirmed_count >= p_slot_capacity THEN 'waitlisted'
    ELSE 'confirmed'
  END;

  INSERT INTO masterclass_bookings
    (slot_date, slot_start_time, slot_end_time, name, email, phone, status)
  VALUES
    (p_date, p_start_time, p_end_time, p_name, p_email, p_phone, v_status)
  RETURNING id INTO v_id;

  RETURN json_build_object('id', v_id, 'status', v_status);
END;
$$;

-- ── Dead code note ────────────────────────────────────────────────────────────
--
-- The following objects from 001_scheduling.sql still exist in the live DB but
-- are confirmed unreferenced in the active frontend and portal code:
--
--   - registrations table        (read only by admin/pages/Registrations.tsx,
--                                  which is stale — it queries the old table)
--   - book_session_seat() RPC    (defined in db.ts as bookSeat() but never
--                                  called from any component)
--   - sessions table             (still referenced by book_masterclass_slot()
--                                  for course_class conflict checks — LIVE)
--   - MasterclassForm.tsx        (writes to masterclass_registrations which
--                                  does not exist in the live DB — dead code)
--
-- Do not drop any of these yet. Cleanup is a separate, deliberate migration.
