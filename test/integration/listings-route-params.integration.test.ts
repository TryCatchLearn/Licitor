import { describe, expect, it } from "vitest";

import {
  parseListingCategoryFilter,
  parseListingConditionFilter,
  parseListingPage,
  parseListingPageSize,
  parseListingPriceFilter,
  parseListingSearchTerm,
  parseListingSortOption,
  parsePublicBrowseStatus,
} from "@/lib/listing-browse";
import { getPublicListingsPaginated } from "@/server/queries/listings";
import { createListingFixture } from "../fixtures/factories";

describe("listings route params integration", () => {
  it("clamps oversized pageSize query params to the max supported page size", async () => {
    for (let index = 1; index <= 60; index += 1) {
      const id = `LST-ROUTE-SIZE-${String(index).padStart(2, "0")}`;
      const createdAt = new Date(Date.UTC(2026, 8, index, 0, 0, 0));

      await createListingFixture({
        id,
        category: "Electronics",
        condition: "LikeNew",
        currentBid: 1_000 + index,
        status: "Active",
        title: `Camera route listing ${index}`,
        description: "Route parser coverage listing",
        createdAt,
        updatedAt: createdAt,
      });
    }

    const page = parseListingPage("1");
    const pageSize = parseListingPageSize("1000");

    expect(pageSize).toBe(48);

    const result = await getPublicListingsPaginated({
      category: parseListingCategoryFilter("Electronics"),
      condition: parseListingConditionFilter("LikeNew"),
      page,
      pageSize,
      price: parseListingPriceFilter("500"),
      q: parseListingSearchTerm(" camera "),
      sort: parseListingSortOption("newest"),
      status: parsePublicBrowseStatus("Active"),
    });

    expect(result.pagination).toMatchObject({
      page: 1,
      pageSize: 48,
      totalCount: 60,
      totalPages: 2,
    });
    expect(result.listings).toHaveLength(48);
    expect(result.listings[0]?.id).toBe("LST-ROUTE-SIZE-60");
  });

  it("normalizes invalid page values to page 1", async () => {
    for (let index = 1; index <= 8; index += 1) {
      const id = `LST-ROUTE-PAGE-${String(index).padStart(2, "0")}`;
      const createdAt = new Date(Date.UTC(2026, 9, index, 0, 0, 0));

      await createListingFixture({
        id,
        status: "Active",
        title: `Page route listing ${index}`,
        createdAt,
        updatedAt: createdAt,
      });
    }

    const fromZero = await getPublicListingsPaginated({
      page: parseListingPage("0"),
      pageSize: 6,
      status: "Active",
    });
    const fromText = await getPublicListingsPaginated({
      page: parseListingPage("abc"),
      pageSize: 6,
      status: "Active",
    });

    expect(fromZero.pagination.page).toBe(1);
    expect(fromText.pagination.page).toBe(1);
    expect(fromZero.listings.map((listing) => listing.id)).toEqual(
      fromText.listings.map((listing) => listing.id),
    );
  });

  it("uses first values from array search params and applies composed browse constraints", async () => {
    for (let index = 1; index <= 8; index += 1) {
      const id = `LST-ROUTE-ARRAY-${String(index).padStart(2, "0")}`;
      const createdAt = new Date(Date.UTC(2026, 10, index, 0, 0, 0));

      await createListingFixture({
        id,
        category: "Electronics",
        condition: "LikeNew",
        currentBid: index * 1_000,
        status: "Active",
        title: `Camera array listing ${index}`,
        description: "Array parser listing",
        createdAt,
        updatedAt: createdAt,
      });
    }

    await createListingFixture({
      id: "LST-ROUTE-ARRAY-CATEGORY-MISS",
      category: "Fashion",
      condition: "LikeNew",
      currentBid: 2_000,
      status: "Active",
      title: "Camera fashion listing",
    });
    await createListingFixture({
      id: "LST-ROUTE-ARRAY-SEARCH-MISS",
      category: "Electronics",
      condition: "LikeNew",
      currentBid: 2_000,
      status: "Active",
      title: "Tripod listing",
    });

    const result = await getPublicListingsPaginated({
      category: parseListingCategoryFilter(["Electronics", "Fashion"]),
      condition: parseListingConditionFilter(["LikeNew", "Good"]),
      page: parseListingPage(["2", "1"]),
      pageSize: parseListingPageSize(["6", "48"]),
      price: parseListingPriceFilter(["100", "500"]),
      q: parseListingSearchTerm(["camera", "tripod"]),
      sort: parseListingSortOption(["price-low-high", "most-bids"]),
      status: parsePublicBrowseStatus(["Active", "Ended"]),
    });

    expect(result.pagination).toMatchObject({
      page: 2,
      pageSize: 6,
      totalCount: 8,
      totalPages: 2,
    });
    expect(result.listings.map((listing) => listing.id)).toEqual([
      "LST-ROUTE-ARRAY-07",
      "LST-ROUTE-ARRAY-08",
    ]);
  });
});
