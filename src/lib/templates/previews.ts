import manifest from "./preview-manifest.json";

/**
 * Rendered previews of each template, produced by
 * scripts/generate-template-previews.mjs from the real preview route.
 * Regenerate with `npm run previews` after changing a template's look.
 */
export interface PreviewImage {
  src: string;
  width: number;
  height: number;
  blurDataURL?: string;
}

export interface TemplatePreview {
  background: string;
  primary: string;
  /** The invitation's face, once opened. */
  cover: PreviewImage;
  /** How it arrives, before the guest opens it. */
  sealed: PreviewImage;
  /** The photo page — where templates differ most. */
  detail: PreviewImage;
  /** 1200×630 social card. */
  og: PreviewImage;
}

const PREVIEWS = manifest as Record<string, TemplatePreview>;

/** Null for a template nobody has rendered yet — e.g. one just added from the admin panel. */
export function getTemplatePreview(slug: string): TemplatePreview | null {
  return PREVIEWS[slug] ?? null;
}
