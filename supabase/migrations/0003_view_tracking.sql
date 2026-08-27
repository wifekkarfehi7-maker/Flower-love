-- ─────────────────────────────────────────────────────────────────────────
-- Flower & Love — View tracking (Phase 6: RSVP + Guest Management + Dashboard)
--
-- Anonymous visitors need to bump `invitations.view_count`, but the only
-- UPDATE policy on `invitations` is owner/admin-only (by design — a random
-- visitor should never be able to edit someone's invitation). A SECURITY
-- DEFINER function gives them a single, narrow capability: incrementing
-- the counter on an already-*active* invitation, nothing else.
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.increment_invitation_views(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.invitations
  set view_count = view_count + 1
  where id = target_id and status = 'active';
end;
$$;

revoke all on function public.increment_invitation_views(uuid) from public;
grant execute on function public.increment_invitation_views(uuid) to anon, authenticated;
