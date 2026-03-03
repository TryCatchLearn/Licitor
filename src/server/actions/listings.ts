"use server";

import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireCurrentUserSession } from "@/lib/auth-session";
import { deleteCloudinaryImage } from "@/lib/cloudinary";
import { db } from "@/lib/db/client";
import type { ListingStatus } from "@/lib/db/schema";
import { listingImages, listings } from "@/lib/db/schema";
import {
  type UpdateListingDraftInput,
  type UpdateListingDraftValues,
  updateListingDraftSchema,
} from "@/lib/validators/listings";

const createDraftListingSchema = z.object({
  imageUrl: z.string().url("A hosted image URL is required."),
  publicId: z.string().min(1, "A Cloudinary public id is required."),
});

const addListingImageSchema = z.object({
  listingId: z.string().min(1, "Listing id is required."),
  imageUrl: z.string().url("A hosted image URL is required."),
  publicId: z.string().min(1, "A Cloudinary public id is required."),
});

const deleteListingImageSchema = z.object({
  listingId: z.string().min(1, "Listing id is required."),
  imageId: z.string().min(1, "Listing image id is required."),
});

const setMainListingImageSchema = z.object({
  listingId: z.string().min(1, "Listing id is required."),
  imageId: z.string().min(1, "Listing image id is required."),
});

const buildPlaceholderDraft = () => {
  return {
    category: "Other" as const,
    condition: "Good" as const,
    description:
      "Phase 1F creates this draft from placeholder JSON after the signed Cloudinary upload completes. AI-generated listing details will replace this stub in a later phase.",
    location: "Seller review pending",
    reservePrice: 22000,
    startingBid: 15000,
    title: "Draft listing awaiting refinement",
  };
};

const resolveStartingBid = (startingBid: number | null | undefined) => {
  return startingBid ?? 0;
};

export const createDraftListingAction = async (input: {
  imageUrl: string;
  publicId: string;
}) => {
  const session = await requireCurrentUserSession();
  const parsed = createDraftListingSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Invalid listing draft payload.",
    );
  }

  const draftValues = buildPlaceholderDraft();
  const listingId = randomUUID();
  const listingImageId = randomUUID();
  const now = new Date();
  const defaultEndAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const startingBid = resolveStartingBid(draftValues.startingBid);

  db.transaction((tx) => {
    tx.insert(listings)
      .values({
        id: listingId,
        sellerId: session.user.id,
        title: draftValues.title,
        description: draftValues.description,
        category: draftValues.category,
        condition: draftValues.condition,
        reservePrice: draftValues.reservePrice,
        startingBid,
        currentBid: startingBid,
        bidCount: 0,
        startAt: null,
        endAt: defaultEndAt,
        status: "Draft",
        location: draftValues.location,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    tx.insert(listingImages)
      .values({
        id: listingImageId,
        listingId,
        url: parsed.data.imageUrl,
        publicId: parsed.data.publicId,
        isMain: true,
        createdAt: now,
      })
      .run();
  });

  revalidatePath("/listings");
  revalidatePath("/my-listings");
  revalidatePath(`/listings/${listingId}`);

  return { id: listingId };
};

const getOwnedListing = async (listingId: string, sellerId: string) => {
  return db.query.listings.findFirst({
    where: (listing, { and, eq }) =>
      and(eq(listing.id, listingId), eq(listing.sellerId, sellerId)),
    with: {
      images: true,
    },
  });
};

const assertListingCanBeEdited = (listing: {
  bidCount: number;
  endAt: Date | null;
  status: ListingStatus;
}) => {
  if (listing.bidCount > 0) {
    throw new Error("Listings with bids can no longer be edited.");
  }

  if (listing.status === "Ended") {
    throw new Error("Ended listings can no longer be edited.");
  }

  if (listing.endAt && listing.endAt.getTime() <= Date.now()) {
    throw new Error("This listing has already ended.");
  }
};

const assertListingCanManageImages = (listing: { status: ListingStatus }) => {
  if (listing.status !== "Draft") {
    throw new Error("Images can only be managed while listing is in draft.");
  }
};

const assertListingCanSetMainImage = (listing: { status: ListingStatus }) => {
  if (
    listing.status !== "Draft" &&
    listing.status !== "Active" &&
    listing.status !== "Scheduled"
  ) {
    throw new Error(
      "Main image can only be changed while listing is in draft, active, or scheduled.",
    );
  }
};

const revalidateListingPaths = (listingId: string) => {
  revalidatePath("/listings");
  revalidatePath("/my-listings");
  revalidatePath(`/listings/${listingId}`);
};

export const addListingImageAction = async (input: {
  imageUrl: string;
  listingId: string;
  publicId: string;
}) => {
  const session = await requireCurrentUserSession();
  const parsed = addListingImageSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Invalid listing image payload.",
    );
  }

  const listing = await getOwnedListing(parsed.data.listingId, session.user.id);

  if (!listing) {
    throw new Error("Listing not found.");
  }

  assertListingCanManageImages(listing);

  if (listing.images.length >= 5) {
    throw new Error("A listing can only include up to 5 images.");
  }

  const listingImageId = randomUUID();
  const createdAt = new Date();

  db.insert(listingImages)
    .values({
      id: listingImageId,
      listingId: parsed.data.listingId,
      url: parsed.data.imageUrl,
      publicId: parsed.data.publicId,
      isMain: false,
      createdAt,
    })
    .run();

  revalidateListingPaths(parsed.data.listingId);

  return {
    image: {
      id: listingImageId,
      isMain: false,
      url: parsed.data.imageUrl,
    },
  };
};

