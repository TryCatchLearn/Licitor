import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import type { ListingStatus } from "@/lib/db/schema";
import { listingImages, listings } from "@/lib/db/schema";
import type { UpdateListingDraftValues } from "@/lib/validators/listings";

export const getPublicListingsData = async () => {
  return db.query.listings.findMany({
    where: (listing, { ne }) => ne(listing.status, "Draft"),
    with: {
      images: {
        where: (images, { eq }) => eq(images.isMain, true),
        orderBy: (images, { desc: orderDesc }) => [orderDesc(images.createdAt)],
      },
      seller: true,
    },
    orderBy: (listing, { desc }) => [desc(listing.createdAt)],
  });
};

export const getListingsBySellerIdData = async (
  sellerId: string,
  status?: ListingStatus,
) => {
  const sellerMatch = eq(listings.sellerId, sellerId);
  const statusMatch = status ? eq(listings.status, status) : undefined;

  return db.query.listings.findMany({
    where: statusMatch ? and(sellerMatch, statusMatch) : sellerMatch,
    with: {
      images: {
        where: (images, { eq }) => eq(images.isMain, true),
        orderBy: (images, { desc: orderDesc }) => [orderDesc(images.createdAt)],
      },
      seller: true,
    },
    orderBy: (listing, { desc }) => [desc(listing.createdAt)],
  });
};

export const getListingByIdData = async (listingId: string) => {
  return db.query.listings.findFirst({
    where: eq(listings.id, listingId),
    with: {
      images: {
        orderBy: (images, { asc }) => [asc(images.createdAt)],
      },
      seller: true,
    },
  });
};

export const getOwnedListingWithImagesData = async (
  listingId: string,
  sellerId: string,
) => {
  return db.query.listings.findFirst({
    where: (listing, { and, eq }) =>
      and(eq(listing.id, listingId), eq(listing.sellerId, sellerId)),
    with: {
      images: true,
    },
  });
};

export const createDraftListingWithMainImageData = (input: {
  defaultEndAt: Date;
  draftValues: {
    category: "Other";
    condition: "Good";
    description: string;
    location: string;
    reservePrice: number;
    startingBid: number;
    title: string;
  };
  imageUrl: string;
  listingId: string;
  listingImageId: string;
  now: Date;
  publicId: string;
  sellerId: string;
  startingBid: number;
}) => {
  db.transaction((tx) => {
    tx.insert(listings)
      .values({
        id: input.listingId,
        sellerId: input.sellerId,
        title: input.draftValues.title,
        description: input.draftValues.description,
        category: input.draftValues.category,
        condition: input.draftValues.condition,
        reservePrice: input.draftValues.reservePrice,
        startingBid: input.startingBid,
        currentBid: input.startingBid,
        bidCount: 0,
        startAt: null,
        endAt: input.defaultEndAt,
        status: "Draft",
        location: input.draftValues.location,
        createdAt: input.now,
        updatedAt: input.now,
      })
      .run();

    tx.insert(listingImages)
      .values({
        id: input.listingImageId,
        listingId: input.listingId,
        url: input.imageUrl,
        publicId: input.publicId,
        isMain: true,
        createdAt: input.now,
      })
      .run();
  });
};

export const addListingImageData = (input: {
  createdAt: Date;
  id: string;
  imageUrl: string;
  listingId: string;
  publicId: string;
}) => {
  db.insert(listingImages)
    .values({
      id: input.id,
      listingId: input.listingId,
      url: input.imageUrl,
      publicId: input.publicId,
      isMain: false,
      createdAt: input.createdAt,
    })
    .run();
};

export const deleteListingImageData = (listingId: string, imageId: string) => {
  db.delete(listingImages)
    .where(
      and(
        eq(listingImages.id, imageId),
        eq(listingImages.listingId, listingId),
      ),
    )
    .run();
};

export const setMainListingImageData = (listingId: string, imageId: string) => {
  db.transaction((tx) => {
    tx.update(listingImages)
      .set({ isMain: true })
      .where(
        and(
          eq(listingImages.id, imageId),
          eq(listingImages.listingId, listingId),
        ),
      )
      .run();

    tx.update(listingImages)
      .set({ isMain: false })
      .where(eq(listingImages.listingId, listingId))
      .run();
  });
};

export const updateListingDraftData = (input: {
  currentBid: number | null;
  listingId: string;
  nextStartingBid: number;
  updatedAt: Date;
  values: UpdateListingDraftValues;
}) => {
  db.update(listings)
    .set({
      category: input.values.category,
      condition: input.values.condition,
      currentBid: input.currentBid,
      description: input.values.description,
      endAt: input.values.endAt,
      location: input.values.location,
      reservePrice: input.values.reservePrice,
      startAt: input.values.startAt,
      startingBid: input.nextStartingBid,
      status: "Draft",
      title: input.values.title,
      updatedAt: input.updatedAt,
    })
    .where(eq(listings.id, input.listingId))
    .run();
};

export const updateListingStatusData = (
  listingId: string,
  status: ListingStatus,
  updatedAt: Date,
) => {
  db.update(listings)
    .set({
      status,
      updatedAt,
    })
    .where(eq(listings.id, listingId))
    .run();
};

export const deleteListingBySellerData = (
  listingId: string,
  sellerId: string,
) => {
  db.delete(listings)
    .where(and(eq(listings.id, listingId), eq(listings.sellerId, sellerId)))
    .run();
};
