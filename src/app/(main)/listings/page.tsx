import { PublicListingsTabs } from "@/components/listings/public-listings-tabs";
import { PageHeader } from "@/components/shared/page-header";
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

type ListingsPageProps = {
  searchParams?: Promise<{
    category?: string | string[];
    condition?: string | string[];
    page?: string | string[];
    pageSize?: string | string[];
    price?: string | string[];
    q?: string | string[];
    sort?: string | string[];
    status?: string | string[];
  }>;
};

export default async function ListingsPage({
  searchParams,
}: ListingsPageProps) {
  const resolvedSearchParams = await searchParams;
  const browseState = {
    category: parseListingCategoryFilter(resolvedSearchParams?.category),
    condition: parseListingConditionFilter(resolvedSearchParams?.condition),
    page: parseListingPage(resolvedSearchParams?.page),
    pageSize: parseListingPageSize(resolvedSearchParams?.pageSize),
    price: parseListingPriceFilter(resolvedSearchParams?.price),
    q: parseListingSearchTerm(resolvedSearchParams?.q),
    sort: parseListingSortOption(resolvedSearchParams?.sort),
    status: parsePublicBrowseStatus(resolvedSearchParams?.status),
  };

  const { listings, pagination } =
    await getPublicListingsPaginated(browseState);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
      <PageHeader
        eyebrow="Public marketplace"
        title="Browse live and upcoming auctions"
        description="Explore the seeded marketplace inventory, from active bidding wars to scheduled launches waiting for their opening bid."
      />

      <PublicListingsTabs
        initialState={browseState}
        listings={listings}
        pagination={pagination}
      />
    </section>
  );
}
