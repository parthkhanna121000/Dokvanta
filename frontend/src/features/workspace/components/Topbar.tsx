"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/features/workspace/components/Breadcrumbs";
import { MobileSidebar } from "@/features/workspace/components/MobileSidebar";
import { NotificationsMenu } from "@/features/workspace/components/NotificationsMenu";
import { UserMenu } from "@/features/workspace/components/UserMenu";

interface TopbarProps {
  collapsed: boolean;
  onToggleSidebar: () => void;
}

export function Topbar({ collapsed, onToggleSidebar }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur-sm">
      <MobileSidebar />
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:inline-flex"
        onClick={onToggleSidebar}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
      </Button>
      <Breadcrumbs />
      <div className="ml-auto flex items-center gap-1">
        <NotificationsMenu />
        <UserMenu />
      </div>
    </header>
  );
}
