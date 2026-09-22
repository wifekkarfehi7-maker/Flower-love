import type { Locale } from "@/lib/i18n/config";
import type { TemplateRecord, TemplateTheme } from "@/types/invitation";
import { getTemplatePreview, type PreviewImage } from "./previews";

/**
 * How a template is presented in the gallery — marketing copy, kept apart
 * from the theme itself so the design data stays pure. Keyed by slug; a
 * template without an entry (added later from the admin panel) falls back
 * to its own `description`.
 */
const BLURBS: Record<string, Record<Locale, string>> = {
  "luxury-gold": {
    ar: "أسود مخمليّ وذهب، ظرفٌ مختوم بالشمع القرمزيّ وزخارف أرابيسك.",
    fr: "Noir velours et or, une enveloppe scellée de cire carmin, des arabesques.",
    en: "Velvet black and gold, an envelope sealed in crimson wax, arabesque detail.",
  },
  "elegant-white": {
    ar: "عاجٌ ولآلئ، بطاقة تنفتح كورقة مطويّة داخل إطار مزدوج.",
    fr: "Ivoire et perle, une carte qui se déplie dans un double filet.",
    en: "Ivory and pearl, a card that unfolds within a double rule.",
  },
  floral: {
    ar: "أغصان الزيتون على كتّان بلون الشمبانيا، أناقة متوسطيّة هادئة.",
    fr: "Branches d'olivier sur lin champagne, une élégance méditerranéenne.",
    en: "Olive branches on champagne linen — quiet Mediterranean elegance.",
  },
  romantic: {
    ar: "بوردو وذهب، ستارة تنفرج عن ورود قانية.",
    fr: "Bordeaux et or, un rideau qui s'ouvre sur des roses profondes.",
    en: "Bordeaux and gold, a curtain drawing back on deep roses.",
  },
  modern: {
    ar: "خطوط رفيعة وخطّ كوفيّ حديث، فخامة في أقلّ التفاصيل.",
    fr: "Filets fins et coufique moderne, le luxe réduit à l'essentiel.",
    en: "Hairlines and modern Kufic — luxury pared to the essential.",
  },
  "black-gold": {
    ar: "أونيكس وشمبانيا، ختمٌ شمعيّ ذهبيّ ينكسر عند الفتح.",
    fr: "Onyx et champagne, un sceau de cire dorée qui se brise à l'ouverture.",
    en: "Onyx and champagne, a gold wax seal that breaks as it opens.",
  },
  "traditional-arabic": {
    ar: "كحليّ ملكيّ وقوسٌ أندلسيّ، أرابيسك وختمٌ ذهبيّ.",
    fr: "Bleu royal et arche andalouse, arabesques et sceau doré.",
    en: "Royal navy and an Andalusian arch, arabesque and a gold seal.",
  },
  minimal: {
    ar: "أبيض ساتان وستارة ناعمة، صفاءٌ تامّ بلا زخرفة.",
    fr: "Blanc satin, un rideau léger, une pureté sans ornement.",
    en: "White satin, a soft curtain, purity without ornament.",
  },
};

type OpeningStyle = NonNullable<TemplateTheme["openAnimation"]>;

/** Where "use this template" leads: a new draft with the template already chosen. */
export function templateUseHref(slug: string) {
  return `/invitations/new?template=${encodeURIComponent(slug)}`;
}

/** What the guest sees first — the one thing a static card can't show, so it's named. */
export const OPENING_LABELS: Record<OpeningStyle, Record<Locale, string>> = {
  envelope: { ar: "ظرف مختوم", fr: "Enveloppe scellée", en: "Sealed envelope" },
  curtain: { ar: "ستارة", fr: "Rideau", en: "Curtain" },
  "paper-fold": { ar: "بطاقة مطويّة", fr: "Carte pliée", en: "Folded card" },
  "wax-seal": { ar: "ختم من الشمع", fr: "Sceau de cire", en: "Wax seal" },
  "minimal-fade": { ar: "ظهور هادئ", fr: "Apparition douce", en: "Soft reveal" },
  classic: { ar: "كلاسيكي", fr: "Classique", en: "Classic" },
};

/** Everything a template card needs, flattened to plain data so it can cross to the client. */
export interface TemplateCardItem {
  slug: string;
  name: string;
  nameAr: string;
  opening: OpeningStyle;
  blurb: Record<Locale, string> | null;
  cover: PreviewImage | null;
  /** Used only when no render exists yet: the template's own colours and heading face. */
  swatch: { background: string; primary: string; text: string; headingFont: string };
}

export function toTemplateCardItem(template: TemplateRecord): TemplateCardItem {
  const fallbackBlurb = template.description
    ? { ar: template.description, fr: template.description, en: template.description }
    : null;
  return {
    slug: template.slug,
    name: template.name,
    nameAr: template.nameAr,
    opening: template.theme.openAnimation ?? "classic",
    blurb: BLURBS[template.slug] ?? fallbackBlurb,
    cover: getTemplatePreview(template.slug)?.cover ?? null,
    swatch: {
      background: template.theme.background,
      primary: template.theme.primary,
      text: template.theme.text,
      headingFont: template.fonts.heading,
    },
  };
}
