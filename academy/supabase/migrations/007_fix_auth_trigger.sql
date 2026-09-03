-- Drop the auth.users trigger that was causing "Database error saving new user".
-- link_enrolled_student_user fired on INSERT to auth.users and tried to UPDATE
-- enrolled_students, but failed under the supabase_auth_admin role context.
-- The user_id linkage is now handled by the link_my_enrollment() RPC called
-- from the portal on first login (SetPasswordPage after verifyOtp).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
