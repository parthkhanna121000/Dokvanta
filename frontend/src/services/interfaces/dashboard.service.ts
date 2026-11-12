import type { ActivityItem, StorageUsage } from "@/types/dashboard";

export interface DashboardService {
  getActivity(): Promise<ActivityItem[]>;
  getStorageUsage(): Promise<StorageUsage>;
}
