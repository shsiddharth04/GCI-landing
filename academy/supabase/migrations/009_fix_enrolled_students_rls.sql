-- Restrict anon_all to the anon role only.
-- Previously it was TO public which meant authenticated students could see
-- every row in enrolled_students, causing .maybeSingle() to throw when
-- there are 2+ students.
DROP POLICY IF EXISTS anon_all ON enrolled_students;
CREATE POLICY anon_all ON enrolled_students FOR ALL TO anon USING (true);

-- Allow authenticated students to find their own row by email before user_id
-- is linked (first login). This is safe because email is unique.
DROP POLICY IF EXISTS student_self_by_email ON enrolled_students;
CREATE POLICY student_self_by_email ON enrolled_students FOR SELECT TO authenticated
  USING (lower(email) = lower(auth.email()));

-- Case-insensitive email match in link_my_enrollment (admin may have entered
-- mixed-case email, auth user is always created with lowercase).
DROP FUNCTION IF EXISTS link_my_enrollment();
CREATE OR REPLACE FUNCTION link_my_enrollment()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $body$
BEGIN
  UPDATE enrolled_students SET user_id = auth.uid()
  WHERE lower(email) = lower(auth.email()) AND user_id IS NULL;
  RETURN FOUND;
END;
$body$;
