"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "@/services";
import type { LoginInput, RegisterInput, User } from "@/types/auth";

type Status = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: Status;
  user: User | null;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Holds the (mock) session for the whole app. Mounted once in the root layout,
 * so it stays alive across route changes. Initial state is "loading" on both
 * server and client, which keeps hydration consistent.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ status: Status; user: User | null }>({
    status: "loading",
    user: null,
  });

  useEffect(() => {
    let cancelled = false;
    authService
      .getCurrentUser()
      .catch(() => null)
      .then((user) => {
        if (cancelled) return;
        setState(user ? { status: "authenticated", user } : { status: "unauthenticated", user: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const user = await authService.login(input);
    setState({ status: "authenticated", user });
    return user;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const user = await authService.register(input);
    setState({ status: "authenticated", user });
    return user;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setState({ status: "unauthenticated", user: null });
  }, []);

  const value = useMemo(
    () => ({ ...state, login, register, logout }),
    [state, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
