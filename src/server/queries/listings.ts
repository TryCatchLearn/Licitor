import type {
  ListingCategory,
  ListingCondition,
  ListingStatus,
} from "@/lib/db/schema";
import type {
  ListingPageSize,
  ListingPriceFilter,
  ListingSortOption,
} from "@/lib/listing-browse";
import {
  buildListingPaginationMeta,
  getListingPriceCeilingCents,
} from "@/lib/listing-browse";
import {
  getListingByIdData,
  getListingsBySellerIdCountData,
  getListingsBySellerIdData,
  getPublicListingsCountData,
  getPublicListingsData,
  type PublicListingStatus,
} from "@/server/data/listings";
import {
  mapListingDetailsDto,
  mapListingSummaryDto,
} from "@/server/mappers/listings";
import type { ListingDetailsDto, ListingSummaryDto } from "@/types/listings";

export const getPublicListings = async (
  options: {
    category?: ListingCategory;
    condition?: ListingCondition;
    price?: ListingPriceFilter;
    q?: string;
    sort?: ListingSortOption;
    status?: PublicListingStatus;
  } = {},
): Promise<ListingSummaryDto[]> => {
  const priceCeilingCents = getListingPriceCeilingCents(options.price);
  const rows = await getPublicListingsData({
    category: options.category,
    condition: options.condition,
    priceCeilingCents,
    searchQuery: options.q,
    sort: options.sort,
    status: options.status,
  });

  return rows.map(mapListingSummaryDto);
};

export const getPublicListingsPaginated = async (options: {
  category?: ListingCategory;
  condition?: ListingCondition;
  page: number;
  pageSize: ListingPageSize;
  price?: ListingPriceFilter;
  q?: string;
  sort?: ListingSortOption;
  status?: PublicListingStatus;
}) => {
  const priceCeilingCents = getListingPriceCeilingCents(options.price);
  const totalCount = await getPublicListingsCountData({
    category: options.category,
    condition: options.condition,
    priceCeilingCents,
    searchQuery: options.q,
    status: options.status,
  });
  const pagination = buildListingPaginationMeta({
    page: options.page,
    pageSize: options.pageSize,
    totalCount,
  });
  const rows = await getPublicListingsData({
    category: options.category,
    condition: options.condition,
    pagination: {
      limit: pagination.pageSize,
      offset: pagination.offset,
    },
    priceCeilingCents,
    searchQuery: options.q,
    sort: options.sort,
    status: options.status,
  });

  return {
    listings: rows.map(mapListingSummaryDto),
    pagination,
  };
};

export const getListingsBySellerId = async (
  sellerId: string,
  status?: ListingStatus,
): Promise<ListingSummaryDto[]> => {
  const rows = await getListingsBySellerIdData(sellerId, { status });

  return rows.map(mapListingSummaryDto);
};

export const getListingsBySellerIdPaginated = async (options: {
  page: number;
  pageSize: ListingPageSize;
  sellerId: string;
  status?: ListingStatus;
}) => {
  const totalCount = await getListingsBySellerIdCountData(
    options.sellerId,
    options.status,
  );
  const pagination = buildListingPaginationMeta({
    page: options.page,
    pageSize: options.pageSize,
    totalCount,
  });
  const rows = await getListingsBySellerIdData(options.sellerId, {
    pagination: {
      limit: pagination.pageSize,
      offset: pagination.offset,
    },
    status: options.status,
  });

  return {
    listings: rows.map(mapListingSummaryDto),
    pagination,
  };
};

export const getListingById = async (
  listingId: string,
): Promise<ListingDetailsDto | null> => {
  const row = await getListingByIdData(listingId);

  if (!row) {
    return null;
  }

  return mapListingDetailsDto(row);
};
