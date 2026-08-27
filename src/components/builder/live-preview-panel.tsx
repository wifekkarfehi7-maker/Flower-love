"use client";

import * as React from "react";
import { Eye, X } from "lucide-react";

import { InvitationRenderer } from "@/components/invitation/invitation-renderer";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { InvitationData, TemplateRecord } from "@/types/invitation";

const LABEL = { ar: "معاينة", fr: "Aperçu", en: "Preview" };

/**
 * Live invitation preview. On large screens it's a sticky phone-frame panel
 * next to the builder form; on mobile it's a floating button that opens a
 * full-screen overlay — matching the platform's "editor left / preview
 * right on desktop, preview button on mobile" requirement.
 */
export function LivePreviewPanel({ invitation, template }: { invitation: InvitationData; template: TemplateRecord | null }) {
  const { locale } = useTranslation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  if (!template) return null;

  const frame = (
    <div className="h-[720px] w-full overflow-y-auto rounded-[2rem] border-8 border-ink-900 bg-white shadow-2xl">
      <InvitationRenderer invitation={invitation} theme={template.theme} fonts={template.fonts} isPreview />
    </div>
  );

  return (
    <>
      <div className="hidden xl:block">
        <div className="sticky top-24">{frame}</div>
      </div>

      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-6 end-6 z-30 flex items-center gap-2 rounded-full bg-ink-900 px-5 py-3 text-sm font-semibold text-white shadow-xl xl:hidden"
      >
        <Eye className="h-4 w-4" />
        {LABEL[locale]}
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/60 p-4 xl:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="mb-3 flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-full bg-white text-ink-700"
            aria-label="close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex-1 overflow-hidden rounded-2xl bg-white">
            <div className="h-full overflow-y-auto">
              <InvitationRenderer invitation={invitation} theme={template.theme} fonts={template.fonts} isPreview />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
