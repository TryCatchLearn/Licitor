"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  type ProfileUpdateInput,
  profileUpdateSchema,
} from "@/lib/validation/profile";

const toNullable = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export const updateProfileByUserId = async (
  userId: string | null,
  input: ProfileUpdateInput,
) => {
  if (!userId) {
    throw new Error("Unauthorized.");
  }

  const parsed = profileUpdateSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Invalid profile payload.",
    );
  }

  const now = new Date();
  const nextValues = {
    name: parsed.data.name.trim(),
    image: toNullable(parsed.data.image),
    bio: toNullable(parsed.data.bio),
    location: toNullable(parsed.data.location),
    updatedAt: now,
  };

  await db.update(profiles).set(nextValues).where(eq(profiles.userId, userId));

  const updatedProfile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
  });

  if (!updatedProfile) {
    throw new Error("Profile not found.");
  }

  return updatedProfile;
};

export const updateProfileAction = async (input: ProfileUpdateInput) => {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  const updatedProfile = await updateProfileByUserId(
    session?.user?.id ?? null,
    input,
  );

  return {
    success: true,
    profile: updatedProfile,
  };
};
