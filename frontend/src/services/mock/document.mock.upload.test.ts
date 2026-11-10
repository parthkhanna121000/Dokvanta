import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UploadProgressEvent } from "@/types/document";
import { MOCK_FAIL_MARKER, mockDocumentService } from "./document.mock";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

const pdf = (name = "Contract.pdf") => new File(["%PDF-1.4"], name, { type: "application/pdf" });

describe("mock uploadDocument", () => {
  it("reports rising progress, then processing, then resolves a ready record", async () => {
    const events: UploadProgressEvent[] = [];
    const promise = mockDocumentService.uploadDocument(pdf(), { onProgress: (e) => events.push(e) });
    await vi.runAllTimersAsync();
    const doc = await promise;

    const percents = events.flatMap((e) => (e.stage === "uploading" ? [e.percent] : []));
    expect(percents[0]).toBeGreaterThan(0);
    expect(percents.at(-1)).toBe(100);
    expect([...percents].sort((a, b) => a - b)).toEqual(percents);
    expect(events.at(-1)).toEqual({ stage: "processing" });
    expect(doc).toMatchObject({ name: "Contract.pdf", kind: "pdf", status: "ready", sizeBytes: 8 });
  });

  it("does not resolve before processing has finished", async () => {
    const events: UploadProgressEvent[] = [];
    let settled = false;
    const promise = mockDocumentService.uploadDocument(pdf(), { onProgress: (e) => events.push(e) });
    promise.then(() => {
      settled = true;
    });

    await vi.advanceTimersByTimeAsync(13 * 170);
    expect(events.at(-1)).toEqual({ stage: "processing" });
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(1800);
    expect(settled).toBe(true);
  });

  it("rejects mid-upload for the demo failure marker and never reaches processing", async () => {
    const events: UploadProgressEvent[] = [];
    const promise = mockDocumentService.uploadDocument(pdf(`my-${MOCK_FAIL_MARKER}.pdf`), {
      onProgress: (e) => events.push(e),
    });
    const assertion = expect(promise).rejects.toThrow("Simulated upload failure");
    await vi.runAllTimersAsync();
    await assertion;

    expect(events.every((e) => e.stage === "uploading")).toBe(true);
    expect(events.at(-1)).toEqual({ stage: "uploading", percent: 52 });
  });

  it("rejects with an AbortError when cancelled and emits nothing afterwards", async () => {
    const events: UploadProgressEvent[] = [];
    const controller = new AbortController();
    const promise = mockDocumentService.uploadDocument(pdf(), {
      signal: controller.signal,
      onProgress: (e) => events.push(e),
    });
    const assertion = expect(promise).rejects.toMatchObject({ name: "AbortError" });

    await vi.advanceTimersByTimeAsync(400);
    controller.abort();
    await assertion;

    const countAtAbort = events.length;
    await vi.runAllTimersAsync();
    expect(events.length).toBe(countAtAbort);
  });

  it("gives each upload its own id and a later modified date", async () => {
    const run = async (name: string) => {
      const promise = mockDocumentService.uploadDocument(pdf(name));
      await vi.runAllTimersAsync();
      return promise;
    };
    const first = await run("One.pdf");
    const second = await run("Two.pdf");

    expect(second.id).not.toBe(first.id);
    expect(second.modifiedAt > first.modifiedAt).toBe(true);
  });
});
