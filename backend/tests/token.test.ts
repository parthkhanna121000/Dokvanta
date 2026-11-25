import { describe, expect, it } from "vitest";
import { readCookie, signToken, verifyToken } from "../src/modules/auth/token";
import { TEST_AUTH } from "./helpers/test-context";

const USER_ID = "64b7f0c2a1b2c3d4e5f60718";

describe("tokens", () => {
  it("round-trips the user id", () => {
    expect(verifyToken(TEST_AUTH, signToken(TEST_AUTH, USER_ID))).toBe(USER_ID);
  });

  it("rejects a token signed with another secret", () => {
    const token = signToken({ ...TEST_AUTH, jwtSecret: "another-secret".repeat(4) }, USER_ID);
    expect(verifyToken(TEST_AUTH, token)).toBeNull();
  });

  it("rejects an expired token", () => {
    expect(verifyToken(TEST_AUTH, signToken({ ...TEST_AUTH, tokenTtlSeconds: -10 }, USER_ID))).toBeNull();
  });

  it("rejects an unsigned alg=none token", () => {
    const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
    const forged = `${b64({ alg: "none", typ: "JWT" })}.${b64({ sub: USER_ID })}.`;
    expect(verifyToken(TEST_AUTH, forged)).toBeNull();
  });

  it("rejects garbage", () => {
    expect(verifyToken(TEST_AUTH, "not-a-token")).toBeNull();
  });
});

describe("readCookie", () => {
  it("finds a cookie among several", () => {
    expect(readCookie("a=1; dokvanta_token=abc.def; b=2", "dokvanta_token")).toBe("abc.def");
  });

  it("returns undefined when missing or when the header is absent", () => {
    expect(readCookie("a=1", "dokvanta_token")).toBeUndefined();
    expect(readCookie(undefined, "dokvanta_token")).toBeUndefined();
  });

  it("does not throw on malformed encoding", () => {
    expect(readCookie("dokvanta_token=%E0%A4%A", "dokvanta_token")).toBeUndefined();
  });
});