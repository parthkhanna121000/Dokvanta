import type { DocumentRecord } from "@/types/document";

/** Contract for document data. The mock implements it in memory; a backend would replace it. */
export interface DocumentService {
  getDocuments(): Promise<DocumentRecord[]>;
  getDocumentById(id: string): Promise<DocumentRecord | null>;
  renameDocument(id: string, name: string): Promise<DocumentRecord>;
  deleteDocument(id: string): Promise<void>;
}
