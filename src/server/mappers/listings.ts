import type {
  getListingByIdData,
  getListingsBySellerIdData,
  getOwnedListingWithImagesData,
  getPublicListingsData,
} from "@/server/data/listings";
import type {
  ListingDetailsDto,
  ListingSummaryDto,
  OwnedListingForEditDto,
} from "@/types/listings";

const toIsoDate = (value: Date | null): string | null => {
  if (!value) {
    return null;
  }
  const iso = value.toISOString();
  return iso;
};

type PublicOrSellerListingRow =
  | Awaited<ReturnType<typeof getPublicListingsData>>[number]
  | Awaited<ReturnType<typeof getListingsBySellerIdData>>[number];

type ListingDetailsRow = Awaited<ReturnType<typeof getListingByIdData>>;
type OwnedListingRow = Awaited<
  ReturnType<typeof getOwnedListingWithImagesData>
>;

export const mapListingSummaryDto = (
  row: PublicOrSellerListingRow,
): ListingSummaryDto => {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    bidCount: row.bidCount,
    currentBid: row.currentBid,
    startAt: toIsoDate(row.startAt),
    endAt: toIsoDate(row.endAt),
    sellerName: row.seller.name,
    imageUrl: row.images[0]?.url ?? null,
  };
};

export const mapListingDetailsDto = (
  row: NonNullable<ListingDetailsRow>,
): ListingDetailsDto => {
  return {
    id: row.id,
    sellerId: row.sellerId,
    title: row.title,
    description: row.description,
    category: row.category,
    condition: row.condition,
    reservePrice: row.reservePrice,
    startingBid: row.startingBid,
    currentBid: row.currentBid,
    bidCount: row.bidCount,
    startAt: toIsoDate(row.startAt),
    endAt: toIsoDate(row.endAt),
    status: row.status,
    location: row.location,
    sellerName: row.seller.name,
    images: row.images.map((image) => ({
      id: image.id,
      isMain: image.isMain,
      url: image.url,
    })),
  };
};

export const mapOwnedListingForEditDto = (
  row: NonNullable<OwnedListingRow>,
): OwnedListingForEditDto => {
  return {
    bidCount: row.bidCount + 1,
    currentBid: row.currentBid,
    endAt: row.endAt,
    startAt: row.startAt,
    status: row.status,
    images: row.images.map((image) => ({
      id: image.id,
      publicId: image.publicId,
      isMain: image.isMain,
      url: image.url,
    })),
  };
};
