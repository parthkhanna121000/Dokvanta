import { z } from "zod";

const email = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
  remember: z.boolean(),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name"),
    email,
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Include at least one letter and one number"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    acceptTerms: z.boolean().refine((v) => v === true, "Please confirm to continue"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type SignupValues = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
}

/** Simple heuristic for UI feedback only; not a security guarantee. */
export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: "Enter a password" };
  let points = 0;
  if (password.length >= 8) points++;
  if (password.length >= 12) points++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points++;
  if (/\d/.test(password)) points++;
  if (/[^A-Za-z0-9]/.test(password)) points++;
  let score = Math.min(4, points) as PasswordStrength["score"];
  if (password.length < 8) score = Math.min(score, 1) as PasswordStrength["score"];
  const labels = ["Enter a password", "Weak", "Fair", "Good", "Strong"] as const;
  return { score, label: labels[score] };
}
