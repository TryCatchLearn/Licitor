import { describe, expect, it } from "vitest";

import {
  formatBidCount,
  formatListingCurrency,
  getListingStatusTone,
  getListingTimeLabel,
} from "@/lib/listings";

describe("listing helpers", () => {
  it("formats listing currency from cents", () => {
    expect(formatListingCurrency(221000)).toBe("$2,210.00");
  });

  it("pluralizes bid counts", () => {
    expect(formatBidCount(1)).toBe("1 bid");
    expect(formatBidCount(7)).toBe("7 bids");
  });

  it("maps listing statuses to stable badge tones", () => {
    expect(getListingStatusTone("Active")).toContain("emerald");
    expect(getListingStatusTone("Scheduled")).toContain("sky");
    expect(getListingStatusTone("Ended")).toContain("zinc");
    expect(getListingStatusTone("Draft")).toContain("amber");
  });

  it("formats active, scheduled, and ended listing timing", () => {
    const now = new Date("2026-03-01T12:00:00.000Z");

    expect(
      getListingTimeLabel({
        endAt: new Date("2026-03-03T16:00:00.000Z"),
        now,
        startAt: null,
        status: "Active",
      }),
    ).toBe("Ends in 2d 4h");

    expect(
      getListingTimeLabel({
        endAt: new Date("2026-03-04T12:00:00.000Z"),
        now,
        startAt: new Date("2026-03-01T18:30:00.000Z"),
        status: "Scheduled",
      }),
    ).toBe("Starts in 6h 30m");

    expect(
      getListingTimeLabel({
        endAt: new Date("2026-02-20T21:00:00.000Z"),
        now,
        startAt: new Date("2026-02-01T09:00:00.000Z"),
        status: "Ended",
      }),
    ).toBe("Ended Feb 20, 2026");
  });
});
