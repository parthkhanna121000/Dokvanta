import type { LoginInput, RegisterInput, User } from "@/types/auth";

/** Error with a stable code the UI can branch on. */
export class AuthError extends Error {
  constructor(
    public readonly code: "NO_ACCOUNT" | "EMAIL_TAKEN",
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Contract for authentication. The mock implements it with browser storage.
 * A real backend must hash passwords, verify them, and issue secure sessions;
 * none of that belongs in the frontend.
 */
export interface AuthService {
  register(input: RegisterInput): Promise<User>;
  login(input: LoginInput): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  requestPasswordReset(email: string): Promise<void>;
}
