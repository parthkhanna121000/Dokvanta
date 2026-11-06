import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="rounded-lg border bg-surface p-6">
      <h1 className="font-serif text-heading">Sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Placeholder. The login form and mock session are built in Phase 3.
      </p>
    </div>
  );
}
