"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/features/auth/components/FormField";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/validations/auth";
import { authService } from "@/services";

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setFormError(null);
    try {
      await authService.requestPasswordReset(values.email);
      setSentTo(values.email);
    } catch {
      setFormError("Something went wrong. Please try again.");
    }
  }

  if (sentTo) {
    return (
      <div role="status" className="grid gap-4">
        <p className="rounded-md border border-success/30 bg-success-soft px-3 py-2 text-sm">
          Request recorded for {sentTo}.
        </p>
        <p className="text-sm text-muted-foreground">
          This is a prototype, so no email was sent. With a real backend, a reset link would arrive here.
        </p>
        <Button asChild variant="outline">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
      {formError && (
        <p role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm">
          {formError}
        </p>
      )}
      <FormField id="forgot-email" label="Email" error={errors.email?.message}>
        <Input
          id="forgot-email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "forgot-email-error" : undefined}
          {...register("email")}
        />
      </FormField>
      <Button type="submit" loading={isSubmitting}>
        Send reset link
      </Button>
    </form>
  );
}
