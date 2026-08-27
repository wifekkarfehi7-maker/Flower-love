-- ─────────────────────────────────────────────────────────────────────────
-- Flower & Love — Seed data
-- Run after 0001_init.sql. Safe to re-run (upserts on slug).
-- ─────────────────────────────────────────────────────────────────────────

insert into public.templates (slug, name, name_ar, category, description, status, theme, fonts, sort_order)
values
  ('luxury-gold', 'Luxury Gold', 'ذهبي فاخر', 'classic',
   'Deep charcoal backgrounds with gold foil accents and ornamental Arabic display type.',
   'active',
   '{"background":"#141210","surface":"#241f1c","primary":"#c9962e","accent":"#f0da96","text":"#f8edc8","textMuted":"#cbc6c0","backgroundStyle":"gradient","cardRadius":"ornate","buttonStyle":"outline-ornate","galleryLayout":"grid","countdownStyle":"ornate","dividerStyle":"ornament","motif":"gem"}',
   '{"heading":"amiri","body":"cairo"}', 1),

  ('elegant-white', 'Elegant White', 'أبيض أنيق', 'minimal',
   'Soft ivory and cream tones with fine serif type for a clean, timeless look.',
   'active',
   '{"background":"#faf7f0","surface":"#ffffff","primary":"#a97622","accent":"#e6c165","text":"#241f1c","textMuted":"#847970","backgroundStyle":"solid","cardRadius":"soft","buttonStyle":"pill","galleryLayout":"minimal","countdownStyle":"minimal","dividerStyle":"line","motif":"sun"}',
   '{"heading":"playfair","body":"inter"}', 2),

  ('floral', 'Floral', 'زهري', 'romantic',
   'Blush pink gradients with a hand-drawn floral motif and italic display type.',
   'active',
   '{"background":"#fbeef0","surface":"#f6dfe4","primary":"#c85566","accent":"#eda3ac","text":"#5c2230","textMuted":"#a8636f","backgroundStyle":"radial","cardRadius":"round","buttonStyle":"pill","galleryLayout":"romantic","countdownStyle":"circular","dividerStyle":"dots","motif":"flower"}',
   '{"heading":"amiri","body":"cairo"}', 3),

  ('romantic', 'Romantic', 'رومانسي', 'romantic',
   'Deep burgundy and rose tones with soft glow accents for an intimate feel.',
   'active',
   '{"background":"#26101a","surface":"#3c1620","primary":"#e17685","accent":"#f6c9cf","text":"#fbe4e6","textMuted":"#e0aab3","backgroundStyle":"gradient","cardRadius":"round","buttonStyle":"pill","galleryLayout":"polaroid","countdownStyle":"circular","dividerStyle":"ornament","motif":"sparkle"}',
   '{"heading":"amiri","body":"cairo"}', 4),

  ('modern', 'Modern', 'عصري', 'contemporary',
   'Slate blue-grey with sharp geometric lines and uppercase tracked type.',
   'active',
   '{"background":"#0a0e12","surface":"#1e2833","primary":"#8fa7bd","accent":"#ffffff","text":"#eef2f5","textMuted":"#8b98a3","backgroundStyle":"solid","cardRadius":"none","buttonStyle":"sharp","galleryLayout":"grid","countdownStyle":"minimal","dividerStyle":"line","motif":"square"}',
   '{"heading":"inter","body":"inter"}', 5),

  ('black-gold', 'Black & Gold', 'أسود وذهبي', 'prestige',
   'Near-black backgrounds with ornate gold detailing for a high-prestige feel.',
   'active',
   '{"background":"#000000","surface":"#1c1608","primary":"#dcaa42","accent":"#f0da96","text":"#f8edc8","textMuted":"#b8a878","backgroundStyle":"radial","cardRadius":"ornate","buttonStyle":"outline-ornate","galleryLayout":"masonry","countdownStyle":"ornate","dividerStyle":"ornament","motif":"moon"}',
   '{"heading":"amiri","body":"cairo"}', 6),

  ('traditional-arabic', 'Traditional Arabic', 'تراث عربي', 'heritage',
   'Emerald green and gold with arabesque border motifs and Diwani-inspired display type.',
   'active',
   '{"background":"#082420","surface":"#155048","primary":"#dcaa42","accent":"#f0da96","text":"#f8edc8","textMuted":"#a9c9c0","backgroundStyle":"pattern","cardRadius":"ornate","buttonStyle":"outline-ornate","galleryLayout":"carousel","countdownStyle":"ornate","dividerStyle":"ornament","motif":"wave"}',
   '{"heading":"amiri","body":"cairo"}', 7),

  ('minimal', 'Minimal', 'بسيط ونقي', 'minimalist',
   'Pure white and soft grey with generous whitespace and light-weight type.',
   'active',
   '{"background":"#ffffff","surface":"#f7f7f5","primary":"#4f463f","accent":"#c9962e","text":"#241f1c","textMuted":"#a89f97","backgroundStyle":"solid","cardRadius":"soft","buttonStyle":"sharp","galleryLayout":"minimal","countdownStyle":"minimal","dividerStyle":"none","motif":"sparkles"}',
   '{"heading":"inter","body":"inter"}', 8)
on conflict (slug) do update set
  name = excluded.name,
  name_ar = excluded.name_ar,
  category = excluded.category,
  description = excluded.description,
  status = excluded.status,
  theme = excluded.theme,
  fonts = excluded.fonts,
  sort_order = excluded.sort_order;

insert into public.pricing_plans (slug, name, name_ar, price, currency, period, description, features, is_watermarked, is_active, sort_order)
values
  ('free', 'Free', 'مجانية', 0, 'TND', 'trial',
   'Try the platform and explore what it can do.',
   '["Limited templates","Limited pages","Watermark","Draft only (no publishing)"]',
   true, true, 1),

  ('standard', 'Standard', 'أساسية', 89, 'TND', 'per_invitation',
   'A complete invitation, ready to publish and share.',
   '["All templates","All pages","No watermark","Publish and share your invitation"]',
   false, true, 2),

  ('premium', 'Premium', 'مميزة', 149, 'TND', 'per_invitation',
   'A complete luxury experience with advanced features.',
   '["Everything in Standard","Custom invitation URL","RSVP confirmation","Detailed analytics","Background music","Invitation QR code","Advanced customization"]',
   false, true, 3)
on conflict (slug) do update set
  name = excluded.name,
  name_ar = excluded.name_ar,
  price = excluded.price,
  currency = excluded.currency,
  period = excluded.period,
  description = excluded.description,
  features = excluded.features,
  is_watermarked = excluded.is_watermarked,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;
