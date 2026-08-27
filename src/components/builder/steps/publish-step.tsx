"use client";

import * as React from "react";
import { Check, CheckCircle2, Loader2 } from "lucide-react";

import { WhatsAppButton } from "@/components/whatsapp-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { fontFamilyFor } from "@/components/invitation/theme";
import { useTranslation } from "@/lib/i18n/use-translation";
import { buildOrderMessage } from "@/lib/whatsapp";
import { createOrder, getOrderForInvitation } from "@/lib/orders/client";
import { SITE_URL } from "@/lib/config";
import type { InvitationRow, OrderRow, ProfileRow } from "@/types/database";
import type { PricingPlanRecord, TemplateRecord } from "@/types/invitation";
import { cn } from "@/lib/utils";

const STRINGS = {
  ar: {
    title: "جاهزون للنشر!",
    description: "دعوتكم جاهزة من ناحية التصميم والمحتوى. اختاروا الباقة المناسبة وأتموا الطلب للتواصل معنا عبر واتساب وإتمام الدفع.",
    template: "التصميم",
    date: "تاريخ الزفاف",
    selectPlan: "اختاروا الباقة",
    yourName: "الاسم الكامل",
    yourWhatsapp: "رقم الواتساب",
    yourWhatsappPlaceholder: "21612345678",
    confirm: "تأكيد الطلب",
    creating: "جاري إنشاء الطلب...",
    fillRequired: "الرجاء إدخال الاسم ورقم الواتساب واختيار باقة.",
    genericError: "حدث خطأ، الرجاء المحاولة مجدداً.",
    orderCreatedTitle: "تم إنشاء طلبكم!",
    orderCreatedDescription: "تواصلوا معنا الآن عبر واتساب لإتمام الدفع وتفعيل دعوتكم.",
    orderNumber: "رقم الطلب",
    plan: "الباقة",
    price: "السعر",
    status: "الحالة",
    whatsapp: "تواصل معنا لإتمام الدفع ❤️",
    finish: "إنهاء والعودة إلى دعواتي",
    mostPopular: "الأكثر طلباً",
    free: "مجانية",
  },
  fr: {
    title: "Prêt à publier !",
    description: "Votre invitation est prête côté design et contenu. Choisissez votre formule et confirmez la commande pour nous contacter sur WhatsApp et finaliser le paiement.",
    template: "Modèle",
    date: "Date du mariage",
    selectPlan: "Choisissez une formule",
    yourName: "Nom complet",
    yourWhatsapp: "Numéro WhatsApp",
    yourWhatsappPlaceholder: "21612345678",
    confirm: "Confirmer la commande",
    creating: "Création de la commande...",
    fillRequired: "Veuillez entrer votre nom, votre numéro WhatsApp et choisir une formule.",
    genericError: "Une erreur est survenue, veuillez réessayer.",
    orderCreatedTitle: "Commande créée !",
    orderCreatedDescription: "Contactez-nous maintenant sur WhatsApp pour finaliser le paiement et activer votre invitation.",
    orderNumber: "Numéro de commande",
    plan: "Formule",
    price: "Prix",
    status: "Statut",
    whatsapp: "Contactez-nous pour payer ❤️",
    finish: "Terminer et retourner à mes invitations",
    mostPopular: "Le plus demandé",
    free: "Gratuite",
  },
  en: {
    title: "Ready to publish!",
    description: "Your invitation is ready design- and content-wise. Choose a plan and confirm your order to contact us on WhatsApp and complete payment.",
    template: "Template",
    date: "Wedding date",
    selectPlan: "Choose a plan",
    yourName: "Full name",
    yourWhatsapp: "WhatsApp number",
    yourWhatsappPlaceholder: "21612345678",
    confirm: "Confirm order",
    creating: "Creating your order...",
    fillRequired: "Please enter your name, WhatsApp number, and choose a plan.",
    genericError: "Something went wrong, please try again.",
    orderCreatedTitle: "Order created!",
    orderCreatedDescription: "Contact us now on WhatsApp to complete payment and activate your invitation.",
    orderNumber: "Order number",
    plan: "Plan",
    price: "Price",
    status: "Status",
    whatsapp: "Contact us to complete payment ❤️",
    finish: "Finish & return to My Invitations",
    mostPopular: "Most popular",
    free: "Free",
  },
};

const STATUS_LABELS = {
  ar: {
    draft: "مسودة",
    pending_payment: "بانتظار الدفع",
    payment_review: "قيد المراجعة",
    paid: "تم الدفع",
    active: "منشورة",
    cancelled: "ملغاة",
    expired: "منتهية",
  },
  fr: {
    draft: "Brouillon",
    pending_payment: "En attente de paiement",
    payment_review: "En vérification",
    paid: "Payée",
    active: "Publiée",
    cancelled: "Annulée",
    expired: "Expirée",
  },
  en: {
    draft: "Draft",
    pending_payment: "Pending payment",
    payment_review: "Under review",
    paid: "Paid",
    active: "Published",
    cancelled: "Cancelled",
    expired: "Expired",
  },
};

