-- ─────────────────────────────────────────────────────────────────────────
-- Flower & Love — Cover layouts for three templates (P2a)
--
-- Data only, no schema change. Three templates name their own cover
-- composition in `theme.coverLayout`; every invitation on them, published or
-- draft, renders it from the template, so no invitation row is touched. The
-- other five templates keep no key and stay on the classic cover.
--
-- Minimal Luxe's muted text moves from #8A8175 (3.4:1 on its ivory) to
-- #6F675C (5.0:1). That correction only applies where the value is still the
-- original, so a colour an admin has since chosen is left alone.
--
-- Idempotent: `||` merges one key, and re-running changes nothing.
-- ─────────────────────────────────────────────────────────────────────────

update public.templates set theme = theme || '{"coverLayout":"editorial"}'::jsonb where slug = 'modern';
update public.templates set theme = theme || '{"coverLayout":"arch"}'::jsonb where slug = 'traditional-arabic';
update public.templates set theme = theme || '{"coverLayout":"midnight"}'::jsonb where slug = 'black-gold';

update public.templates
set theme = theme || '{"textMuted":"#6F675C"}'::jsonb
where slug = 'modern' and theme->>'textMuted' = '#8A8175';
