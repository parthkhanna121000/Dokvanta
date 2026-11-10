import type { UploadProgressEvent } from "@/types/document";

export type UploadPhase = "idle" | "uploading" | "processing" | "success" | "error";
export type UploadErrorKind = "validation" | "service";

export type UploadState =
  | { phase: "idle" }
  | { phase: "uploading"; fileName: string; percent: number }
  | { phase: "processing"; fileName: string }
  | { phase: "success"; fileName: string }
  | { phase: "error"; kind: UploadErrorKind; fileName: string | null; message: string };

export type UploadAction =
  | { type: "started"; fileName: string }
  | { type: "progress"; event: UploadProgressEvent }
  | { type: "succeeded" }
  | { type: "failed"; message: string }
  | { type: "rejected"; fileName: string; message: string }
  | { type: "reset" };

export const INITIAL_UPLOAD_STATE: UploadState = { phase: "idle" };

const clampPercent = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

/**
 * Pure state machine for one upload dialog. Two rules matter most:
 * - Reaching 100% never means done. "success" is entered only by the
 *   "succeeded" action, which the hook dispatches after the service promise resolves.
 * - Events that arrive in the wrong phase (late progress after an error, a second
 *   "succeeded") are ignored and return the same state object.
 */
export function uploadReducer(state: UploadState, action: UploadAction): UploadState {
  const running = state.phase === "uploading" || state.phase === "processing";

  switch (action.type) {
    case "started":
      return state.phase === "idle" || state.phase === "error"
        ? { phase: "uploading", fileName: action.fileName, percent: 0 }
        : state;

    case "rejected":
      return state.phase === "idle" || state.phase === "error"
        ? { phase: "error", kind: "validation", fileName: action.fileName, message: action.message }
        : state;

    case "progress":
      if (state.phase !== "uploading") return state;
      if (action.event.stage === "processing") {
        return { phase: "processing", fileName: state.fileName };
      }
      return { ...state, percent: Math.max(state.percent, clampPercent(action.event.percent)) };

    case "succeeded":
      return running ? { phase: "success", fileName: state.fileName } : state;

    case "failed":
      return running
        ? { phase: "error", kind: "service", fileName: state.fileName, message: action.message }
        : state;

    case "reset":
      return INITIAL_UPLOAD_STATE;
  }
}

/**
 * Text for the screen-reader live region. During upload it only changes at
 * 25% milestones, so assistive tech is not interrupted on every tick.
 */
export function announcementFor(state: UploadState): string {
  switch (state.phase) {
    case "idle":
      return "";
    case "uploading": {
      const milestone = Math.floor(state.percent / 25) * 25;
      return milestone === 0 ? "Uploading" : `Uploading, ${milestone} percent`;
    }
    case "processing":
      return "Processing PDF";
    case "success":
      return "Upload complete. The document was added to your list.";
    case "error":
      return state.kind === "service" ? `Upload failed. ${state.message}` : state.message;
  }
}
