"use client";

import Link from "next/link";
import { SidebarNav } from "@/features/workspace/components/SidebarNav";
import { SITE } from "@/lib/constants/site";
import { cn } from "@/lib/utils/cn";

export function WorkspaceLogo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      href="/dashboard"
      aria-label={`${SITE.name} overview`}
      className="inline-flex items-center gap-2 rounded-sm font-serif text-xl"
    >
      <span
        aria-hidden="true"
        className="flex size-6 items-center justify-center rounded-sm bg-primary text-sm font-semibold text-primary-foreground"
      >
        D
      </span>
      <span className={cn(collapsed && "sr-only")}>{SITE.name}</span>
    </Link>
  );
}

/** Desktop sidebar (hidden below md; the mobile drawer takes over). */
export function Sidebar({ collapsed }: { collapsed: boolean }) {
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col gap-6 border-r bg-surface p-3 transition-[width] md:flex",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className={cn("flex h-8 items-center", collapsed ? "justify-center" : "px-2")}>
        <WorkspaceLogo collapsed={collapsed} />
      </div>
      <SidebarNav collapsed={collapsed} />
    </aside>
  );
}
