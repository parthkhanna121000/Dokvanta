import { FileText } from "lucide-react";
import type { DocumentRecord } from "@/types/document";
import { DocumentMeta } from "./DocumentMeta";
import { DocumentStatusBadge } from "./DocumentStatusBadge";

export function DocumentRow({ doc }: { doc: DocumentRecord }) {
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
    </li>
  );
}
