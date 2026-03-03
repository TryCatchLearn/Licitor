import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db/client";
import { listingImages, listings } from "@/lib/db/schema";
import {
  addListingImageAction,
  deleteListingImageAction,
  setMainListingImageAction,
} from "@/server/actions/listings";
import { createListingFixture } from "../fixtures/factories";

const requireCurrentUserSessionMock = vi.hoisted(() => vi.fn());
const deleteCloudinaryImageMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth-session", () => ({
  requireCurrentUserSession: requireCurrentUserSessionMock,
}));

vi.mock("@/lib/cloudinary", () => ({
  deleteCloudinaryImage: deleteCloudinaryImageMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

const setCurrentUser = (userId: string) => {
  requireCurrentUserSessionMock.mockResolvedValue({
    user: {
      id: userId,
    },
  });
};

describe("listing image server actions integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteCloudinaryImageMock.mockResolvedValue({ result: "ok" });
  });

  describe("addListingImageAction", () => {
    it("adds a non-main image for draft listing owner", async () => {
      const listing = await createListingFixture({ status: "Draft" });
      setCurrentUser(listing.sellerId);

      const result = await addListingImageAction({
        imageUrl: "https://example.com/new-image.jpg",
        listingId: listing.id,
        publicId: "cloudinary/new-image",
      });

      const inserted = await db.query.listingImages.findFirst({
        where: eq(listingImages.id, result.image.id),
      });

      expect(result.image.url).toBe("https://example.com/new-image.jpg");
      expect(inserted).toBeDefined();
      expect(inserted?.isMain).toBe(false);
      expect(inserted?.publicId).toBe("cloudinary/new-image");
    });

    it("rejects when listing already has 5 images", async () => {
      const listing = await createListingFixture({ status: "Draft" });
      setCurrentUser(listing.sellerId);

      await db.insert(listingImages).values([
        {
          id: `${listing.id}-IMG-2`,
          listingId: listing.id,
          url: "https://example.com/2.jpg",
          publicId: "cloudinary/2",
          isMain: false,
          createdAt: new Date("2026-03-01T10:00:00.000Z"),
        },
        {
          id: `${listing.id}-IMG-3`,
          listingId: listing.id,
          url: "https://example.com/3.jpg",
          publicId: "cloudinary/3",
          isMain: false,
          createdAt: new Date("2026-03-01T10:01:00.000Z"),
        },
        {
          id: `${listing.id}-IMG-4`,
          listingId: listing.id,
          url: "https://example.com/4.jpg",
          publicId: "cloudinary/4",
          isMain: false,
          createdAt: new Date("2026-03-01T10:02:00.000Z"),
        },
        {
          id: `${listing.id}-IMG-5`,
          listingId: listing.id,
          url: "https://example.com/5.jpg",
          publicId: "cloudinary/5",
          isMain: false,
          createdAt: new Date("2026-03-01T10:03:00.000Z"),
        },
      ]);

      await expect(
        addListingImageAction({
          imageUrl: "https://example.com/overflow.jpg",
          listingId: listing.id,
          publicId: "cloudinary/overflow",
        }),
      ).rejects.toThrow("A listing can only include up to 5 images.");
    });

    it("rejects non-owners", async () => {
      const listing = await createListingFixture({ status: "Draft" });
      setCurrentUser("usr_non_owner");

      await expect(
        addListingImageAction({
          imageUrl: "https://example.com/new-image.jpg",
          listingId: listing.id,
          publicId: "cloudinary/new-image",
        }),
      ).rejects.toThrow("Listing not found.");
    });

    it("rejects non-draft listings", async () => {
      const listing = await createListingFixture({ status: "Active" });
      setCurrentUser(listing.sellerId);

      await expect(
        addListingImageAction({
          imageUrl: "https://example.com/new-image.jpg",
          listingId: listing.id,
          publicId: "cloudinary/new-image",
        }),
      ).rejects.toThrow(
        "Images can only be managed while listing is in draft.",
      );
    });
  });

  describe("deleteListingImageAction", () => {
    it("deletes non-main image from DB and cloudinary", async () => {
      const listing = await createListingFixture({ status: "Draft" });
      setCurrentUser(listing.sellerId);

      const imageId = `${listing.id}-IMG-2`;
      await db.insert(listingImages).values({
        id: imageId,
        listingId: listing.id,
        url: "https://example.com/delete-me.jpg",
        publicId: "cloudinary/delete-me",
        isMain: false,
        createdAt: new Date("2026-03-01T10:00:00.000Z"),
      });

      await deleteListingImageAction({
        imageId,
        listingId: listing.id,
      });

      const image = await db.query.listingImages.findFirst({
        where: eq(listingImages.id, imageId),
      });

      expect(image).toBeUndefined();
      expect(deleteCloudinaryImageMock).toHaveBeenCalledWith(
        "cloudinary/delete-me",
      );
    });

    it("rejects deleting the main image", async () => {
      const listing = await createListingFixture({ status: "Draft" });
      setCurrentUser(listing.sellerId);

      await expect(
        deleteListingImageAction({
          imageId: `${listing.id}-IMG-1`,
          listingId: listing.id,
        }),
      ).rejects.toThrow("Main image cannot be deleted.");
    });
  });

  describe("setMainListingImageAction", () => {
    it("sets exactly one main image", async () => {
      const listing = await createListingFixture({ status: "Draft" });
      setCurrentUser(listing.sellerId);

      const imageId = `${listing.id}-IMG-2`;
      await db.insert(listingImages).values({
        id: imageId,
        listingId: listing.id,
        url: "https://example.com/secondary.jpg",
        publicId: "cloudinary/secondary",
        isMain: false,
        createdAt: new Date("2026-03-01T10:00:00.000Z"),
      });

      await setMainListingImageAction({
        imageId,
        listingId: listing.id,
      });

      const rows = await db.query.listingImages.findMany({
        where: eq(listingImages.listingId, listing.id),
      });

      expect(rows.filter((row) => row.isMain)).toHaveLength(1);
      expect(rows.find((row) => row.id === imageId)?.isMain).toBe(true);
      expect(rows.find((row) => row.id === `${listing.id}-IMG-1`)?.isMain).toBe(
        false,
      );
    });

    it("rejects image that does not belong to listing", async () => {
      const listing = await createListingFixture({ status: "Draft" });
      setCurrentUser(listing.sellerId);

      await expect(
        setMainListingImageAction({
          imageId: "missing-image-id",
          listingId: listing.id,
        }),
      ).rejects.toThrow("Listing image not found.");
    });

    it("rejects non-owner and ended listings", async () => {
      const listing = await createListingFixture({ status: "Draft" });
      setCurrentUser("usr_non_owner");

      await expect(
        setMainListingImageAction({
          imageId: `${listing.id}-IMG-1`,
          listingId: listing.id,
        }),
      ).rejects.toThrow("Listing not found.");

      setCurrentUser(listing.sellerId);
      await db
        .update(listings)
        .set({ status: "Ended" })
        .where(eq(listings.id, listing.id))
        .run();

      await expect(
        setMainListingImageAction({
          imageId: `${listing.id}-IMG-1`,
          listingId: listing.id,
        }),
      ).rejects.toThrow(
        "Main image can only be changed while listing is in draft, active, or scheduled.",
      );
    });

    it("allows setting main image while listing is Active or Scheduled", async () => {
      for (const status of ["Active", "Scheduled"] as const) {
        const listing = await createListingFixture({ status });
        setCurrentUser(listing.sellerId);

        const imageId = `${listing.id}-IMG-2`;
        await db.insert(listingImages).values({
          id: imageId,
          listingId: listing.id,
          url: "https://example.com/secondary-status.jpg",
          publicId: null,
          isMain: false,
          createdAt: new Date("2026-03-01T10:00:00.000Z"),
        });

        await setMainListingImageAction({
          imageId,
          listingId: listing.id,
        });

        const rows = await db.query.listingImages.findMany({
          where: eq(listingImages.listingId, listing.id),
        });

        expect(rows.filter((row) => row.isMain)).toHaveLength(1);
        expect(rows.find((row) => row.id === imageId)?.isMain).toBe(true);
      }
    });
  });
});
