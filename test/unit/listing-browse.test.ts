import { describe, expect, it } from "vitest";

import {
  buildListingPaginationMeta,
  buildListingsSearchHref,
  defaultListingPageSize,
  getListingPriceCeilingCents,
  parseListingCategoryFilter,
  parseListingConditionFilter,
  parseListingPage,
  parseListingPageSize,
  parseListingPriceFilter,
  parseListingSearchTerm,
  parseListingSortOption,
  parsePublicBrowseStatus,
} from "@/lib/listing-browse";

describe("listing browse helpers", () => {
  it("parses supported browse params and falls back safely", () => {
    expect(parsePublicBrowseStatus("Scheduled")).toBe("Scheduled");
    expect(parsePublicBrowseStatus("Draft")).toBe("Active");

    expect(parseListingCategoryFilter("Electronics")).toBe("Electronics");
    expect(parseListingCategoryFilter("Unknown")).toBeUndefined();

    expect(parseListingConditionFilter("LikeNew")).toBe("LikeNew");
    expect(parseListingConditionFilter("Damaged")).toBeUndefined();

    expect(parseListingPriceFilter("100")).toBe("100");
    expect(parseListingPriceFilter("150")).toBeUndefined();

    expect(parseListingSortOption("most-bids")).toBe("most-bids");
    expect(parseListingSortOption("random")).toBeUndefined();
  });

  it("normalizes array params and trims search text", () => {
    expect(parsePublicBrowseStatus(["Ended", "Active"])).toBe("Ended");
    expect(parseListingSearchTerm("  optics  ")).toBe("optics");
    expect(parseListingSearchTerm("   ")).toBeUndefined();
  });

  it("builds listings search URLs for in-place and cross-route submits", () => {
    expect(
      buildListingsSearchHref({
        pathname: "/listings",
        currentSearchParams: new URLSearchParams(
          "status=Scheduled&sort=most-bids&page=3",
        ),
        query: "  camera  ",
      }),
    ).toBe(
      "/listings?status=Scheduled&sort=most-bids&page=1&q=camera&pageSize=12",
    );

    expect(
      buildListingsSearchHref({
        pathname: "/dashboard",
        currentSearchParams: new URLSearchParams("status=Ended"),
        query: "electronics",
      }),
    ).toBe("/listings?q=electronics&page=1&pageSize=12");

    expect(
      buildListingsSearchHref({
        pathname: "/listings",
        currentSearchParams: new URLSearchParams(
          "status=Active&q=phone&page=2",
        ),
        query: "   ",
      }),
    ).toBe("/listings?status=Active&page=1&pageSize=12");
  });

  it("parses page and pageSize values safely", () => {
    expect(parseListingPage("4")).toBe(4);
    expect(parseListingPage("0")).toBe(1);
    expect(parseListingPage("text")).toBe(1);
    expect(parseListingPage()).toBe(1);

    expect(parseListingPageSize("6")).toBe(6);
    expect(parseListingPageSize("48")).toBe(48);
    expect(parseListingPageSize("99")).toBe(48);
    expect(parseListingPageSize("1000")).toBe(48);
    expect(parseListingPageSize("47")).toBe(defaultListingPageSize);
    expect(parseListingPageSize()).toBe(defaultListingPageSize);
  });

  it("builds pagination meta with clamped pages and ranges", () => {
    expect(
      buildListingPaginationMeta({
        page: 3,
        pageSize: 6,
        totalCount: 20,
      }),
    ).toMatchObject({
      from: 13,
      offset: 12,
      page: 3,
      to: 18,
      totalCount: 20,
      totalPages: 4,
    });

    expect(
      buildListingPaginationMeta({
        page: 9,
        pageSize: 12,
        totalCount: 20,
      }),
    ).toMatchObject({
      from: 13,
      offset: 12,
      page: 2,
      to: 20,
      totalCount: 20,
      totalPages: 2,
    });
  });

  it("maps price filters to cents ceilings", () => {
    expect(getListingPriceCeilingCents("10")).toBe(1_000);
    expect(getListingPriceCeilingCents("50")).toBe(5_000);
    expect(getListingPriceCeilingCents("500")).toBe(50_000);
    expect(getListingPriceCeilingCents()).toBeUndefined();
  });
});
