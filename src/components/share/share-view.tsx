"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BarChart3, Check, Copy, ExternalLink, Link2, Loader2, Lock, QrCode } from "lucide-react";

import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { InvitationQr } from "./invitation-qr";
import { setInvitationSlug, type SlugError } from "@/lib/invitations/client";
import { useTranslation } from "@/lib/i18n/use-translation";
import { SITE_URL } from "@/lib/config";
import type { InvitationRow } from "@/types/database";

const STRINGS = {
  ar: {
    back: "دعواتي",
    title: "مشاركة الدعوة",
    linkTitle: "رابط الدعوة",
    linkPending: "يظهر الرابط هنا فور تفعيل دعوتكم بعد تأكيد الدفع.",
    copy: "نسخ",
    copied: "تم النسخ",
    open: "فتح",
    shareWhatsapp: "مشاركة عبر واتساب",
    shareMessage: "يسعدنا دعوتكم لحضور حفل زفافنا 🤍",
    customTitle: "رابط خاص",
    customHint: "حروف لاتينية صغيرة وأرقام وشرطات، من 3 إلى 40 حرفاً. مثال: mohamed-sirine",
    customSave: "حفظ الرابط",
    customSaved: "تم حفظ الرابط الجديد.",
    customWarning: "تنبيه: الرابط القديم سيتوقف عن العمل. من الأفضل اختيار الرابط قبل إرسال الدعوة للضيوف.",
    qrTitle: "رمز QR",
    qrHint: "ضعوه على البطاقات المطبوعة أو على طاولة الاستقبال، ويفتح الدعوة مباشرة.",
    qrPending: "يظهر رمز QR هنا فور تفعيل الدعوة.",
    premiumOnly: "متوفر في باقة Premium.",
    upgrade: "الترقية إلى Premium",
    upgradeMessage: "مرحباً، أرغب في ترقية دعوتي إلى باقة Premium.",
    stats: "إحصائيات الدعوة",
    errors: {
      invalid_slug: "الرابط غير صالح. استعملوا حروفاً لاتينية صغيرة وأرقاماً وشرطات فقط (3 إلى 40).",
      slug_taken: "هذا الرابط مستعمل. جرّبوا رابطاً آخر.",
      premium_required: "الرابط الخاص متوفر في باقة Premium فقط.",
      generic: "حدث خطأ، الرجاء المحاولة مجدداً.",
    } satisfies Record<SlugError, string>,
  },
  fr: {
    back: "Mes invitations",
    title: "Partager l'invitation",
    linkTitle: "Lien de l'invitation",
    linkPending: "Le lien apparaîtra ici dès l'activation de votre invitation, après confirmation du paiement.",
    copy: "Copier",
    copied: "Copié",
    open: "Ouvrir",
    shareWhatsapp: "Partager sur WhatsApp",
    shareMessage: "Nous avons le plaisir de vous inviter à notre mariage 🤍",
    customTitle: "Lien personnalisé",
    customHint: "Lettres latines minuscules, chiffres et tirets, de 3 à 40 caractères. Exemple : mohamed-sirine",
    customSave: "Enregistrer le lien",
    customSaved: "Nouveau lien enregistré.",
    customWarning: "Attention : l'ancien lien ne fonctionnera plus. Mieux vaut le choisir avant d'envoyer l'invitation.",
    qrTitle: "QR code",
    qrHint: "À imprimer sur vos cartes ou à poser à l'accueil : il ouvre directement l'invitation.",
    qrPending: "Le QR code apparaîtra ici dès l'activation de l'invitation.",
    premiumOnly: "Disponible avec l'offre Premium.",
    upgrade: "Passer à Premium",
    upgradeMessage: "Bonjour, je souhaite passer mon invitation à l'offre Premium.",
    stats: "Statistiques de l'invitation",
    errors: {
      invalid_slug: "Lien invalide. Utilisez uniquement des lettres latines minuscules, des chiffres et des tirets (3 à 40).",
      slug_taken: "Ce lien est déjà pris. Essayez-en un autre.",
      premium_required: "Le lien personnalisé est réservé à l'offre Premium.",
      generic: "Une erreur est survenue, veuillez réessayer.",
    } satisfies Record<SlugError, string>,
  },
  en: {
    back: "My Invitations",
    title: "Share your invitation",
    linkTitle: "Invitation link",
    linkPending: "Your link appears here as soon as the invitation is activated, once payment is confirmed.",
    copy: "Copy",
    copied: "Copied",
    open: "Open",
    shareWhatsapp: "Share on WhatsApp",
    shareMessage: "We would be delighted to have you at our wedding 🤍",
    customTitle: "Custom link",
    customHint: "Lowercase latin letters, numbers and hyphens, 3 to 40 characters. Example: mohamed-sirine",
    customSave: "Save link",
    customSaved: "New link saved.",
    customWarning: "Note: the old link will stop working. Best to choose it before sending the invitation to guests.",
    qrTitle: "QR code",
    qrHint: "Print it on your cards or place it at the reception: it opens the invitation directly.",
    qrPending: "Your QR code appears here as soon as the invitation is activated.",
    premiumOnly: "Available on the Premium plan.",
    upgrade: "Upgrade to Premium",
    upgradeMessage: "Hello, I would like to upgrade my invitation to the Premium plan.",
    stats: "Invitation statistics",
    errors: {
      invalid_slug: "Invalid link. Use only lowercase latin letters, numbers and hyphens (3 to 40).",
      slug_taken: "That link is taken. Try another one.",
      premium_required: "Custom links are available on the Premium plan only.",
      generic: "Something went wrong, please try again.",
    } satisfies Record<SlugError, string>,
  },
};