export const deleteListingImageAction = async (input: {
  imageId: string;
  listingId: string;
}) => {
  const session = await requireCurrentUserSession();
  const parsed = deleteListingImageSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Invalid listing image payload.",
    );
  }

  const listing = await getOwnedListing(parsed.data.listingId, session.user.id);

  if (!listing) {
    throw new Error("Listing not found.");
  }

  assertListingCanManageImages(listing);

  const targetImage = listing.images.find(
    (image) => image.id === parsed.data.imageId,
  );

  if (!targetImage) {
    throw new Error("Listing image not found.");
  }

  if (targetImage.isMain) {
    throw new Error("Main image cannot be deleted.");
  }

  db.delete(listingImages)
    .where(
      and(
        eq(listingImages.id, parsed.data.imageId),
        eq(listingImages.listingId, parsed.data.listingId),
      ),
    )
    .run();

  if (targetImage.publicId) {
    await deleteCloudinaryImage(targetImage.publicId);
  }

  revalidateListingPaths(parsed.data.listingId);

  return {
    success: true as const,
  };
};

export const setMainListingImageAction = async (input: {
  imageId: string;
  listingId: string;
}) => {
  const session = await requireCurrentUserSession();
  const parsed = setMainListingImageSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Invalid listing image payload.",
    );
  }

  const listing = await getOwnedListing(parsed.data.listingId, session.user.id);

  if (!listing) {
    throw new Error("Listing not found.");
  }

  assertListingCanSetMainImage(listing);

  const targetImage = listing.images.find(
    (image) => image.id === parsed.data.imageId,
  );

  if (!targetImage) {
    throw new Error("Listing image not found.");
  }

  db.transaction((tx) => {
    tx.update(listingImages)
      .set({ isMain: false })
      .where(eq(listingImages.listingId, parsed.data.listingId))
      .run();

    tx.update(listingImages)
      .set({ isMain: true })
      .where(
        and(
          eq(listingImages.id, parsed.data.imageId),
          eq(listingImages.listingId, parsed.data.listingId),
        ),
      )
      .run();
  });

  revalidateListingPaths(parsed.data.listingId);

  return {
    success: true as const,
  };
};

export const updateListingDraftAction = async (
  listingId: string,
  input: UpdateListingDraftInput | UpdateListingDraftValues,
) => {
  const session = await requireCurrentUserSession();
  const listing = await getOwnedListing(listingId, session.user.id);

  if (!listing) {
    throw new Error("Listing not found.");
  }

  assertListingCanBeEdited(listing);

  const parsed = updateListingDraftSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Listing details are invalid.",
    );
  }

  const nextValues = parsed.data;
  const nextStartingBid = resolveStartingBid(nextValues.startingBid);

  db.update(listings)
    .set({
      category: nextValues.category,
      condition: nextValues.condition,
      currentBid: listing.bidCount === 0 ? nextStartingBid : listing.currentBid,
      description: nextValues.description,
      endAt: nextValues.endAt,
      location: nextValues.location,
      reservePrice: nextValues.reservePrice,
      startAt: nextValues.startAt,
      startingBid: nextStartingBid,
      status: "Draft",
      title: nextValues.title,
      updatedAt: new Date(),
    })
    .where(eq(listings.id, listingId))
    .run();

  revalidateListingPaths(listingId);

  return { success: true as const };
};

export const publishListingAction = async (listingId: string) => {
  const session = await requireCurrentUserSession();
  const listing = await getOwnedListing(listingId, session.user.id);

  if (!listing) {
    throw new Error("Listing not found.");
  }

  if (listing.status !== "Draft") {
    throw new Error("Only draft listings can be published.");
  }

  const now = Date.now();
  const nextStatus =
    listing.startAt && listing.startAt.getTime() > now ? "Scheduled" : "Active";

  db.update(listings)
    .set({
      status: nextStatus,
      updatedAt: new Date(),
    })
    .where(eq(listings.id, listingId))
    .run();

  revalidateListingPaths(listingId);

  return {
    status: nextStatus,
    success: true as const,
  };
};

export const returnListingToDraftAction = async (listingId: string) => {
  const session = await requireCurrentUserSession();
  const listing = await getOwnedListing(listingId, session.user.id);

  if (!listing) {
    throw new Error("Listing not found.");
  }

  assertListingCanBeEdited(listing);

  if (listing.status !== "Active" && listing.status !== "Scheduled") {
    throw new Error(
      "Only active or scheduled listings can be returned to draft.",
    );
  }

  db.update(listings)
    .set({
      status: "Draft",
      updatedAt: new Date(),
    })
    .where(eq(listings.id, listingId))
    .run();

  revalidateListingPaths(listingId);

  return { success: true as const };
};

export const deleteListingAction = async (listingId: string) => {
  const session = await requireCurrentUserSession();
  const listing = await getOwnedListing(listingId, session.user.id);

  if (!listing) {
    throw new Error("Listing not found.");
  }

  if (listing.status !== "Draft") {
    throw new Error("Only draft listings can be deleted.");
  }

  for (const image of listing.images) {
    if (image.publicId) {
      await deleteCloudinaryImage(image.publicId);
    }
  }

  db.delete(listings)
    .where(
      and(eq(listings.id, listingId), eq(listings.sellerId, session.user.id)),
    )
    .run();

  revalidatePath("/listings");
  revalidatePath("/my-listings");

  return { success: true as const };
};
