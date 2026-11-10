"use client";

import { useMemo, useState } from "react";
import { FileText, SearchX } from "lucide-react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Button } from "@/components/ui/button";
import { useDocuments } from "../hooks/useDocuments";
import {
  DEFAULT_LIST_OPTIONS,
  filterAndSortDocuments,
  hasActiveFilters,
  type DocumentListOptions,
} from "../lib/filter-sort";
import { DocumentCard } from "./DocumentCard";
import { DocumentRow } from "./DocumentRow";
import { DocumentsSkeleton } from "./DocumentsSkeleton";
import { DocumentsToolbar, type DocumentsViewMode } from "./DocumentsToolbar";

export function DocumentsView() {
  const { state, retry } = useDocuments();
  const [options, setOptions] = useState<DocumentListOptions>(DEFAULT_LIST_OPTIONS);
  const [view, setView] = useState<DocumentsViewMode>("list");

  const allDocuments = state.status === "ready" ? state.documents : null;
  const visible = useMemo(
    () => (allDocuments ? filterAndSortDocuments(allDocuments, options) : []),
    [allDocuments, options],
  );

  const total = allDocuments?.length ?? 0;
  const filtered = hasActiveFilters(options);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-title">My Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sample documents only. Nothing here is stored on a server.
        </p>
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
                <DocumentRow key={doc.id} doc={doc} />
              ))}
            </ul>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
