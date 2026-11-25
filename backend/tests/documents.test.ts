import { readFile, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ArtifactModel } from "../src/modules/documents/artifact.model";
import { DocumentModel } from "../src/modules/documents/document.model";
import { RevisionModel } from "../src/modules/documents/revision.model";
import { clearTestDb, startTestDb, stopTestDb } from "./helpers/db";
import { minimalPdf } from "./helpers/pdf-fixtures";
import { createTestContext } from "./helpers/test-context";

type Agent = ReturnType<typeof request.agent>;

const ctx = createTestContext();
const small = createTestContext({ maxUploadBytes: 1024 });
const PASSWORD = "correct-horse-battery";

beforeAll(async () => {
  await startTestDb();
});
afterAll(async () => {
  await stopTestDb();
  await rm(ctx.storageDir, { recursive: true, force: true }).catch(() => undefined);
  await rm(small.storageDir, { recursive: true, force: true }).catch(() => undefined);
});
beforeEach(async () => {
  await clearTestDb();
});

async function signup(email: string, app = ctx.app): Promise<Agent> {
  const agent = request.agent(app);
  const res = await agent.post("/api/v1/auth/register").send({ email, password: PASSWORD, name: "User" });
  expect(res.status).toBe(201);
  return agent;
}

function upload(
  agent: Agent,
  buffer: Buffer,
  options: { filename?: string; contentType?: string } = {},
) {
  return agent.post("/api/v1/documents").attach("file", buffer, {
    filename: options.filename ?? "report.pdf",
    contentType: options.contentType ?? "application/pdf",
  });
}

const binaryParser = (res: request.Response, callback: (err: Error | null, body: Buffer) => void) => {
  const chunks: Buffer[] = [];
  res.on("data", (chunk: Buffer | string) => chunks.push(Buffer.from(chunk)));
  res.on("end", () => callback(null, Buffer.concat(chunks)));
};

describe("upload", () => {
  it("rejects unauthenticated uploads with 401", async () => {
    const res = await request(ctx.app)
      .post("/api/v1/documents")
      .attach("file", minimalPdf(), { filename: "a.pdf", contentType: "application/pdf" });
    expect(res.status).toBe(401);
    expect(await DocumentModel.countDocuments()).toBe(0);
  });

  it("stores the original, creates artifact + revision 1, and hides internals", async () => {
    const agent = await signup("ada@example.com");
    const pdf = minimalPdf("one");
    const res = await upload(agent, pdf);

    expect(res.status).toBe(201);
    const doc = res.body.data;
    expect(doc).toMatchObject({
      title: "report",
      originalFilename: "report.pdf",
      status: "ready",
      sizeBytes: pdf.length,
    });
    // No storage keys, artifact ids or filesystem paths leave the backend.
    const json = JSON.stringify(res.body);
    expect(json).not.toContain(ctx.storageDir);
    expect(json).not.toMatch(/storageKey|originalArtifactId|sha256/);

    const artifact = await ArtifactModel.findOne({ documentId: doc.id });
    expect(artifact?.kind).toBe("original");
    expect(artifact?.sha256).toBe(createHash("sha256").update(pdf).digest("hex"));

    const revision = await RevisionModel.findOne({ documentId: doc.id });
    expect(revision?.number).toBe(1);
    expect(revision?.parentRevisionId).toBeNull();
    expect(String(revision?._id)).toBe(doc.currentRevisionId);

    const onDisk = await readFile(path.join(ctx.storageDir, artifact?.storageKey ?? "missing"));
    expect(onDisk.equals(pdf)).toBe(true);
  });

  it.each([
    ["wrong extension", minimalPdf(), { filename: "report.txt" }, 415],
    ["wrong MIME type", minimalPdf(), { contentType: "text/plain" }, 415],
    ["fake PDF content", Buffer.from("<html>nope</html>"), {}, 415],
    ["truncated PDF", Buffer.from("%PDF-1.4\n1 0 obj\n"), {}, 422],
  ])("rejects %s and leaves nothing behind", async (_label, buffer, options, status) => {
    const agent = await signup("ada@example.com");
    const res = await upload(agent, buffer, options);
    expect(res.status).toBe(status);
    expect(await DocumentModel.countDocuments()).toBe(0);
    expect(await ArtifactModel.countDocuments()).toBe(0);
  });

  it("rejects a request with no file with 400", async () => {
    const agent = await signup("ada@example.com");
    const res = await agent.post("/api/v1/documents").send({});
    expect(res.status).toBe(400);
  });

  it("enforces the size limit with 413", async () => {
    const agent = await signup("big@example.com", small.app);
    const tooBig = Buffer.concat([minimalPdf(), Buffer.alloc(5000, 32)]);
    const res = await upload(agent, tooBig);
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe("FILE_TOO_LARGE");
  });

  it("marks the document failed and hides the cause when storage fails", async () => {
    const failing = createTestContext({
      storage: {
        put: async () => {
          throw new Error("disk full secret detail");
        },
        get: async () => {
          throw new Error("unused");
        },
        exists: async () => false,
      },
    });
    const agent = await signup("ada@example.com", failing.app);
    const res = await upload(agent, minimalPdf());
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain("secret detail");
    const doc = await DocumentModel.findOne({});
    expect(doc?.status).toBe("failed");
    await rm(failing.storageDir, { recursive: true, force: true }).catch(() => undefined);
  });
});

