"use client";

import { useMemo, useState } from "react";
import { FileText, SearchX } from "lucide-react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Button } from "@/components/ui/button";
import type { DocumentRecord } from "@/types/document";
import { useDocuments } from "../hooks/useDocuments";
import {
  DEFAULT_LIST_OPTIONS,
  filterAndSortDocuments,
  hasActiveFilters,
  type DocumentListOptions,
} from "../lib/filter-sort";
import { DeleteDocumentDialog } from "./DeleteDocumentDialog";
import { DocumentActionsMenu } from "./DocumentActionsMenu";
import { DocumentCard } from "./DocumentCard";
import { DocumentRow } from "./DocumentRow";
import { DocumentsSkeleton } from "./DocumentsSkeleton";
import { DocumentsToolbar, type DocumentsViewMode } from "./DocumentsToolbar";
import { RenameDocumentDialog } from "./RenameDocumentDialog";

export function DocumentsView() {
  const { state, retry, rename, remove } = useDocuments();
  const [options, setOptions] = useState<DocumentListOptions>(DEFAULT_LIST_OPTIONS);
  const [view, setView] = useState<DocumentsViewMode>("list");
  const [renaming, setRenaming] = useState<DocumentRecord | null>(null);
  const [deleting, setDeleting] = useState<DocumentRecord | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const allDocuments = state.status === "ready" ? state.documents : null;
  const visible = useMemo(
    () => (allDocuments ? filterAndSortDocuments(allDocuments, options) : []),
    [allDocuments, options],
  );

  const total = allDocuments?.length ?? 0;
  const filtered = hasActiveFilters(options);

  function openRename(doc: DocumentRecord) {
    setNotice(null);
    setRenaming(doc);
  }

  function openDelete(doc: DocumentRecord) {
    setNotice(null);
    setDeleting(doc);
  }

  async function handleRename(doc: DocumentRecord, name: string) {
    const updated = await rename(doc.id, name);
    setNotice(`Renamed "${doc.name}" to "${updated.name}".`);
  }

  async function handleDelete(doc: DocumentRecord) {
    await remove(doc.id);
    setNotice(`Deleted "${doc.name}".`);
  }

  const actionsFor = (doc: DocumentRecord) => (
    <DocumentActionsMenu doc={doc} onRename={openRename} onDelete={openDelete} />
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-title">My Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sample documents only. Nothing here is stored on a server.
        </p>
        <div role="status" aria-live="polite">
          {notice && (
            <p className="mt-3 rounded-md border bg-muted px-3 py-2 text-sm">{notice}</p>
          )}
        </div>
      </div>

      <DocumentsToolbar
        options={options}
        onOptionsChange={setOptions}
        view={view}
        onViewChange={setView}
        disabled={state.status !== "ready" || total === 0}
      />

      {state.status === "loading" && <DocumentsSkeleton />}

      {state.status === "error" && (
        <ErrorState
          title="Could not load documents"
          action={
            <Button type="button" variant="outline" onClick={retry}>
              Try again
            </Button>
          }
        />
      )}

      {state.status === "ready" && total === 0 && (
        <EmptyState
          icon={<FileText />}
          title="No documents yet"
          description="Documents you add will appear here."
        />
      )}

      {state.status === "ready" && total > 0 && (
        <>
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {filtered
              ? `Showing ${visible.length} of ${total} documents`
              : `${total} ${total === 1 ? "document" : "documents"}`}
          </p>

          {visible.length === 0 ? (
            <EmptyState
              icon={<SearchX />}
              title="No matching documents"
              description="Try a different search or type filter."
              action={
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOptions({ ...DEFAULT_LIST_OPTIONS, sort: options.sort })}
                >
                  Clear filters
                </Button>
              }
            />
          ) : view === "list" ? (
            <ul className="divide-y rounded-lg border bg-surface">
              {visible.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} actions={actionsFor(doc)} />
              ))}
            </ul>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} actions={actionsFor(doc)} />
              ))}
            </ul>
          )}
        </>
      )}

      <RenameDocumentDialog
        doc={renaming}
        onClose={() => setRenaming(null)}
        onRename={handleRename}
      />
      <DeleteDocumentDialog
        doc={deleting}
        onClose={() => setDeleting(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}
