"use client";

import { LayoutGrid, List, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SORT_LABELS,
  TYPE_LABELS,
  type DocumentListOptions,
  type DocumentSort,
  type DocumentTypeFilter,
} from "../lib/filter-sort";

export type DocumentsViewMode = "list" | "grid";

const TYPES: DocumentTypeFilter[] = ["all", "pdf", "created"];
const SORTS: DocumentSort[] = [
  "modified-desc",
  "modified-asc",
  "name-asc",
  "name-desc",
  "size-desc",
  "size-asc",
];

const SELECT_CLASS =
  "h-9 rounded-md border border-input bg-surface px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50";

interface DocumentsToolbarProps {
  options: DocumentListOptions;
  onOptionsChange: (options: DocumentListOptions) => void;
  view: DocumentsViewMode;
  onViewChange: (view: DocumentsViewMode) => void;
  disabled?: boolean;
}

export function DocumentsToolbar({
  options,
  onOptionsChange,
  view,
  onViewChange,
  disabled = false,
}: DocumentsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-52 flex-1 sm:max-w-xs">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          aria-label="Search documents by name"
          placeholder="Search documents"
          className="pl-9"
          value={options.query}
          disabled={disabled}
          onChange={(e) => onOptionsChange({ ...options, query: e.target.value })}
        />
      </div>

      <select
        aria-label="Filter by type"
        className={SELECT_CLASS}
        value={options.type}
        disabled={disabled}
        onChange={(e) =>
          onOptionsChange({ ...options, type: e.target.value as DocumentTypeFilter })
        }
      >
        {TYPES.map((t) => (
          <option key={t} value={t}>
            {TYPE_LABELS[t]}
          </option>
        ))}
      </select>

      <select
        aria-label="Sort documents"
        className={SELECT_CLASS}
        value={options.sort}
        disabled={disabled}
        onChange={(e) => onOptionsChange({ ...options, sort: e.target.value as DocumentSort })}
      >
        {SORTS.map((s) => (
          <option key={s} value={s}>
            {SORT_LABELS[s]}
          </option>
        ))}
      </select>

      <div role="group" aria-label="Layout" className="ml-auto flex gap-1">
        <Button
          type="button"
          size="icon"
          variant={view === "list" ? "secondary" : "ghost"}
          aria-label="List view"
          aria-pressed={view === "list"}
          disabled={disabled}
          onClick={() => onViewChange("list")}
        >
          <List />
        </Button>
        <Button
          type="button"
          size="icon"
          variant={view === "grid" ? "secondary" : "ghost"}
          aria-label="Grid view"
          aria-pressed={view === "grid"}
          disabled={disabled}
          onClick={() => onViewChange("grid")}
        >
          <LayoutGrid />
        </Button>
      </div>
    </div>
  );
}
