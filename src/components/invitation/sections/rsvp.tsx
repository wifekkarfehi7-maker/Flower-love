"use client";

import * as React from "react";

import { Reveal } from "@/components/ui/reveal";
import { SectionHeading, SectionShell } from "../section-heading";
import { OrnamentFlourish } from "../ornament";
import { buttonClass } from "../theme";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { InvitationData, TemplateTheme } from "@/types/invitation";
import { cn } from "@/lib/utils";

const STRINGS = {
  ar: {
    question: "هل ستشاركوننا فرحتنا؟",
    eyebrow: "تأكيد الحضور",
    yes: "نعم، سأحضر",
    no: "لن أتمكن",
    name: "الاسم",
    phone: "رقم الهاتف (اختياري)",
    companions: "عدد المرافقين",
    totalLabel: "الإجمالي",
    person: "شخص",
    message: "كلمة للعروسين (اختياري)",
    submit: "إرسال الرد",
    submitting: "جاري الإرسال…",
    success: "شكراً لكم — وصلنا ردّكم",
    successNote: "في انتظاركم لنفرح معاً",
    error: "تعذّر إرسال الرد، حاولوا مجدداً.",
    previewNotice: "هذا عرض توضيحي — الإرسال غير مفعّل هنا.",
  },
  fr: {
    question: "Serez-vous des nôtres ?",
    eyebrow: "Confirmation",
    yes: "Oui, je serai là",
    no: "Je ne pourrai pas",
    name: "Nom",
    phone: "Téléphone (optionnel)",
    companions: "Personnes vous accompagnant",
    totalLabel: "Total",
    person: "personne(s)",
    message: "Un mot pour les mariés (optionnel)",
    submit: "Envoyer",
    submitting: "Envoi…",
    success: "Merci — votre réponse est bien arrivée",
    successNote: "Nous avons hâte de célébrer avec vous",
    error: "Échec de l'envoi, veuillez réessayer.",
    previewNotice: "Ceci est un aperçu — l'envoi est désactivé ici.",
  },
  en: {
    question: "Will you share our joy?",
    eyebrow: "Kindly reply",
    yes: "Joyfully accepts",
    no: "Regretfully declines",
    name: "Name",
    phone: "Phone (optional)",
    companions: "Guests joining you",
    totalLabel: "Total",
    person: "guest(s)",
    message: "A word for the couple (optional)",
    submit: "Send reply",
    submitting: "Sending…",
    success: "Thank you — your reply has reached us",
    successNote: "We can't wait to celebrate with you",
    error: "Couldn't send your reply, please try again.",
    previewNotice: "This is a preview — sending is disabled here.",
  },
};

