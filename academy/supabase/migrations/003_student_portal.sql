-- Student portal — enrolled students, resources, announcements
-- Also adds cohort field to sessions for course_class cohort assignment

-- ── Sessions: add cohort column ───────────────────────────────────────────────
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS cohort TEXT CHECK (cohort IN ('C1', 'C2'));

-- ── enrolled_students ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrolled_students (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  email       TEXT        UNIQUE NOT NULL,
  phone       TEXT,
  cohort      TEXT        NOT NULL CHECK (cohort IN ('C1', 'C2')),
  status      TEXT        NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'graduated', 'suspended')),
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at  TIMESTAMPTZ,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  notes       TEXT
);

-- ── student_resources ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_resources (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  description   TEXT,
  url           TEXT        NOT NULL,
  resource_type TEXT        CHECK (resource_type IN ('pdf', 'link', 'video', 'audio', 'other')),
  cohort        TEXT        NOT NULL CHECK (cohort IN ('C1', 'C2', 'all')),
  is_published  BOOLEAN     NOT NULL DEFAULT false,
  file_name     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── announcements ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT        NOT NULL,
  body         TEXT        NOT NULL,
  cohort       TEXT        NOT NULL CHECK (cohort IN ('C1', 'C2', 'all')),
  is_published BOOLEAN     NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE enrolled_students  ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_resources  ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements      ENABLE ROW LEVEL SECURITY;

-- Admin (anon key, client-side password gate — same pattern as all other tables)
CREATE POLICY "anon_all" ON enrolled_students  FOR ALL USING (true);
CREATE POLICY "anon_all" ON student_resources  FOR ALL USING (true);
CREATE POLICY "anon_all" ON announcements      FOR ALL USING (true);

-- Students (authenticated via magic link — JWT attached by supabase-js client)
CREATE POLICY "student_self" ON enrolled_students
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "student_resources_read" ON student_resources
  FOR SELECT TO authenticated
  USING (
    is_published = true AND (
      cohort = 'all' OR
      cohort = (SELECT cohort FROM enrolled_students WHERE user_id = auth.uid() LIMIT 1)
    )
  );

CREATE POLICY "student_announcements_read" ON announcements
  FOR SELECT TO authenticated
  USING (
    is_published = true AND (
      cohort = 'all' OR
      cohort = (SELECT cohort FROM enrolled_students WHERE user_id = auth.uid() LIMIT 1)
    )
  );

CREATE POLICY "student_sessions_read" ON sessions
  FOR SELECT TO authenticated
  USING (
    session_type = 'course_class' AND
    cohort = (SELECT cohort FROM enrolled_students WHERE user_id = auth.uid() LIMIT 1)
  );

-- ── Trigger: auto-link auth user to enrolled_students on first sign-in ────────
CREATE OR REPLACE FUNCTION link_enrolled_student_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE enrolled_students
  SET user_id = NEW.id
  WHERE email = NEW.email AND user_id IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION link_enrolled_student_user();
