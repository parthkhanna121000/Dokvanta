import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="rounded-lg border bg-surface p-6">
      <h1 className="font-serif text-heading">Sign in</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">Welcome back to Dokvanta.</p>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/signup" className="text-brand underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
