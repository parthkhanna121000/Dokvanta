import type { DocumentRecord, UploadProgressEvent } from "@/types/document";

export interface UploadOptions {
  onProgress?: (event: UploadProgressEvent) => void;
  /** Aborting rejects the upload with an AbortError and adds nothing to the list. */
  signal?: AbortSignal;
}

/** Contract for document data. The mock implements it in memory; a backend would replace it. */
export interface DocumentService {
  getDocuments(): Promise<DocumentRecord[]>;
  getDocumentById(id: string): Promise<DocumentRecord | null>;
  renameDocument(id: string, name: string): Promise<DocumentRecord>;
  deleteDocument(id: string): Promise<void>;
  /** Resolves with the new record only once the document is ready. Rejects on failure or abort. */
  uploadDocument(file: File, options?: UploadOptions): Promise<DocumentRecord>;
  /**
   * A URL the viewer can load, or null if the service has no file for this id.
   * The service owns the URL's lifetime: callers must not revoke it.
   */
  getDocumentFileUrl(id: string): Promise<string | null>;
}
