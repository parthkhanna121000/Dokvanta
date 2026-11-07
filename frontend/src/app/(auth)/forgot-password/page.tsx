import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <div className="rounded-lg border bg-surface p-6">
      <h1 className="font-serif text-heading">Reset your password</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        Enter your email and we will record a reset request.
      </p>
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-brand underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
