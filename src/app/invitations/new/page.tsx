"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/lib/auth/provider";
import { createDraftInvitation, setDraftTemplateBySlug } from "@/lib/invitations/client";
import { useTranslation } from "@/lib/i18n/use-translation";

const LABEL = {
  ar: "جاري إنشاء دعوتكم...",
  fr: "Création de votre invitation...",
  en: "Creating your invitation...",
};

export default function NewInvitationPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { locale } = useTranslation();
  const started = React.useRef(false);

  React.useEffect(() => {
    if (loading || started.current) return;

    // Set by "use this template" in the gallery; carried through sign-in.
    const templateSlug = new URLSearchParams(window.location.search).get("template");
    const returnTo = templateSlug ? `/invitations/new?template=${encodeURIComponent(templateSlug)}` : "/invitations/new";

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(returnTo)}`);
      return;
    }

    started.current = true;
    createDraftInvitation(user.id).then(async (result) => {
      if (result.data) {
        if (templateSlug) await setDraftTemplateBySlug(result.data.id, templateSlug);
        router.replace(`/invitations/${result.data.id}/builder`);
      } else {
        router.replace("/my-invitations");
      }
    });
  }, [loading, user, router]);

  return (
    <div data-ui="" className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <Loader2 strokeWidth={1.25} className="h-7 w-7 animate-spin text-ink-400" />
      <p className="type-small">{LABEL[locale]}</p>
    </div>
  );
}
