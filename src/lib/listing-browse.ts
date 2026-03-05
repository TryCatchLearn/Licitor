import {
  type ListingCategory,
  type ListingCondition,
  type ListingStatus,
  listingCategories,
  listingConditions,
} from "@/lib/db/schema";

export type PublicBrowseStatus = Exclude<ListingStatus, "Draft">;

export const publicBrowseStatuses = [
  "Active",
  "Scheduled",
  "Ended",
] as const satisfies ReadonlyArray<PublicBrowseStatus>;

export type ListingPriceFilter = "10" | "50" | "100" | "500";

export const listingPriceFilterOptions = [
  { label: "Under $10", value: "10" },
  { label: "Under $50", value: "50" },
  { label: "Under $100", value: "100" },
  { label: "Under $500", value: "500" },
] as const satisfies ReadonlyArray<{
  label: string;
  value: ListingPriceFilter;
}>;

export type ListingSortOption =
  | "newest"
  | "ending-soonest"
  | "most-bids"
  | "price-low-high"
  | "price-high-low";

export const listingSortOptions = [
  { label: "Newest", value: "newest" },
  { label: "Ending Soonest", value: "ending-soonest" },
  { label: "Most Bids", value: "most-bids" },
  { label: "Price Low->High", value: "price-low-high" },
  { label: "Price High->Low", value: "price-high-low" },
] as const satisfies ReadonlyArray<{
  label: string;
  value: ListingSortOption;
}>;

export type ListingBrowseState = {
  category?: ListingCategory;
  condition?: ListingCondition;
  page: number;
  pageSize: ListingPageSize;
  price?: ListingPriceFilter;
  q?: string;
  sort?: ListingSortOption;
  status: PublicBrowseStatus;
};

export const listingPageSizeOptions = [
  6, 12, 24, 48,
] as const satisfies ReadonlyArray<number>;

export type ListingPageSize = (typeof listingPageSizeOptions)[number];

export const defaultListingPageSize: ListingPageSize = 12;

const listingCategorySet = new Set<ListingCategory>(listingCategories);
const listingConditionSet = new Set<ListingCondition>(listingConditions);
const publicBrowseStatusSet = new Set<PublicBrowseStatus>(publicBrowseStatuses);
const listingPriceFilterSet = new Set<ListingPriceFilter>(
  listingPriceFilterOptions.map((option) => option.value),
);
const listingSortSet = new Set<ListingSortOption>(
  listingSortOptions.map((option) => option.value),
);
const listingPageSizeSet = new Set<ListingPageSize>(listingPageSizeOptions);

const normalizeSearchParam = (value?: string | string[]) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

export const parsePublicBrowseStatus = (
  value?: string | string[],
): PublicBrowseStatus => {
  const normalized = normalizeSearchParam(value);

  if (
    normalized &&
    publicBrowseStatusSet.has(normalized as PublicBrowseStatus)
  ) {
    return normalized as PublicBrowseStatus;
  }

  return "Active";
};

export const parseListingCategoryFilter = (
  value?: string | string[],
): ListingCategory | undefined => {
  const normalized = normalizeSearchParam(value);

  if (!normalized) {
    return undefined;
  }

  return listingCategorySet.has(normalized as ListingCategory)
    ? (normalized as ListingCategory)
    : undefined;
};

export const parseListingConditionFilter = (
  value?: string | string[],
): ListingCondition | undefined => {
  const normalized = normalizeSearchParam(value);

  if (!normalized) {
    return undefined;
  }

  return listingConditionSet.has(normalized as ListingCondition)
    ? (normalized as ListingCondition)
    : undefined;
};

export const parseListingPriceFilter = (
  value?: string | string[],
): ListingPriceFilter | undefined => {
  const normalized = normalizeSearchParam(value);

  if (!normalized) {
    return undefined;
  }

  return listingPriceFilterSet.has(normalized as ListingPriceFilter)
    ? (normalized as ListingPriceFilter)
    : undefined;
};

