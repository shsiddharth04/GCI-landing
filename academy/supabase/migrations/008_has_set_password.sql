-- Track whether a student has completed password setup
ALTER TABLE enrolled_students ADD COLUMN IF NOT EXISTS has_set_password BOOLEAN NOT NULL DEFAULT FALSE;

-- Returns true if this is the first sign-in (user_id was null and just got linked)
DROP FUNCTION IF EXISTS link_my_enrollment();
CREATE OR REPLACE FUNCTION link_my_enrollment()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $body$
BEGIN
  UPDATE enrolled_students SET user_id = auth.uid()
  WHERE email = auth.email() AND user_id IS NULL;
  RETURN FOUND;
END;
$body$;

-- Called after updateUser({ password }) succeeds in SetPasswordPage
CREATE OR REPLACE FUNCTION mark_password_set()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $body$
BEGIN
  UPDATE enrolled_students SET has_set_password = true WHERE user_id = auth.uid();
END;
$body$;
