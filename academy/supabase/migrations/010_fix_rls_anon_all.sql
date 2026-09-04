-- Restrict anon_all on student_resources and announcements to anon role only.
-- Previously TO public meant authenticated students bypassed the cohort-based
-- student_resources_read / student_announcements_read policies and could see
-- every published resource/announcement regardless of cohort.
DROP POLICY IF EXISTS anon_all ON student_resources;
CREATE POLICY anon_all ON student_resources FOR ALL TO anon USING (true);

DROP POLICY IF EXISTS anon_all ON announcements;
CREATE POLICY anon_all ON announcements FOR ALL TO anon USING (true);
