import { AuthError, type AuthService } from "@/services/interfaces/auth.service";
import type { LoginInput, RegisterInput, User } from "@/types/auth";
import { delay } from "./delay";

/**
 * MOCK ONLY, NOT SECURITY.
 * Stores { id, name, email } in browser storage. Passwords are never stored
 * and never checked. Real auth must be implemented by the backend.
 */
const SESSION_KEY = "dokvanta.mock.session";
const USERS_KEY = "dokvanta.mock.users";

export const DEMO_USER: User = {
  id: "user_demo",
  name: "Demo User",
  email: "demo@dokvanta.app",
};

function read<T>(storage: Storage | undefined, key: string): T | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(storage: Storage | undefined, key: string, value: unknown) {
  try {
    storage?.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private mode, quota). The session just won't persist.
  }
}

const local = () => (typeof window === "undefined" ? undefined : window.localStorage);
const session = () => (typeof window === "undefined" ? undefined : window.sessionStorage);

function readUsers(): User[] {
  return read<User[]>(local(), USERS_KEY) ?? [];
}

function startSession(user: User, remember: boolean) {
  local()?.removeItem(SESSION_KEY);
  session()?.removeItem(SESSION_KEY);
  write(remember ? local() : session(), SESSION_KEY, user);
}

const normalize = (email: string) => email.trim().toLowerCase();

export const mockAuthService: AuthService = {
  async register(input: RegisterInput) {
    await delay(700);
    const email = normalize(input.email);
    const exists = [DEMO_USER, ...readUsers()].some((u) => u.email === email);
    if (exists) {
      throw new AuthError("EMAIL_TAKEN", "An account with this email already exists in the prototype.");
    }
    const user: User = { id: `user_${crypto.randomUUID()}`, name: input.name.trim(), email };
    write(local(), USERS_KEY, [...readUsers(), user]);
    startSession(user, true);
    return user;
  },

  async login(input: LoginInput) {
    await delay(600);
    const email = normalize(input.email);
    const user = [DEMO_USER, ...readUsers()].find((u) => u.email === email);
    if (!user) {
      throw new AuthError(
        "NO_ACCOUNT",
        "No account found for this email in the prototype. Sign up first, or use demo@dokvanta.app.",
      );
    }
    startSession(user, input.remember);
    return user;
  },

  async logout() {
    await delay(200);
    local()?.removeItem(SESSION_KEY);
    session()?.removeItem(SESSION_KEY);
  },

  async getCurrentUser() {
    await delay(150);
    return read<User>(local(), SESSION_KEY) ?? read<User>(session(), SESSION_KEY);
  },

  async requestPasswordReset() {
    await delay(700);
    // Nothing is sent. The UI says so.
  },
};
