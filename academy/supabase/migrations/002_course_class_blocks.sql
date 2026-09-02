-- Course class blocks — admin adds C1/C2 class time ranges that block
-- masterclass slots and display with FOMO cohort labels on the booking page.

CREATE TABLE IF NOT EXISTS course_class_blocks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  block_date  DATE        NOT NULL,
  start_time  TIME        NOT NULL,
  end_time    TIME        NOT NULL,
  cohort      TEXT        NOT NULL CHECK (cohort IN ('C1', 'C2')),
  label       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE course_class_blocks ENABLE ROW LEVEL SECURITY;

-- Public site reads course blocks to determine slot availability
CREATE POLICY "anon_read" ON course_class_blocks
  FOR SELECT USING (true);

-- Admin portal writes (uses anon key; password gate is client-side)
CREATE POLICY "anon_write" ON course_class_blocks
  FOR ALL USING (true);
