"use client";

import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { validateRename } from "@/lib/validations/document";
import type { DocumentRecord } from "@/types/document";

interface RenameDocumentDialogProps {
  /** The document being renamed, or null when the dialog is closed. */
  doc: DocumentRecord | null;
  onClose: () => void;
  /** Rejects on failure, so the dialog can show an error and stay open. */
  onRename: (doc: DocumentRecord, name: string) => Promise<void>;
}

export function RenameDocumentDialog({ doc, onClose, onRename }: RenameDocumentDialogProps) {
  return (
    <Dialog
      open={doc !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {/* Keyed by id and mounted only while open, so the form state resets each time. */}
      {doc && <RenameForm key={doc.id} doc={doc} onClose={onClose} onRename={onRename} />}
    </Dialog>
  );
}

function RenameForm({
  doc,
  onClose,
  onRename,
}: {
  doc: DocumentRecord;
  onClose: () => void;
  onRename: (doc: DocumentRecord, name: string) => Promise<void>;
}) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const [name, setName] = useState(doc.name);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateRename(name, doc.name);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onRename(doc, result.name);
      onClose();
    } catch {
      setError("Could not rename this document. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <DialogContent>
      <form onSubmit={handleSubmit} noValidate className="grid gap-4">
        <DialogHeader>
          <DialogTitle>Rename document</DialogTitle>
          <DialogDescription>
            Choose a new name. In this demo the change lasts until you reload the page.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-1.5">
          <label htmlFor={inputId} className="text-sm font-medium">
            Name
          </label>
          <Input
            id={inputId}
            value={name}
            autoComplete="off"
            disabled={submitting}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
          />
          {error && (
            <p id={errorId} role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Save
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
