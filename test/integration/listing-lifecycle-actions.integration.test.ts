import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db/client";
import { listingImages, listings } from "@/lib/db/schema";
import {
  createDraftListingAction,
  deleteListingAction,
  publishListingAction,
  returnListingToDraftAction,
  setMainListingImageAction,
  updateListingDraftAction,
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

const futureDate = (daysFromNow: number) => {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
};

const pastDate = (daysAgo: number) => {
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
};

const expectListingStatus = async (
  listingId: string,
  expectedStatus: string,
) => {
  const listing = await db.query.listings.findFirst({
    where: eq(listings.id, listingId),
  });

  expect(listing).toBeDefined();
  expect(listing?.status).toBe(expectedStatus);
};

const expectListingRevalidation = (listingId: string) => {
  expect(revalidatePathMock).toHaveBeenCalledWith("/listings");
  expect(revalidatePathMock).toHaveBeenCalledWith("/my-listings");
  expect(revalidatePathMock).toHaveBeenCalledWith(`/listings/${listingId}`);
};

const buildValidDraftUpdateInput = () => {
  const startAt = futureDate(1);
  const endAt = futureDate(3);

  return {
    title: "Vintage Camera Bundle",
    description:
      "Fully tested vintage camera bundle with manual lens and original case.",
    category: "Collectibles" as const,
    condition: "Good" as const,
    location: "Austin, TX",
    startingBid: "125.50",
    reservePrice: "250.00",
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
  };
};

describe("listing lifecycle server actions integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteCloudinaryImageMock.mockResolvedValue({ result: "ok" });
  });

  describe("createDraftListingAction", () => {
    it("creates draft listing with placeholder values and a main image", async () => {
      const seeded = await createListingFixture();
      const ownerId = seeded.sellerId;
      setCurrentUser(ownerId);
      const startedAt = Date.now();

      const result = await createDraftListingAction({
        imageUrl: "https://example.com/uploaded.jpg",
        publicId: "cloudinary/uploaded",
      });

      const listing = await db.query.listings.findFirst({
        where: eq(listings.id, result.id),
      });
      const images = await db.query.listingImages.findMany({
        where: eq(listingImages.listingId, result.id),
      });

      expect(listing).toBeDefined();
      expect(listing?.sellerId).toBe(ownerId);
      expect(listing?.status).toBe("Draft");
      expect(listing?.bidCount).toBe(0);
      expect(listing?.startAt).toBeNull();
      expect(listing?.currentBid).toBe(listing?.startingBid);
      expect(listing?.title).toBe("Draft listing awaiting refinement");
      expect(listing?.description).toContain("placeholder JSON");
      expect(listing?.endAt).not.toBeNull();

      const endedAtMs = listing?.endAt?.getTime() ?? 0;
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      expect(endedAtMs).toBeGreaterThanOrEqual(startedAt + sevenDaysMs - 2_000);
      expect(endedAtMs).toBeLessThanOrEqual(Date.now() + sevenDaysMs + 2_000);

      expect(images).toHaveLength(1);
      expect(images[0]?.isMain).toBe(true);
      expect(images[0]?.url).toBe("https://example.com/uploaded.jpg");
      expect(images[0]?.publicId).toBe("cloudinary/uploaded");

      expectListingRevalidation(result.id);
    });

    it("rejects invalid payloads", async () => {
      setCurrentUser("usr_create_owner");

      await expect(
        createDraftListingAction({
          imageUrl: "not-a-url",
          publicId: "cloudinary/uploaded",
        }),
      ).rejects.toThrow("A hosted image URL is required.");

      await expect(
        createDraftListingAction({
          imageUrl: "https://example.com/uploaded.jpg",
          publicId: "",
        }),
      ).rejects.toThrow("A Cloudinary public id is required.");
    });

    it("propagates authentication failures", async () => {
      requireCurrentUserSessionMock.mockRejectedValue(
        new Error("Unauthorized"),
      );

      await expect(
        createDraftListingAction({
          imageUrl: "https://example.com/uploaded.jpg",
          publicId: "cloudinary/uploaded",
        }),
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe("updateListingDraftAction", () => {
    it("updates editable fields and keeps listing in draft", async () => {
      const listing = await createListingFixture({
        status: "Draft",
        startAt: null,
        endAt: futureDate(5),
        currentBid: 2_500,
        startingBid: 2_500,
      });
      setCurrentUser(listing.sellerId);

      const input = buildValidDraftUpdateInput();
      const response = await updateListingDraftAction(listing.id, input);

      expect(response.success).toBe(true);

      const updated = await db.query.listings.findFirst({
        where: eq(listings.id, listing.id),
      });

      expect(updated?.status).toBe("Draft");
      expect(updated?.title).toBe(input.title);
      expect(updated?.description).toBe(input.description);
      expect(updated?.category).toBe(input.category);
      expect(updated?.condition).toBe(input.condition);
      expect(updated?.location).toBe(input.location);
      expect(updated?.startingBid).toBe(12_550);
      expect(updated?.reservePrice).toBe(25_000);
      expect(updated?.startAt?.toISOString()).toBe(input.startAt);
      expect(updated?.endAt?.toISOString()).toBe(input.endAt);

      expectListingRevalidation(listing.id);
    });

    it("resets currentBid to startingBid when bidCount is 0", async () => {
      const listing = await createListingFixture({
        status: "Draft",
        bidCount: 0,
        currentBid: 10_000,
        startingBid: 10_000,
        endAt: futureDate(5),
      });
      setCurrentUser(listing.sellerId);

      await updateListingDraftAction(listing.id, {
        ...buildValidDraftUpdateInput(),
        startingBid: "75.00",
        reservePrice: "90.00",
      });

      const updated = await db.query.listings.findFirst({
        where: eq(listings.id, listing.id),
      });

      expect(updated?.startingBid).toBe(7_500);
      expect(updated?.currentBid).toBe(7_500);
    });

    it("defaults startingBid and currentBid to 0 when startingBid is omitted", async () => {
      const listing = await createListingFixture({
        status: "Draft",
        bidCount: 0,
        currentBid: 10_000,
        startingBid: 10_000,
        endAt: futureDate(5),
      });
      setCurrentUser(listing.sellerId);

      const { startingBid: _startingBid, ...input } =
        buildValidDraftUpdateInput();

      await updateListingDraftAction(listing.id, input);

      const updated = await db.query.listings.findFirst({
        where: eq(listings.id, listing.id),
      });

      expect(updated?.startingBid).toBe(0);
      expect(updated?.currentBid).toBe(0);
    });

    it("rejects listing with bids and does not overwrite currentBid", async () => {
      const listing = await createListingFixture({
        status: "Draft",
        bidCount: 2,
        currentBid: 11_000,
        startingBid: 5_000,
        endAt: futureDate(5),
      });
      setCurrentUser(listing.sellerId);

      await expect(
        updateListingDraftAction(listing.id, buildValidDraftUpdateInput()),
      ).rejects.toThrow("Listings with bids can no longer be edited.");

      const unchanged = await db.query.listings.findFirst({
        where: eq(listings.id, listing.id),
      });

      expect(unchanged?.currentBid).toBe(11_000);
      expect(unchanged?.startingBid).toBe(5_000);
    });

    it("rejects invalid listing payload variants", async () => {
      const listing = await createListingFixture({
        status: "Draft",
        endAt: futureDate(5),
      });
      setCurrentUser(listing.sellerId);

      const invalidTimeOrder = {
        ...buildValidDraftUpdateInput(),
        startAt: futureDate(3).toISOString(),
        endAt: futureDate(2).toISOString(),
      };

      await expect(
        updateListingDraftAction(listing.id, invalidTimeOrder),
      ).rejects.toThrow("End time must be after the start time.");

      await expect(
        updateListingDraftAction(listing.id, {
          ...buildValidDraftUpdateInput(),
          startAt: pastDate(1).toISOString(),
        }),
      ).rejects.toThrow("Start time must be in the future.");

      await expect(
        updateListingDraftAction(listing.id, {
          ...buildValidDraftUpdateInput(),
          reservePrice: "10.00",
          startingBid: "20.00",
        }),
      ).rejects.toThrow("Reserve price must be at least the starting bid.");

      await expect(
        updateListingDraftAction(listing.id, {
          ...buildValidDraftUpdateInput(),
          title: "short",
        }),
      ).rejects.toThrow("Title must be at least 8 characters.");

      await expect(
        updateListingDraftAction(listing.id, {
          ...buildValidDraftUpdateInput(),
          description: "too short",
        }),
      ).rejects.toThrow("Description must be at least 20 characters.");
    });

    it("rejects missing and non-owned listings", async () => {
      const listing = await createListingFixture({
        status: "Draft",
        endAt: futureDate(5),
      });

      setCurrentUser("usr_other_user");
      await expect(
        updateListingDraftAction(listing.id, buildValidDraftUpdateInput()),
      ).rejects.toThrow("Listing not found.");

      setCurrentUser("usr_any");
      await expect(
        updateListingDraftAction("LST-NOT-FOUND", buildValidDraftUpdateInput()),
      ).rejects.toThrow("Listing not found.");
    });

    it("rejects ended and expired listings", async () => {
      const ended = await createListingFixture({
        status: "Ended",
        endAt: futureDate(1),
      });
      const expired = await createListingFixture({
        status: "Draft",
        endAt: pastDate(1),
      });

      setCurrentUser(ended.sellerId);
      await expect(
        updateListingDraftAction(ended.id, buildValidDraftUpdateInput()),
      ).rejects.toThrow("Ended listings can no longer be edited.");

      setCurrentUser(expired.sellerId);
      await expect(
        updateListingDraftAction(expired.id, buildValidDraftUpdateInput()),
      ).rejects.toThrow("This listing has already ended.");
    });
  });

  describe("publishListingAction", () => {
    it("publishes to Active when startAt is null or in the past", async () => {
      const listingWithoutStart = await createListingFixture({
        status: "Draft",
        startAt: null,
        endAt: futureDate(3),
      });
      setCurrentUser(listingWithoutStart.sellerId);

      const first = await publishListingAction(listingWithoutStart.id);
      expect(first.success).toBe(true);
      expect(first.status).toBe("Active");
      await expectListingStatus(listingWithoutStart.id, "Active");

      const listingWithPastStart = await createListingFixture({
        status: "Draft",
        startAt: pastDate(1),
        endAt: futureDate(3),
      });
      setCurrentUser(listingWithPastStart.sellerId);

      const second = await publishListingAction(listingWithPastStart.id);
      expect(second.status).toBe("Active");
      await expectListingStatus(listingWithPastStart.id, "Active");
    });

    it("publishes to Scheduled when startAt is in the future", async () => {
      const listing = await createListingFixture({
        status: "Draft",
        startAt: futureDate(2),
        endAt: futureDate(4),
      });
      setCurrentUser(listing.sellerId);

      const result = await publishListingAction(listing.id);

      expect(result.success).toBe(true);
      expect(result.status).toBe("Scheduled");
      await expectListingStatus(listing.id, "Scheduled");
      expectListingRevalidation(listing.id);
    });

    it("rejects publish for missing/non-owned/non-draft listings", async () => {
      const nonOwned = await createListingFixture({
        status: "Draft",
        endAt: futureDate(3),
      });
      setCurrentUser("usr_other_user");
      await expect(publishListingAction(nonOwned.id)).rejects.toThrow(
        "Listing not found.",
      );

      setCurrentUser("usr_any");
      await expect(publishListingAction("LST-NOT-FOUND")).rejects.toThrow(
        "Listing not found.",
      );

      for (const status of ["Active", "Scheduled", "Ended"] as const) {
        const listing = await createListingFixture({
          status,
          endAt: futureDate(3),
        });
        setCurrentUser(listing.sellerId);
        await expect(publishListingAction(listing.id)).rejects.toThrow(
          "Only draft listings can be published.",
        );
      }
    });

    it("allows publishing draft listings even when bids exist", async () => {
      const hasBids = await createListingFixture({
        status: "Draft",
        bidCount: 1,
        endAt: futureDate(3),
      });
      setCurrentUser(hasBids.sellerId);
      const result = await publishListingAction(hasBids.id);
      expect(result.success).toBe(true);
      expect(result.status).toBe("Active");
    });

    it("allows publishing draft listings when endAt is missing", async () => {
      const listing = await createListingFixture({
        status: "Draft",
        endAt: null,
      });
      setCurrentUser(listing.sellerId);
      const result = await publishListingAction(listing.id);
      expect(result.success).toBe(true);
      expect(result.status).toBe("Active");
    });

    it("allows publishing draft listings with past endAt", async () => {
      const expiredDraft = await createListingFixture({
        status: "Draft",
        endAt: pastDate(1),
      });
      setCurrentUser(expiredDraft.sellerId);

      const result = await publishListingAction(expiredDraft.id);
      expect(result.success).toBe(true);
      expect(result.status).toBe("Active");
    });
  });

  describe("returnListingToDraftAction", () => {
    it("returns Active and Scheduled listings to Draft", async () => {
      const activeListing = await createListingFixture({
        status: "Active",
        endAt: futureDate(2),
      });
      setCurrentUser(activeListing.sellerId);

      const activeResult = await returnListingToDraftAction(activeListing.id);

      expect(activeResult.success).toBe(true);
      await expectListingStatus(activeListing.id, "Draft");
      expectListingRevalidation(activeListing.id);

      const scheduledListing = await createListingFixture({
        status: "Scheduled",
        endAt: futureDate(2),
      });
      setCurrentUser(scheduledListing.sellerId);

      const scheduledResult = await returnListingToDraftAction(
        scheduledListing.id,
      );

      expect(scheduledResult.success).toBe(true);
      await expectListingStatus(scheduledListing.id, "Draft");
      expectListingRevalidation(scheduledListing.id);
    });

    it("rejects non-Active and non-Scheduled statuses", async () => {
      const draft = await createListingFixture({
        status: "Draft",
        endAt: futureDate(2),
      });
      setCurrentUser(draft.sellerId);

      await expect(returnListingToDraftAction(draft.id)).rejects.toThrow(
        "Only active or scheduled listings can be returned to draft.",
      );

      const ended = await createListingFixture({
        status: "Ended",
        endAt: futureDate(2),
      });
      setCurrentUser(ended.sellerId);

      await expect(returnListingToDraftAction(ended.id)).rejects.toThrow(
        "Ended listings can no longer be edited.",
      );
    });

    it("rejects edit-constrained, missing, and non-owned listings", async () => {
      const hasBids = await createListingFixture({
        status: "Active",
        bidCount: 3,
        endAt: futureDate(2),
      });
      setCurrentUser(hasBids.sellerId);
      await expect(returnListingToDraftAction(hasBids.id)).rejects.toThrow(
        "Listings with bids can no longer be edited.",
      );

      const expired = await createListingFixture({
        status: "Active",
        endAt: pastDate(1),
      });
      setCurrentUser(expired.sellerId);
      await expect(returnListingToDraftAction(expired.id)).rejects.toThrow(
        "This listing has already ended.",
      );

      const nonOwned = await createListingFixture({
        status: "Active",
        endAt: futureDate(2),
      });
      setCurrentUser("usr_other_user");
      await expect(returnListingToDraftAction(nonOwned.id)).rejects.toThrow(
        "Listing not found.",
      );

      setCurrentUser("usr_any");
      await expect(returnListingToDraftAction("LST-NOT-FOUND")).rejects.toThrow(
        "Listing not found.",
      );
    });
  });

  describe("deleteListingAction", () => {
    it("deletes draft listing, associated images, and cloudinary assets", async () => {
      const listing = await createListingFixture({ status: "Draft" });
      setCurrentUser(listing.sellerId);

      await db
        .update(listingImages)
        .set({ publicId: "cloudinary/main" })
        .where(eq(listingImages.id, `${listing.id}-IMG-1`))
        .run();

      await db.insert(listingImages).values([
        {
          id: `${listing.id}-IMG-2`,
          listingId: listing.id,
          url: "https://example.com/extra-1.jpg",
          publicId: "cloudinary/extra-1",
          isMain: false,
          createdAt: new Date(),
        },
        {
          id: `${listing.id}-IMG-3`,
          listingId: listing.id,
          url: "https://example.com/extra-2.jpg",
          publicId: null,
          isMain: false,
          createdAt: new Date(),
        },
      ]);

      const result = await deleteListingAction(listing.id);

      expect(result.success).toBe(true);
      const deletedListing = await db.query.listings.findFirst({
        where: eq(listings.id, listing.id),
      });
      const remainingImages = await db.query.listingImages.findMany({
        where: eq(listingImages.listingId, listing.id),
      });

      expect(deletedListing).toBeUndefined();
      expect(remainingImages).toHaveLength(0);
      expect(deleteCloudinaryImageMock).toHaveBeenCalledTimes(2);
      expect(deleteCloudinaryImageMock).toHaveBeenCalledWith("cloudinary/main");
      expect(deleteCloudinaryImageMock).toHaveBeenCalledWith(
        "cloudinary/extra-1",
      );

      expect(revalidatePathMock).toHaveBeenCalledWith("/listings");
      expect(revalidatePathMock).toHaveBeenCalledWith("/my-listings");
    });

    it("does not call cloudinary for images without publicId", async () => {
      const listing = await createListingFixture({ status: "Draft" });
      setCurrentUser(listing.sellerId);

      await db.insert(listingImages).values({
        id: `${listing.id}-IMG-2`,
        listingId: listing.id,
        url: "https://example.com/extra-no-public-id.jpg",
        publicId: null,
        isMain: false,
        createdAt: new Date(),
      });

      await deleteListingAction(listing.id);

      expect(deleteCloudinaryImageMock).not.toHaveBeenCalled();
    });

    it("rejects non-draft statuses, missing listing, and non-owner", async () => {
      for (const status of ["Active", "Scheduled", "Ended"] as const) {
        const listing = await createListingFixture({ status });
        setCurrentUser(listing.sellerId);

        await expect(deleteListingAction(listing.id)).rejects.toThrow(
          "Only draft listings can be deleted.",
        );
      }

      const owned = await createListingFixture({ status: "Draft" });
      setCurrentUser("usr_other_user");
      await expect(deleteListingAction(owned.id)).rejects.toThrow(
        "Listing not found.",
      );

      setCurrentUser("usr_any");
      await expect(deleteListingAction("LST-NOT-FOUND")).rejects.toThrow(
        "Listing not found.",
      );
    });
  });

  describe("allows changing main image while listing is Active", () => {
    it("allows changing main image while listing is Active (expected behavior)", async () => {
      const listing = await createListingFixture({
        status: "Active",
        endAt: futureDate(2),
      });
      setCurrentUser(listing.sellerId);

      const imageId = `${listing.id}-IMG-2`;
      await db.insert(listingImages).values({
        id: imageId,
        listingId: listing.id,
        url: "https://example.com/secondary-active.jpg",
        publicId: null,
        isMain: false,
        createdAt: new Date(),
      });

      await setMainListingImageAction({
        listingId: listing.id,
        imageId,
      });

      const rows = await db.query.listingImages.findMany({
        where: eq(listingImages.listingId, listing.id),
      });

      expect(rows.filter((row) => row.isMain)).toHaveLength(1);
      expect(rows.find((row) => row.id === imageId)?.isMain).toBe(true);
    });
  });
});
