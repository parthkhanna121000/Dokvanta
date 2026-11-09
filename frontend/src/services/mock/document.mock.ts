import type { DocumentService } from "@/services/interfaces/document.service";
import type { Document } from "@/types/document";
import { delay } from "./delay";

const MB = 1024 * 1024;

/** Sample data only. Timestamps are fixed so nothing depends on the clock. */
const SEED: Document[] = [
  { id: "doc_1", name: "Q3 Project Proposal.pdf", kind: "pdf", sizeBytes: 2.4 * MB, pageCount: 28, status: "ready", modifiedAt: "2026-11-08T09:30:00Z" },
  { id: "doc_2", name: "Distributed Systems Survey.pdf", kind: "pdf", sizeBytes: 5.1 * MB, pageCount: 42, status: "ready", modifiedAt: "2026-11-06T14:10:00Z" },
  { id: "doc_3", name: "Service Agreement.pdf", kind: "pdf", sizeBytes: 0.8 * MB, pageCount: 12, status: "ready", modifiedAt: "2026-11-04T11:00:00Z" },
  { id: "doc_4", name: "Onboarding Handbook", kind: "created", sizeBytes: 0.2 * MB, pageCount: 6, status: "draft", modifiedAt: "2026-11-03T16:45:00Z" },
  { id: "doc_5", name: "Annual Report 2025.pdf", kind: "pdf", sizeBytes: 12.6 * MB, pageCount: null, status: "processing", modifiedAt: "2026-11-02T08:20:00Z" },
  { id: "doc_6", name: "Scan_0042.pdf", kind: "pdf", sizeBytes: 3.3 * MB, pageCount: null, status: "failed", modifiedAt: "2026-10-30T17:05:00Z" },
];

let documents: Document[] = SEED.map((d) => ({ ...d, sizeBytes: Math.round(d.sizeBytes) }));

export const mockDocumentService: DocumentService = {
  async getDocuments() {
    await delay(500);
    return documents.map((d) => ({ ...d }));
  },

  async getDocumentById(id) {
    await delay(250);
    const found = documents.find((d) => d.id === id);
    return found ? { ...found } : null;
  },

  async renameDocument(id, name) {
    await delay(300);
    const index = documents.findIndex((d) => d.id === id);
    if (index === -1) throw new Error("Document not found");
    documents = documents.map((d) => (d.id === id ? { ...d, name: name.trim() } : d));
    return { ...documents[index], name: name.trim() };
  },

  async deleteDocument(id) {
    await delay(300);
    if (!documents.some((d) => d.id === id)) throw new Error("Document not found");
    documents = documents.filter((d) => d.id !== id);
  },
};
