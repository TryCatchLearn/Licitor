import { describe, expect, it } from "vitest";

import {
  describeCreateListingImage,
  formatCreateListingFileSize,
  isCreateListingImageFile,
} from "@/lib/create-listing";

describe("create listing helpers", () => {
  it("accepts image mime types and rejects non-images", () => {
    expect(isCreateListingImageFile({ type: "image/jpeg" })).toBe(true);
    expect(isCreateListingImageFile({ type: "image/avif" })).toBe(true);
    expect(isCreateListingImageFile({ type: "application/pdf" })).toBe(false);
  });

  it("formats file sizes for preview metadata", () => {
    expect(formatCreateListingFileSize(96 * 1024)).toBe("96 KB");
    expect(formatCreateListingFileSize(1.5 * 1024 * 1024)).toBe("1.5 MB");
  });

  it("describes preview images with type and size", () => {
    expect(
      describeCreateListingImage({
        size: 2 * 1024 * 1024,
        type: "image/webp",
      }),
    ).toBe("WEBP • 2 MB");
  });
});
