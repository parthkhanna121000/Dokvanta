"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const LABELS: Record<string, string> = {
  dashboard: "Overview",
  documents: "My Documents",
  intelligence: "AI Intelligence",
  "visual-edit": "AI Visual Edit",
  creator: "Document Creator",
  templates: "Templates",
  settings: "Settings",
  ai: "Create with AI",
  "from-text": "Create from text",
  editor: "Editor",
};

/** Segments that have no page of their own, so they render as text, not links. */
const NOT_LINKS = new Set(["editor"]);

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((segment, index) => ({
    label: LABELS[segment] ?? decodeURIComponent(segment),
    href: `/${segments.slice(0, index + 1).join("/")}`,
    linkable: !NOT_LINKS.has(segment),
  }));

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex min-w-0 items-center gap-1.5">
              {index > 0 && <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />}
              {last || !crumb.linkable ? (
                <span
                  aria-current={last ? "page" : undefined}
                  className={last ? "truncate font-medium text-foreground" : "truncate"}
                >
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="truncate rounded-sm hover:text-foreground">
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
