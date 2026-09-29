-- 028: Superadmin system
--
-- 1. Add is_superadmin column to admin_users
-- 2. Seed sh.siddharth04@gmail.com as the first superadmin
-- 3. Add is_superadmin() SECURITY DEFINER function (frontend uses this to gate
--    the Team page and the invite action)
-- 4. Add SELECT policy on admin_users so any admin can list teammates

ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS is_superadmin boolean NOT NULL DEFAULT false;

UPDATE admin_users
  SET is_superadmin = true
  WHERE email = 'sh.siddharth04@gmail.com';

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   admin_users
    WHERE  email        = lower(auth.jwt() ->> 'email')
      AND  is_superadmin = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_superadmin TO authenticated;

-- Any admin can read the full admin_users list (needed for Team page)
CREATE POLICY admin_users_select
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (is_admin());
