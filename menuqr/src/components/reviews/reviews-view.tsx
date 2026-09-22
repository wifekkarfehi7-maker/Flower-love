"use client";

import { Loader2, MessageSquareText, Star, Trash2 } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { formatDateTime, tableDisplayName } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/provider";
import { useRestaurant } from "@/lib/restaurants/provider";
import { loadReviewPage, type ReviewWithContextRow } from "@/lib/reviews/load-reviews";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export type ReviewWithContext = ReviewWithContextRow;

export interface ReviewSummary {
  total: number;
  average: number | null;
  /** counts[0] is one star … counts[4] is five. */
  counts: [number, number, number, number, number];
}

type Filter = "all" | "comments" | "low";

/**
 * What guests said, in the order they said it.
 *
 * The summary leads because it is the question an owner opens this page with
 * — "how are we doing" — and the list follows for "why". The low-score
 * filter exists for the only review that needs acting on the same day.
 */
export function ReviewsView({
  restaurantId,
  initialSummary,
  initialReviews,
  initialHasMore,
}: {
  restaurantId: string;
  initialSummary: ReviewSummary;
  initialReviews: ReviewWithContext[];
  initialHasMore: boolean;
}) {
  const { t, locale } = useTranslation();
  const { can } = useRestaurant();
  const toast = useToast();
  const canManage = can("reviews:manage");

  const [summary, setSummary] = React.useState(initialSummary);
  const [reviews, setReviews] = React.useState(initialReviews);
  const [hasMore, setHasMore] = React.useState(initialHasMore);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [deleting, setDeleting] = React.useState<ReviewWithContext | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);

  const labels = [t.reviews.star1, t.reviews.star2, t.reviews.star3, t.reviews.star4, t.reviews.star5];

  const visible = reviews.filter((review) => {
    if (filter === "comments") return Boolean(review.comment);
    if (filter === "low") return review.rating <= 3;
    return true;
  });

  const loadMore = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || loadingMore) return;
    setLoadingMore(true);
    const page = await loadReviewPage(supabase, restaurantId, reviews.length);
    setLoadingMore(false);
    // A review deleted in another tab shifts the offset by one; dropping ids
    // already shown keeps the list from repeating a row.
    setReviews((current) => {
      const seen = new Set(current.map((review) => review.id));
      return [...current, ...page.reviews.filter((review) => !seen.has(review.id))];
    });
    setHasMore(page.hasMore);
  };

  const confirmDelete = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !deleting) return;
    setDeleteBusy(true);
    const target = deleting;
    // `.select()` so a delete RLS silently filtered out is told apart from
    // one that happened: PostgREST reports success for zero rows either way.
    const { data, error } = await supabase.from("reviews").delete().eq("id", target.id).select("id");
    setDeleteBusy(false);

    if (error || !data || data.length === 0) {
      toast({ title: t.errors.deleteFailed, variant: "error" });
      return;
    }

    setDeleting(null);
    setReviews((current) => current.filter((review) => review.id !== target.id));
    setSummary((current) => {
      const counts = [...current.counts] as ReviewSummary["counts"];
      const index = target.rating - 1;
      counts[index] = Math.max(0, (counts[index] ?? 0) - 1);
      const total = Math.max(0, current.total - 1);
      const sum = counts.reduce((acc, count, i) => acc + count * (i + 1), 0);
      return { total, counts, average: total > 0 ? Math.round((sum / total) * 100) / 100 : null };
    });
    toast({ title: t.reviews.removed, variant: "success" });
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t.reviews.title} description={t.reviews.subtitle} />

      {summary.total === 0 ? (
        <EmptyState icon={<Star />} title={t.reviews.emptyTitle} description={t.reviews.emptyText} />
      ) : (
        <>
          <SummaryCard summary={summary} labels={labels} t={t} />

          <div className="flex flex-wrap gap-2" role="group" aria-label={t.reviews.title}>
            {(
              [
                ["all", t.reviews.filterAll],
                ["comments", t.reviews.filterWithComment],
                ["low", t.reviews.filterLow],
              ] as [Filter, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                  filter === value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t.reviews.noneForFilter}
            </p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2" data-testid="reviews-list">
              {visible.map((review) => (
                <li
                  key={review.id}
                  className={cn(
                    "flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-card",
                    review.rating <= 2 && "border-red-300 dark:border-red-900"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Stars value={review.rating} />
                      <p className="mt-1 text-sm font-medium">{labels[review.rating - 1]}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {formatDateTime(review.created_at, locale)}
                      </span>
                      {canManage ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleting(review)}
                          aria-label={t.common.delete}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {review.comment ? (
                    <p className="whitespace-pre-line break-words text-[15px] leading-relaxed" dir="auto">
                      {review.comment}
                    </p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">{t.reviews.noComment}</p>
                  )}

                  {review.tableName || review.orderNumber != null ? (
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {review.tableName ? (
                        <span className="rounded-full bg-muted px-2.5 py-1">
                          {tableDisplayName(review.tableName, t.menu.tableLabel)}
                        </span>
                      ) : null}
                      {review.orderNumber != null ? (
                        <span className="rounded-full bg-muted px-2.5 py-1">
                          {`${t.reviews.orderChip} #${review.orderNumber}`}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          {hasMore ? (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => void loadMore()} disabled={loadingMore}>
                {loadingMore ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                {t.reviews.loadMore}
              </Button>
            </div>
          ) : null}
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t.reviews.deleteTitle}
        description={t.reviews.deleteText}
        confirmLabel={t.common.delete}
        loading={deleteBusy}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "lg" }) {
  const box = size === "lg" ? "size-5" : "size-4";
  return (
    // Fills from where reading starts, as the guest's own form does; the
    // partial star is clipped from that side too.
    <span className="inline-flex gap-0.5" aria-label={`${value} / 5`} role="img">
      {[1, 2, 3, 4, 5].map((index) => {
        // How much of this star the score covers, so an average of 3.5 shows
        // three and a half stars rather than rounding up to four.
        const share = Math.min(1, Math.max(0, value - (index - 1)));
        return (
          <span key={index} className={cn("relative inline-block", box)}>
            <Star className={cn("absolute inset-0 fill-transparent text-muted-foreground/40", box)} strokeWidth={1.6} aria-hidden />
            {share > 0 ? (
              <span className="absolute inset-y-0 start-0 overflow-hidden" style={{ width: `${share * 100}%` }}>
                <Star className={cn("fill-amber-400 text-amber-400", box)} strokeWidth={1.6} aria-hidden />
              </span>
            ) : null}
          </span>
        );
      })}
    </span>
  );
}

function SummaryCard({
  summary,
  labels,
  t,
}: {
  summary: ReviewSummary;
  labels: string[];
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const { locale } = useTranslation();
  const max = Math.max(...summary.counts, 1);

  return (
    <section
      className="grid gap-6 rounded-2xl border bg-card p-5 shadow-card sm:grid-cols-[auto_1fr] sm:items-center"
      data-testid="reviews-summary"
    >
      <div className="flex flex-col items-center gap-1 sm:min-w-40">
        <p className="text-5xl font-bold tabular-nums leading-none" data-testid="reviews-average">
          {summary.average !== null ? summary.average.toFixed(1) : "—"}
        </p>
        <p className="text-sm text-muted-foreground">{t.reviews.outOfFive}</p>
        <Stars value={summary.average ?? 0} size="lg" />
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MessageSquareText className="size-4" aria-hidden />
          <span className="tabular-nums" data-testid="reviews-total">
            {summary.total}
          </span>{" "}
          {reviewCountWord(summary.total, locale, t)}
        </p>
      </div>

      <ul className="space-y-2">
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = summary.counts[stars - 1] ?? 0;
          return (
            <li key={stars} className="flex items-center gap-3 text-sm">
              <span className="flex w-24 shrink-0 items-center gap-1 tabular-nums sm:w-28">
                {stars}
                <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
                <span className="truncate text-xs text-muted-foreground">{labels[stars - 1]}</span>
              </span>
              <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className={cn("block h-full rounded-full", stars >= 4 ? "bg-emerald-500" : stars === 3 ? "bg-amber-400" : "bg-red-500")}
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </span>
              <span className="w-8 shrink-0 text-end tabular-nums text-muted-foreground">{count}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * "1 review", "2 reviews"; in Arabic the noun changes with the number —
 * تقييم for one, تقييمات for two to ten, تقييم again from eleven — so the
 * language's own plural rules pick the word rather than an "s".
 */
function reviewCountWord(count: number, locale: string, t: ReturnType<typeof useTranslation>["t"]) {
  const rule = new Intl.PluralRules(locale).select(count);
  if (rule === "one") return t.reviews.countOne;
  if (rule === "two") return t.reviews.countTwo;
  if (rule === "few") return t.reviews.countFew;
  return t.reviews.countOther;
}
