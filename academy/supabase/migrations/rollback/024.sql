-- Rollback for 024_revoke_unused_privileges.sql

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format(
      'GRANT TRUNCATE, REFERENCES, TRIGGER ON public.%I TO anon, authenticated', t);
  END LOOP;
END$$;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT TRUNCATE, REFERENCES, TRIGGER ON TABLES TO anon, authenticated;

CREATE POLICY IF NOT EXISTS anon_all ON public.practice_bookings
  FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS anon_all ON public.student_access_audit
  FOR ALL TO public USING (true) WITH CHECK (true);