describe("ownership", () => {
  it("lists only the caller's documents", async () => {
    const ada = await signup("ada@example.com");
    const bob = await signup("bob@example.com");
    await upload(ada, minimalPdf("a1"));
    await upload(ada, minimalPdf("a2"));
    await upload(bob, minimalPdf("b1"));

    const adaList = await ada.get("/api/v1/documents");
    expect(adaList.status).toBe(200);
    expect(adaList.body.data).toHaveLength(2);
    expect(adaList.body.meta.total).toBe(2);
    expect((await bob.get("/api/v1/documents")).body.data).toHaveLength(1);
  });

  it("returns metadata to the owner", async () => {
    const ada = await signup("ada@example.com");
    const created = await upload(ada, minimalPdf());
    const res = await ada.get(`/api/v1/documents/${created.body.data.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(created.body.data.id);
  });

  it("makes another user's document look missing (404) for metadata and download", async () => {
    const ada = await signup("ada@example.com");
    const bob = await signup("bob@example.com");
    const created = await upload(ada, minimalPdf());
    const id = created.body.data.id;

    expect((await bob.get(`/api/v1/documents/${id}`)).status).toBe(404);
    expect((await bob.get(`/api/v1/documents/${id}/original`)).status).toBe(404);
  });

  it("requires authentication for metadata and download", async () => {
    const ada = await signup("ada@example.com");
    const created = await upload(ada, minimalPdf());
    const id = created.body.data.id;
    expect((await request(ctx.app).get(`/api/v1/documents/${id}`)).status).toBe(401);
    expect((await request(ctx.app).get(`/api/v1/documents/${id}/original`)).status).toBe(401);
  });

  it("validates ids (400) and reports unknown ids as 404", async () => {
    const ada = await signup("ada@example.com");
    expect((await ada.get("/api/v1/documents/not-an-id")).status).toBe(400);
    expect((await ada.get("/api/v1/documents/64b7f0c2a1b2c3d4e5f60718")).status).toBe(404);
  });
});

describe("download original", () => {
  it("streams the exact uploaded bytes as an attachment", async () => {
    const ada = await signup("ada@example.com");
    const pdf = minimalPdf("download");
    const created = await upload(ada, pdf, { filename: "My Plan.pdf" });

    const res = await ada
      .get(`/api/v1/documents/${created.body.data.id}/original`)
      .buffer(true)
      .parse(binaryParser);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/pdf");
    expect(res.headers["content-disposition"]).toMatch(/attachment/i);
    expect(res.headers["content-disposition"]).toContain("My Plan.pdf");
    expect(res.headers["cache-control"]).toContain("no-store");
    expect(Buffer.from(res.body as Buffer).equals(pdf)).toBe(true);
  });

  it("leaves the stored original untouched across repeated downloads", async () => {
    const ada = await signup("ada@example.com");
    const pdf = minimalPdf("stable");
    const created = await upload(ada, pdf);
    const url = `/api/v1/documents/${created.body.data.id}/original`;
    for (let i = 0; i < 2; i++) {
      const res = await ada.get(url).buffer(true).parse(binaryParser);
      expect(Buffer.from(res.body as Buffer).equals(pdf)).toBe(true);
    }
    const artifact = await ArtifactModel.findOne({ documentId: created.body.data.id });
    const onDisk = await readFile(path.join(ctx.storageDir, artifact?.storageKey ?? "missing"));
    expect(onDisk.equals(pdf)).toBe(true);
  });
});