import type { ReactNode } from "react";
import { FileText } from "lucide-react";
import type { DocumentRecord } from "@/types/document";
import { DocumentMeta } from "./DocumentMeta";
import { DocumentStatusBadge } from "./DocumentStatusBadge";

interface DocumentRowProps {
  doc: DocumentRecord;
  /** Optional row actions, e.g. the actions menu. Passed in so this stays presentational. */
  actions?: ReactNode;
}

export function DocumentRow({ doc, actions }: DocumentRowProps) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
      <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{doc.name}</p>
        <p className="text-xs text-muted-foreground">
          <DocumentMeta doc={doc} />
        </p>
      </div>
      <DocumentStatusBadge status={doc.status} />
      {actions}
    </li>
  );
}
