-- Adds email dispatch audit columns to course_class_blocks so the admin UI can
-- show whether a schedule notification has been sent, and to guard against
-- double-sending on accidental re-submits.

ALTER TABLE course_class_blocks
  ADD COLUMN IF NOT EXISTS email_sent       BOOLEAN     DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_sent_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_sent_count INTEGER     DEFAULT 0;
