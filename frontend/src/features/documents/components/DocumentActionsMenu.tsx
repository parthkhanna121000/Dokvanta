"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DocumentRecord } from "@/types/document";

interface DocumentActionsMenuProps {
  doc: DocumentRecord;
  onRename: (doc: DocumentRecord) => void;
  onDelete: (doc: DocumentRecord) => void;
}

/**
 * modal={false} avoids a known Radix clash when a dialog opens from a menu
 * item: with a modal menu, the page can be left unclickable after the dialog closes.
 */
export function DocumentActionsMenu({ doc, onRename, onDelete }: DocumentActionsMenuProps) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={`Actions for ${doc.name}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onRename(doc)}>
          <Pencil aria-hidden="true" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={() => onDelete(doc)}>
          <Trash2 aria-hidden="true" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
