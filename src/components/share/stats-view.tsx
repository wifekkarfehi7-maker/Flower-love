"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarCheck, Eye, HelpCircle, Lock, MessageSquareReply, Share2, TrendingUp, UserX, Users } from "lucide-react";

import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { InvitationRow } from "@/types/database";

export interface DayPoint {
  /** YYYY-MM-DD, Tunisian time. */
  day: string;
  views: number;
  attending: number;
  notAttending: number;
}

export interface StatsTotals {
  views: number;
  responses: number;
  attendingPeople: number;
  notAttending: number;
  pendingGuests: number;
}

const STRINGS = {
  ar: {
    back: "دعواتي",
    title: "إحصائيات الدعوة",
    views: "المشاهدات",
    views7: "مشاهدات آخر 7 أيام",
    responses: "الردود",
    responseRate: "نسبة الرد",
    responseRateHint: "من الزيارات",
    attendingPeople: "أشخاص سيحضرون",
    notAttending: "اعتذروا",
    peakDay: "أكثر يوم زيارة",
    viewsUnit: "مشاهدة",
    pendingGuests: "بانتظار الرد",
    viewsChart: "المشاهدات يومياً (آخر 30 يوماً)",
    responsesChart: "الردود يومياً (آخر 30 يوماً)",
    attending: "سيحضرون",
    declined: "اعتذروا",
    noViewsYet: "لا توجد زيارات بعد في هذه الفترة. تبدأ الإحصائيات اليومية من يوم تفعيلها.",
    noResponsesYet: "لا توجد ردود بعد في هذه الفترة.",
    guests: "قائمة الضيوف والردود",
    share: "مشاركة الدعوة",
    premiumTitle: "إحصائيات مفصّلة",
    premiumBody: "مع باقة Premium تتابعون الزيارات يوماً بيوم، ونسبة الرد، واليوم الذي فُتحت فيه الدعوة أكثر.",
    upgrade: "الترقية إلى Premium",
    upgradeMessage: "مرحباً، أرغب في ترقية دعوتي إلى باقة Premium.",
    chartSummary: (total: number, peak: number) => `مجموع ${total} مشاهدة خلال 30 يوماً، وأعلى يوم ${peak}.`,
    responsesSummary: (a: number, n: number) => `${a} ردود بالحضور و${n} اعتذارات خلال 30 يوماً.`,
  },
  fr: {
    back: "Mes invitations",
    title: "Statistiques de l'invitation",
    views: "Vues",
    views7: "Vues sur 7 jours",
    responses: "Réponses",
    responseRate: "Taux de réponse",
    responseRateHint: "des visites",
    attendingPeople: "Personnes présentes",
    notAttending: "Excusés",
    peakDay: "Jour le plus visité",
    viewsUnit: "vues",
    pendingGuests: "En attente de réponse",
    viewsChart: "Vues par jour (30 derniers jours)",
    responsesChart: "Réponses par jour (30 derniers jours)",
    attending: "Présents",
    declined: "Excusés",
    noViewsYet: "Pas encore de visites sur cette période. Le suivi quotidien commence à son activation.",
    noResponsesYet: "Pas encore de réponses sur cette période.",
    guests: "Invités et réponses",
    share: "Partager l'invitation",
    premiumTitle: "Statistiques détaillées",
    premiumBody: "Avec l'offre Premium : les visites jour par jour, le taux de réponse et le jour le plus consulté.",
    upgrade: "Passer à Premium",
    upgradeMessage: "Bonjour, je souhaite passer mon invitation à l'offre Premium.",
    chartSummary: (total: number, peak: number) => `${total} vues sur 30 jours, maximum ${peak} en un jour.`,
    responsesSummary: (a: number, n: number) => `${a} présences et ${n} excuses sur 30 jours.`,
  },
  en: {
    back: "My Invitations",
    title: "Invitation statistics",
    views: "Views",
    views7: "Views, last 7 days",
    responses: "Responses",
    responseRate: "Response rate",
    responseRateHint: "of visits",
    attendingPeople: "People attending",
    notAttending: "Declined",
    peakDay: "Busiest day",
    viewsUnit: "views",
    pendingGuests: "Awaiting reply",
    viewsChart: "Views per day (last 30 days)",
    responsesChart: "Responses per day (last 30 days)",
    attending: "Attending",
    declined: "Declined",
    noViewsYet: "No visits in this period yet. Daily tracking starts from its activation.",
    noResponsesYet: "No responses in this period yet.",
    guests: "Guests and responses",
    share: "Share invitation",
    premiumTitle: "Detailed analytics",
    premiumBody: "With Premium: visits day by day, your response rate and the day your invitation was opened most.",
    upgrade: "Upgrade to Premium",
    upgradeMessage: "Hello, I would like to upgrade my invitation to the Premium plan.",
    chartSummary: (total: number, peak: number) => `${total} views over 30 days, at most ${peak} in one day.`,
    responsesSummary: (a: number, n: number) => `${a} attending and ${n} declined over 30 days.`,
  },
};

/** "DD/MM" straight from the YYYY-MM-DD string, so no time zone can shift the day. */
function dayLabel(day: string): string {
  return `${day.slice(8, 10)}/${day.slice(5, 7)}`;
}

function Tile({ icon: Icon, label, value, hint, tone = "text-ink-600" }: { icon: typeof Eye; label: string; value: string | number; hint?: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-4 text-center">
      <Icon className={`mx-auto h-5 w-5 ${tone}`} aria-hidden="true" />
      <p className="mt-2 font-heading text-2xl text-ink-900" dir="ltr">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-ink-500">{label}</p>
      {hint && <p className="text-[0.6875rem] text-ink-400">{hint}</p>}
    </div>
  );
}

