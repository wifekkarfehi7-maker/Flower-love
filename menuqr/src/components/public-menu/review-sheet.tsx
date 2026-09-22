"use client";

import * as React from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { Dictionary } from "@/lib/i18n/types";
import { ReviewForm } from "./review-form";

/**
 * The rating form as a bottom sheet, opened from the menu itself so a venue
 * that does not take orders from the phone still hears from its guests.
 */
export function ReviewSheet({
  themeStyle,
  open,
  onOpenChange,
  restaurantId,
  tableId,
  initialRating = 0,
  t,
}: {
  /** Portalled outside the menu, so the palette has to travel with it —
      otherwise every var(--menu-*) is empty and the sheet paints transparent. */
  themeStyle: React.CSSProperties;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: string;
  tableId: string | null;
  initialRating?: number;
  t: Dictionary;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={themeStyle}
        className="border-[var(--menu-border)] bg-[var(--menu-surface)] text-[var(--menu-text)] sm:max-w-md"
        data-testid="review-sheet"
      >
        {/* The form carries its own visible heading; these keep the dialog
            named for assistive technology without saying it twice. */}
        <DialogTitle className="sr-only">{t.reviews.rateTitle}</DialogTitle>
        <DialogDescription className="sr-only">{t.reviews.rateSubtitle}</DialogDescription>

        <div className="overflow-y-auto px-5 pb-6 pt-4">
          {/* Mounted only while open, so re-opening re-checks whether this
              phone has already had its say today. */}
          {open ? (
            <ReviewForm restaurantId={restaurantId} tableId={tableId} initialRating={initialRating} t={t} />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
