import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { UserModel } from "../src/modules/users/user.model";
import { clearTestDb, startTestDb, stopTestDb } from "./helpers/db";
import { createTestContext } from "./helpers/test-context";

const ctx = createTestContext();
const PASSWORD = "correct-horse-battery";

beforeAll(async () => {
  await startTestDb();
});
afterAll(async () => {
  await stopTestDb();
});
beforeEach(async () => {
  await clearTestDb();
});

/** Joins all Set-Cookie headers into one string (supertest types headers loosely). */
function cookiesOf(res: request.Response): string {
  const raw: unknown = res.headers["set-cookie"];
  return Array.isArray(raw) ? raw.join(";") : String(raw ?? "");
}

const register = (email = "ada@example.com", password = PASSWORD) =>
  request(ctx.app).post("/api/v1/auth/register").send({ email, password, name: "Ada" });

describe("POST /api/v1/auth/register", () => {
  it("creates a user and sets an httpOnly SameSite cookie, without exposing the hash", async () => {
    const res = await register();
    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({ email: "ada@example.com", name: "Ada" });
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|\$2[aby]\$/);
    const cookie = cookiesOf(res);
    expect(cookie).toContain("dokvanta_token=");
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  it("stores a bcrypt hash, never the password", async () => {
    await register();
    const user = await UserModel.findOne({ email: "ada@example.com" }).select("+passwordHash");
    expect(user?.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(user?.passwordHash).not.toContain(PASSWORD);
  });

  it("normalizes the email to trimmed lowercase", async () => {
    const res = await register("  Ada@Example.COM ");
    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe("ada@example.com");
  });

  it("rejects a duplicate email (case-insensitive) with 409", async () => {
    await register("ada@example.com");
    const res = await register("ADA@example.com");
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("rejects a short password and an invalid email with 400", async () => {
    const weak = await register("a@example.com", "short");
    expect(weak.status).toBe(400);
    expect(weak.body.error.details[0].path).toBe("password");
    const bad = await register("not-an-email");
    expect(bad.status).toBe(400);
  });
});

describe("POST /api/v1/auth/login", () => {
  it("logs in with the right password and sets a cookie", async () => {
    await register();
    const res = await request(ctx.app)
      .post("/api/v1/auth/login")
      .send({ email: "ada@example.com", password: PASSWORD });
    expect(res.status).toBe(200);
    expect(cookiesOf(res)).toContain("dokvanta_token=");
  });

  it("gives the same 401 for a wrong password and an unknown email", async () => {
    await register();
    const wrong = await request(ctx.app)
      .post("/api/v1/auth/login")
      .send({ email: "ada@example.com", password: "wrong-password-123" });
    const unknown = await request(ctx.app)
      .post("/api/v1/auth/login")
      .send({ email: "nobody@example.com", password: PASSWORD });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error.message).toBe(unknown.body.error.message);
  });
});

describe("GET /api/v1/auth/me and logout", () => {
  it("requires authentication", async () => {
    const res = await request(ctx.app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns the user for a signed-in agent, then 401 after logout", async () => {
    const agent = request.agent(ctx.app);
    await agent.post("/api/v1/auth/register").send({ email: "ada@example.com", password: PASSWORD, name: "Ada" });
    const me = await agent.get("/api/v1/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe("ada@example.com");

    expect((await agent.post("/api/v1/auth/logout")).status).toBe(204);
    expect((await agent.get("/api/v1/auth/me")).status).toBe(401);
  });

  it("rejects a tampered cookie", async () => {
    const res = await request(ctx.app).get("/api/v1/auth/me").set("Cookie", "dokvanta_token=garbage");
    expect(res.status).toBe(401);
  });

  it("rejects a valid token whose user no longer exists", async () => {
    const agent = request.agent(ctx.app);
    await agent.post("/api/v1/auth/register").send({ email: "ada@example.com", password: PASSWORD, name: "Ada" });
    await UserModel.deleteMany({});
    expect((await agent.get("/api/v1/auth/me")).status).toBe(401);
  });
});