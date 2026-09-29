-- 027: Security hardening
--
-- 1. Revoke 8 admin-only RPCs from anon / authenticated / public
-- 2. Drop open-to-all SELECT on masterclass_bookings; serve just
--    payment_status via a tight SECURITY DEFINER RPC that SessionPicker uses
-- 3. Harden book_masterclass_slot to read slot capacity from masterclass_config
--    instead of trusting the caller-supplied p_slot_capacity parameter

-- ── 1. Revoke admin-only RPCs ─────────────────────────────────────────────────

DO $$
DECLARE
  fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'admin_reassign_registration',
    'admin_reschedule_session',
    'admin_set_student_practice_access',
    'admin_swap_registrations',
    'upsert_slot_override',
    'delete_slot_override',
    'ensure_practice_slots',
    'book_session_seat'
  ]
  LOOP
    BEGIN
      EXECUTE format(
        'REVOKE EXECUTE ON FUNCTION public.%I FROM PUBLIC, anon, authenticated',
        fn
      );
    EXCEPTION WHEN undefined_function THEN
      NULL;
    END;
  END LOOP;
END $$;

-- ── 2. Narrow masterclass_bookings SELECT ─────────────────────────────────────
-- Remove the unrestricted public SELECT that exposed PII (name, phone, email)
-- to any anon caller.  The admin_all policy (authenticated + is_admin()) remains.
-- SessionPicker polls payment_status for a booking it just created — serve that
-- one field via a security-definer function, no other data exposed.

DROP POLICY IF EXISTS mc_bookings_select ON masterclass_bookings;

CREATE OR REPLACE FUNCTION public.get_booking_payment_status(p_booking_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT payment_status
  FROM   masterclass_bookings
  WHERE  id = p_booking_id
  LIMIT  1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_booking_payment_status FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_booking_payment_status TO   anon, authenticated;

-- ── 3. Harden book_masterclass_slot ──────────────────────────────────────────
-- Reads slot capacity from masterclass_config instead of the caller's parameter.
-- p_slot_capacity kept in signature for backwards compatibility but is ignored.

CREATE OR REPLACE FUNCTION public.book_masterclass_slot(
  p_date          date,
  p_start_time    time without time zone,
  p_end_time      time without time zone,
  p_name          text,
  p_email         text,
  p_phone         text,
  p_slot_capacity integer DEFAULT 3
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_confirmed_count INT;
  v_manual_override TEXT;
  v_class_blocked   BOOL;
  v_status          TEXT;
  v_id              UUID;
  v_slot_capacity   INT;
BEGIN
  SELECT value::int INTO v_slot_capacity
  FROM   masterclass_config
  WHERE  key = 'slot_capacity';
  v_slot_capacity := COALESCE(v_slot_capacity, 1);

  PERFORM pg_advisory_xact_lock(
    (EXTRACT(EPOCH FROM p_date)::bigint / 86400)::int,
    (EXTRACT(HOUR FROM p_start_time)::int * 60
      + EXTRACT(MINUTE FROM p_start_time)::int)::int
  );

  SELECT override INTO v_manual_override
  FROM masterclass_slot_overrides
  WHERE slot_date  = p_date
    AND slot_start = p_start_time
  LIMIT 1;

  IF v_manual_override = 'blocked' THEN
    RETURN json_build_object('error', 'slot_blocked');
  END IF;

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

  SELECT COUNT(*) INTO v_confirmed_count
  FROM masterclass_bookings
  WHERE slot_date       = p_date
    AND slot_start_time = p_start_time
    AND status          = 'confirmed';

  v_status := CASE
    WHEN v_confirmed_count >= v_slot_capacity THEN 'waitlisted'
    ELSE 'confirmed'
  END;

  BEGIN
    INSERT INTO masterclass_bookings
      (slot_date, slot_start_time, slot_end_time, name, email, phone, status)
    VALUES
      (p_date, p_start_time, p_end_time, p_name, p_email, p_phone, v_status)
    RETURNING id INTO v_id;
  EXCEPTION WHEN unique_violation THEN
    RETURN json_build_object('error', 'already_registered');
  END;

  RETURN json_build_object('id', v_id, 'status', v_status);
END;
$function$;
