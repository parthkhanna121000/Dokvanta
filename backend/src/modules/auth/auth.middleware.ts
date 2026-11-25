import type { Request, RequestHandler } from "express";
import { AppError } from "../../utils/app-error";
import { UserModel } from "../users/user.model";
import type { AuthConfig } from "./auth.config";
import { AUTH_COOKIE, readCookie, verifyToken } from "./token";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

const OBJECT_ID = /^[a-f0-9]{24}$/i;

/** Verifies the cookie token and loads the user. Rejects with 401 otherwise. */
export function requireAuth(config: AuthConfig): RequestHandler {
  return async (req, _res, next) => {
    const token = readCookie(req.headers.cookie, AUTH_COOKIE);
    const userId = token ? verifyToken(config, token) : null;
    if (!userId || !OBJECT_ID.test(userId)) throw AppError.unauthorized();

    const user = await UserModel.findById(userId).lean();
    if (!user) throw AppError.unauthorized();

    req.user = { id: String(user._id), email: user.email, name: user.name };
    next();
  };
}

/** Use inside handlers behind requireAuth. Avoids non-null assertions. */
export function currentUser(req: Request): AuthUser {
  if (!req.user) throw AppError.unauthorized();
  return req.user;
}