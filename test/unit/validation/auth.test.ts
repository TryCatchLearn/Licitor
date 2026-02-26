import { describe, expect, it } from "vitest";

import { registerSchema, signInSchema } from "@/lib/validation/auth";

describe("auth validation schemas", () => {
  it("accepts valid sign-in input", () => {
    const parsed = signInSchema.safeParse({
      email: "valid@example.com",
      password: "password123",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid sign-in email", () => {
    const parsed = signInSchema.safeParse({
      email: "invalid",
      password: "password123",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts valid register input with matching passwords", () => {
    const parsed = registerSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "password123",
      confirmPassword: "password123",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects register input when passwords do not match", () => {
    const parsed = registerSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "password123",
      confirmPassword: "password456",
    });

    expect(parsed.success).toBe(false);
  });
});