export function PublishStep({
  invitation,
  template,
  plans,
  profile,
  userId,
  onPublish,
}: {
  invitation: InvitationRow;
  template: TemplateRecord | null;
  plans: PricingPlanRecord[];
  profile: ProfileRow | null;
  userId: string;
  onPublish: () => void;
}) {
  const { locale } = useTranslation();
  const t = STRINGS[locale];

  const [selectedPlanId, setSelectedPlanId] = React.useState<string | null>(null);
  const [customerName, setCustomerName] = React.useState(profile?.full_name ?? "");
  const [customerWhatsapp, setCustomerWhatsapp] = React.useState(profile?.whatsapp ?? "");
  const [order, setOrder] = React.useState<OrderRow | null>(null);
  const [loadingOrder, setLoadingOrder] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getOrderForInvitation(invitation.id).then((result) => {
      if (!cancelled && result.data) setOrder(result.data);
      if (!cancelled) setLoadingOrder(false);
    });
    return () => {
      cancelled = true;
    };
  }, [invitation.id]);

  const coupleNames = `${invitation.groom_name ?? ""} & ${invitation.bride_name ?? ""}`;

  async function handleConfirmOrder() {
    const plan = plans.find((p) => p.id === selectedPlanId);
    if (!plan || !customerName.trim() || !customerWhatsapp.trim()) {
      setError(t.fillRequired);
      return;
    }
    setError(null);
    setCreating(true);
    const result = await createOrder({
      userId,
      invitationId: invitation.id,
      planId: plan.id.startsWith("static-") ? null : plan.id,
      customerName: customerName.trim(),
      customerWhatsapp: customerWhatsapp.trim(),
      planName: locale === "ar" ? plan.nameAr : plan.name,
      price: plan.price,
      currency: plan.currency,
    });
    setCreating(false);
    if (result.error || !result.data) {
      setError(t.genericError);
      return;
    }
    setOrder(result.data);
  }

  if (loadingOrder) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-ink-300" />
      </div>
    );
  }

  if (order) {
    const previewUrl = `${SITE_URL}/invitations/${invitation.id}/preview`;
    const message = buildOrderMessage({
      customerName: order.customer_name,
      customerWhatsapp: order.customer_whatsapp,
      invitationName: coupleNames,
      invitationId: order.order_number,
      planName: order.plan_name,
      price: String(order.price),
      currency: order.currency,
      previewUrl,
    });

    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <h2 className="mt-4 font-heading text-2xl font-bold text-ink-900">{t.orderCreatedTitle}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">{t.orderCreatedDescription}</p>

        <div className="mx-auto mt-6 flex max-w-sm flex-col gap-3 rounded-2xl border border-ink-100 bg-ink-50/60 p-5 text-start">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-500">{t.orderNumber}</span>
            <span className="font-semibold text-ink-900" dir="ltr">
              {order.order_number}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-500">{t.plan}</span>
            <span className="font-semibold text-ink-900">{order.plan_name}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-500">{t.price}</span>
            <span className="font-semibold text-ink-900" dir="ltr">
              {order.price} {order.currency}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-500">{t.status}</span>
            <Badge variant="outline">{STATUS_LABELS[locale][order.status]}</Badge>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <WhatsAppButton message={message} size="lg">
            {t.whatsapp}
          </WhatsAppButton>
          <Button variant="ghost" onClick={onPublish}>
            {t.finish}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
      <h2 className="mt-4 font-heading text-2xl font-bold text-ink-900">{t.title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">{t.description}</p>

      <div className="mx-auto mt-6 flex max-w-sm flex-col gap-3 rounded-2xl border border-ink-100 bg-ink-50/60 p-5 text-start">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-500">{t.template}</span>
          <span className="font-semibold text-ink-900" style={{ fontFamily: template ? fontFamilyFor(template.fonts.heading) : undefined }}>
            {locale === "ar" ? template?.nameAr : template?.name}
          </span>
        </div>
        {invitation.wedding_date && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-500">{t.date}</span>
            <span className="font-semibold text-ink-900" dir="ltr">
              {invitation.wedding_date}
            </span>
          </div>
        )}
      </div>

      <div className="mx-auto mt-8 max-w-2xl text-start">
        <h3 className="text-center font-heading text-lg font-bold text-ink-900">{t.selectPlan}</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {plans.map((plan) => {
            const isSelected = plan.id === selectedPlanId;
            const highlighted = plan.slug === "premium" || (plan.slug !== "free" && plan === plans[plans.length - 1]);
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlanId(plan.id)}
                className={cn(
                  "relative flex flex-col rounded-2xl border-2 p-4 text-start transition-colors",
                  isSelected ? "border-gold-500 bg-gold-50/60" : "border-ink-100 hover:border-ink-200"
                )}
              >
                {isSelected && (
                  <span className="absolute end-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-gold-500 text-white">
                    <Check className="h-3 w-3" />
                  </span>
                )}
                {highlighted && (
                  <Badge variant="gold" className="mb-2 w-fit text-[10px]">
                    {t.mostPopular}
                  </Badge>
                )}
                <span className="font-heading text-base font-bold text-ink-900">
                  {locale === "ar" ? plan.nameAr : plan.name}
                </span>
                <span className="mt-1 text-lg font-bold text-ink-900" dir="ltr">
                  {plan.price === 0 ? t.free : `${plan.price} ${plan.currency}`}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="publish-name">{t.yourName}</Label>
            <Input id="publish-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="publish-whatsapp">{t.yourWhatsapp}</Label>
            <Input
              id="publish-whatsapp"
              dir="ltr"
              placeholder={t.yourWhatsappPlaceholder}
              value={customerWhatsapp}
              onChange={(e) => setCustomerWhatsapp(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="mt-3 text-center text-sm text-destructive">{error}</p>}

        <div className="mt-6 flex justify-center">
          <Button variant="gold" size="lg" onClick={handleConfirmOrder} disabled={creating}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {creating ? t.creating : t.confirm}
          </Button>
        </div>
      </div>
    </div>
  );
}
