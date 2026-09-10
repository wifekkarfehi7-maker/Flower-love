-- ─────────────────────────────────────────────────────────────────────────
-- Flower & Love — Seed data
-- Run after 0001_init.sql. Safe to re-run (upserts on slug).
-- ─────────────────────────────────────────────────────────────────────────

insert into public.templates (slug, name, name_ar, category, description, status, theme, fonts, sort_order)
values
  ('luxury-gold', 'Noir & Or', 'نوار وذهب', 'luxury',
   'Charcoal black with champagne gold foil, arabesque corners and a wax-sealed envelope.',
   'active',
   '{"background":"#0A0A0B","surface":"#17130E","primary":"#C9A24A","accent":"#EFDDAE","text":"#F5ECD8","textMuted":"#B9AC90","backgroundStyle":"gradient","cardRadius":"ornate","buttonStyle":"outline-ornate","galleryLayout":"grid","countdownStyle":"ornate","dividerStyle":"ornament","motif":"gem","openAnimation":"envelope","decorativeStyle":"arabesque","texture":"velvet","frameStyle":"ornate-corner","sealColor":"#7C1D2B","foil":true}',
   '{"heading":"cinzel","body":"cormorant","display":"amiri"}', 1),

  ('elegant-white', 'Ivoire & Perle', 'عاج ولؤلؤ', 'classic',
   'Ivory and pearl with orchid sprays, an embossed double rule and a folding card.',
   'active',
   '{"background":"#FBF8F3","surface":"#FFFFFF","primary":"#B99B5F","accent":"#E8D9BC","text":"#2A2621","textMuted":"#857B6C","backgroundStyle":"solid","cardRadius":"soft","buttonStyle":"pill","galleryLayout":"minimal","countdownStyle":"minimal","dividerStyle":"line","motif":"sun","openAnimation":"paper-fold","decorativeStyle":"pearl-bloom","texture":"paper","frameStyle":"double-rule","sealColor":"#D9C6A5","foil":true}',
   '{"heading":"cormorant","body":"cormorant","display":"naskh"}', 2),

  ('floral', 'Olivier & Champagne', 'زيتون وشمبانيا', 'botanical',
   'Sage and olive on warm ivory with botanical branches and a quiet light reveal.',
   'active',
   '{"background":"#F4F3EC","surface":"#FDFCF8","primary":"#7C8A6B","accent":"#C9B487","text":"#2E332A","textMuted":"#77806E","backgroundStyle":"solid","cardRadius":"soft","buttonStyle":"sharp","galleryLayout":"romantic","countdownStyle":"minimal","dividerStyle":"dots","motif":"flower","openAnimation":"minimal-fade","decorativeStyle":"olive-branch","texture":"linen","frameStyle":"hairline","sealColor":"#7C8A6B"}',
   '{"heading":"cormorant","body":"cormorant","display":"naskh"}', 3),

  ('romantic', 'Bordeaux & Or', 'بوردو وذهب', 'romantic',
   'Deep wine and champagne gold with garden roses behind parting satin curtains.',
   'active',
   '{"background":"#2A0E16","surface":"#45151F","primary":"#C9A24A","accent":"#E9C9A0","text":"#F7E7DF","textMuted":"#C9A69C","backgroundStyle":"gradient","cardRadius":"round","buttonStyle":"pill","galleryLayout":"polaroid","countdownStyle":"circular","dividerStyle":"ornament","motif":"sparkle","openAnimation":"curtain","decorativeStyle":"rose-burgundy","texture":"velvet","frameStyle":"ornate-corner","sealColor":"#E0C089","foil":true}',
   '{"heading":"cormorant","body":"cormorant","display":"amiri"}', 4),

  ('modern', 'Minimal Luxe', 'مينيمال فاخر', 'editorial',
   'Warm ivory, taupe and champagne with oversized type and generous negative space.',
   'active',
   '{"background":"#F6F2EC","surface":"#FFFDFA","primary":"#A08C6E","accent":"#D9C7A8","text":"#24211D","textMuted":"#8A8175","backgroundStyle":"solid","cardRadius":"none","buttonStyle":"sharp","galleryLayout":"grid","countdownStyle":"minimal","dividerStyle":"line","motif":"square","openAnimation":"minimal-fade","texture":"satin","frameStyle":"hairline","sealColor":"#A08C6E","foil":true}',
   '{"heading":"cinzel","body":"cormorant","display":"kufi"}', 5),

  ('black-gold', 'Onyx & Champagne', 'أونيكس وشمبانيا', 'luxury',
   'Near-black satin with champagne rules and a single champagne wax seal.',
   'active',
   '{"background":"#050505","surface":"#121212","primary":"#D8BC7E","accent":"#F2E4C1","text":"#F6F0E4","textMuted":"#A79C88","backgroundStyle":"radial","cardRadius":"none","buttonStyle":"sharp","galleryLayout":"masonry","countdownStyle":"ornate","dividerStyle":"line","motif":"moon","openAnimation":"wax-seal","texture":"satin","frameStyle":"double-rule","sealColor":"#D8BC7E","foil":true}',
   '{"heading":"cinzel","body":"cormorant","display":"naskh"}', 6),

  ('traditional-arabic', 'Royal Arabesque', 'أرابيسك ملكي', 'heritage',
   'Midnight navy and gold under an arch, with interlaced geometry and a gold seal.',
   'active',
   '{"background":"#071A2C","surface":"#0E2C46","primary":"#CBA95C","accent":"#EBD6A0","text":"#F4EBD6","textMuted":"#A9BACB","backgroundStyle":"gradient","cardRadius":"ornate","buttonStyle":"outline-ornate","galleryLayout":"carousel","countdownStyle":"ornate","dividerStyle":"ornament","motif":"wave","openAnimation":"wax-seal","decorativeStyle":"arabesque","texture":"velvet","frameStyle":"arch","sealColor":"#CBA95C","foil":true}',
   '{"heading":"amiri","body":"naskh","display":"amiri"}', 7),

  ('minimal', 'Blanc Satin', 'أبيض ساتان', 'minimal',
   'Pure white satin drawn back from the names, with almost no ornament at all.',
   'active',
   '{"background":"#FFFFFF","surface":"#F5F1EA","primary":"#9A8C7A","accent":"#DED2C0","text":"#1F1D1A","textMuted":"#8B8378","backgroundStyle":"solid","cardRadius":"soft","buttonStyle":"sharp","galleryLayout":"minimal","countdownStyle":"minimal","dividerStyle":"none","motif":"sparkles","openAnimation":"curtain","texture":"satin","sealColor":"#C9BBA6"}',
   '{"heading":"cormorant","body":"cormorant","display":"naskh"}', 8)
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
