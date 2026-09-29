-- 026: Walk-in cash payment support
--
-- 1. masterclass_config  — server-side slot capacity
-- 2. masterclass_payments — payment_method, nullable razorpay cols, audit fields, concurrent-click guard
-- 3. admin_record_walkin_cash() — atomic booking + cash payment; service_role only

-- ── 1. masterclass_config ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS masterclass_config (
  key   text PRIMARY KEY,
  value text NOT NULL
);

ALTER TABLE masterclass_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY config_authenticated_select ON masterclass_config
  FOR SELECT TO authenticated USING (true);

INSERT INTO masterclass_config (key, value)
VALUES ('slot_capacity', '1')
ON CONFLICT (key) DO NOTHING;

-- ── 2. masterclass_payments additions ────────────────────────────────────────

ALTER TABLE masterclass_payments
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'razorpay'
    CHECK (payment_method IN ('razorpay', 'cash'));

ALTER TABLE masterclass_payments
  ALTER COLUMN razorpay_order_id DROP NOT NULL;

ALTER TABLE masterclass_payments
  ADD COLUMN IF NOT EXISTS recorded_by text,
  ADD COLUMN IF NOT EXISTS note        text;

-- concurrent-click guard: one paid cash row per booking
CREATE UNIQUE INDEX IF NOT EXISTS masterclass_payments_cash_unique_idx
  ON masterclass_payments (masterclass_booking_id)
  WHERE payment_method = 'cash' AND status = 'paid';

-- ── 3. admin_record_walkin_cash ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_record_walkin_cash(
  p_date        date,
  p_start_time  time,
  p_name        text,
  p_email       text,
  p_phone       text,
  p_recorded_by text,
  p_note        text DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name  text := trim(p_name);
  v_email text := lower(trim(p_email));
  v_phone text := regexp_replace(p_phone, '[\s\-]', '', 'g');
  v_end_time          time := p_start_time + interval '30 minutes';
  v_slot_capacity     int;
  v_confirmed_count   int;
  v_manual_override   text;
  v_class_blocked     bool;
  v_booking_id        uuid;
  v_invoice_number    text;
  v_today             date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
BEGIN

  IF p_date < v_today THEN
    RETURN json_build_object('error', 'past_date');
  END IF;

  IF EXTRACT(MINUTE FROM p_start_time) NOT IN (0, 30)
  OR EXTRACT(SECOND FROM p_start_time) != 0 THEN
    RETURN json_build_object('error', 'invalid_slot_grid');
  END IF;

  IF length(v_name) < 2 THEN
    RETURN json_build_object('error', 'invalid_name');
  END IF;

  IF v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN json_build_object('error', 'invalid_email');
  END IF;

  IF v_phone !~ '^(\+91)?[6-9]\d{9}$' THEN
    RETURN json_build_object('error', 'invalid_phone');
  END IF;

  SELECT value::int INTO v_slot_capacity
  FROM masterclass_config WHERE key = 'slot_capacity';
  v_slot_capacity := COALESCE(v_slot_capacity, 1);

  PERFORM pg_advisory_xact_lock(
    (EXTRACT(EPOCH FROM p_date)::bigint / 86400)::int,
    (EXTRACT(HOUR  FROM p_start_time)::int * 60
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
        AND start_time    < v_end_time
        AND end_time      > p_start_time
    ) INTO v_class_blocked;

    IF v_class_blocked THEN
      RETURN json_build_object('error', 'course_class_conflict');
    END IF;
  END IF;

  SELECT COUNT(*) INTO v_confirmed_count
  FROM masterclass_bookings
  WHERE slot_date       = p_date
    AND slot_start_time = p_start_time
    AND status          = 'confirmed';

  IF v_confirmed_count >= v_slot_capacity THEN
    RETURN json_build_object('error', 'slot_full');
  END IF;

  BEGIN
    INSERT INTO masterclass_bookings
      (slot_date, slot_start_time, slot_end_time,
       name, email, phone, status, payment_status)
    VALUES
      (p_date, p_start_time, v_end_time,
       v_name, v_email, v_phone, 'confirmed', 'paid')
    RETURNING id INTO v_booking_id;
  EXCEPTION WHEN unique_violation THEN
    RETURN json_build_object('error', 'already_registered');
  END;

  SELECT next_invoice_number('MC') INTO v_invoice_number;

  INSERT INTO masterclass_payments
    (masterclass_booking_id,
     razorpay_order_id, razorpay_payment_id,
     status, payment_method, amount,
     invoice_number, recorded_by, note)
  VALUES
    (v_booking_id,
     NULL, NULL,
     'paid', 'cash', 17900,
     v_invoice_number, p_recorded_by, p_note);

  RETURN json_build_object(
    'booking_id',     v_booking_id,
    'invoice_number', v_invoice_number
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_record_walkin_cash FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_record_walkin_cash FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_record_walkin_cash FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_record_walkin_cash TO   service_role;
