import { AppError } from "../../utils/app-error";

export const SESSION_STATUSES = [
  "processing",
  "preview_ready",
  "reviewing",
  "committing",
  "completed",
  "failed",
  "cancelled",
] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

/**
 * The only legal moves. Everything else is rejected, including "committing a cancelled session".
 * preview_ready = proposals are stored and ready for review (Milestone 4 adds PDF preview rendering).
 */
const ALLOWED: Record<SessionStatus, readonly SessionStatus[]> = {
  processing: ["preview_ready", "failed", "cancelled"],
  preview_ready: ["reviewing", "cancelled", "failed"],
  reviewing: ["committing", "cancelled", "failed"],
  committing: ["completed", "failed", "reviewing"],
  completed: [],
  failed: [],
  cancelled: [],
};

/** Accept/reject decisions are only allowed in these states. */
export const ACTIVE_STATUSES: readonly SessionStatus[] = ["preview_ready", "reviewing"];

/** A session can be cancelled until it starts committing. */
export const CANCELLABLE_STATUSES: readonly SessionStatus[] = ["processing", "preview_ready", "reviewing"];

export function canTransition(from: SessionStatus, to: SessionStatus): boolean {
  return ALLOWED[from].includes(to);
}

export function assertTransition(from: SessionStatus, to: SessionStatus): void {
  if (!canTransition(from, to)) {
    throw new AppError(409, "INVALID_STATE_TRANSITION", `An editing session cannot move from ${from} to ${to}`);
  }
}