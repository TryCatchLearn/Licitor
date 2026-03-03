import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import type { Listing } from "@/lib/db/schema";
import { listingImages, listings, profiles, user } from "@/lib/db/schema";

export const createUserFixture = async (overrides?: {
  email?: string;
  name?: string;
  password?: string;
  image?: string;
}) => {
  const suffix = randomUUID();

  return auth.api.signUpEmail({
    body: {
      name: overrides?.name ?? `Fixture User ${suffix.slice(0, 8)}`,
      email: overrides?.email ?? `fixture-${suffix}@test.local`,
      password: overrides?.password ?? "Pa$$w0rd",
      image: overrides?.image ?? "https://example.com/fixture-user.png",
    },
  });
};

export const createListingFixture = async (
  overrides?: Partial<Listing>,
): Promise<Listing> => {
  let sellerId = overrides?.sellerId;

  if (!sellerId) {
    sellerId = `usr_${randomUUID()}`;
    const now = new Date();

    await db.insert(user).values({
      id: sellerId,
      name: "Fixture Seller",
      email: `seller-${randomUUID()}@test.local`,
      emailVerified: true,
      image: "https://example.com/fixture-user.png",
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(profiles).values({
      id: `prf_${randomUUID()}`,
      userId: sellerId,
      name: "Fixture Seller",
      location: "Fixture City",
      bio: "Fixture seller profile",
      image: "https://example.com/fixture-user.png",
      createdAt: now,
      updatedAt: now,
    });
  }

  const id = overrides?.id ?? `LST-${randomUUID().slice(0, 8).toUpperCase()}`;
  const listing: Listing = {
    id,
    sellerId,
    title: overrides?.title ?? "Fixture Listing",
    description: overrides?.description ?? "Fixture listing description",
    category: overrides?.category ?? "Other",
    condition: overrides?.condition ?? "Good",
    reservePrice: overrides?.reservePrice ?? null,
    startingBid: overrides?.startingBid ?? 1_000,
    currentBid: overrides?.currentBid ?? overrides?.startingBid ?? 1_000,
    bidCount: overrides?.bidCount ?? 0,
    startAt: overrides?.startAt ?? null,
    endAt: overrides?.endAt ?? null,
    status: overrides?.status ?? "Draft",
    location: overrides?.location ?? "Fixture City",
    createdAt: overrides?.createdAt ?? new Date(),
    updatedAt: overrides?.updatedAt ?? overrides?.createdAt ?? new Date(),
  };

  await db.insert(listings).values(listing);
  await db.insert(listingImages).values({
    id: `${id}-IMG-1`,
    listingId: id,
    url: "https://example.com/fixture-listing.jpg",
    publicId: null,
    isMain: true,
    createdAt: listing.createdAt,
  });

  return listing;
};
