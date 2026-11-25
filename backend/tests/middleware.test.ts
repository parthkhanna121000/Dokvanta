import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { errorHandler } from "../src/middleware/error-handler";
import { requestId } from "../src/middleware/request-id";
import { validate } from "../src/middleware/validate";
import { AppError } from "../src/utils/app-error";

function buildApp() {
  const app = express();
  app.use(requestId);
  app.use(express.json({ limit: "1kb" }));

  app.post(
    "/echo",
    validate({ body: z.object({ name: z.string().min(1) }) }),
    (req, res) => {
      res.json({ body: req.body });
    },
  );

  app.get(
    "/items/:id",
    validate({
      params: z.object({ id: z.string().regex(/^\d+$/) }),
      query: z.object({ page: z.coerce.number().int().min(1).default(1) }),
    }),
    (_req, res) => {
      res.json({ params: res.locals.params, query: res.locals.query });
    },
  );

  app.get("/forbidden", () => {
    throw AppError.forbidden();
  });
  app.get("/conflict", () => {
    throw AppError.conflict("Base revision is stale");
  });
  app.get("/boom", () => {
    throw new Error("secret internal detail");
  });

  app.use(errorHandler);
  return app;
}

describe("validate middleware", () => {
  const app = buildApp();

  it("passes a valid body and strips unknown keys", async () => {
    const res = await request(app).post("/echo").send({ name: "Ada", extra: 1 });
    expect(res.status).toBe(200);
    expect(res.body.body).toEqual({ name: "Ada" });
  });

  it("rejects an invalid body with 400 and issue details", async () => {
    const res = await request(app).post("/echo").send({ name: "" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
    expect(res.body.error.details[0]).toMatchObject({ in: "body", path: "name" });
  });

  it("collects issues across params and query in one response", async () => {
    const res = await request(app).get("/items/abc?page=0");
    expect(res.status).toBe(400);
    const parts = res.body.error.details.map((d: { in: string }) => d.in);
    expect(parts).toContain("params");
    expect(parts).toContain("query");
  });

  it("exposes parsed and coerced params/query via res.locals", async () => {
    const res = await request(app).get("/items/42?page=3");
    expect(res.status).toBe(200);
    expect(res.body.params).toEqual({ id: "42" });
    expect(res.body.query).toEqual({ page: 3 });
  });

  it("applies schema defaults", async () => {
    const res = await request(app).get("/items/42");
    expect(res.body.query).toEqual({ page: 1 });
  });
});

describe("error handler", () => {
  const app = buildApp();

  it("maps AppError.forbidden to 403 FORBIDDEN", async () => {
    const res = await request(app).get("/forbidden");
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("maps AppError.conflict to 409 CONFLICT", async () => {
    const res = await request(app).get("/conflict");
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("hides internals for unexpected errors", async () => {
    const res = await request(app).get("/boom");
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
    expect(res.body.error.message).toBe("Something went wrong");
    expect(JSON.stringify(res.body)).not.toContain("secret internal detail");
  });

  it("returns 413 for an oversized JSON body", async () => {
    const res = await request(app).post("/echo").send({ name: "x".repeat(2000) });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe("PAYLOAD_TOO_LARGE");
  });
});

describe("request id", () => {
  it("replaces an unsafe incoming x-request-id with a generated one", async () => {
    const res = await request(buildApp())
      .get("/forbidden")
      .set("x-request-id", "bad id with spaces!");
    expect(res.headers["x-request-id"]).not.toBe("bad id with spaces!");
    expect(res.headers["x-request-id"]).toHaveLength(36);
  });
});