/** A ruled line with its label above it, the way a printed reply card is set. */
function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2.5">
      <label
        htmlFor={id}
        className="text-[0.5rem] uppercase"
        style={{
          color: "var(--inv-primary)",
          letterSpacing: "var(--inv-track-label, 0.34em)",
          fontFamily: "var(--inv-font-body)",
          opacity: 0.8,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

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
  const fieldId = React.useId();

  const [attendance, setAttendance] = React.useState<"attending" | "not_attending" | null>(null);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [companions, setCompanions] = React.useState(0);
  const [message, setMessage] = React.useState("");
  const [website, setWebsite] = React.useState(""); // honeypot — real guests never see or fill this field
  const [status, setStatus] = React.useState<"idle" | "submitting" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPreview || !attendance || !name.trim()) return;

    if (website.trim()) {
      // Honeypot tripped — silently pretend to succeed, no DB write.
      setStatus("done");
      return;
    }

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
      guest_count: attendance === "attending" ? companions + 1 : 1,
      message: message.trim() || null,
    });

    setStatus(error ? "error" : "done");
  }

  if (status === "done") {
    return (
      <SectionShell>
        <Reveal className="flex flex-col items-center">
          <span className="block w-32" style={{ color: "var(--inv-primary)", opacity: 0.7 }}>
            <OrnamentFlourish className="h-4 w-full" />
          </span>
          <p
            role="status"
            className="mt-8 text-[1.25rem] leading-relaxed"
            style={{ fontFamily: "var(--inv-font-heading)", color: "var(--inv-text)" }}
          >
            {t.success}
          </p>
          <p className="mt-3 text-[0.85rem]" style={{ color: "var(--inv-text-muted)" }}>
            {t.successNote}
          </p>
        </Reveal>
      </SectionShell>
    );
  }

  /**
   * The chosen reply is marked the way a printed card is: the rule goes solid
   * and the paper takes a wash of the house color. A saturated fill would put
   * a UI button in the middle of the stationery.
   */
  const choiceStyle = (selected: boolean) => ({
    borderColor: selected
      ? "var(--inv-primary)"
      : "color-mix(in srgb, var(--inv-primary) 45%, transparent)",
    backgroundColor: selected
      ? "color-mix(in srgb, var(--inv-primary) 14%, transparent)"
      : "transparent",
    color: "var(--inv-primary)",
    opacity: selected ? 1 : 0.75,
  });

  return (
    <SectionShell>
      <SectionHeading title={invitation.rsvpQuestion || t.question} eyebrow={t.eyebrow} theme={theme} />

      <Reveal delay={110} className="mt-11">
        <div className="flex gap-3">
          <button
            type="button"
            aria-pressed={attendance === "attending"}
            onClick={() => setAttendance("attending")}
            className={cn(buttonClass(theme.buttonStyle), "flex-1 !px-3 !py-3.5 text-center")}
            style={choiceStyle(attendance === "attending")}
          >
            {t.yes}
          </button>
          <button
            type="button"
            aria-pressed={attendance === "not_attending"}
            onClick={() => setAttendance("not_attending")}
            className={cn(buttonClass(theme.buttonStyle), "flex-1 !px-3 !py-3.5 text-center")}
            style={choiceStyle(attendance === "not_attending")}
          >
            {t.no}
          </button>
        </div>

        {attendance && (
          <form onSubmit={handleSubmit} className="mt-11 flex flex-col gap-8">
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
            />

            <Field id={`${fieldId}-name`} label={t.name}>
              <input
                id={`${fieldId}-name`}
                required
                maxLength={120}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="inv-field"
              />
            </Field>

            <Field id={`${fieldId}-phone`} label={t.phone}>
              <input
                id={`${fieldId}-phone`}
                type="tel"
                inputMode="tel"
                maxLength={40}
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="inv-field"
                dir="ltr"
              />
            </Field>

            {attendance === "attending" && (
              <Field id={`${fieldId}-companions`} label={t.companions}>
                <input
                  id={`${fieldId}-companions`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={49}
                  value={companions}
                  onChange={(e) => setCompanions(Math.min(49, Math.max(0, Number(e.target.value) || 0)))}
                  className="inv-field mx-auto !w-20"
                  aria-describedby={`${fieldId}-total`}
                />
                <p id={`${fieldId}-total`} className="text-[0.75rem]" style={{ color: "var(--inv-text-muted)" }}>
                  {t.totalLabel}: {companions + 1} {t.person}
                </p>
              </Field>
            )}

            <Field id={`${fieldId}-message`} label={t.message}>
              <textarea
                id={`${fieldId}-message`}
                rows={3}
                maxLength={500}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="inv-field"
              />
            </Field>

            <div aria-live="polite" className="min-h-[1rem]">
              {isPreview && (
                <p className="text-[0.72rem]" style={{ color: "var(--inv-text-muted)" }}>
                  {t.previewNotice}
                </p>
              )}
              {status === "error" && (
                <p className="text-[0.78rem]" style={{ color: "var(--inv-primary)" }}>
                  {t.error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPreview || status === "submitting"}
              className={cn(buttonClass(theme.buttonStyle), "mx-auto disabled:opacity-40")}
              style={{ borderColor: "var(--inv-primary)", color: "var(--inv-primary)" }}
            >
              {status === "submitting" ? t.submitting : t.submit}
            </button>
          </form>
        )}
      </Reveal>
    </SectionShell>
  );
}