/** Thirty bars, oldest on the left like the dates under them; the axis names the first, middle and last day. */
function BarChart({
  series,
  label,
  summary,
  bars,
}: {
  series: DayPoint[];
  label: string;
  summary: string;
  bars: (point: DayPoint) => { height: number; className: string }[];
}) {
  const max = Math.max(1, ...series.map((p) => bars(p).reduce((sum, b) => sum + b.height, 0)));
  const ticks = [0, Math.floor(series.length / 2), series.length - 1];
  return (
    <figure>
      <figcaption className="text-sm font-medium text-ink-700">{label}</figcaption>
      <div role="img" aria-label={summary} dir="ltr" className="mt-4 flex h-32 items-end gap-[3px]">
        {series.map((point) => (
          <div key={point.day} className="flex h-full min-w-0 flex-1 flex-col-reverse" title={dayLabel(point.day)}>
            {bars(point).map((bar, i) =>
              bar.height > 0 ? (
                <div key={i} className={`w-full ${bar.className} first:rounded-b-[2px] last:rounded-t-[2px]`} style={{ height: `${(bar.height / max) * 100}%` }} />
              ) : null
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[0.6875rem] text-ink-400" dir="ltr" aria-hidden="true">
        {ticks.map((i) => (
          <span key={i}>{dayLabel(series[i]!.day)}</span>
        ))}
      </div>
    </figure>
  );
}

export function StatsView({
  invitation,
  isPremium,
  totals,
  series,
}: {
  invitation: InvitationRow;
  isPremium: boolean;
  totals: StatsTotals;
  series: DayPoint[];
}) {
  const { locale, dir } = useTranslation();
  const t = STRINGS[locale];
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;
  const couple = `${invitation.groom_name || "—"} & ${invitation.bride_name || "—"}`;

  const windowViews = series.reduce((sum, p) => sum + p.views, 0);
  const views7 = series.slice(-7).reduce((sum, p) => sum + p.views, 0);
  const peak = series.reduce((best, p) => (p.views > best.views ? p : best), series[0]!);
  const windowAttending = series.reduce((sum, p) => sum + p.attending, 0);
  const windowDeclined = series.reduce((sum, p) => sum + p.notAttending, 0);
  const responseRate = totals.views > 0 ? `${Math.min(100, Math.round((totals.responses / totals.views) * 100))}%` : "—";

  return (
    <section className="bg-ink-50/60 py-10 sm:py-14">
      <Container className="max-w-4xl">
        <Link href="/my-invitations" className="flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900">
          <BackIcon className="h-4 w-4" />
          {t.back}
        </Link>

        <p className="mt-3 text-sm text-ink-500">{t.title}</p>
        <h1 className="mt-1 font-heading text-2xl text-ink-900 sm:text-3xl">{couple}</h1>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile icon={Eye} label={t.views} value={totals.views} />
          <Tile icon={MessageSquareReply} label={t.responses} value={totals.responses} />
          <Tile icon={CalendarCheck} label={t.attendingPeople} value={totals.attendingPeople} tone="text-emerald-600" />
          <Tile icon={UserX} label={t.notAttending} value={totals.notAttending} tone="text-destructive" />
          {isPremium && (
            <>
              <Tile icon={TrendingUp} label={t.views7} value={views7} />
              <Tile icon={Users} label={t.responseRate} value={responseRate} hint={t.responseRateHint} />
              <Tile icon={Eye} label={t.peakDay} value={peak.views > 0 ? dayLabel(peak.day) : "—"} hint={peak.views > 0 ? `${peak.views} ${t.viewsUnit}` : undefined} />
              <Tile icon={HelpCircle} label={t.pendingGuests} value={totals.pendingGuests} tone="text-gold-600" />
            </>
          )}
        </div>

        {isPremium ? (
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-ink-100 bg-white p-5 sm:p-6">
              <BarChart
                series={series}
                label={t.viewsChart}
                summary={t.chartSummary(windowViews, peak.views)}
                bars={(p) => [{ height: p.views, className: "bg-ink-800" }]}
              />
              {windowViews === 0 && <p className="mt-4 text-xs leading-relaxed text-ink-500">{t.noViewsYet}</p>}
            </div>
            <div className="rounded-2xl border border-ink-100 bg-white p-5 sm:p-6">
              <BarChart
                series={series}
                label={t.responsesChart}
                summary={t.responsesSummary(windowAttending, windowDeclined)}
                bars={(p) => [
                  { height: p.attending, className: "bg-emerald-500" },
                  { height: p.notAttending, className: "bg-destructive/70" },
                ]}
              />
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-ink-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                  {t.attending}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-destructive/70" aria-hidden="true" />
                  {t.declined}
                </span>
              </div>
              {windowAttending + windowDeclined === 0 && <p className="mt-3 text-xs leading-relaxed text-ink-500">{t.noResponsesYet}</p>}
            </div>
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl border border-ink-100 bg-white p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-heading text-lg text-ink-900">
              <Lock className="h-4 w-4 text-gold-600" aria-hidden="true" />
              {t.premiumTitle}
            </h2>
            <p className="text-sm leading-relaxed text-ink-500">{t.premiumBody}</p>
            <WhatsAppButton size="sm" message={`${t.upgradeMessage}\n${couple}`}>
              {t.upgrade}
            </WhatsAppButton>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href={`/invitations/${invitation.id}/guests`}>
              <Users className="h-4 w-4" />
              {t.guests}
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href={`/invitations/${invitation.id}/share`}>
              <Share2 className="h-4 w-4" />
              {t.share}
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
