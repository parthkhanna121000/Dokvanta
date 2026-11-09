import type { DashboardService } from "@/services/interfaces/dashboard.service";
import type { ActivityItem } from "@/types/dashboard";
import { delay } from "./delay";

const MB = 1024 * 1024;

/** Sample data only: nothing here was produced by a real model or backend. */
const ACTIVITY: ActivityItem[] = [
  { id: "a1", kind: "question", description: "Asked about project risks in Q3 Project Proposal.pdf", at: "2026-11-08T09:42:00Z" },
  { id: "a2", kind: "edit", description: "Reviewed 3 proposed edits in Q3 Project Proposal.pdf", at: "2026-11-08T09:20:00Z" },
  { id: "a3", kind: "upload", description: "Uploaded Annual Report 2025.pdf", at: "2026-11-02T08:20:00Z" },
  { id: "a4", kind: "create", description: "Started Onboarding Handbook from a template", at: "2026-11-03T16:45:00Z" },
  { id: "a5", kind: "export", description: "Exported Service Agreement.pdf", at: "2026-11-04T11:10:00Z" },
];

export const mockDashboardService: DashboardService = {
  async getActivity() {
    await delay(400);
    return ACTIVITY.map((a) => ({ ...a }));
  },

  async getStorageUsage() {
    await delay(300);
    // Illustrative values, not a real quota.
    return { usedBytes: 38.4 * MB, totalBytes: 100 * MB };
  },
};
