import type { AuthService } from "./interfaces/auth.service";
import { mockAuthService } from "./mock/auth.mock";

/**
 * Composition root: the ONLY file that imports mock implementations.
 * Components import services from "@/services". To use a real backend,
 * change the right-hand side here; no UI code changes.
 */
export const authService: AuthService = mockAuthService;
