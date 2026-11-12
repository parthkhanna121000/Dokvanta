export type ActivityKind = "upload" | "question" | "edit" | "create" | "export";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  description: string;
  /** ISO 8601 string. */
  at: string;
}

export interface StorageUsage {
  usedBytes: number;
  totalBytes: number;
}
