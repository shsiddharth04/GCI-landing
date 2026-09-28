-- 024: Revoke unused privileges (interim hardening)
--
-- A2 from the security hardening plan.
--
-- Proof of safety:
--   practice_bookings anon_all: fetchAllPracticeBookings() in db.ts is exported
--     but never imported anywhere in src/. No anon caller. RPCs use SECURITY
--     DEFINER and don't need this policy.
--   student_access_audit anon_all: zero frontend references across all of src/
--     and supabase/functions/. Admin-only audit table.
--
-- No production feature depends on TRUNCATE, REFERENCES, or TRIGGER being
-- granted to anon or authenticated on any public table.

-- ── Revoke TRUNCATE / REFERENCES / TRIGGER from anon and authenticated ────────

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format(
      'REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM anon, authenticated', t);
  END LOOP;
END$$;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLES FROM anon, authenticated;

-- ── Drop dead anon_all policies ───────────────────────────────────────────────

-- practice_bookings: only live callers are SECURITY DEFINER RPCs + authenticated
-- student_read_own policy. fetchAllPracticeBookings() is dead code (never imported).
DROP POLICY IF EXISTS anon_all ON public.practice_bookings;

-- student_access_audit: admin-only table, zero frontend references.
DROP POLICY IF EXISTS anon_all ON public.student_access_audit;
