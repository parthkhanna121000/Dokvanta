"use client";

import { Bell } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SAMPLE_NOTIFICATIONS } from "@/features/workspace/notifications";

export function NotificationsMenu() {
  const [readIds, setReadIds] = useState<string[]>([]);
  const unread = SAMPLE_NOTIFICATIONS.filter((n) => !readIds.includes(n.id)).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <Bell />
          {unread > 0 && (
            <span
              aria-hidden="true"
              className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-medium text-brand-foreground"
            >
              {unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications (sample data)</DropdownMenuLabel>
        {SAMPLE_NOTIFICATIONS.map((n) => {
          const isRead = readIds.includes(n.id);
          return (
            <DropdownMenuItem
              key={n.id}
              className="flex-col items-start gap-0.5"
              onSelect={(event) => {
                event.preventDefault();
                setReadIds((ids) => (ids.includes(n.id) ? ids : [...ids, n.id]));
              }}
            >
              <span className={isRead ? "text-muted-foreground" : "font-medium"}>
                {n.title}
                {!isRead && <span className="ml-2 text-xs font-normal text-brand">New</span>}
              </span>
              <span className="text-xs text-muted-foreground">{n.detail}</span>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={unread === 0}
          onSelect={(event) => {
            event.preventDefault();
            setReadIds(SAMPLE_NOTIFICATIONS.map((n) => n.id));
          }}
        >
          Mark all as read
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
