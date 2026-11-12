import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading dashboard" className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
