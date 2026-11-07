import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/features/auth/components/SignupForm";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <div className="rounded-lg border bg-surface p-6">
      <h1 className="font-serif text-heading">Create your account</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">Start working with documents in Dokvanta.</p>
      <SignupForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-brand underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
