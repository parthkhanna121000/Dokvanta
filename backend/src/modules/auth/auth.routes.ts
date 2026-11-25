import { Router } from "express";
import { validate } from "../../middleware/validate";
import type { AuthConfig } from "./auth.config";
import { currentUser, requireAuth } from "./auth.middleware";
import { loginSchema, registerSchema } from "./auth.schemas";
import { loginUser, registerUser } from "./auth.service";
import { clearAuthCookie, setAuthCookie, signToken } from "./token";

export function createAuthRouter(config: AuthConfig): Router {
  const router = Router();

  router.post("/register", validate({ body: registerSchema }), async (req, res) => {
    const user = await registerUser(config, req.body);
    setAuthCookie(res, config, signToken(config, user.id));
    res.status(201).json({ data: { user } });
  });

  router.post("/login", validate({ body: loginSchema }), async (req, res) => {
    const user = await loginUser(config, req.body);
    setAuthCookie(res, config, signToken(config, user.id));
    res.json({ data: { user } });
  });

  router.post("/logout", (_req, res) => {
    clearAuthCookie(res, config);
    res.status(204).end();
  });

  router.get("/me", requireAuth(config), (req, res) => {
    res.json({ data: { user: currentUser(req) } });
  });

  return router;
}