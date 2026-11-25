import request from "supertest";
import { describe, expect, it } from "vitest";
import { loadEnv } from "../src/config/env";
import { createTestApp } from "./helpers/test-app";

describe("health and error handling", () => {
  const app = createTestApp();

  it("GET /api/health returns ok with a request id", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.headers["x-request-id"]).toBeTruthy();
  });

  it("echoes a valid incoming x-request-id", async () => {
    const res = await request(app).get("/api/health").set("x-request-id", "abc-123");
    expect(res.headers["x-request-id"]).toBe("abc-123");
  });

  it("GET /api/health/ready returns 503 when the database is not connected", async () => {
    const res = await request(app).get("/api/health/ready");
    expect(res.status).toBe(503);
    expect(res.body.database).toBe("down");
  });

  it("unknown routes return a structured 404", async () => {
    const res = await request(app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(res.body.error.requestId).toBeTruthy();
  });

  it("malformed JSON returns 400 INVALID_JSON", async () => {
    const res = await request(app)
      .post("/api/health")
      .set("Content-Type", "application/json")
      .send("{bad");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_JSON");
  });
});

describe("config", () => {
  it("fails fast when V2_MONGODB_URI is missing", () => {
    expect(() => loadEnv({})).toThrow(/V2_MONGODB_URI/);
  });

  it("applies defaults", () => {
    const env = loadEnv({ V2_MONGODB_URI: "mongodb://x/dokvanta_v2", JWT_SECRET: "x".repeat(32) });
    expect(env.API_PORT).toBe(5001);
    expect(env.CORS_ORIGIN).toBe("http://localhost:3000");
  });

  it("refuses to share the legacy database URI", () => {
    expect(() =>
      loadEnv({ V2_MONGODB_URI: "mongodb://x/a", MONGODB_URI: "mongodb://x/a", JWT_SECRET: "x".repeat(32) }),
    ).toThrow(/legacy/i);
  });
});
