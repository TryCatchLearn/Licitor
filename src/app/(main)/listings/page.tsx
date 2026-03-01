import Link from "next/link";

import { ListingCard } from "@/components/listings/listing-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicListings } from "@/server/queries/listings";

export default async function ListingsPage() {
  const listingRows = await getPublicListings();

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.22em] text-primary">
          Public marketplace
        </p>
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
          Browse live and upcoming auctions
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Explore the seeded marketplace inventory, from active bidding wars to
          scheduled launches waiting for their opening bid.
        </p>
      </div>

      {listingRows.length === 0 ? (
        <Card className="border-dashed border-border/70 bg-card/70 py-0">
          <CardHeader className="gap-3 px-6 py-6">
            <p className="text-sm uppercase tracking-[0.2em] text-primary">
              No public listings
            </p>
            <CardTitle className="text-2xl">
              The marketplace is empty right now.
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-6 pb-6">
            <p className="max-w-2xl text-sm text-muted-foreground">
              Draft listings stay private, so this state appears when nothing is
              active, scheduled, or already ended in the public dataset.
            </p>
            <div>
              <Button asChild variant="outline">
                <Link href="/">Return home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {listingRows.map((listing, index) => (
            <ListingCard
              key={listing.id}
              bidCount={listing.bidCount}
              currentBid={listing.currentBid}
              endAt={listing.endAt}
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
