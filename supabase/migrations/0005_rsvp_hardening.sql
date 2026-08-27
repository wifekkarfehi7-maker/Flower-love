-- ─────────────────────────────────────────────────────────────────────────
-- Flower & Love — RSVP hardening (Phase 9: SEO + Performance + Security)
--
-- `public.rsvps` is the only table anonymous visitors can write to (see
-- 0001_init.sql). The app's client-side form already bounds guest_count
-- (1-20) and is a plain HTML form, but nothing stops a direct API call
-- from sending an out-of-range guest_count or multi-megabyte text fields.
-- These CHECK constraints make those bounds real at the database layer,
-- which is this app's primary validation boundary (RLS-first, no separate
-- server-actions layer for most writes).
-- ─────────────────────────────────────────────────────────────────────────

alter table public.rsvps
  add constraint rsvps_guest_count_range check (guest_count between 1 and 50),
  add constraint rsvps_guest_name_length check (char_length(guest_name) between 1 and 200),
  add constraint rsvps_phone_length check (phone is null or char_length(phone) <= 30),
  add constraint rsvps_message_length check (message is null or char_length(message) <= 1000);
