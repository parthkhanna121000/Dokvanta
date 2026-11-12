import type { DocumentKind, DocumentRecord } from "@/types/document";

export type DocumentTypeFilter = "all" | DocumentKind;

export type DocumentSort =
  | "modified-desc"
  | "modified-asc"
  | "name-asc"
  | "name-desc"
  | "size-desc"
  | "size-asc";

export interface DocumentListOptions {
  query: string;
  type: DocumentTypeFilter;
  sort: DocumentSort;
}

export const DEFAULT_LIST_OPTIONS: DocumentListOptions = {
  query: "",
  type: "all",
  sort: "modified-desc",
};

export const SORT_LABELS: Record<DocumentSort, string> = {
  "modified-desc": "Recently modified",
  "modified-asc": "Oldest modified",
  "name-asc": "Name (A to Z)",
  "name-desc": "Name (Z to A)",
  "size-desc": "Largest first",
  "size-asc": "Smallest first",
};

export const TYPE_LABELS: Record<DocumentTypeFilter, string> = {
  all: "All types",
  pdf: "Uploaded PDFs",
  created: "Created here",
};

/** True when a search or type filter is narrowing the list (sort does not count). */
export function hasActiveFilters(options: DocumentListOptions): boolean {
  return options.query.trim() !== "" || options.type !== "all";
}

const byName = (a: DocumentRecord, b: DocumentRecord) =>
  a.name.localeCompare(b.name, "en", { numeric: true, sensitivity: "base" });

const byModified = (a: DocumentRecord, b: DocumentRecord) =>
  Date.parse(a.modifiedAt) - Date.parse(b.modifiedAt);

const bySize = (a: DocumentRecord, b: DocumentRecord) => a.sizeBytes - b.sizeBytes;

const COMPARATORS: Record<DocumentSort, (a: DocumentRecord, b: DocumentRecord) => number> = {
  "modified-desc": (a, b) => byModified(b, a),
  "modified-asc": byModified,
  "name-asc": byName,
  "name-desc": (a, b) => byName(b, a),
  "size-desc": (a, b) => bySize(b, a),
  "size-asc": bySize,
};

/**
 * Pure: returns a new array and never mutates the input.
 * Search is a case-insensitive substring match on the name.
 * Ties fall back to id so the order is always deterministic.
 */
export function filterAndSortDocuments(
  documents: readonly DocumentRecord[],
  options: DocumentListOptions,
): DocumentRecord[] {
  const query = options.query.trim().toLowerCase();
  const compare = COMPARATORS[options.sort];

  return documents
    .filter((d) => options.type === "all" || d.kind === options.type)
    .filter((d) => query === "" || d.name.toLowerCase().includes(query))
    .sort((a, b) => compare(a, b) || a.id.localeCompare(b.id));
}
