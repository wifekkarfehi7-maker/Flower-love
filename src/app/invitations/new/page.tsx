"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/lib/auth/provider";
import { createDraftInvitation } from "@/lib/invitations/client";
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

    if (!user) {
      router.replace("/login?next=/invitations/new");
      return;
    }

    started.current = true;
    createDraftInvitation(user.id).then((result) => {
      if (result.data) {
        router.replace(`/invitations/${result.data.id}/builder`);
      } else {
        router.replace("/my-invitations");
      }
    });
  }, [loading, user, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ink-50/40">
      <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
      <p className="text-sm text-ink-500">{LABEL[locale]}</p>
    </div>
  );
}
