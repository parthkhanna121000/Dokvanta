import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { LocalFileStorage } from "../src/storage/local-file-storage";

const dir = mkdtempSync(path.join(tmpdir(), "dokvanta-storage-"));
const storage = new LocalFileStorage(dir);

afterAll(() => {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    /* temp dir cleanup is best effort */
  }
});

describe("LocalFileStorage", () => {
  it("stores and reads back identical bytes", async () => {
    const data = Buffer.from("%PDF-1.4 hello %%EOF");
    await storage.put("owner1/doc1/art1.pdf", data);
    expect((await storage.get("owner1/doc1/art1.pdf")).equals(data)).toBe(true);
    expect(await storage.exists("owner1/doc1/art1.pdf")).toBe(true);
  });

  it("refuses to overwrite an existing key and keeps the original bytes", async () => {
    await storage.put("owner1/doc1/art2.pdf", Buffer.from("first"));
    await expect(storage.put("owner1/doc1/art2.pdf", Buffer.from("second"))).rejects.toThrow(/immutable/i);
    expect((await storage.get("owner1/doc1/art2.pdf")).toString()).toBe("first");
  });

  it.each(["../x.pdf", "a/../b.pdf", "/abs.pdf", "a\\b.pdf", "a/b.txt", "a//b.pdf", "..%2f.pdf", ""])(
    "rejects unsafe key %j",
    async (key) => {
      await expect(storage.put(key, Buffer.from("x"))).rejects.toThrow(/invalid storage key/i);
      await expect(storage.get(key)).rejects.toThrow(/invalid storage key/i);
    },
  );

  it("reports a missing file", async () => {
    await expect(storage.get("owner1/doc1/missing.pdf")).rejects.toThrow(/not found/i);
    expect(await storage.exists("owner1/doc1/missing.pdf")).toBe(false);
  });
});