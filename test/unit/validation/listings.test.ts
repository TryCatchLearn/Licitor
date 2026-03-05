import { describe, expect, it } from "vitest";

import { updateListingDraftSchema } from "@/lib/validators/listings";

const futureDate = (daysFromNow: number) =>
  new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString();
const pastDate = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

const buildValidInput = () => ({
  title: "Vintage Camera Bundle",
  description:
    "Fully tested vintage camera bundle with manual lens and original case.",
  category: "Collectibles" as const,
  condition: "Good" as const,
  location: "Austin, TX",
  reservePrice: "250.00",
  startAt: futureDate(1),
  endAt: futureDate(3),
});

describe("listing validation schema", () => {
  it("accepts missing startingBid", () => {
    const input = buildValidInput();
    const parsed = updateListingDraftSchema.safeParse(input);

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.startingBid).toBeNull();
    }
  });

  it("rejects startAt when it is in the past", () => {
    const parsed = updateListingDraftSchema.safeParse({
      ...buildValidInput(),
      startAt: pastDate(1),
      startingBid: "125.50",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toBe(
        "Start time must be in the future.",
      );
    }
  });

  it("applies reserve-price comparison only when startingBid is present", () => {
    const withoutStartingBid = updateListingDraftSchema.safeParse({
      ...buildValidInput(),
      reservePrice: "10.00",
    });
    expect(withoutStartingBid.success).toBe(true);

    const withStartingBid = updateListingDraftSchema.safeParse({
      ...buildValidInput(),
      reservePrice: "10.00",
      startingBid: "20.00",
    });
    expect(withStartingBid.success).toBe(false);
    if (!withStartingBid.success) {
      expect(withStartingBid.error.issues[0]?.message).toBe(
        "Reserve price must be at least the starting bid.",
      );
    }
  });

  it("rejects invalid reservePrice format with a field validation message", () => {
    const parsed = updateListingDraftSchema.safeParse({
      ...buildValidInput(),
      reservePrice: "twelve dollars",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toBe(
        "Reserve price must be a valid dollar amount.",
      );
      expect(parsed.error.issues[0]?.path).toEqual(["reservePrice"]);
    }
  });

  it("rejects invalid startAt format with a field validation message", () => {
    const parsed = updateListingDraftSchema.safeParse({
      ...buildValidInput(),
      startAt: "not-a-date",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toBe(
        "Choose a valid date and time.",
      );
      expect(parsed.error.issues[0]?.path).toEqual(["startAt"]);
    }
  });
});
