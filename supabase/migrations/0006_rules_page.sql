-- ─────────────────────────────────────────────────────────────────────────
-- Flower & Love — Party rules page type (post-launch feature)
--
-- Adds "rules" as a first-class page, toggleable and reorderable through
-- the same Pages step as every other section. The actual rule text lives
-- in invitations.data (jsonb) as `partyRules: string[]`, the same place
-- rsvpQuestion/coverImageUrl already live — see InvitationDataExtra.
-- ─────────────────────────────────────────────────────────────────────────

alter type public.page_type add value if not exists 'rules';
