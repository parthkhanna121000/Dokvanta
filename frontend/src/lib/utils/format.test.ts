import { describe, expect, it } from "vitest";
import { formatBytes, formatDate } from "./format";

describe("formatBytes", () => {
  it("formats bytes, kilobytes and megabytes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(2516582)).toBe("2.4 MB");
    expect(formatBytes(10 * 1024 * 1024)).toBe("10 MB");
  });
});

describe("formatDate", () => {
  it("formats an ISO date in UTC", () => {
    expect(formatDate("2026-11-08T09:30:00Z")).toBe("Nov 8, 2026");
  });
});
