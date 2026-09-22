"use client";

import { CheckCircle2, Loader2, Star } from "lucide-react";
import * as React from "react";

import type { Dictionary } from "@/lib/i18n/types";
import { hasReviewedToday, leaveReview, reviewErrorMessage } from "@/lib/reviews/leave-review";
import { cn } from "@/lib/utils";

const MAX_COMMENT = 500;

type Phase = "checking" | "idle" | "sending" | "done" | "already";

/**
 * Five stars and a note.
 *
 * Built for a thumb on a phone at a table: the stars are big enough to hit
 * without aiming, the word under them says what the tap meant ("Excellent",
 * not just five yellow shapes), and the note only appears once a rating is
 * chosen, so the first thing asked is the one thing that matters.
 *
 * The venue reads these; nobody else does, and the guest is told so — people
 * write more honestly when they know it is not a public review site.
 */
export function ReviewForm({
  restaurantId,
  tableId,
  orderId,
  t,
  compact = false,
  initialRating = 0,
  onDone,
}: {
  restaurantId: string;
  tableId: string | null;
  orderId?: string | null;
  t: Dictionary;
  /** A star already tapped on the menu, so the guest is not asked twice. */
  initialRating?: number;
  /** Inside the receipt: no heading of its own, the receipt already has one. */
  compact?: boolean;
  onDone?: () => void;
}) {
  const [phase, setPhase] = React.useState<Phase>("checking");
  const [rating, setRating] = React.useState(() => Math.min(5, Math.max(0, Math.round(initialRating))));
  const [hover, setHover] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void hasReviewedToday(restaurantId).then((already) => {
      if (!cancelled) setPhase(already ? "already" : "idle");
    });
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  const labels = [t.reviews.star1, t.reviews.star2, t.reviews.star3, t.reviews.star4, t.reviews.star5];
  const shown = hover || rating;

  const submit = async () => {
    if (rating < 1 || phase === "sending") return;
    setPhase("sending");
    setError(null);
    const result = await leaveReview({ restaurantId, rating, comment, tableId, orderId });
    if ("error" in result) {
      if (result.error.includes("ALREADY_REVIEWED")) {
        setPhase("already");
        return;
      }
      setError(reviewErrorMessage(result.error, t));
      setPhase("idle");
      return;
    }
    setPhase("done");
    onDone?.();
  };

  if (phase === "checking") {
    return (
      <div className="flex justify-center py-6 text-[var(--menu-muted)]">
        <Loader2 className="size-5 animate-spin" aria-hidden />
      </div>
    );
  }

  if (phase === "done" || phase === "already") {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center" role="status" data-testid="review-thanks">
        <span className="grid size-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-600">
          <CheckCircle2 className="size-6" aria-hidden />
        </span>
        <p className="text-base font-semibold">
          {phase === "done" ? t.reviews.thanksTitle : t.reviews.alreadyReviewed}
        </p>
        {phase === "done" ? <p className="text-sm text-[var(--menu-muted)]">{t.reviews.thanksText}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="review-form">
      {!compact ? (
        <div className="text-center">
          <p className="text-lg font-semibold">{t.reviews.rateTitle}</p>
          <p className="mt-1 text-sm text-[var(--menu-muted)]">{t.reviews.rateSubtitle}</p>
        </div>
      ) : null}

      <div className="flex flex-col items-center gap-2">
        {/* A radio group, not five buttons: one choice among five, and arrow
            keys move between them the way a screen-reader user expects. */}
        <div
          role="radiogroup"
          aria-label={t.reviews.pickRating}
          className="flex items-center gap-1"
          // The first star sits where reading starts — on the right in Arabic,
          // the way Arabic rating bars fill — so no `dir` is forced here.
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((value) => {
            const lit = value <= shown;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} — ${labels[value - 1]}`}
                onClick={() => setRating(value)}
                onMouseEnter={() => setHover(value)}
                onKeyDown={(event) => {
                  // "Forward" is towards the end of the line, which is left in
                  // a right-to-left page.
                  const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
                  const forward = rtl ? "ArrowLeft" : "ArrowRight";
                  const backward = rtl ? "ArrowRight" : "ArrowLeft";
                  if (event.key === forward || event.key === "ArrowUp") {
                    event.preventDefault();
                    setRating((current) => Math.min(5, Math.max(1, current + 1)));
                  } else if (event.key === backward || event.key === "ArrowDown") {
                    event.preventDefault();
                    setRating((current) => Math.max(1, current - 1));
                  }
                }}
                tabIndex={rating === value || (rating === 0 && value === 1) ? 0 : -1}
                className="grid size-12 place-items-center rounded-full transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--menu-accent)]"
                data-testid={`review-star-${value}`}
              >
                <Star
                  className={cn(
                    "size-9 transition-colors",
                    lit ? "fill-amber-400 text-amber-400" : "fill-transparent text-[var(--menu-border)]"
                  )}
                  strokeWidth={1.6}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
        <p
          className={cn(
            "h-5 text-sm font-medium",
            shown ? "text-[var(--menu-text)]" : "text-[var(--menu-muted)]"
          )}
          aria-live="polite"
        >
          {shown ? labels[shown - 1] : t.reviews.pickRating}
        </p>
      </div>

      {rating > 0 ? (
        <div className="space-y-2 motion-safe:animate-fade-up">
          <label className="sr-only" htmlFor={`review-note-${restaurantId}`}>
            {t.reviews.commentLabel}
          </label>
          <textarea
            id={`review-note-${restaurantId}`}
            value={comment}
            onChange={(event) => setComment(event.target.value.slice(0, MAX_COMMENT))}
            placeholder={t.reviews.commentPlaceholder}
            // A guest on the Arabic menu may well write in French.
            dir="auto"
            rows={3}
            className="w-full resize-none rounded-[calc(var(--menu-radius)-2px)] border border-[var(--menu-border)] bg-[var(--menu-bg)] px-3 py-2.5 text-[15px] text-[var(--menu-text)] placeholder:text-[var(--menu-muted)] focus:border-[var(--menu-accent)] focus:outline-none"
            data-testid="review-comment"
          />
          <p className="text-end text-xs tabular-nums text-[var(--menu-muted)]">
            {comment.length}/{MAX_COMMENT}
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void submit()}
        disabled={rating < 1 || phase === "sending"}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--menu-accent)] px-4 text-[15px] font-semibold text-[var(--menu-accent-text)] transition-opacity disabled:opacity-40"
        data-testid="review-submit"
      >
        {phase === "sending" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {phase === "sending" ? t.reviews.sending : t.reviews.submit}
      </button>
    </div>
  );
}
