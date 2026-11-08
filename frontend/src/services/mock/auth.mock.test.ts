// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEMO_USER, mockAuthService } from "./auth.mock";

const SESSION_KEY = "dokvanta.mock.session";
const USERS_KEY = "dokvanta.mock.users";

/** Run a promise while advancing the mock's simulated network delay. */
async function settle<T>(promise: Promise<T>) {
  const outcome = promise.then(
    (value) => ({ status: "ok" as const, value }),
    (error: unknown) => ({ status: "error" as const, error }),
  );
  await vi.runAllTimersAsync();
  return outcome;
}

async function succeed<T>(promise: Promise<T>): Promise<T> {
  const result = await settle(promise);
  if (result.status === "error") throw result.error;
  return result.value;
}

async function fail(promise: Promise<unknown>): Promise<unknown> {
  const result = await settle(promise);
  if (result.status === "ok") throw new Error("Expected the promise to reject");
  return result.error;
}

beforeEach(() => {
  vi.useFakeTimers();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("mockAuthService", () => {
  it("logs in the demo user with any password", async () => {
    const user = await succeed(
      mockAuthService.login({ email: "demo@dokvanta.app", password: "whatever", remember: false }),
    );
    expect(user).toEqual(DEMO_USER);
  });

  it("matches emails case-insensitively", async () => {
    const user = await succeed(
      mockAuthService.login({ email: "  DEMO@Dokvanta.app ", password: "x", remember: false }),
    );
    expect(user.id).toBe(DEMO_USER.id);
  });

  it("rejects an unknown email with NO_ACCOUNT", async () => {
    const error = await fail(
      mockAuthService.login({ email: "nobody@example.com", password: "x", remember: false }),
    );
    expect(error).toMatchObject({ code: "NO_ACCOUNT" });
  });

  it("stores the session in sessionStorage when remember is off", async () => {
    await succeed(mockAuthService.login({ email: DEMO_USER.email, password: "x", remember: false }));
    expect(window.sessionStorage.getItem(SESSION_KEY)).not.toBeNull();
    expect(window.localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it("stores the session in localStorage when remember is on", async () => {
    await succeed(mockAuthService.login({ email: DEMO_USER.email, password: "x", remember: true }));
    expect(window.localStorage.getItem(SESSION_KEY)).not.toBeNull();
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it("registers a user, signs them in, and never stores the password", async () => {
    const user = await succeed(
      mockAuthService.register({ name: " Parth ", email: "Parth@Example.com", password: "SuperSecret123" }),
    );
    expect(user).toMatchObject({ name: "Parth", email: "parth@example.com" });

    const stored = `${window.localStorage.getItem(USERS_KEY)}${window.localStorage.getItem(SESSION_KEY)}`;
    expect(stored).not.toContain("SuperSecret123");

    const current = await succeed(mockAuthService.getCurrentUser());
    expect(current?.email).toBe("parth@example.com");
  });

  it("rejects registering an existing email with EMAIL_TAKEN", async () => {
    const error = await fail(
      mockAuthService.register({ name: "Someone", email: DEMO_USER.email, password: "Password123" }),
    );
    expect(error).toMatchObject({ code: "EMAIL_TAKEN" });
  });

  it("lets a registered user log in again later", async () => {
    await succeed(mockAuthService.register({ name: "Ana", email: "ana@example.com", password: "Password123" }));
    await succeed(mockAuthService.logout());
    const user = await succeed(
      mockAuthService.login({ email: "ana@example.com", password: "anything", remember: false }),
    );
    expect(user.name).toBe("Ana");
  });

  it("clears the session on logout", async () => {
    await succeed(mockAuthService.login({ email: DEMO_USER.email, password: "x", remember: true }));
    await succeed(mockAuthService.logout());
    expect(await succeed(mockAuthService.getCurrentUser())).toBeNull();
  });

  it("returns null when there is no session", async () => {
    expect(await succeed(mockAuthService.getCurrentUser())).toBeNull();
  });
});
