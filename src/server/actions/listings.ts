"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import { requireCurrentUserSession } from "@/lib/auth-session";
import { deleteCloudinaryImage } from "@/lib/cloudinary";
import {
  type AddListingImageInput,
  addListingImageSchema,
  type CreateDraftListingInput,
  createDraftListingSchema,
  type DeleteListingImageInput,
  deleteListingImageSchema,
  type SetMainListingImageInput,
  setMainListingImageSchema,
  type UpdateListingDraftInput,
  type UpdateListingDraftValues,
  updateListingDraftSchema,
} from "@/lib/validators/listings";
import {
  addListingImageData,
  createDraftListingWithMainImageData,
  deleteListingBySellerData,
  deleteListingImageData,
  getOwnedListingWithImagesData,
  setMainListingImageData,
  updateListingDraftData,
  updateListingStatusData,
} from "@/server/data/listings";
import { mapOwnedListingForEditDto } from "@/server/mappers/listings";
import type {
  AddListingImageResultDto,
  CreateDraftListingResultDto,
  MutationSuccessDto,
  OwnedListingForEditDto,
  PublishListingResultDto,
} from "@/types/listings";

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

export const createDraftListingAction = async (
  input: CreateDraftListingInput,
): Promise<CreateDraftListingResultDto> => {
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

  createDraftListingWithMainImageData({
    defaultEndAt,
    draftValues,
    imageUrl: parsed.data.imageUrl,
    listingId,
    listingImageId,
    now,
    publicId: parsed.data.publicId,
    sellerId: session.user.id,
    startingBid,
  });

  revalidatePath("/listings");
  revalidatePath("/my-listings");
  revalidatePath(`/listings/${listingId}`);

  return { id: listingId };
};

const getOwnedListing = async (listingId: string, sellerId: string) => {
  const listing = await getOwnedListingWithImagesData(listingId, sellerId);

  if (!listing) {
    return null;
  }

  return mapOwnedListingForEditDto(listing);
};

const assertListingCanBeEdited = (listing: OwnedListingForEditDto) => {
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

const assertListingCanManageImages = (listing: OwnedListingForEditDto) => {
  if (listing.status !== "Draft") {
    throw new Error("Images can only be managed while listing is in draft.");
  }
};

const assertListingCanSetMainImage = (listing: OwnedListingForEditDto) => {
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
  // RH3: extra revalidatePath call — this path doesn't exist, is a no-op
  revalidatePath(`/my-listings/${listingId}`);
};

export const addListingImageAction = async (
  input: AddListingImageInput,
): Promise<AddListingImageResultDto> => {
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

  addListingImageData({
    createdAt,
    id: listingImageId,
    imageUrl: parsed.data.imageUrl,
    listingId: parsed.data.listingId,
    publicId: parsed.data.publicId,
  });

  revalidateListingPaths(parsed.data.listingId);

  return {
    image: {
      id: listingImageId,
      isMain: false,
      url: parsed.data.imageUrl,
    },
  };
};

export const deleteListingImageAction = async (
  input: DeleteListingImageInput,
): Promise<MutationSuccessDto> => {
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

  deleteListingImageData(parsed.data.listingId, parsed.data.imageId);

  if (targetImage.publicId) {
    await deleteCloudinaryImage(targetImage.publicId);
  }

  revalidateListingPaths(parsed.data.listingId);

  return {
    success: true as const,
  };
};

export const setMainListingImageAction = async (
  input: SetMainListingImageInput,
): Promise<MutationSuccessDto> => {
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

  setMainListingImageData(parsed.data.listingId, parsed.data.imageId);

  revalidateListingPaths(parsed.data.listingId);

  return {
    success: true as const,
  };
};

export const updateListingDraftAction = async (
  listingId: string,
  input: UpdateListingDraftInput | UpdateListingDraftValues,
): Promise<MutationSuccessDto> => {
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

  updateListingDraftData({
    currentBid: listing.bidCount === 0 ? nextStartingBid : listing.currentBid,
    listingId,
    nextStartingBid,
    updatedAt: new Date(),
    values: nextValues,
  });

  revalidateListingPaths(listingId);

  return { success: true as const };
};

export const publishListingAction = async (
  listingId: string,
): Promise<PublishListingResultDto> => {
  const session = await requireCurrentUserSession();
  const listing = await getOwnedListing(listingId, session.user.id);

  if (!listing) {
    throw new Error("Listing not found.");
  }

  if (listing.status !== "Draft") {
    throw new Error("Only draft listings can be published.");
  }

  const now = Date.now();
  let nextStatus: "Active" | "Scheduled";
  if (listing.startAt !== null && listing.startAt.getTime() > now) {
    nextStatus = "Scheduled";
  } else {
    nextStatus = "Active";
  }

  updateListingStatusData(listingId, listing.status, new Date());

  revalidateListingPaths(listingId);

  return {
    status: nextStatus,
    success: true as const,
  };
};

export const returnListingToDraftAction = async (
  listingId: string,
): Promise<MutationSuccessDto> => {
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

  updateListingStatusData(listingId, "Draft", new Date());

  revalidateListingPaths(listingId);

  return { success: true as const };
};

export const deleteListingAction = async (
  listingId: string,
): Promise<MutationSuccessDto> => {
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

  deleteListingBySellerData(listingId, session.user.id);

  revalidatePath("/listings");
  revalidatePath("/my-listings");

  return { success: true as const };
};
