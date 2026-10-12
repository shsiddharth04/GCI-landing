-- 027: Grant EXECUTE on slot override RPCs to authenticated role
--
-- upsert_slot_override and delete_slot_override are SECURITY DEFINER functions
-- called by the admin Schedule page (Block / Unblock / Force-open buttons in
-- the Masterclass slots panel). Their proacl was restricted to postgres and
-- service_role only — neither anon nor authenticated had EXECUTE permission,
-- causing all three operations to fail silently (errors are swallowed in the
-- UI catch blocks).
--
-- The admin now uses Supabase Auth (authenticated role), so granting to
-- authenticated is the correct minimal fix. anon is excluded intentionally —
-- public callers have no business modifying admin slot overrides.

GRANT EXECUTE ON FUNCTION public.upsert_slot_override(date, time without time zone, time without time zone, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_slot_override(uuid) TO authenticated;
