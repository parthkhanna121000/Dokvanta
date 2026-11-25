import { promises as fs } from "node:fs";
import path from "node:path";
import type { FileStorage } from "./file-storage";

// Segments are letters, digits, "_" and "-" only, so ".." and separators can never appear.
const KEY_PATTERN = /^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*\.pdf$/;

function hasCode(err: unknown, code: string): boolean {
  return typeof err === "object" && err !== null && (err as { code?: unknown }).code === code;
}

export class LocalFileStorage implements FileStorage {
  private readonly root: string;

  constructor(rootDir: string) {
    this.root = path.resolve(rootDir);
  }

  private resolveKey(key: string): string {
    if (!KEY_PATTERN.test(key)) throw new Error("Invalid storage key");
    const full = path.resolve(this.root, ...key.split("/"));
    if (!full.startsWith(this.root + path.sep)) throw new Error("Invalid storage key");
    return full;
  }

  async put(key: string, data: Buffer): Promise<void> {
    const full = this.resolveKey(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    try {
      // "wx" = fail if the file exists; 0o444 = read-only. Together they enforce immutability.
      await fs.writeFile(full, data, { flag: "wx", mode: 0o444 });
    } catch (err) {
      if (hasCode(err, "EEXIST")) {
        throw new Error("Storage key already exists (artifacts are immutable)");
      }
      throw err;
    }
  }

  async get(key: string): Promise<Buffer> {
    const full = this.resolveKey(key);
    try {
      return await fs.readFile(full);
    } catch (err) {
      if (hasCode(err, "ENOENT")) throw new Error("Stored file not found");
      throw err;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.resolveKey(key));
      return true;
    } catch {
      return false;
    }
  }
}