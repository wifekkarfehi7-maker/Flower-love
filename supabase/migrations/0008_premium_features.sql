-- ─────────────────────────────────────────────────────────────────────────
-- Flower & Love — Premium features + publishing guard
--
-- 1. Publishing guard. The owner UPDATE policy on `invitations` lets a
--    customer write any column of their own row, so a direct API call could
--    set status = 'active' and is_watermarked = false without paying.
--    Publishing, the watermark, the public slug and the view counter are now
--    Flower & Love's to set: an admin, or one of the narrow SECURITY DEFINER
--    functions below. A customer's only status move is placing an order
--    (draft → pending_payment). New rows always start as unpublished drafts.
--    Orders get the same treatment: a customer's order always starts
--    unpaid, at the plan's real price, on one of their own invitations.
--
-- 2. Custom invitation URL (Premium). `set_invitation_slug` lets the owner
--    of an invitation with a Premium order choose its /invite/<slug>.
--
-- 3. Detailed analytics (Premium). Views are also counted per day, in
--    Tunisian time, so the owner can see when their guests opened it.
-- ─────────────────────────────────────────────────────────────────────────

-- ── 1. Publishing guard ─────────────────────────────────────────────────

create or replace function public.guard_invitation_publishing()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Only API callers are restricted. Admins, the service role and SECURITY
  -- DEFINER functions (which run as their owner, not as anon/authenticated)
  -- go through untouched.
  if current_user not in ('anon', 'authenticated') or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status := 'draft';
    new.is_watermarked := true;
    new.slug := null;
    new.view_count := 0;
    new.published_at := null;
    return new;
  end if;

  if new.status is distinct from old.status
     and not (old.status in ('draft', 'cancelled', 'expired') and new.status = 'pending_payment') then
    raise exception 'invitation status is set by Flower & Love' using errcode = '42501';
  end if;

  if new.is_watermarked is distinct from old.is_watermarked
     or new.slug is distinct from old.slug
     or new.view_count is distinct from old.view_count
     or new.published_at is distinct from old.published_at then
    raise exception 'publishing fields are set by Flower & Love' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger invitations_guard_publishing
  before insert or update on public.invitations
  for each row execute function public.guard_invitation_publishing();

create or replace function public.guard_order_insert()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  plan record;
begin
  if current_user not in ('anon', 'authenticated') or public.is_admin() then
    return new;
  end if;

  if not exists (select 1 from public.invitations where id = new.invitation_id and user_id = auth.uid()) then
    raise exception 'order must be for one of your invitations' using errcode = '42501';
  end if;

  if new.status not in ('draft', 'pending_payment') then
    new.status := 'pending_payment';
  end if;
  new.paid_at := null;
  new.activated_at := null;
  new.admin_notes := null;

  if new.plan_id is not null then
    select price, currency into plan from public.pricing_plans where id = new.plan_id and is_active;
    if not found then
      raise exception 'unknown plan' using errcode = '23503';
    end if;
    new.price := plan.price;
    new.currency := plan.currency;
  end if;

  return new;
end;
$$;

create trigger orders_guard_insert
  before insert on public.orders
  for each row execute function public.guard_order_insert();

-- ── 2. Custom invitation URL ────────────────────────────────────────────

-- True when the invitation has a live (not cancelled/expired) Premium order.
create or replace function public.invitation_has_premium(p_invitation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.orders o
    join public.pricing_plans p on p.id = o.plan_id
    where o.invitation_id = p_invitation_id
      and o.status in ('pending_payment', 'payment_review', 'paid', 'active')
      and p.slug = 'premium'
  );
$$;

revoke all on function public.invitation_has_premium(uuid) from public, anon, authenticated;

create or replace function public.set_invitation_slug(p_invitation_id uuid, p_slug text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug text := lower(btrim(coalesce(p_slug, '')));
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.invitations
    where id = p_invitation_id and (user_id = auth.uid() or public.is_admin())
  ) then
    raise exception 'not_found' using errcode = 'P0002';
  end if;

  if not public.is_admin() and not public.invitation_has_premium(p_invitation_id) then
    raise exception 'premium_required' using errcode = '42501';
  end if;

  -- 3–40 characters: latin letters, digits and single hyphens, no hyphen at either end.
  if v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or char_length(v_slug) not between 3 and 40 then
    raise exception 'invalid_slug' using errcode = '22023';
  end if;

  begin
    update public.invitations set slug = v_slug where id = p_invitation_id;
  exception when unique_violation then
    raise exception 'slug_taken' using errcode = '23505';
  end;

  return v_slug;
end;
$$;

revoke all on function public.set_invitation_slug(uuid, text) from public, anon;
grant execute on function public.set_invitation_slug(uuid, text) to authenticated;

-- ── 3. Views per day ────────────────────────────────────────────────────

create table public.invitation_daily_views (
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  day date not null,
  views integer not null default 0,
  primary key (invitation_id, day)
);

comment on table public.invitation_daily_views is 'Views of a published invitation per day (Africa/Tunis). Written only by increment_invitation_views.';

alter table public.invitation_daily_views enable row level security;

create policy "invitation_daily_views_select_own_or_admin"
  on public.invitation_daily_views for select
  using (
    exists (
      select 1 from public.invitations i
      where i.id = invitation_id and (i.user_id = auth.uid() or public.is_admin())
    )
  );

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

  if found then
    insert into public.invitation_daily_views (invitation_id, day, views)
    values (target_id, (now() at time zone 'Africa/Tunis')::date, 1)
    on conflict (invitation_id, day) do update set views = invitation_daily_views.views + 1;
  end if;
end;
$$;

revoke all on function public.increment_invitation_views(uuid) from public;
grant execute on function public.increment_invitation_views(uuid) to anon, authenticated;
