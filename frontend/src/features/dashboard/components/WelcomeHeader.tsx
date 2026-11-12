"use client";

import Link from "next/link";
import { FilePlus2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";

export function WelcomeHeader() {
  const { user } = useAuth();
  const firstName = user?.name.trim().split(" ")[0] ?? "";

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-title">{firstName ? `Welcome, ${firstName}` : "Welcome"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Here is what is happening in your workspace.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/documents">
            <Upload /> Upload PDF
          </Link>
        </Button>
        <Button asChild>
          <Link href="/creator">
            <FilePlus2 /> New document
          </Link>
        </Button>
      </div>
    </div>
  );
}
