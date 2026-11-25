import { z } from "zod";

const email = z.string().trim().toLowerCase().max(254).pipe(z.email());

export const registerSchema = z.object({
  email,
  // bcrypt only uses the first 72 bytes, so longer passwords are rejected, not silently truncated.
  password: z.string().min(12, "must be at least 12 characters").max(72),
  name: z.string().trim().min(1).max(100),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(72),
});