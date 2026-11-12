"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DocumentRecord } from "@/types/document";

interface DeleteDocumentDialogProps {
  /** The document to delete, or null when the dialog is closed. */
  doc: DocumentRecord | null;
  onClose: () => void;
  /** Rejects on failure, so the dialog can show an error and stay open. */
  onDelete: (doc: DocumentRecord) => Promise<void>;
}

export function DeleteDocumentDialog({ doc, onClose, onDelete }: DeleteDocumentDialogProps) {
  return (
    <Dialog
      open={doc !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {doc && <DeleteContent key={doc.id} doc={doc} onClose={onClose} onDelete={onDelete} />}
    </Dialog>
  );
}

function DeleteContent({
  doc,
  onClose,
  onDelete,
}: {
  doc: DocumentRecord;
  onClose: () => void;
  onDelete: (doc: DocumentRecord) => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleDelete() {
    setError(null);
    setSubmitting(true);
    try {
      await onDelete(doc);
      onClose();
    } catch {
      setError("Could not delete this document. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete document?</DialogTitle>
        <DialogDescription>
          &ldquo;{doc.name}&rdquo; will be removed from this demo workspace. The sample data comes
          back when you reload the page.
        </DialogDescription>
      </DialogHeader>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="button" variant="destructive" onClick={handleDelete} loading={submitting}>
          Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
