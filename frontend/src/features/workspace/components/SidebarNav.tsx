"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { WORKSPACE_NAV } from "@/lib/constants/workspace-nav";
import { cn } from "@/lib/utils/cn";

interface SidebarNavProps {
  collapsed?: boolean;
  /** Called when a link is clicked (the mobile drawer uses it to close). */
  onNavigate?: () => void;
}

/** New-document action plus the seven workspace links. Shared by desktop sidebar and mobile drawer. */
export function SidebarNav({ collapsed = false, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  const newDocument = (
    <Button asChild className={cn("w-full", collapsed && "px-0")}>
      <Link href="/creator" onClick={onNavigate}>
        <Plus aria-hidden="true" />
        <span className={cn(collapsed && "sr-only")}>New document</span>
      </Link>
    </Button>
  );

  return (
    <div className="flex flex-col gap-4">
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{newDocument}</TooltipTrigger>
          <TooltipContent side="right">New document</TooltipContent>
        </Tooltip>
      ) : (
        newDocument
      )}

      <nav aria-label="Workspace">
        <ul className="grid gap-1">
          {WORKSPACE_NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const link = (
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
                  collapsed && "justify-center px-0",
                  active ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className="size-4 shrink-0" aria-hidden="true" />
                <span className={cn(collapsed && "sr-only")}>{item.label}</span>
              </Link>
            );
            return (
              <li key={item.href}>
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                ) : (
                  link
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
