export type DocumentKind = "pdf" | "created";
export type DocumentStatus = "ready" | "processing" | "failed" | "draft";

/**
 * A document in the workspace. Named DocumentRecord so it never shadows
 * the DOM's global Document type.
 */
export interface DocumentRecord {
  id: string;
  name: string;
  kind: DocumentKind;
  sizeBytes: number;
  /** null while a document is still processing or failed. */
  pageCount: number | null;
  status: DocumentStatus;
  /** ISO 8601 string. Fixed in mock data so rendering is deterministic. */
  modifiedAt: string;
}

/**
 * What an upload reports while it runs. "uploading" carries a 0-100 percent;
 * "processing" means the bytes arrived and the service is preparing the document.
 * Completion is NOT an event: it is the upload promise resolving.
 */
export type UploadProgressEvent =
  | { stage: "uploading"; percent: number }
  | { stage: "processing" };
