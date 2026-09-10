-- ============================================================================
-- MenuQR — 0006_team
-- Owners add staff by email. Profiles are not readable across venues, so the
-- lookup happens inside a SECURITY DEFINER function that first proves the
-- caller owns the venue and only ever returns "added" or "no such account" —
-- never any other user's data.
-- ============================================================================

create or replace function public.add_restaurant_member_by_email(
  p_restaurant uuid,
  p_email text,
  p_role public.restaurant_role default 'staff'
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid;
  v_member uuid;
begin
  if not public.can_administer_restaurant(p_restaurant) then
    raise exception 'Not allowed' using errcode = 'insufficient_privilege';
  end if;

  if p_role = 'owner' then
    raise exception 'OWNER_ROLE_NOT_ASSIGNABLE' using errcode = 'check_violation';
  end if;

  select id into v_user
  from public.profiles
  where lower(email) = lower(trim(p_email))
  limit 1;

  if v_user is null then
    raise exception 'USER_NOT_FOUND' using errcode = 'no_data_found';
  end if;

  if exists (
    select 1 from public.restaurant_members
    where restaurant_id = p_restaurant and user_id = v_user
  ) then
    raise exception 'ALREADY_A_MEMBER' using errcode = 'unique_violation';
  end if;

  insert into public.restaurant_members (restaurant_id, user_id, role)
  values (p_restaurant, v_user, p_role)
  returning id into v_member;

  return v_member;
end;
$$;

revoke all on function public.add_restaurant_member_by_email(uuid, text, public.restaurant_role) from public;
grant execute on function public.add_restaurant_member_by_email(uuid, text, public.restaurant_role) to authenticated;
