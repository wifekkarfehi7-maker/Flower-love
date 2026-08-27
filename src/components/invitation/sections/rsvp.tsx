"use client";

import * as React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { Divider } from "../divider";
import { buttonClass, radiusClass } from "../theme";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { InvitationData, TemplateTheme } from "@/types/invitation";
import { cn } from "@/lib/utils";

const STRINGS = {
  ar: {
    question: "هل ستشاركوننا فرحتنا؟ ❤️",
    yes: "نعم، سأحضر",
    no: "للأسف لن أتمكن من الحضور",
    name: "الاسم",
    phone: "رقم الهاتف (اختياري)",
    guests: "عدد الحضور",
    message: "رسالة (اختياري)",
    submit: "إرسال",
    submitting: "جاري الإرسال...",
    success: "شكراً لكم! تم استلام ردكم ❤️",
    error: "تعذر إرسال الرد، حاولوا مجدداً.",
    previewNotice: "هذا عرض توضيحي للنموذج — الإرسال غير مفعّل هنا.",
  },
  fr: {
    question: "Serez-vous des nôtres ? ❤️",
    yes: "Oui, je serai présent(e)",
    no: "Malheureusement, je ne pourrai pas venir",
    name: "Nom",
    phone: "Téléphone (optionnel)",
    guests: "Nombre d'invités",
    message: "Message (optionnel)",
    submit: "Envoyer",
    submitting: "Envoi...",
    success: "Merci ! Votre réponse a bien été reçue ❤️",
    error: "Échec de l'envoi, veuillez réessayer.",
    previewNotice: "Ceci est un aperçu du modèle — l'envoi est désactivé ici.",
  },
  en: {
    question: "Will you share our joy? ❤️",
    yes: "Yes, I'll attend",
    no: "Sorry, I can't make it",
    name: "Name",
    phone: "Phone (optional)",
    guests: "Number of guests",
    message: "Message (optional)",
    submit: "Submit",
    submitting: "Submitting...",
    success: "Thank you! Your response has been received ❤️",
    error: "Couldn't submit your response, please try again.",
    previewNotice: "This is a template preview — submission is disabled here.",
  },
};

export function RsvpSection({
  invitation,
  theme,
  isPreview = false,
}: {
  invitation: InvitationData;
  theme: TemplateTheme;
  isPreview?: boolean;
}) {
  const { locale } = useTranslation();
  const t = STRINGS[locale];

  const [attendance, setAttendance] = React.useState<"attending" | "not_attending" | null>(null);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [guestCount, setGuestCount] = React.useState(1);
  const [message, setMessage] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "submitting" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPreview || !attendance || !name.trim()) return;

    setStatus("submitting");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setStatus("error");
      return;
    }

    // No .select() here on purpose — RLS intentionally denies read-back to
    // the anonymous submitter (see supabase/migrations/0001_init.sql).
    const { error } = await supabase.from("rsvps").insert({
      invitation_id: invitation.id,
      guest_name: name.trim(),
      phone: phone.trim() || null,
      attendance,
      guest_count: guestCount,
      message: message.trim() || null,
    });

    setStatus(error ? "error" : "done");
  }

  if (status === "done") {
    return (
      <section className="px-6 py-16 text-center">
        <Reveal className="flex flex-col items-center">
          <CheckCircle2 className="h-8 w-8" style={{ color: "var(--inv-primary)" }} />
          <p className="mt-3 font-semibold" style={{ fontFamily: "var(--inv-font-heading)", color: "var(--inv-text)" }}>
            {t.success}
          </p>
        </Reveal>
      </section>
    );
  }

  return (
    <section className="px-6 py-16 text-center">
      <Reveal className="mx-auto max-w-sm">
        <p
          className="text-2xl font-bold sm:text-3xl"
          style={{ fontFamily: "var(--inv-font-heading)", color: "var(--inv-text)" }}
        >
          {invitation.rsvpQuestion || t.question}
        </p>
        <Divider theme={theme} />

        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={() => setAttendance("attending")}
            className={cn(
              buttonClass(theme.buttonStyle),
              "flex-1 !py-3 text-sm",
              attendance === "attending" ? "" : "opacity-60"
            )}
            style={{
              backgroundColor: theme.buttonStyle === "outline-ornate" ? "transparent" : "var(--inv-primary)",
              borderColor: "var(--inv-primary)",
              color: theme.buttonStyle === "outline-ornate" ? "var(--inv-primary)" : theme.background,
            }}
          >
            {t.yes}
          </button>
          <button
            type="button"
            onClick={() => setAttendance("not_attending")}
            className={cn(
              "flex-1 rounded-full border px-6 py-3 text-sm font-semibold transition-opacity",
              attendance === "not_attending" ? "" : "opacity-60"
            )}
            style={{ borderColor: "var(--inv-text-muted)", color: "var(--inv-text)" }}
          >
            {t.no}
          </button>
        </div>

        {attendance && (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 text-start">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.name}
              className={`border px-4 py-2.5 text-sm outline-none ${radiusClass(theme.cardRadius === "none" ? "none" : "soft")}`}
              style={{ backgroundColor: "var(--inv-surface)", borderColor: "var(--inv-text-muted)", color: "var(--inv-text)" }}
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t.phone}
              type="tel"
              className={`border px-4 py-2.5 text-sm outline-none ${radiusClass(theme.cardRadius === "none" ? "none" : "soft")}`}
              style={{ backgroundColor: "var(--inv-surface)", borderColor: "var(--inv-text-muted)", color: "var(--inv-text)" }}
            />
            {attendance === "attending" && (
              <label className="flex items-center justify-between text-sm" style={{ color: "var(--inv-text)" }}>
                {t.guests}
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value) || 1)}
                  className="w-16 rounded-lg border px-2 py-1 text-center outline-none"
                  style={{ backgroundColor: "var(--inv-surface)", borderColor: "var(--inv-text-muted)", color: "var(--inv-text)" }}
                />
              </label>
            )}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.message}
              rows={2}
              className={`border px-4 py-2.5 text-sm outline-none ${radiusClass(theme.cardRadius === "none" ? "none" : "soft")}`}
              style={{ backgroundColor: "var(--inv-surface)", borderColor: "var(--inv-text-muted)", color: "var(--inv-text)" }}
            />

            {isPreview && (
              <p className="text-xs opacity-60" style={{ color: "var(--inv-text)" }}>
                {t.previewNotice}
              </p>
            )}
            {status === "error" && <p className="text-xs text-red-500">{t.error}</p>}

            <button
              type="submit"
              disabled={isPreview || status === "submitting"}
              className={cn(buttonClass(theme.buttonStyle), "mt-1 disabled:opacity-50")}
              style={{
                backgroundColor: theme.buttonStyle === "outline-ornate" ? "transparent" : "var(--inv-primary)",
                borderColor: "var(--inv-primary)",
                color: theme.buttonStyle === "outline-ornate" ? "var(--inv-primary)" : theme.background,
              }}
            >
              {status === "submitting" && <Loader2 className="me-2 inline h-4 w-4 animate-spin" />}
              {status === "submitting" ? t.submitting : t.submit}
            </button>
          </form>
        )}
      </Reveal>
    </section>
  );
}
