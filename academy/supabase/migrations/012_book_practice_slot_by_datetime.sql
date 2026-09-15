-- 012: Replace book_practice_slot RPC with date/time-based signature
--
-- The new approach computes practice vacancies client-side from gaps in the
-- schedule. Students book a vacant time slot; the RPC creates the sessions row
-- on-the-fly and handles all race-condition checking atomically.

-- Drop old signature (took p_session_id uuid, p_enrolled_student_id uuid)
DROP FUNCTION IF EXISTS book_practice_slot(uuid, uuid);

-- Drop ensure_practice_slots (no longer needed — vacancies computed client-side)
DROP FUNCTION IF EXISTS ensure_practice_slots(date[]);

-- Partial unique index guards concurrent bookings racing on the same slot.
-- Using CREATE INDEX IF NOT EXISTS so re-running is safe.
CREATE UNIQUE INDEX IF NOT EXISTS sessions_practice_slot_uniq
  ON sessions (session_date, start_time, end_time)
  WHERE session_type = 'practice_session' AND status != 'cancelled';

-- ── New RPC ───────────────────────────────────────────────────────────────────
--
-- book_practice_slot(p_enrolled_student_id, p_session_date, p_start_time, p_end_time)
--
-- Returns one of:
--   { booking_id, session_id, status: 'confirmed' }
--   { error: 'invalid_slot' | 'student_not_found' | 'access_locked' |
--             'noshowblock' [, until] | 'daily_cap_reached' |
--             'slot_no_longer_available' | 'no_instructor_found' }

CREATE OR REPLACE FUNCTION book_practice_slot(
  p_enrolled_student_id uuid,
  p_session_date        date,
  p_start_time          time,
  p_end_time            time
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  v_student       enrolled_students%ROWTYPE;
  v_instructor_id uuid;
  v_session_id    uuid;
  v_booking_id    uuid;
  v_start_mins    int;
  v_end_mins      int;
  v_day_bookings  int;
  v_location      text := '11th Floor, The Capital, Next to CDS, Gurugram';
BEGIN
  -- Validate: must be a 30-minute slot within studio hours (10:00–20:00)
  v_start_mins := EXTRACT(HOUR FROM p_start_time)::int * 60 + EXTRACT(MINUTE FROM p_start_time)::int;
  v_end_mins   := EXTRACT(HOUR FROM p_end_time)::int   * 60 + EXTRACT(MINUTE FROM p_end_time)::int;
  IF v_end_mins - v_start_mins != 30
     OR v_start_mins < 600
     OR v_end_mins   > 1200 THEN
    RETURN json_build_object('error', 'invalid_slot');
  END IF;

  -- Fetch + lock student row (prevents concurrent noshowblock races)
  SELECT * INTO v_student
    FROM enrolled_students
   WHERE id = p_enrolled_student_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'student_not_found');
  END IF;
  IF v_student.practice_access_mode = 'locked' THEN
    RETURN json_build_object('error', 'access_locked');
  END IF;
  IF v_student.blocked_until IS NOT NULL AND v_student.blocked_until > now() THEN
    RETURN json_build_object('error', 'noshowblock', 'until', v_student.blocked_until);
  END IF;

  -- Daily cap: max 2 confirmed practice bookings per student per date
  SELECT COUNT(*) INTO v_day_bookings
    FROM practice_bookings pb
    JOIN sessions s ON s.id = pb.session_id
   WHERE pb.enrolled_student_id = p_enrolled_student_id
     AND pb.status = 'confirmed'
     AND s.session_date = p_session_date;
  IF v_day_bookings >= 2 THEN
    RETURN json_build_object('error', 'daily_cap_reached');
  END IF;

  -- Check no existing non-cancelled session overlaps this window
  IF EXISTS (
    SELECT 1 FROM sessions
     WHERE session_date = p_session_date
       AND status       != 'cancelled'
       AND start_time   < p_end_time
       AND end_time     > p_start_time
  ) THEN
    RETURN json_build_object('error', 'slot_no_longer_available');
  END IF;

  -- Check no course_class_block for the student's cohort overlaps this window
  IF EXISTS (
    SELECT 1 FROM course_class_blocks
     WHERE cohort     = v_student.cohort
       AND block_date = p_session_date
       AND start_time < p_end_time
       AND end_time   > p_start_time
  ) THEN
    RETURN json_build_object('error', 'slot_no_longer_available');
  END IF;

  -- Pick default instructor (nullable in schema; set for data consistency)
  SELECT id INTO v_instructor_id FROM instructors WHERE active = true LIMIT 1;

  -- Create the practice session row; unique index catches any remaining race
  BEGIN
    INSERT INTO sessions (
      instructor_id, session_type,       session_date,
      start_time,    end_time,           location,
      capacity,      seats_booked,       status
    ) VALUES (
      v_instructor_id, 'practice_session', p_session_date,
      p_start_time,    p_end_time,         v_location,
      1,               1,                  'full'
    )
    RETURNING id INTO v_session_id;
  EXCEPTION WHEN unique_violation THEN
    RETURN json_build_object('error', 'slot_no_longer_available');
  END;

  -- Create the booking record
  INSERT INTO practice_bookings (session_id, enrolled_student_id, status)
  VALUES (v_session_id, p_enrolled_student_id, 'confirmed')
  RETURNING id INTO v_booking_id;

  RETURN json_build_object(
    'booking_id', v_booking_id,
    'session_id', v_session_id,
    'status',     'confirmed'
  );
END;
$$;
