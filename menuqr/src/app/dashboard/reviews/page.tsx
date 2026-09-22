import type { Metadata } from "next";

import { ReviewsView, type ReviewSummary, type ReviewWithContext } from "@/components/reviews/reviews-view";
import { defaultLocale } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { getRestaurantContext } from "@/lib/restaurants/get-restaurant-context";
import { loadReviewPage } from "@/lib/reviews/load-reviews";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: dictionaries[defaultLocale].reviews.title,
  robots: { index: false },
};

const EMPTY_SUMMARY: ReviewSummary = { total: 0, average: null, counts: [0, 0, 0, 0, 0] };

export default async function ReviewsPage() {
  const { active } = await getRestaurantContext();
  const supabase = getSupabaseServerClient();

  let summary = EMPTY_SUMMARY;
  let reviews: ReviewWithContext[] = [];
  let hasMore = false;

  if (active && supabase) {
    const [summaryResult, page] = await Promise.all([
      supabase.rpc("restaurant_review_summary", { p_restaurant: active.id }),
      loadReviewPage(supabase, active.id, 0),
    ]);

    const row = summaryResult.data?.[0];
    if (row) {
      summary = {
        total: Number(row.total),
        average: row.average === null ? null : Number(row.average),
        // one..five, so counts[rating - 1] reads naturally.
        counts: [Number(row.one), Number(row.two), Number(row.three), Number(row.four), Number(row.five)],
      };
    }
    reviews = page.reviews;
    hasMore = page.hasMore;
  }

  return (
    <ReviewsView
      restaurantId={active?.id ?? ""}
      initialSummary={summary}
      initialReviews={reviews}
      initialHasMore={hasMore}
    />
  );
}
