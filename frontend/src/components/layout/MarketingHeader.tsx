import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";

/**
 * Minimal header for Phase 1. Phase 2 replaces it with the full navigation
 * (Features, Pricing, ...) once those pages exist, so there are no dead links.
 */
export function MarketingHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
        <Logo />
        <nav aria-label="Primary" className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard">Get started</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
