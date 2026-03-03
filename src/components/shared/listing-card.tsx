import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatBidCount,
  formatListingCurrency,
  getListingStatusTone,
  getListingTimeLabel,
} from "@/lib/listings";
import { cn } from "@/lib/utils";
import type { ListingSummaryDto } from "@/types/listings";

type ListingCardProps = {
  href: string;
  listing: ListingSummaryDto;
  priority?: boolean;
};

const fallbackImage = "https://picsum.photos/id/6/1/0";

export function ListingCard({
  href,
  listing,
  priority = false,
}: ListingCardProps) {
  const startAt = listing.startAt ? new Date(listing.startAt) : null;
  const endAt = listing.endAt ? new Date(listing.endAt) : null;

  return (
    <Link
      href={href}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className="gap-0 overflow-hidden border-border/70 bg-card/90 py-0 shadow-sm transition-transform duration-200 hover:-translate-y-1">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={listing.imageUrl ?? fallbackImage}
            alt={listing.title}
            fill
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 bg-gradient-to-b from-black/55 via-black/10 to-transparent p-4">
            <Badge
              variant="outline"
              className={cn(
                "border px-3 py-1 text-[0.7rem] uppercase tracking-[0.18em]",
                getListingStatusTone(listing.status),
              )}
            >
              {listing.status}
            </Badge>
            <div className="rounded-full bg-black/45 px-3 py-1 text-[0.7rem] font-medium tracking-[0.12em] text-white backdrop-blur-sm">
              {getListingTimeLabel({
                endAt,
                startAt,
                status: listing.status,
              })}
            </div>
          </div>
        </div>

        <CardContent className="space-y-4 p-5">
          <div className="space-y-2">
            <h2 className="truncate text-xl font-semibold text-foreground">
              {listing.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              Seller {listing.sellerName}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border/70 bg-background/50 p-4">
            <div className="space-y-1">
              <p className="text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">
                Current price
              </p>
              <p className="text-xl font-semibold text-primary">
                {formatListingCurrency(listing.currentBid ?? 0)}
              </p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">
                Activity
              </p>
              <p className="text-base font-medium text-foreground">
                {formatBidCount(listing.bidCount)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
