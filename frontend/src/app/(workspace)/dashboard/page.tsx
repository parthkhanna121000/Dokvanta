import type { Metadata } from "next";

// The workspace guard reads a mock session in the browser, so this page
// cannot be prerendered. Opt out of instant-navigation validation.
export const instant = false;

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <h1 className="font-serif text-title">Overview</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Placeholder. The dashboard is built in Phase 4.
      </p>
    </div>
  );
}
