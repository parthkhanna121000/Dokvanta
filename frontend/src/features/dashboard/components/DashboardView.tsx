"use client";

import { ErrorState } from "@/components/feedback/ErrorState";
import { Button } from "@/components/ui/button";
import { ActivityFeed } from "@/features/dashboard/components/ActivityFeed";
import { DashboardSkeleton } from "@/features/dashboard/components/DashboardSkeleton";
import { QuickAccess } from "@/features/dashboard/components/QuickAccess";
import { RecentDocuments } from "@/features/dashboard/components/RecentDocuments";
import { StorageUsage } from "@/features/dashboard/components/StorageUsage";
import { WelcomeHeader } from "@/features/dashboard/components/WelcomeHeader";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";

/** Client orchestrator: owns loading/error/ready and hands plain data to presentational children. */
export function DashboardView() {
  const { state, retry } = useDashboardData();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <WelcomeHeader />

      {state.status === "loading" && <DashboardSkeleton />}

      {state.status === "error" && (
        <ErrorState
          title="Could not load your dashboard"
          description="The mock service returned an error."
          action={
            <Button variant="outline" onClick={retry}>
              Try again
            </Button>
          }
        />
      )}

      {state.status === "ready" && (
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-8">
            <RecentDocuments documents={state.documents} />
            <QuickAccess />
          </div>
          <div className="space-y-8">
            <StorageUsage usage={state.storage} />
            <ActivityFeed items={state.activity} />
          </div>
        </div>
      )}
    </div>
  );
}
