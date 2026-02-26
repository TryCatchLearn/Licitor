import { describe, expect, it } from "vitest";

import { profileUpdateSchema } from "@/lib/validation/profile";

describe("profile validation schema", () => {
  it("accepts valid profile payload", () => {
    const parsed = profileUpdateSchema.safeParse({
      name: "Jane Doe",
      image: "https://example.com/avatar.png",
      bio: "Collector and vintage enthusiast.",
      location: "San Francisco, CA",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects missing name", () => {
    const parsed = profileUpdateSchema.safeParse({
      name: "",
      image: "",
      bio: "",
      location: "",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects bio longer than 280 characters", () => {
    const parsed = profileUpdateSchema.safeParse({
      name: "Jane Doe",
      image: "",
      bio: "a".repeat(281),
      location: "",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects location longer than 80 characters", () => {
    const parsed = profileUpdateSchema.safeParse({
      name: "Jane Doe",
      image: "",
      bio: "",
      location: "a".repeat(81),
    });

    expect(parsed.success).toBe(false);
  });
});
