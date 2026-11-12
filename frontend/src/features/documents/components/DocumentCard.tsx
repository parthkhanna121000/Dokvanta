import type { ReactNode } from "react";
import { FileText } from "lucide-react";
import type { DocumentRecord } from "@/types/document";
import { DocumentMeta } from "./DocumentMeta";
import { DocumentStatusBadge } from "./DocumentStatusBadge";

interface DocumentCardProps {
  doc: DocumentRecord;
  /** Optional card actions, e.g. the actions menu. */
  actions?: ReactNode;
}

export function DocumentCard({ doc, actions }: DocumentCardProps) {
  return (
    <li className="flex flex-col gap-3 rounded-lg border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <FileText className="size-5" aria-hidden="true" />
        </div>
        <div className="flex items-center gap-1">
          <DocumentStatusBadge status={doc.status} />
          {actions}
        </div>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium" title={doc.name}>
          {doc.name}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          <DocumentMeta doc={doc} />
        </p>
      </div>
    </li>
  );
}
