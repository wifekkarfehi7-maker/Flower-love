import { Skeleton, SkeletonRows } from "@/components/ui/skeleton";

/**
 * Shown while a dashboard route's data is being fetched, so navigation never
 * lands on a blank screen.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-lg" />
        ))}
      </div>

      <SkeletonRows rows={5} />
    </div>
  );
}
