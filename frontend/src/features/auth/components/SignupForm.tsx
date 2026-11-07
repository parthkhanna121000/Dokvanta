"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/features/auth/components/FormField";
import { PasswordInput } from "@/features/auth/components/PasswordInput";
import { PasswordStrength } from "@/features/auth/components/PasswordStrength";
import { signupSchema, type SignupValues } from "@/lib/validations/auth";
import { useAuth } from "@/providers/AuthProvider";

export function SignupForm() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", acceptTerms: false },
  });

  const passwordValue = useWatch({ control, name: "password" });

  async function onSubmit(values: SignupValues) {
    setFormError(null);
    try {
      await registerUser({ name: values.name, email: values.email, password: values.password });
      setCreated(true);
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
      {created && (
        <p role="status" className="rounded-md border border-success/30 bg-success-soft px-3 py-2 text-sm">
          Account created in the prototype. Redirecting...
        </p>
      )}

      <FormField id="signup-name" label="Full name" error={errors.name?.message}>
        <Input
          id="signup-name"
          autoComplete="name"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "signup-name-error" : undefined}
          {...register("name")}
        />
      </FormField>

      <FormField id="signup-email" label="Email" error={errors.email?.message}>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "signup-email-error" : undefined}
          {...register("email")}
        />
      </FormField>

      <FormField id="signup-password" label="Password" error={errors.password?.message}>
        <PasswordInput
          id="signup-password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "signup-password-error" : undefined}
          {...register("password")}
        />
      </FormField>
      <PasswordStrength password={passwordValue} />

      <FormField id="signup-confirm" label="Confirm password" error={errors.confirmPassword?.message}>
        <PasswordInput
          id="signup-confirm"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? "signup-confirm-error" : undefined}
          {...register("confirmPassword")}
        />
      </FormField>

      <div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-primary"
            aria-invalid={!!errors.acceptTerms}
            aria-describedby={errors.acceptTerms ? "signup-terms-error" : undefined}
            {...register("acceptTerms")}
          />
          I understand Dokvanta V1 is a prototype and accept the terms of use.
        </label>
        {errors.acceptTerms && (
          <p id="signup-terms-error" role="alert" className="mt-1 text-xs text-danger">
            {errors.acceptTerms.message}
          </p>
        )}
      </div>

      <Button type="submit" loading={isSubmitting || created}>
        Create account
      </Button>
      <p className="text-xs text-muted-foreground">
        Your password is not stored. Only your name and email are kept in this browser.
      </p>
    </form>
  );
}
