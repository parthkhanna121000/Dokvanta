"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Menu, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** Temporary demo of the overlay primitives. Delete with /design-preview. */
export default function OverlaysPreviewPage() {
  const [lastAction, setLastAction] = useState("none yet");
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-6 py-12">
      <header>
        <p className="text-sm text-muted-foreground">Temporary page. Delete after Phase 1C.</p>
        <h1 className="font-serif text-title">Overlays</h1>
        <p className="mt-2 text-sm">
          Last action: <span className="font-mono">{lastAction}</span>
        </p>
      </header>

      <section className="flex flex-wrap items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Download">
              <Download />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download PDF</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Document actions">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Document</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => setLastAction("rename")}>
              <Pencil /> Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => setConfirmOpen(true)}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">
              <Menu /> Open drawer
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Navigation</SheetTitle>
              <SheetDescription>The mobile menu will live here.</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </section>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this document?</DialogTitle>
            <DialogDescription>
              This is a demo. In the app, this removes the document from your mock workspace.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                setLastAction("delete confirmed");
                setConfirmOpen(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
