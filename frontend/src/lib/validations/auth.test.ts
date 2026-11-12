import { describe, expect, it } from "vitest";
import {
  forgotPasswordSchema,
  getPasswordStrength,
  loginSchema,
  signupSchema,
} from "./auth";

const validSignup = {
  name: "Parth Khanna",
  email: "parth@example.com",
  password: "Dokvanta2026",
  confirmPassword: "Dokvanta2026",
  acceptTerms: true,
};

describe("loginSchema", () => {
  it("accepts a valid email and any non-empty password", () => {
    const result = loginSchema.safeParse({ email: "a@b.co", password: "x", remember: false });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({ email: "abc", password: "x", remember: false });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "a@b.co", password: "", remember: false });
    expect(result.success).toBe(false);
  });
});

describe("signupSchema", () => {
  it("accepts valid input", () => {
    expect(signupSchema.safeParse(validSignup).success).toBe(true);
  });

  it("rejects a short password", () => {
    const result = signupSchema.safeParse({ ...validSignup, password: "Ab1", confirmPassword: "Ab1" });
    expect(result.success).toBe(false);
  });

  it("rejects a password without a number", () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      password: "OnlyLetters",
      confirmPassword: "OnlyLetters",
    });
    expect(result.success).toBe(false);
  });

  it("reports a mismatch on the confirmPassword field", () => {
    const result = signupSchema.safeParse({ ...validSignup, confirmPassword: "Different123" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes("confirmPassword"));
      expect(issue?.message).toBe("Passwords do not match");
    }
  });

  it("requires the terms checkbox", () => {
    const result = signupSchema.safeParse({ ...validSignup, acceptTerms: false });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("accepts a valid email and rejects an invalid one", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@b.co" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});

describe("getPasswordStrength", () => {
  it("returns score 0 for an empty password", () => {
    expect(getPasswordStrength("")).toEqual({ score: 0, label: "Enter a password" });
  });

  it("labels a short non-empty password Weak", () => {
    expect(getPasswordStrength("abc")).toEqual({ score: 1, label: "Weak" });
  });

  it("caps short passwords at Weak even with mixed characters", () => {
    expect(getPasswordStrength("Ab1!").score).toBe(1);
  });

  it("scores a long mixed password Strong", () => {
    expect(getPasswordStrength("Dokvanta2026!")).toEqual({ score: 4, label: "Strong" });
  });

  it("scores an 8-character letters-and-digit password Fair", () => {
    expect(getPasswordStrength("abcdefg1").label).toBe("Fair");
  });
});
