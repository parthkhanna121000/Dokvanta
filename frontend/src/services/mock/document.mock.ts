import type { DocumentService, UploadOptions } from "@/services/interfaces/document.service";
import type { DocumentRecord } from "@/types/document";
import { delay } from "./delay";

const MB = 1024 * 1024;

/** Sample data only. Timestamps are fixed so nothing depends on the clock. */
const SEED: DocumentRecord[] = [
  { id: "doc_1", name: "Q3 Project Proposal.pdf", kind: "pdf", sizeBytes: 2.4 * MB, pageCount: 28, status: "ready", modifiedAt: "2026-11-08T09:30:00Z" },
  { id: "doc_2", name: "Distributed Systems Survey.pdf", kind: "pdf", sizeBytes: 5.1 * MB, pageCount: 42, status: "ready", modifiedAt: "2026-11-06T14:10:00Z" },
  { id: "doc_3", name: "Service Agreement.pdf", kind: "pdf", sizeBytes: 0.8 * MB, pageCount: 12, status: "ready", modifiedAt: "2026-11-04T11:00:00Z" },
  { id: "doc_4", name: "Onboarding Handbook", kind: "created", sizeBytes: 0.2 * MB, pageCount: 6, status: "draft", modifiedAt: "2026-11-03T16:45:00Z" },
  { id: "doc_5", name: "Annual Report 2025.pdf", kind: "pdf", sizeBytes: 12.6 * MB, pageCount: null, status: "processing", modifiedAt: "2026-11-02T08:20:00Z" },
  { id: "doc_6", name: "Scan_0042.pdf", kind: "pdf", sizeBytes: 3.3 * MB, pageCount: null, status: "failed", modifiedAt: "2026-10-30T17:05:00Z" },
];

let documents: DocumentRecord[] = SEED.map((d) => ({ ...d, sizeBytes: Math.round(d.sizeBytes) }));

/** Uploaded bytes live only in this tab's memory and are gone on reload. */
const uploadedFiles = new Map<string, File>();
const objectUrls = new Map<string, string>();
let uploadCounter = 0;

/** Fixed, uneven steps so the progress feels real without Math.random or the clock. */
const PROGRESS_STEPS = [4, 9, 15, 24, 33, 41, 52, 60, 71, 79, 88, 95, 100];
const STEP_MS = 170;
const PROCESSING_MS = 1800;

/** Demo hook: a file whose name contains this fails at 60%, so the error state can be seen. */
export const MOCK_FAIL_MARKER = "fail-upload";

function abortError() {
  return new DOMException("Upload cancelled", "AbortError");
}

/** setTimeout that rejects as soon as the signal aborts. */
function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    function onAbort() {
      clearTimeout(timer);
      reject(abortError());
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

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

    const url = objectUrls.get(id);
    if (url) URL.revokeObjectURL(url);
    objectUrls.delete(id);
    uploadedFiles.delete(id);
  },

  async uploadDocument(file: File, { onProgress, signal }: UploadOptions = {}) {
    const shouldFail = file.name.toLowerCase().includes(MOCK_FAIL_MARKER);

    for (const percent of PROGRESS_STEPS) {
      await wait(STEP_MS, signal);
      if (shouldFail && percent >= 60) throw new Error("Simulated upload failure");
      onProgress?.({ stage: "uploading", percent });
    }

    onProgress?.({ stage: "processing" });
    await wait(PROCESSING_MS, signal);
    signal?.throwIfAborted();

    // Commit only now. Nothing is added to the list unless the upload fully succeeded.
    uploadCounter += 1;
    const record: DocumentRecord = {
      id: `doc_upload_${uploadCounter}`,
      name: file.name.trim(),
      kind: "pdf",
      sizeBytes: file.size,
      // Unknown until the viewer parses the file (Phase 5C).
      pageCount: null,
      status: "ready",
      // Fixed arguments, so this never reads the clock; the counter keeps uploads ordered.
      modifiedAt: new Date(Date.UTC(2026, 10, 10, 12, uploadCounter)).toISOString(),
    };
    uploadedFiles.set(record.id, file);
    documents = [record, ...documents];
    return { ...record };
  },

  async getDocumentFileUrl(id) {
    const file = uploadedFiles.get(id);
    if (!file) return null;
    let url = objectUrls.get(id);
    if (!url) {
      url = URL.createObjectURL(file);
      objectUrls.set(id, url);
    }
    return url;
  },
};