export function ShareView({ invitation, isPremium }: { invitation: InvitationRow; isPremium: boolean }) {
  const { locale, dir } = useTranslation();
  const t = STRINGS[locale];
  const router = useRouter();
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  const isLive = invitation.status === "active" && Boolean(invitation.slug);
  const publicUrl = invitation.slug ? `${SITE_URL}/invite/${invitation.slug}` : null;
  const couple = `${invitation.groom_name || "—"} & ${invitation.bride_name || "—"}`;

  const [copied, setCopied] = React.useState(false);
  const [slugInput, setSlugInput] = React.useState(invitation.slug ?? "");
  const [saving, setSaving] = React.useState(false);
  const [slugError, setSlugError] = React.useState<SlugError | null>(null);
  const [slugSaved, setSlugSaved] = React.useState(false);

  async function copyLink() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (e.g. insecure context); the link stays visible and selectable.
    }
  }

  async function saveSlug(event: React.FormEvent) {
    event.preventDefault();
    setSlugError(null);
    setSlugSaved(false);
    setSaving(true);
    const result = await setInvitationSlug(invitation.id, slugInput);
    setSaving(false);
    if (result.data === null) {
      setSlugError(result.error in t.errors ? (result.error as SlugError) : "generic");
      return;
    }
    setSlugInput(result.data);
    setSlugSaved(true);
    router.refresh();
  }

  const upgrade = (
    <div className="flex flex-col items-start gap-3 rounded-xl bg-ink-900/[0.03] p-4">
      <p className="flex items-center gap-2 text-sm text-ink-600">
        <Lock className="h-4 w-4 shrink-0 text-gold-600" aria-hidden="true" />
        {t.premiumOnly}
      </p>
      <WhatsAppButton size="sm" message={`${t.upgradeMessage}\n${couple}`}>
        {t.upgrade}
      </WhatsAppButton>
    </div>
  );

  return (
    <section className="bg-ink-50/60 py-10 sm:py-14">
      <Container className="max-w-2xl">
        <Link href="/my-invitations" className="flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900">
          <BackIcon className="h-4 w-4" />
          {t.back}
        </Link>

        <p className="mt-3 text-sm text-ink-500">{t.title}</p>
        <h1 className="mt-1 font-heading text-2xl text-ink-900 sm:text-3xl">{couple}</h1>

        <div className="mt-8 flex flex-col gap-5">
          {/* Link — every plan */}
          <div className="rounded-2xl border border-ink-100 bg-white p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-heading text-lg text-ink-900">
              <Link2 className="h-4 w-4 text-gold-600" aria-hidden="true" />
              {t.linkTitle}
            </h2>
            {isLive && publicUrl ? (
              <>
                <p
                  dir="ltr"
                  className="mt-4 select-all break-all rounded-xl border border-ink-100 bg-ink-50/60 px-4 py-3 text-start text-sm text-ink-900"
                >
                  {publicUrl}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" variant="primary" size="sm" onClick={copyLink} aria-live="polite">
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? t.copied : t.copy}
                  </Button>
                  <WhatsAppButton size="sm" phone="" message={`${t.shareMessage}\n${couple}\n${publicUrl}`}>
                    {t.shareWhatsapp}
                  </WhatsAppButton>
                  <Button asChild variant="ghost" size="sm">
                    <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      {t.open}
                    </a>
                  </Button>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-ink-500">{t.linkPending}</p>
            )}
          </div>

          {/* Custom link — Premium */}
          <div className="rounded-2xl border border-ink-100 bg-white p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-heading text-lg text-ink-900">
              <Link2 className="h-4 w-4 text-gold-600" aria-hidden="true" />
              {t.customTitle}
            </h2>
            {isPremium ? (
              <form onSubmit={saveSlug} className="mt-4" noValidate>
                <Label htmlFor="custom-slug" className="sr-only">
                  {t.customTitle}
                </Label>
                <div dir="ltr" className={`flex items-stretch overflow-hidden rounded-sm border bg-paper-raised focus-within:border-ink-900 focus-within:ring-1 focus-within:ring-ink-900 ${slugError ? "border-destructive" : "border-ink-900/15"}`}>
                  <span className="hidden items-center border-e border-ink-900/10 px-3 text-sm text-ink-400 sm:flex">/invite/</span>
                  <Input
                    id="custom-slug"
                    value={slugInput}
                    onChange={(e) => {
                      setSlugInput(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                      setSlugError(null);
                      setSlugSaved(false);
                    }}
                    placeholder="mohamed-sirine"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={40}
                    invalid={Boolean(slugError)}
                    aria-describedby="custom-slug-hint"
                    className="rounded-none border-0 hover:border-0 focus-visible:ring-0"
                  />
                </div>
                <p id="custom-slug-hint" className="mt-2 text-xs leading-relaxed text-ink-500">
                  {t.customHint}
                </p>
                {isLive && <p className="mt-2 text-xs leading-relaxed text-gold-700">{t.customWarning}</p>}
                {slugError && (
                  <p role="alert" className="mt-3 text-sm text-destructive">
                    {t.errors[slugError]}
                  </p>
                )}
                {slugSaved && (
                  <p role="status" className="mt-3 flex items-center gap-1.5 text-sm text-emerald-700">
                    <Check className="h-4 w-4" />
                    {t.customSaved}
                  </p>
                )}
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                  disabled={saving || !slugInput.trim() || slugInput === invitation.slug}
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {t.customSave}
                </Button>
              </form>
            ) : (
              <div className="mt-4">{upgrade}</div>
            )}
          </div>

          {/* QR code — Premium */}
          <div className="rounded-2xl border border-ink-100 bg-white p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-heading text-lg text-ink-900">
              <QrCode className="h-4 w-4 text-gold-600" aria-hidden="true" />
              {t.qrTitle}
            </h2>
            {!isPremium ? (
              <div className="mt-4">{upgrade}</div>
            ) : isLive && publicUrl ? (
              <>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{t.qrHint}</p>
                <div className="mt-5">
                  <InvitationQr url={publicUrl} fileName={`qr-${invitation.slug}`} locale={locale} />
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-ink-500">{t.qrPending}</p>
            )}
          </div>

          <Button asChild variant="secondary" className="self-start">
            <Link href={`/invitations/${invitation.id}/stats`}>
              <BarChart3 className="h-4 w-4" />
              {t.stats}
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
