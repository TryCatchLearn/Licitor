import { describe, expect, it } from "vitest";

import { db } from "@/lib/db/client";
import { listings } from "@/lib/db/schema";
import { getPublicListings } from "@/server/queries/listings";
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

  it("starts each test with a clean listing state via transaction rollback", async () => {
    const result = await db.select().from(listings);
    expect(result).toHaveLength(0);
  });
});
