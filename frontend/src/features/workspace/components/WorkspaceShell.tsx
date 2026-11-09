"use client";

import { useState } from "react";
import { Sidebar } from "@/features/workspace/components/Sidebar";
import { Topbar } from "@/features/workspace/components/Topbar";

/** Owns the one piece of shell state (sidebar collapsed) and arranges sidebar, top bar and page. */
export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex flex-1">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Sidebar collapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar collapsed={collapsed} onToggleSidebar={() => setCollapsed((c) => !c)} />
        <main id="main" className="flex-1 px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
