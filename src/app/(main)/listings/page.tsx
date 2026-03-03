import Link from "next/link";

import { EmptyStateCard } from "@/components/shared/empty-state-card";
import { ListingCard } from "@/components/shared/listing-card";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { getPublicListings } from "@/server/queries/listings";

export default async function ListingsPage() {
  const listingRows = await getPublicListings();

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
      <PageHeader
        eyebrow="Public marketplace"
        title="Browse live and upcoming auctions"
        description="Explore the seeded marketplace inventory, from active bidding wars to scheduled launches waiting for their opening bid."
      />

      {listingRows.length === 0 ? (
        <EmptyStateCard
          eyebrow="No public listings"
          title="The marketplace is empty right now."
          description="Draft listings stay private, so this state appears when nothing is active, scheduled, or already ended in the public dataset."
          contentClassName="flex flex-col gap-4"
          actions={
            <div>
              <Button asChild variant="outline">
                <Link href="/">Return home</Link>
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {listingRows.map((listing, index) => (
            <ListingCard
              key={listing.id}
              bidCount={listing.bidCount}
              currentBid={listing.currentBid}
              endAt={listing.endAt}
              href={`/listings/${listing.id}`}
              imageUrl={listing.images[0]?.url ?? null}
              priority={index < 3}
              sellerName={listing.seller.name}
              startAt={listing.startAt}
              status={listing.status}
              title={listing.title}
            />
          ))}
        </div>
      )}
    </section>
  );
}
