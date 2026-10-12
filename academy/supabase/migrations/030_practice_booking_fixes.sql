-- 028: Practice booking fixes
--
-- Fix 1: Grant EXECUTE on admin_set_student_practice_access to authenticated
--   Without this, the admin "unlock/lock" buttons on the Students tab silently
--   fail. Every student defaults to practice_access_mode = 'locked', so no
--   student can book practice slots until the admin unlocks them — but the
--   admin can't, because the RPC refuses to execute. This is the root cause of
--   practice booking being non-functional for all students.
--
-- Fix 2: Rewrite book_practice_slot with:
--   a) 24-hour advance booking window — slots starting within 24h of now()
--      cannot be booked; returns error code 'inside_booking_window'.
--   b) Cohort block check expanded to ALL cohorts — the studio is one physical
--      space. The old check only blocked the student's own cohort's class
--      blocks; other cohorts' blocks were invisible to the RPC and left an
--      unguarded gap.

-- ── Fix 1 ─────────────────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION public.admin_set_student_practice_access(
  uuid, text, timestamptz, text, text
) TO authenticated;

-- ── Fix 2 ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.book_practice_slot(
  p_enrolled_student_id uuid,
  p_session_date        date,
  p_start_time          time without time zone,
  p_end_time            time without time zone
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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

  -- 24-hour advance booking window
  IF (p_session_date + p_start_time) AT TIME ZONE 'Asia/Kolkata' < now() + interval '24 hours' THEN
    RETURN json_build_object('error', 'inside_booking_window');
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

  -- Check no course_class_block (any cohort — studio is a single space) overlaps this window
  IF EXISTS (
    SELECT 1 FROM course_class_blocks
     WHERE block_date = p_session_date
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
$function$;
