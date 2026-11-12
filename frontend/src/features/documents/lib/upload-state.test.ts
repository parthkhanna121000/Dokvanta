import { describe, expect, it } from "vitest";
import {
  INITIAL_UPLOAD_STATE,
  announcementFor,
  uploadReducer,
  type UploadState,
} from "./upload-state";

const uploading = (percent = 0): UploadState => ({ phase: "uploading", fileName: "a.pdf", percent });
const processing: UploadState = { phase: "processing", fileName: "a.pdf" };
const success: UploadState = { phase: "success", fileName: "a.pdf" };
const failed: UploadState = { phase: "error", kind: "service", fileName: "a.pdf", message: "boom" };

describe("uploadReducer: happy path", () => {
  it("starts idle", () => {
    expect(INITIAL_UPLOAD_STATE).toEqual({ phase: "idle" });
  });

  it("moves from idle to uploading at 0 percent", () => {
    expect(uploadReducer(INITIAL_UPLOAD_STATE, { type: "started", fileName: "a.pdf" })).toEqual(uploading(0));
  });

  it("keeps the highest percent and clamps to 0-100", () => {
    let state = uploadReducer(uploading(40), { type: "progress", event: { stage: "uploading", percent: 30 } });
    expect(state).toMatchObject({ percent: 40 });
    state = uploadReducer(state, { type: "progress", event: { stage: "uploading", percent: 250 } });
    expect(state).toMatchObject({ percent: 100 });
  });

  it("moves to processing when the service reports it", () => {
    expect(uploadReducer(uploading(100), { type: "progress", event: { stage: "processing" } })).toEqual(processing);
  });

  it("does not report success at 100 percent", () => {
    const state = uploadReducer(uploading(95), { type: "progress", event: { stage: "uploading", percent: 100 } });
    expect(state).toEqual(uploading(100));
    expect(state.phase).not.toBe("success");
  });

  it("reaches success only through the succeeded action", () => {
    expect(uploadReducer(processing, { type: "succeeded" })).toEqual(success);
  });
});

describe("uploadReducer: failures and guards", () => {
  it("fails a running upload with a service error and keeps the file name", () => {
    expect(uploadReducer(processing, { type: "failed", message: "boom" })).toEqual(failed);
  });

  it("rejects invalid files as validation errors", () => {
    expect(uploadReducer(INITIAL_UPLOAD_STATE, { type: "rejected", fileName: "b.docx", message: "nope" })).toEqual({
      phase: "error",
      kind: "validation",
      fileName: "b.docx",
      message: "nope",
    });
  });

  it("allows a new attempt from an error", () => {
    expect(uploadReducer(failed, { type: "started", fileName: "a.pdf" })).toEqual(uploading(0));
  });

  it("ignores late events after the upload ended", () => {
    for (const ended of [success, failed]) {
      expect(uploadReducer(ended, { type: "progress", event: { stage: "uploading", percent: 70 } })).toBe(ended);
      expect(uploadReducer(ended, { type: "succeeded" })).toBe(ended);
      expect(uploadReducer(ended, { type: "failed", message: "late" })).toBe(ended);
    }
  });

  it("ignores succeeded, failed and progress when nothing is running", () => {
    const idle = INITIAL_UPLOAD_STATE;
    expect(uploadReducer(idle, { type: "succeeded" })).toBe(idle);
    expect(uploadReducer(idle, { type: "failed", message: "x" })).toBe(idle);
    expect(uploadReducer(idle, { type: "progress", event: { stage: "processing" } })).toBe(idle);
  });

  it("resets to idle from any state", () => {
    for (const state of [uploading(50), processing, success, failed]) {
      expect(uploadReducer(state, { type: "reset" })).toEqual(INITIAL_UPLOAD_STATE);
    }
  });
});

describe("announcementFor", () => {
  it("is silent when idle", () => {
    expect(announcementFor(INITIAL_UPLOAD_STATE)).toBe("");
  });

  it("announces uploading only at 25 percent milestones", () => {
    expect(announcementFor(uploading(24))).toBe("Uploading");
    expect(announcementFor(uploading(33))).toBe("Uploading, 25 percent");
    expect(announcementFor(uploading(41))).toBe(announcementFor(uploading(33)));
    expect(announcementFor(uploading(52))).toBe("Uploading, 50 percent");
  });

  it("announces processing, success and errors", () => {
    expect(announcementFor(processing)).toBe("Processing PDF");
    expect(announcementFor(success)).toContain("Upload complete");
    expect(announcementFor(failed)).toBe("Upload failed. boom");
    expect(
      announcementFor({ phase: "error", kind: "validation", fileName: "b.docx", message: "Only PDF files." }),
    ).toBe("Only PDF files.");
  });
});
