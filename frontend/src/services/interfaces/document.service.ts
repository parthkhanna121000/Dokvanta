import type { Document } from "@/types/document";

/** Contract for document data. The mock implements it in memory; a backend would replace it. */
export interface DocumentService {
  getDocuments(): Promise<Document[]>;
  getDocumentById(id: string): Promise<Document | null>;
  renameDocument(id: string, name: string): Promise<Document>;
  deleteDocument(id: string): Promise<void>;
}
