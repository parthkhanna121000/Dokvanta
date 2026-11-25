import type { Env } from "../../config/env";

export interface AuthConfig {
  jwtSecret: string;
  tokenTtlSeconds: number;
  cookieSecure: boolean;
  bcryptCost: number;
}

export function authConfigFromEnv(env: Env): AuthConfig {
  return {
    jwtSecret: env.JWT_SECRET,
    tokenTtlSeconds: env.JWT_EXPIRES_IN_SECONDS,
    cookieSecure: env.NODE_ENV === "production",
    bcryptCost: env.NODE_ENV === "test" ? 4 : 12,
  };
}