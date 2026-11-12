import Link from "next/link";
import { FileText } from "lucide-react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/ui/button";
import { DocumentStatusBadge } from "@/features/documents/components/DocumentStatusBadge";
import { formatBytes, formatDate } from "@/lib/utils/format";
import type { DocumentRecord } from "@/types/document";

export function RecentDocuments({ documents }: { documents: readonly DocumentRecord[] }) {
  const recent = [...documents].sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt)).slice(0, 5);

  return (
    <section aria-labelledby="recent-heading">
      <div className="flex items-center justify-between">
        <h2 id="recent-heading" className="font-serif text-heading">
          Recent documents
        </h2>
        <Button asChild variant="link" size="sm">
          <Link href="/documents">View all</Link>
        </Button>
      </div>

      {recent.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={<FileText />}
          title="No documents yet"
          description="Upload a PDF or create a document to get started."
        />
      ) : (
        <ul className="mt-4 divide-y rounded-lg border bg-surface">
          {recent.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
              <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{doc.name}</p>
                <p className="text-xs text-muted-foreground">
                  {doc.kind === "pdf" ? "PDF" : "Created"} &middot; {formatBytes(doc.sizeBytes)}
                  {doc.pageCount !== null && <> &middot; {doc.pageCount} pages</>} &middot;{" "}
                  {formatDate(doc.modifiedAt)}
                </p>
              </div>
              <DocumentStatusBadge status={doc.status} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
