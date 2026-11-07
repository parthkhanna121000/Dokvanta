"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";

/** Temporary: replaced by the profile menu in the Phase 4 workspace shell. */
export function SessionControls() {
  const { user, logout } = useAuth();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    await logout(); // WorkspaceGuard then redirects to /login
  }

  return (
    <div className="ml-auto flex items-center gap-3 text-sm">
      <span className="text-muted-foreground">{user?.name}</span>
      <Button variant="outline" size="sm" loading={pending} onClick={handleSignOut}>
        Sign out
      </Button>
    </div>
  );
}
