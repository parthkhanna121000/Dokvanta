import type { AuthService } from "./interfaces/auth.service";
import type { DashboardService } from "./interfaces/dashboard.service";
import type { DocumentService } from "./interfaces/document.service";
import { mockAuthService } from "./mock/auth.mock";
import { mockDashboardService } from "./mock/dashboard.mock";
import { mockDocumentService } from "./mock/document.mock";

/**
 * Composition root: the ONLY file that imports mock implementations.
 * Components import services from "@/services". To use a real backend,
 * change the right-hand side of each line; no UI code changes.
 */
export const authService: AuthService = mockAuthService;
export const documentService: DocumentService = mockDocumentService;
export const dashboardService: DashboardService = mockDashboardService;
