import type { Response } from "express";
import { sign, verify } from "jsonwebtoken";
import type { AuthConfig } from "./auth.config";

export const AUTH_COOKIE = "dokvanta_token";

export function signToken(config: AuthConfig, userId: string): string {
  return sign({}, config.jwtSecret, {
    algorithm: "HS256",
    subject: userId,
    expiresIn: config.tokenTtlSeconds,
  });
}

/** Returns the user id, or null for any invalid, expired or tampered token. */
export function verifyToken(config: AuthConfig, token: string): string | null {
  try {
    const payload = verify(token, config.jwtSecret, { algorithms: ["HS256"] });
    return typeof payload === "object" && typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() !== name) continue;
    const raw = part.slice(index + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function setAuthCookie(res: Response, config: AuthConfig, token: string): void {
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.cookieSecure,
    maxAge: config.tokenTtlSeconds * 1000,
    path: "/",
  });
}

export function clearAuthCookie(res: Response, config: AuthConfig): void {
  res.clearCookie(AUTH_COOKIE, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.cookieSecure,
    path: "/",
  });
}