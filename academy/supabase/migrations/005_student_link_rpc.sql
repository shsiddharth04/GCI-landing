-- RPC called on first magic-link login to link auth.uid() → enrolled_students.user_id.
-- SECURITY DEFINER bypasses RLS so the update can run before the row is reachable
-- by the student_self policy (which filters on user_id = auth.uid()).
-- Safe: only touches the row matching auth.email(), only when user_id IS NULL.
CREATE OR REPLACE FUNCTION link_my_enrollment()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE enrolled_students
  SET user_id = auth.uid()
  WHERE email = auth.email()
    AND user_id IS NULL;
END;
$$;