export const parseListingSortOption = (
  value?: string | string[],
): ListingSortOption | undefined => {
  const normalized = normalizeSearchParam(value);

  if (!normalized) {
    return undefined;
  }

  return listingSortSet.has(normalized as ListingSortOption)
    ? (normalized as ListingSortOption)
    : undefined;
};

export const parseListingSearchTerm = (value?: string | string[]) => {
  const normalized = normalizeSearchParam(value)?.trim();

  if (!normalized) {
    return undefined;
  }

  return normalized.slice(0, 200);
};

export const parseListingPage = (value?: string | string[]) => {
  const normalized = normalizeSearchParam(value);

  if (!normalized) {
    return 1;
  }

  const parsedPage = Number.parseInt(normalized, 10);

  if (Number.isNaN(parsedPage) || parsedPage < 1) {
    return 1;
  }

  return parsedPage;
};

export const parseListingPageSize = (value?: string | string[]) => {
  const normalized = normalizeSearchParam(value);

  if (!normalized) {
    return defaultListingPageSize;
  }

  const parsedPageSize = Number.parseInt(normalized, 10);
  const maxListingPageSize =
    listingPageSizeOptions[listingPageSizeOptions.length - 1];

  if (
    !Number.isNaN(parsedPageSize) &&
    maxListingPageSize !== undefined &&
    parsedPageSize > maxListingPageSize
  ) {
    return maxListingPageSize;
  }

  if (!listingPageSizeSet.has(parsedPageSize as ListingPageSize)) {
    return defaultListingPageSize;
  }

  return parsedPageSize as ListingPageSize;
};

export type ListingPaginationMeta = {
  from: number;
  offset: number;
  page: number;
  pageSize: ListingPageSize;
  to: number;
  totalCount: number;
  totalPages: number;
};

export const buildListingPaginationMeta = (input: {
  page: number;
  pageSize: ListingPageSize;
  totalCount: number;
}): ListingPaginationMeta => {
  const totalPages = Math.ceil(input.totalCount / input.pageSize);
  const safePage =
    totalPages > 0 ? Math.min(Math.max(input.page, 1), totalPages) : 1;
  const offset = (safePage - 1) * input.pageSize;
  const from = input.totalCount > 0 ? offset + 1 : 0;
  const to =
    input.totalCount > 0
      ? Math.min(offset + input.pageSize, input.totalCount)
      : 0;

  return {
    from,
    offset,
    page: safePage,
    pageSize: input.pageSize,
    to,
    totalCount: input.totalCount,
    totalPages,
  };
};

type SearchParamsLike = {
  toString(): string;
};

export const buildListingsSearchHref = (input: {
  currentSearchParams?: SearchParamsLike;
  pathname: string;
  query?: string;
}) => {
  const normalizedQuery = parseListingSearchTerm(input.query);
  const nextSearchParams =
    input.pathname === "/listings"
      ? new URLSearchParams(input.currentSearchParams?.toString())
      : new URLSearchParams();

  if (normalizedQuery) {
    nextSearchParams.set("q", normalizedQuery);
  } else {
    nextSearchParams.delete("q");
  }
  nextSearchParams.set("page", "1");
  if (!nextSearchParams.get("pageSize")) {
    nextSearchParams.set("pageSize", String(defaultListingPageSize));
  }

  const nextQueryString = nextSearchParams.toString();

  return nextQueryString ? `/listings?${nextQueryString}` : "/listings";
};

export const getListingPriceCeilingCents = (
  priceFilter?: ListingPriceFilter,
): number | undefined => {
  if (!priceFilter) {
    return undefined;
  }

  return Number(priceFilter) * 100;
};

export const getListingSortLabel = (sort?: ListingSortOption) => {
  if (!sort) {
    return undefined;
  }

  return listingSortOptions.find((option) => option.value === sort)?.label;
};

export const getListingPriceLabel = (price?: ListingPriceFilter) => {
  if (!price) {
    return undefined;
  }

  return listingPriceFilterOptions.find((option) => option.value === price)
    ?.label;
};
