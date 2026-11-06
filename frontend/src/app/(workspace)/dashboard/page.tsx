import type { Metadata } from "next";

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
