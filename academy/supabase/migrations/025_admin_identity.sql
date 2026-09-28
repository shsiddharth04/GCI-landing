-- 025: Admin identity, is_admin(), and admin-scoped RLS policies
--
-- Adds admin_users table and is_admin() helper, then creates admin policies
-- on all tables the admin panel reads/writes. ADDITIVE ONLY — no existing
-- policies are dropped or revoked. Existing anon/student access is unchanged.
--
-- After Phase B4 (admin auth swap) ships to production, Phase C will drop
-- the now-redundant anon_all / mc_bookings_select etc. policies.

-- ── admin_users ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.admin_users (
  email text PRIMARY KEY CHECK (email = lower(email))
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
-- No RLS policies: admin_users is only ever read by is_admin() (SECURITY DEFINER)
-- and inserted into by service_role — both bypass RLS.

INSERT INTO public.admin_users (email)
VALUES ('sh.siddharth04@gmail.com')
ON CONFLICT DO NOTHING;

-- ── is_admin() ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE email = lower(auth.jwt() ->> 'email')
  );
$$;

REVOKE ALL     ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ── Admin ALL policies (full CRUD) ───────────────────────────────────────────

CREATE POLICY admin_all ON public.enrolled_students
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY admin_all ON public.announcements
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY admin_all ON public.student_resources
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY admin_all ON public.sessions
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY admin_all ON public.course_class_blocks
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY admin_all ON public.masterclass_bookings
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY admin_all ON public.registrations
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY admin_all ON public.practice_bookings
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY admin_all ON public.student_access_audit
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY admin_all ON public.masterclass_slot_overrides
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY admin_all ON public.instructors
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ── Admin SELECT policies (read-only; mutations via service_role Edge Fns) ───

CREATE POLICY admin_select ON public.masterclass_payments
  FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY admin_select ON public.course_payments
  FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY admin_select ON public.course_enrollments
  FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY admin_select ON public.course_callbacks
  FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY admin_select ON public.academy_waitlist
  FOR SELECT TO authenticated USING (is_admin());

-- ── Storage: admin policies ───────────────────────────────────────────────────

-- Invoices: admin can SELECT (download signed URLs)
CREATE POLICY admin_invoices_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'invoices' AND (storage.foldername(name))[1] != '..' AND is_admin());

-- Academy-resources: admin gets full CRUD
CREATE POLICY admin_resources_all ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'academy-resources' AND is_admin())
  WITH CHECK (bucket_id = 'academy-resources' AND is_admin());
