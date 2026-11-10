import { formatBytes, formatDate } from "@/lib/utils/format";
import type { DocumentRecord } from "@/types/document";

/** One line of document details, shared by the list row and the grid card. */
export function DocumentMeta({ doc }: { doc: DocumentRecord }) {
  return (
    <>
      {doc.kind === "pdf" ? "PDF" : "Created"} &middot; {formatBytes(doc.sizeBytes)}
      {doc.pageCount !== null && <> &middot; {doc.pageCount} pages</>} &middot;{" "}
      {formatDate(doc.modifiedAt)}
    </>
  );
}
