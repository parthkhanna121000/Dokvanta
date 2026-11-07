"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/features/auth/components/FormField";
import { PasswordInput } from "@/features/auth/components/PasswordInput";
import { loginSchema, type LoginValues } from "@/lib/validations/auth";
import { useAuth } from "@/providers/AuthProvider";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    try {
      await login(values);
      setSignedIn(true);
      router.push("/dashboard");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
      {formError && (
        <p role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm">
          {formError}
        </p>
      )}
      {signedIn && (
        <p role="status" className="rounded-md border border-success/30 bg-success-soft px-3 py-2 text-sm">
          Signed in. Redirecting to your dashboard...
        </p>
      )}

      <FormField id="login-email" label="Email" error={errors.email?.message}>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "login-email-error" : undefined}
          {...register("email")}
        />
      </FormField>

      <FormField id="login-password" label="Password" error={errors.password?.message}>
        <PasswordInput
          id="login-password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "login-password-error" : undefined}
          {...register("password")}
        />
      </FormField>

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="size-4 accent-primary" {...register("remember")} />
          Remember me
        </label>
        <Link href="/forgot-password" className="text-brand underline-offset-4 hover:underline">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" loading={isSubmitting || signedIn}>
        Sign in
      </Button>

      <p className="text-xs text-muted-foreground">
        Prototype: use <span className="font-mono">demo@dokvanta.app</span> with any password. Passwords are not
        checked or stored.
      </p>
    </form>
  );
}
