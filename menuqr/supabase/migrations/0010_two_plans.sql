-- ============================================================================
-- MenuQR — 0010_two_plans
--
-- Three tiers was a guess made before the product had customers. The offer is
-- two: a venue tries it free, and when it outgrows that there is one monthly
-- subscription. A third tier only makes the choice harder to explain to a café
-- owner over the phone.
--
-- Any venue already on `business` is moved to `pro` before the row goes, so no
-- subscription is left pointing at a plan that no longer exists — and moved
-- rather than dropped, because the venue paid for more than free.
-- ============================================================================

update public.subscriptions s
   set plan_id = (select id from public.subscription_plans where code = 'pro')
 where s.plan_id = (select id from public.subscription_plans where code = 'business');

delete from public.subscription_plans where code = 'business';
