import { describe, expect, it } from "vitest";
import type { DocumentRecord } from "@/types/document";
import {
  DEFAULT_LIST_OPTIONS,
  filterAndSortDocuments,
  hasActiveFilters,
  type DocumentListOptions,
} from "./filter-sort";

function doc(partial: Partial<DocumentRecord> & Pick<DocumentRecord, "id" | "name">): DocumentRecord {
  return {
    kind: "pdf",
    sizeBytes: 1000,
    pageCount: 1,
    status: "ready",
    modifiedAt: "2026-11-01T00:00:00Z",
    ...partial,
  };
}

const DOCS: DocumentRecord[] = [
  doc({ id: "a", name: "Annual Report 2025.pdf", sizeBytes: 12000, modifiedAt: "2026-11-02T00:00:00Z" }),
  doc({ id: "b", name: "Onboarding Handbook", kind: "created", sizeBytes: 2000, modifiedAt: "2026-11-03T00:00:00Z" }),
  doc({ id: "c", name: "Report 10.pdf", sizeBytes: 5000, modifiedAt: "2026-11-05T00:00:00Z" }),
  doc({ id: "d", name: "Report 2.pdf", sizeBytes: 5000, modifiedAt: "2026-11-01T00:00:00Z" }),
];

const ids = (list: DocumentRecord[]) => list.map((d) => d.id);
const run = (overrides: Partial<DocumentListOptions>) =>
  ids(filterAndSortDocuments(DOCS, { ...DEFAULT_LIST_OPTIONS, ...overrides }));

describe("filterAndSortDocuments: sorting", () => {
  it("defaults to most recently modified first", () => {
    expect(run({})).toEqual(["c", "b", "a", "d"]);
  });

  it("sorts oldest modified first", () => {
    expect(run({ sort: "modified-asc" })).toEqual(["d", "a", "b", "c"]);
  });

  it("sorts names with numbers in natural order", () => {
    expect(run({ sort: "name-asc" })).toEqual(["a", "b", "d", "c"]);
    expect(run({ sort: "name-desc" })).toEqual(["c", "d", "b", "a"]);
  });

  it("sorts by size and breaks ties by id", () => {
    expect(run({ sort: "size-desc" })).toEqual(["a", "c", "d", "b"]);
    expect(run({ sort: "size-asc" })).toEqual(["b", "c", "d", "a"]);
  });
});

describe("filterAndSortDocuments: search and type", () => {
  it("matches names case-insensitively and ignores surrounding spaces", () => {
    expect(run({ query: "  REPORT " })).toEqual(["c", "a", "d"]);
  });

  it("treats a blank query as no filter", () => {
    expect(run({ query: "   " })).toEqual(["c", "b", "a", "d"]);
  });

  it("filters by type", () => {
    expect(run({ type: "created" })).toEqual(["b"]);
    expect(run({ type: "pdf" })).toEqual(["c", "a", "d"]);
  });

  it("combines search and type, and can return nothing", () => {
    expect(run({ query: "report", type: "created" })).toEqual([]);
    expect(run({ query: "zzz" })).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const copy = DOCS.map((d) => ({ ...d }));
    filterAndSortDocuments(DOCS, { ...DEFAULT_LIST_OPTIONS, sort: "name-desc" });
    expect(DOCS).toEqual(copy);
  });
});

describe("hasActiveFilters", () => {
  it("is false for the defaults and for sort-only changes", () => {
    expect(hasActiveFilters(DEFAULT_LIST_OPTIONS)).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_LIST_OPTIONS, sort: "name-asc" })).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_LIST_OPTIONS, query: "  " })).toBe(false);
  });

  it("is true when a query or type narrows the list", () => {
    expect(hasActiveFilters({ ...DEFAULT_LIST_OPTIONS, query: "x" })).toBe(true);
    expect(hasActiveFilters({ ...DEFAULT_LIST_OPTIONS, type: "pdf" })).toBe(true);
  });
});
