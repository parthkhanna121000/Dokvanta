"use client";

import { useCallback, useEffect, useState } from "react";
import { documentService } from "@/services";
import type { DocumentRecord } from "@/types/document";

export type DocumentsState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; documents: DocumentRecord[] };

/**
 * Loads the document list through the service interface and keeps it in sync
 * after rename and delete. `rename` and `remove` reject on failure, so the
 * dialog that called them can show its own error and stay open.
 */
export function useDocuments() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<DocumentsState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    documentService
      .getDocuments()
      .then((documents) => {
        if (!cancelled) setState({ status: "ready", documents });
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

  const rename = useCallback(async (id: string, name: string) => {
    const updated = await documentService.renameDocument(id, name);
    setState((prev) =>
      prev.status === "ready"
        ? { ...prev, documents: prev.documents.map((d) => (d.id === id ? updated : d)) }
        : prev,
    );
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await documentService.deleteDocument(id);
    setState((prev) =>
      prev.status === "ready"
        ? { ...prev, documents: prev.documents.filter((d) => d.id !== id) }
        : prev,
    );
  }, []);

  return { state, retry, rename, remove };
}
