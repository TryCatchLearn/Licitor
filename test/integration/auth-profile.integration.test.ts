import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db } from "@/db/client";
import { profiles, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { updateProfileByUserId } from "@/server/actions/profile";

describe("auth profile integration", () => {
  it("creates a profile automatically after email sign up", async () => {
    await db.delete(profiles);
    await db.delete(user);

    const result = await auth.api.signUpEmail({
      body: {
        name: "Integration Tester",
        email: "integration@test.com",
        password: "Pa$$w0rd",
        image: "https://randomuser.me/api/portraits/men/11.jpg",
      },
    });

    const createdProfile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, result.user.id),
    });

    expect(createdProfile).toBeDefined();
    expect(createdProfile?.name).toBe("Integration Tester");
    expect(createdProfile?.image).toBe(
      "https://randomuser.me/api/portraits/men/11.jpg",
    );
  });

  it("updates editable profile fields for authenticated user", async () => {
    await db.delete(profiles);
    await db.delete(user);

    const result = await auth.api.signUpEmail({
      body: {
        name: "Profile Editor",
        email: "profile@test.com",
        password: "Pa$$w0rd",
        image: "https://randomuser.me/api/portraits/women/31.jpg",
      },
    });

    const updated = await updateProfileByUserId(result.user.id, {
      name: "Updated Name",
      image: "https://example.com/new-avatar.png",
      bio: "Updated bio text.",
      location: "Austin, TX",
    });

    expect(updated.name).toBe("Updated Name");
    expect(updated.image).toBe("https://example.com/new-avatar.png");
    expect(updated.bio).toBe("Updated bio text.");
    expect(updated.location).toBe("Austin, TX");
  });

  it("rejects profile updates without an authenticated user id", async () => {
    await expect(
      updateProfileByUserId(null, {
        name: "Unauthorized Update",
        image: "",
        bio: "",
        location: "",
      }),
    ).rejects.toThrow("Unauthorized.");
  });
});
