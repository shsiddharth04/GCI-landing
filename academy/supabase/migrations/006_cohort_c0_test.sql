-- Add C0 (internal test cohort) to all cohort CHECK constraints.
-- C0 is only visible to the super admin and is used for testing the portal.
ALTER TABLE sessions
  DROP CONSTRAINT IF EXISTS sessions_cohort_check,
  ADD CONSTRAINT sessions_cohort_check CHECK (cohort IN ('C0','C1','C2','C3','C4','C5'));

ALTER TABLE course_class_blocks
  DROP CONSTRAINT IF EXISTS course_class_blocks_cohort_check,
  ADD CONSTRAINT course_class_blocks_cohort_check CHECK (cohort IN ('C0','C1','C2','C3','C4','C5'));

ALTER TABLE enrolled_students
  DROP CONSTRAINT IF EXISTS enrolled_students_cohort_check,
  ADD CONSTRAINT enrolled_students_cohort_check CHECK (cohort IN ('C0','C1','C2','C3','C4','C5'));

ALTER TABLE student_resources
  DROP CONSTRAINT IF EXISTS student_resources_cohort_check,
  ADD CONSTRAINT student_resources_cohort_check CHECK (cohort IN ('C0','C1','C2','C3','C4','C5','all'));

ALTER TABLE announcements
  DROP CONSTRAINT IF EXISTS announcements_cohort_check,
  ADD CONSTRAINT announcements_cohort_check CHECK (cohort IN ('C0','C1','C2','C3','C4','C5','all'));
