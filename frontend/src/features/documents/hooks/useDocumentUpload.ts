"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { validateUpload } from "@/lib/validations/upload";
import { documentService } from "@/services";
import type { DocumentRecord } from "@/types/document";
import { INITIAL_UPLOAD_STATE, uploadReducer } from "../lib/upload-state";

const FAILURE_MESSAGE = "The upload was interrupted, so nothing was added to your documents.";

/**
 * Connects the upload UI to documentService.uploadDocument.
 * - "succeeded" is dispatched only after the service promise resolves.
 * - Cancelling, resetting or unmounting aborts the request; whatever the service
 *   reports after that is ignored, and nothing is added to the list.
 */
export function useDocumentUpload({ onUploaded }: { onUploaded: (doc: DocumentRecord) => void }) {
  const [state, dispatch] = useReducer(uploadReducer, INITIAL_UPLOAD_STATE);
  const controllerRef = useRef<AbortController | null>(null);
  const fileRef = useRef<File | null>(null);
  const onUploadedRef = useRef(onUploaded);

  useEffect(() => {
    onUploadedRef.current = onUploaded;
  });

  // Abort an in-flight upload when the dialog content unmounts.
  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, []);

  const run = useCallback(async (file: File) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    fileRef.current = file;
    dispatch({ type: "started", fileName: file.name });

    let doc: DocumentRecord;
    try {
      doc = await documentService.uploadDocument(file, {
        signal: controller.signal,
        onProgress: (event) => {
          if (controllerRef.current === controller) dispatch({ type: "progress", event });
        },
      });
    } catch {
      // Cancelled or superseded: stay quiet. Otherwise it is a real failure.
      if (controllerRef.current !== controller) return;
      controllerRef.current = null;
      dispatch({ type: "failed", message: FAILURE_MESSAGE });
      return;
    }

    if (controllerRef.current !== controller) return;
    controllerRef.current = null;
    dispatch({ type: "succeeded" });
    onUploadedRef.current(doc);
  }, []);

  const selectFile = useCallback(
    (file: File) => {
      const result = validateUpload(file);
      if (!result.ok) {
        fileRef.current = null;
        dispatch({ type: "rejected", fileName: file.name, message: result.error });
        return;
      }
      void run(file);
    },
    [run],
  );

  const retry = useCallback(() => {
    if (fileRef.current) void run(fileRef.current);
  }, [run]);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    fileRef.current = null;
    dispatch({ type: "reset" });
  }, []);

  return { state, selectFile, retry, reset };
}
