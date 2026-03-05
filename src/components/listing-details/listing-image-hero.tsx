"use client";

import Image from "next/image";

import { useListingDetailsContext } from "@/components/listing-details/listing-details-context";

const fallbackImage = "https://picsum.photos/id/1/1200/900";

export function ListingImageHero() {
  const {
    canSelectMainFromPreview,
    listing,
    mainImageIndex,
    selectedImage,
    setSelectedImage,
  } = useListingDetailsContext();

  return (
    <div className="relative aspect-[4/3] bg-background/60">
      <button
        type="button"
        className="absolute inset-0 cursor-pointer"
        disabled={!canSelectMainFromPreview}
        onClick={() => {
          if (mainImageIndex >= 0) {
            setSelectedImage(mainImageIndex);
          }
        }}
      >
        <Image
          key={selectedImage?.id ?? "fallback"}
          alt={listing.title}
          className="object-cover"
          data-testid="listing-main-image"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 80vw"
          src={selectedImage?.url ?? fallbackImage}
        />
        <span className="sr-only">Preview main listing image</span>
      </button>
    </div>
  );
}
