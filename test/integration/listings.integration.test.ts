import { describe, expect, it } from "vitest";

import { db } from "@/lib/db/client";
import { listingImages, listings, profiles, user } from "@/lib/db/schema";
import {
  getListingById,
  getListingsBySellerId,
  getListingsBySellerIdPaginated,
  getPublicListings,
  getPublicListingsPaginated,
} from "@/server/queries/listings";
import { createListingFixture } from "../fixtures/factories";

describe("getPublicListings integration", () => {
  it("returns public listings ordered by createdAt descending", async () => {
    await createListingFixture({
      id: "LST-OLDEST",
      title: "Old listing",
      description: "Created first",
      status: "Ended",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    await createListingFixture({
      id: "LST-NEWEST",
      title: "New listing",
      description: "Created last",
      status: "Active",
      createdAt: new Date("2026-02-01T00:00:00.000Z"),
      updatedAt: new Date("2026-02-01T00:00:00.000Z"),
    });

    const result = await getPublicListings();

    expect(result).toHaveLength(2);
    expect(result.map((listing) => listing.id)).toEqual([
      "LST-NEWEST",
      "LST-OLDEST",
    ]);
  });

  it("excludes draft listings from the public dataset", async () => {
    await createListingFixture({
      id: "LST-DRAFT",
      title: "Private draft",
      status: "Draft",
    });
    await createListingFixture({
      id: "LST-SCHEDULED",
      title: "Public scheduled",
      status: "Scheduled",
    });

    const result = await getPublicListings();

    expect(result.map((listing) => listing.id)).toEqual(["LST-SCHEDULED"]);
  });

  it("returns an empty array when no public listings exist", async () => {
    const result = await getPublicListings();

    expect(result).toEqual([]);
  });

  it("can filter public listings by status", async () => {
    await createListingFixture({
      id: "LST-PUBLIC-ACTIVE",
      status: "Active",
      createdAt: new Date("2026-02-02T00:00:00.000Z"),
      updatedAt: new Date("2026-02-02T00:00:00.000Z"),
    });
    await createListingFixture({
      id: "LST-PUBLIC-SCHEDULED",
      status: "Scheduled",
      createdAt: new Date("2026-02-03T00:00:00.000Z"),
      updatedAt: new Date("2026-02-03T00:00:00.000Z"),
    });
    await createListingFixture({
      id: "LST-PUBLIC-ENDED",
      status: "Ended",
      createdAt: new Date("2026-02-04T00:00:00.000Z"),
      updatedAt: new Date("2026-02-04T00:00:00.000Z"),
    });
    await createListingFixture({
      id: "LST-PUBLIC-DRAFT",
      status: "Draft",
      createdAt: new Date("2026-02-05T00:00:00.000Z"),
      updatedAt: new Date("2026-02-05T00:00:00.000Z"),
    });

    const scheduled = await getPublicListings({ status: "Scheduled" });
    const active = await getPublicListings({ status: "Active" });
    const ended = await getPublicListings({ status: "Ended" });

    expect(scheduled.map((listing) => listing.id)).toEqual([
      "LST-PUBLIC-SCHEDULED",
    ]);
    expect(active.map((listing) => listing.id)).toEqual(["LST-PUBLIC-ACTIVE"]);
    expect(ended.map((listing) => listing.id)).toEqual(["LST-PUBLIC-ENDED"]);
  });

  it("starts each test with a clean listing state via transaction rollback", async () => {
    const result = await db.select().from(listings);
    expect(result).toHaveLength(0);
  });

  it("combines category and price filters with low-high price sorting", async () => {
    await createListingFixture({
      id: "LST-ELECTRONICS-LOW",
      category: "Electronics",
      currentBid: 8_500,
      status: "Active",
      title: "Electronics low",
    });
    await createListingFixture({
      id: "LST-ELECTRONICS-HIGH",
      category: "Electronics",
      currentBid: 9_500,
      status: "Active",
      title: "Electronics high",
    });
    await createListingFixture({
      id: "LST-ELECTRONICS-TOO-HIGH",
      category: "Electronics",
      currentBid: 12_500,
      status: "Active",
      title: "Electronics too high",
    });
    await createListingFixture({
      id: "LST-FASHION-LOW",
      category: "Fashion",
      currentBid: 7_500,
      status: "Active",
      title: "Fashion low",
    });

    const result = await getPublicListings({
      category: "Electronics",
      price: "100",
      sort: "price-low-high",
      status: "Active",
    });

    expect(result.map((listing) => listing.id)).toEqual([
      "LST-ELECTRONICS-LOW",
      "LST-ELECTRONICS-HIGH",
    ]);
  });

  it("applies title and description search to public listings", async () => {
    await createListingFixture({
      id: "LST-SEARCH-TITLE",
      status: "Scheduled",
      title: "Vintage camera rig",
      description: "Collector condition body with accessories",
      createdAt: new Date("2026-03-01T00:00:00.000Z"),
      updatedAt: new Date("2026-03-01T00:00:00.000Z"),
    });
    await createListingFixture({
      id: "LST-SEARCH-DESCRIPTION",
      status: "Scheduled",
      title: "Studio bundle",
      description: "Includes a backup camera and tripod",
      createdAt: new Date("2026-03-02T00:00:00.000Z"),
      updatedAt: new Date("2026-03-02T00:00:00.000Z"),
    });
    await createListingFixture({
      id: "LST-SEARCH-MISS",
      status: "Scheduled",
      title: "Office chair",
      description: "Ergonomic seat",
      createdAt: new Date("2026-03-03T00:00:00.000Z"),
      updatedAt: new Date("2026-03-03T00:00:00.000Z"),
    });

    const result = await getPublicListings({
      q: "camera",
      status: "Scheduled",
    });

    expect(result.map((listing) => listing.id)).toEqual([
      "LST-SEARCH-DESCRIPTION",
      "LST-SEARCH-TITLE",
    ]);
  });
});

describe("getListingsBySellerId integration", () => {
  it("returns only listings owned by the requested seller", async () => {
    const sellerCreatedAt = new Date("2026-01-01T00:00:00.000Z");

    await db.insert(user).values([
      {
        id: "usr_seller_a",
        name: "Seller A",
        email: "seller-a@test.local",
        emailVerified: true,
        image: "https://example.com/seller-a.png",
        createdAt: sellerCreatedAt,
        updatedAt: sellerCreatedAt,
      },
      {
        id: "usr_seller_b",
        name: "Seller B",
        email: "seller-b@test.local",
        emailVerified: true,
        image: "https://example.com/seller-b.png",
        createdAt: sellerCreatedAt,
        updatedAt: sellerCreatedAt,
      },
    ]);
    await db.insert(profiles).values([
      {
        id: "prf_seller_a",
        userId: "usr_seller_a",
        name: "Seller A",
        location: "Seller City",
        bio: null,
        image: "https://example.com/seller-a.png",
        createdAt: sellerCreatedAt,
        updatedAt: sellerCreatedAt,
      },
      {
        id: "prf_seller_b",
        userId: "usr_seller_b",
        name: "Seller B",
        location: "Seller City",
        bio: null,
        image: "https://example.com/seller-b.png",
        createdAt: sellerCreatedAt,
        updatedAt: sellerCreatedAt,
      },
    ]);

    await createListingFixture({
      id: "LST-MY-DRAFT",
      sellerId: "usr_seller_a",
      title: "My draft",
      status: "Draft",
      createdAt: new Date("2026-02-01T00:00:00.000Z"),
      updatedAt: new Date("2026-02-01T00:00:00.000Z"),
    });
    await createListingFixture({
      id: "LST-MY-ACTIVE",
      sellerId: "usr_seller_a",
      title: "My active",
      status: "Active",
      createdAt: new Date("2026-02-02T00:00:00.000Z"),
      updatedAt: new Date("2026-02-02T00:00:00.000Z"),
    });
    await createListingFixture({
      id: "LST-OTHER-ACTIVE",
      sellerId: "usr_seller_b",
      title: "Other active",
      status: "Active",
      createdAt: new Date("2026-02-03T00:00:00.000Z"),
      updatedAt: new Date("2026-02-03T00:00:00.000Z"),
    });

    const result = await getListingsBySellerId("usr_seller_a");

    expect(result.map((listing) => listing.id)).toEqual([
      "LST-MY-ACTIVE",
      "LST-MY-DRAFT",
    ]);
  });

  it("includes all statuses for the current seller, including drafts", async () => {
    const sellerCreatedAt = new Date("2026-01-01T00:00:00.000Z");

    await db.insert(user).values({
      id: "usr_seller_c",
      name: "Seller C",
      email: "seller-c@test.local",
      emailVerified: true,
      image: "https://example.com/seller-c.png",
      createdAt: sellerCreatedAt,
      updatedAt: sellerCreatedAt,
    });
    await db.insert(profiles).values({
      id: "prf_seller_c",
      userId: "usr_seller_c",
      name: "Seller C",
      location: "Seller City",
      bio: null,
      image: "https://example.com/seller-c.png",
      createdAt: sellerCreatedAt,
      updatedAt: sellerCreatedAt,
    });

    await createListingFixture({
      id: "LST-SELLER-DRAFT",
      sellerId: "usr_seller_c",
      status: "Draft",
      createdAt: new Date("2026-02-01T00:00:00.000Z"),
      updatedAt: new Date("2026-02-01T00:00:00.000Z"),
    });
    await createListingFixture({
      id: "LST-SELLER-SCHEDULED",
      sellerId: "usr_seller_c",
      status: "Scheduled",
      createdAt: new Date("2026-02-02T00:00:00.000Z"),
      updatedAt: new Date("2026-02-02T00:00:00.000Z"),
    });
    await createListingFixture({
      id: "LST-SELLER-ENDED",
      sellerId: "usr_seller_c",
      status: "Ended",
      createdAt: new Date("2026-02-03T00:00:00.000Z"),
      updatedAt: new Date("2026-02-03T00:00:00.000Z"),
    });

    const result = await getListingsBySellerId("usr_seller_c");

    expect(result.map((listing) => listing.status)).toEqual([
      "Ended",
      "Scheduled",
      "Draft",
    ]);
  });

  it("can filter the seller dataset by status at the query layer", async () => {
    const sellerCreatedAt = new Date("2026-01-01T00:00:00.000Z");

    await db.insert(user).values({
      id: "usr_seller_d",
      name: "Seller D",
      email: "seller-d@test.local",
      emailVerified: true,
      image: "https://example.com/seller-d.png",
      createdAt: sellerCreatedAt,
      updatedAt: sellerCreatedAt,
    });
    await db.insert(profiles).values({
      id: "prf_seller_d",
      userId: "usr_seller_d",
      name: "Seller D",
      location: "Seller City",
      bio: null,
      image: "https://example.com/seller-d.png",
      createdAt: sellerCreatedAt,
      updatedAt: sellerCreatedAt,
    });

    await createListingFixture({
      id: "LST-SELLER-D-ACTIVE",
      sellerId: "usr_seller_d",
      status: "Active",
      createdAt: new Date("2026-02-02T00:00:00.000Z"),
      updatedAt: new Date("2026-02-02T00:00:00.000Z"),
    });
    await createListingFixture({
      id: "LST-SELLER-D-SCHEDULED",
      sellerId: "usr_seller_d",
      status: "Scheduled",
      createdAt: new Date("2026-02-03T00:00:00.000Z"),
      updatedAt: new Date("2026-02-03T00:00:00.000Z"),
    });

    const result = await getListingsBySellerId("usr_seller_d", "Scheduled");

    expect(result.map((listing) => listing.id)).toEqual([
      "LST-SELLER-D-SCHEDULED",
    ]);
    expect(result.every((listing) => listing.status === "Scheduled")).toBe(
      true,
    );
  });
});

describe("getPublicListingsPaginated integration", () => {
  it("composes status, category, condition, price, search, sort, and pagination", async () => {
    await createListingFixture({
      id: "LST-PUBLIC-PAGINATED-MATCH-LOW",
      category: "Electronics",
      condition: "LikeNew",
      currentBid: 4_500,
      status: "Active",
      title: "Camera body low",
      description: "Mirrorless camera body",
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
      updatedAt: new Date("2026-04-01T00:00:00.000Z"),
    });
    await createListingFixture({
      id: "LST-PUBLIC-PAGINATED-MATCH-HIGH",
      category: "Electronics",
      condition: "LikeNew",
      currentBid: 6_500,
      status: "Active",
      title: "Camera body high",
      description: "Collector camera edition",
      createdAt: new Date("2026-04-02T00:00:00.000Z"),
      updatedAt: new Date("2026-04-02T00:00:00.000Z"),
    });
    await createListingFixture({
      id: "LST-PUBLIC-PAGINATED-STATUS-MISS",
      category: "Electronics",
      condition: "LikeNew",
      currentBid: 5_500,
      status: "Scheduled",
      title: "Camera scheduled",
    });
    await createListingFixture({
      id: "LST-PUBLIC-PAGINATED-CATEGORY-MISS",
      category: "Fashion",
      condition: "LikeNew",
      currentBid: 5_500,
      status: "Active",
      title: "Camera jacket",
    });
    await createListingFixture({
      id: "LST-PUBLIC-PAGINATED-CONDITION-MISS",
      category: "Electronics",
      condition: "Good",
      currentBid: 5_500,
      status: "Active",
      title: "Camera used",
    });
    await createListingFixture({
      id: "LST-PUBLIC-PAGINATED-PRICE-MISS",
      category: "Electronics",
      condition: "LikeNew",
      currentBid: 11_500,
      status: "Active",
      title: "Camera expensive",
    });

    const result = await getPublicListingsPaginated({
      category: "Electronics",
      condition: "LikeNew",
      page: 1,
      pageSize: 6,
      price: "100",
      q: "camera",
      sort: "price-low-high",
      status: "Active",
    });

    expect(result.listings.map((listing) => listing.id)).toEqual([
      "LST-PUBLIC-PAGINATED-MATCH-LOW",
      "LST-PUBLIC-PAGINATED-MATCH-HIGH",
    ]);
    expect(result.pagination).toMatchObject({
      from: 1,
      offset: 0,
      page: 1,
      pageSize: 6,
      to: 2,
      totalCount: 2,
      totalPages: 1,
    });
  });

  it("returns precise pagination metadata for middle pages", async () => {
    const seededIds: string[] = [];

    for (let index = 1; index <= 14; index += 1) {
      const id = `LST-PUBLIC-METADATA-${String(index).padStart(2, "0")}`;
      seededIds.push(id);
      const createdAt = new Date(Date.UTC(2026, 4, index, 0, 0, 0));

      await createListingFixture({
        id,
        status: "Active",
        title: `Metadata listing ${index}`,
        createdAt,
        updatedAt: createdAt,
      });
    }

    const result = await getPublicListingsPaginated({
      page: 2,
      pageSize: 6,
      status: "Active",
    });

    expect(result.pagination).toMatchObject({
      from: 7,
      offset: 6,
      page: 2,
      pageSize: 6,
      to: 12,
      totalCount: 14,
      totalPages: 3,
    });
    expect(result.listings.map((listing) => listing.id)).toEqual(
      [...seededIds].reverse().slice(6, 12),
    );
  });

  it("clamps overflow page requests to the last page", async () => {
    const seededIds: string[] = [];

    for (let index = 1; index <= 14; index += 1) {
      const id = `LST-PUBLIC-OVERFLOW-${String(index).padStart(2, "0")}`;
      seededIds.push(id);
      const createdAt = new Date(Date.UTC(2026, 5, index, 0, 0, 0));

      await createListingFixture({
        id,
        status: "Active",
        title: `Overflow listing ${index}`,
        createdAt,
        updatedAt: createdAt,
      });
    }

    const result = await getPublicListingsPaginated({
      page: 99,
      pageSize: 6,
      status: "Active",
    });

    expect(result.pagination).toMatchObject({
      from: 13,
      offset: 12,
      page: 3,
      pageSize: 6,
      to: 14,
      totalCount: 14,
      totalPages: 3,
    });
    expect(result.listings.map((listing) => listing.id)).toEqual(
      [...seededIds].reverse().slice(12),
    );
  });

  it("returns empty listings and zero ranges when no records match", async () => {
    await createListingFixture({
      id: "LST-PUBLIC-EMPTY-MISS",
      category: "Fashion",
      condition: "Good",
      status: "Active",
      title: "Not a camera listing",
    });

    const result = await getPublicListingsPaginated({
      category: "Electronics",
      condition: "LikeNew",
      page: 4,
      pageSize: 24,
      price: "10",
      q: "camera",
      sort: "most-bids",
      status: "Scheduled",
    });

    expect(result.listings).toEqual([]);
    expect(result.pagination).toMatchObject({
      from: 0,
      offset: 0,
      page: 1,
      pageSize: 24,
      to: 0,
      totalCount: 0,
      totalPages: 0,
    });
  });

  it("keeps page results non-overlapping while honoring active filters, search, and sort", async () => {
    const expectedOrderedIds: string[] = [];

    for (let index = 1; index <= 9; index += 1) {
      const id = `LST-PUBLIC-COMPOSED-${String(index).padStart(2, "0")}`;
      expectedOrderedIds.unshift(id);
      const createdAt = new Date(Date.UTC(2026, 6, index, 0, 0, 0));

      await createListingFixture({
        id,
        category: "Electronics",
        condition: "LikeNew",
        currentBid: index * 1_000,
        status: "Active",
        title: `Camera listing ${index}`,
        description: "Camera-ready bundle",
        createdAt,
        updatedAt: createdAt,
      });
    }

    await createListingFixture({
      id: "LST-PUBLIC-COMPOSED-MISS",
      category: "Electronics",
      condition: "LikeNew",
      currentBid: 999_000,
      status: "Ended",
      title: "Camera ended listing",
      description: "Should not match status",
    });

    const pageOne = await getPublicListingsPaginated({
      category: "Electronics",
      condition: "LikeNew",
      page: 1,
      pageSize: 6,
      price: "500",
      q: "camera",
      sort: "price-high-low",
      status: "Active",
    });
    const pageTwo = await getPublicListingsPaginated({
      category: "Electronics",
      condition: "LikeNew",
      page: 2,
      pageSize: 6,
      price: "500",
      q: "camera",
      sort: "price-high-low",
      status: "Active",
    });

    const pageOneIds = pageOne.listings.map((listing) => listing.id);
    const pageTwoIds = pageTwo.listings.map((listing) => listing.id);
    const overlap = pageOneIds.filter((id) => pageTwoIds.includes(id));

    expect(overlap).toHaveLength(0);
    expect([...pageOneIds, ...pageTwoIds]).toEqual(expectedOrderedIds);
    expect(pageOne.pagination).toMatchObject({
      page: 1,
      pageSize: 6,
      totalCount: 9,
      totalPages: 2,
    });
    expect(pageTwo.pagination).toMatchObject({
      page: 2,
      pageSize: 6,
      totalCount: 9,
      totalPages: 2,
    });
  });
});

describe("getListingsBySellerIdPaginated integration", () => {
  it("applies seller scope + status filters and clamps overflow page requests", async () => {
    const sellerCreatedAt = new Date("2026-01-01T00:00:00.000Z");

    await db.insert(user).values([
      {
        id: "usr_paginated_seller_a",
        name: "Paginated Seller A",
        email: "paginated-seller-a@test.local",
        emailVerified: true,
        image: "https://example.com/paginated-seller-a.png",
        createdAt: sellerCreatedAt,
        updatedAt: sellerCreatedAt,
      },
      {
        id: "usr_paginated_seller_b",
        name: "Paginated Seller B",
        email: "paginated-seller-b@test.local",
        emailVerified: true,
        image: "https://example.com/paginated-seller-b.png",
        createdAt: sellerCreatedAt,
        updatedAt: sellerCreatedAt,
      },
    ]);
    await db.insert(profiles).values([
      {
        id: "prf_paginated_seller_a",
        userId: "usr_paginated_seller_a",
        name: "Paginated Seller A",
        location: "Pagination City",
        bio: null,
        image: "https://example.com/paginated-seller-a.png",
        createdAt: sellerCreatedAt,
        updatedAt: sellerCreatedAt,
      },
      {
        id: "prf_paginated_seller_b",
        userId: "usr_paginated_seller_b",
        name: "Paginated Seller B",
        location: "Pagination City",
        bio: null,
        image: "https://example.com/paginated-seller-b.png",
        createdAt: sellerCreatedAt,
        updatedAt: sellerCreatedAt,
      },
    ]);

    const sellerDraftIds: string[] = [];

    for (let index = 1; index <= 8; index += 1) {
      const id = `LST-SELLER-PAGINATED-DRAFT-${String(index).padStart(2, "0")}`;
      sellerDraftIds.push(id);
      const createdAt = new Date(Date.UTC(2026, 7, index, 0, 0, 0));

      await createListingFixture({
        id,
        sellerId: "usr_paginated_seller_a",
        status: "Draft",
        title: `Seller draft ${index}`,
        createdAt,
        updatedAt: createdAt,
      });
    }

    await createListingFixture({
      id: "LST-SELLER-PAGINATED-ACTIVE-MISS",
      sellerId: "usr_paginated_seller_a",
      status: "Active",
      title: "Seller active miss",
    });
    await createListingFixture({
      id: "LST-SELLER-PAGINATED-OTHER-SELLER-MISS",
      sellerId: "usr_paginated_seller_b",
      status: "Draft",
      title: "Other seller draft miss",
    });

    const result = await getListingsBySellerIdPaginated({
      page: 9,
      pageSize: 6,
      sellerId: "usr_paginated_seller_a",
      status: "Draft",
    });

    expect(result.pagination).toMatchObject({
      from: 7,
      offset: 6,
      page: 2,
      pageSize: 6,
      to: 8,
      totalCount: 8,
      totalPages: 2,
    });
    expect(result.listings.map((listing) => listing.id)).toEqual(
      [...sellerDraftIds].reverse().slice(6),
    );
    expect(
      result.listings.every(
        (listing) => listing.status === "Draft" && listing.id.includes("DRAFT"),
      ),
    ).toBe(true);
  });
});

describe("getListingById integration", () => {
  it("returns a complete listing record with seller and ordered images", async () => {
    const createdAt = new Date("2026-02-10T12:00:00.000Z");
    await db.insert(user).values({
      id: "usr_detail_owner",
      name: "Detail Seller",
      email: "detail-seller@test.local",
      emailVerified: true,
      image: "https://example.com/detail-seller.png",
      createdAt,
      updatedAt: createdAt,
    });
    await db.insert(profiles).values({
      id: "prf_detail_owner",
      userId: "usr_detail_owner",
      name: "Detail Seller",
      location: "Detail City",
      bio: null,
      image: "https://example.com/detail-seller.png",
      createdAt,
      updatedAt: createdAt,
    });

    await createListingFixture({
      id: "LST-DETAILS",
      sellerId: "usr_detail_owner",
      title: "Detailed listing",
      status: "Active",
      createdAt,
      updatedAt: createdAt,
    });

    await db.insert(listingImages).values({
      id: "LST-DETAILS-IMG-2",
      listingId: "LST-DETAILS",
      url: "https://example.com/detail-listing-2.jpg",
      publicId: null,
      isMain: false,
      createdAt: new Date("2026-02-10T12:05:00.000Z"),
    });

    const result = await getListingById("LST-DETAILS");

    expect(result).not.toBeNull();
    expect(result?.sellerName).toBe("Detail Seller");
    expect(result?.images.map((image) => image.id)).toEqual([
      "LST-DETAILS-IMG-1",
      "LST-DETAILS-IMG-2",
    ]);
    expect(result?.status).toBe("Active");
  });
});
