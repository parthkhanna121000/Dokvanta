"use client";

import { useCallback, useEffect, useState } from "react";
import { dashboardService, documentService } from "@/services";
import type { ActivityItem, StorageUsage } from "@/types/dashboard";
import type { DocumentRecord } from "@/types/document";

export type DashboardState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; documents: DocumentRecord[]; activity: ActivityItem[]; storage: StorageUsage };

/**
 * Loads everything the dashboard needs through the service interfaces.
 * `retry` goes back to "loading" in an event handler, and the effect re-runs.
 */
export function useDashboardData() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<DashboardState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      documentService.getDocuments(),
      dashboardService.getActivity(),
      dashboardService.getStorageUsage(),
    ])
      .then(([documents, activity, storage]) => {
        if (!cancelled) setState({ status: "ready", documents, activity, storage });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  return { state, retry };
}
