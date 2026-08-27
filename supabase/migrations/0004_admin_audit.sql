-- ─────────────────────────────────────────────────────────────────────────
-- Flower & Love — Admin audit log RPC (Phase 8: Admin Dashboard)
--
-- `audit_logs` deliberately has no INSERT policy for any role (see
-- 0001_init.sql) — admin write actions (confirming payments, activating
-- invitations, editing pricing/templates) go through normal RLS-checked
-- table writes since `orders`/`payments`/`invitations`/`templates`/
-- `pricing_plans` policies already grant admins access via `is_admin()`.
-- The one thing RLS can't express is "let an admin insert an audit trail
-- of what they just did" without also letting anyone claim to be an
-- admin — so this SECURITY DEFINER function checks `is_admin()` itself
-- and is the *only* way to write an audit_logs row.
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.log_admin_action(
  p_action text,
  p_target_type text,
  p_target_id text default null,
  p_previous_status text default null,
  p_new_status text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if not public.is_admin() then
    raise exception 'log_admin_action: caller is not an admin';
  end if;

  insert into public.audit_logs (admin_id, action, target_type, target_id, previous_status, new_status, metadata)
  values (auth.uid(), p_action, p_target_type, p_target_id, p_previous_status, p_new_status, p_metadata)
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.log_admin_action(text, text, text, text, text, jsonb) from public;
grant execute on function public.log_admin_action(text, text, text, text, text, jsonb) to authenticated;
