"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { EmptyStateCard } from "@/components/shared/empty-state-card";
import { ListingCard } from "@/components/shared/listing-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ListingStatus } from "@/lib/db/schema";

type MyListingRecord = {
  id: string;
  bidCount: number;
  currentBid: number | null;
  endAt: string | null;
  imageUrl: string | null;
  sellerName: string;
  startAt: string | null;
  title: string;
};

const tabConfig = [
  { label: "Drafts", value: "Draft" },
  { label: "Active", value: "Active" },
  { label: "Scheduled", value: "Scheduled" },
  { label: "Ended", value: "Ended" },
] as const satisfies ReadonlyArray<{
  label: string;
  value: ListingStatus;
}>;

type MyListingsTabsProps = {
  initialStatus?: ListingStatus;
  listings: MyListingRecord[];
};

export function MyListingsTabs({
  initialStatus = "Draft",
  listings,
}: MyListingsTabsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [selectedStatus, setSelectedStatus] =
    useState<ListingStatus>(initialStatus);

  useEffect(() => {
    setSelectedStatus(initialStatus);
  }, [initialStatus]);

  const handleStatusChange = (status: string) => {
    const nextStatus = status as ListingStatus;
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.set("status", nextStatus);

    setSelectedStatus(nextStatus);
    startTransition(() => {
      router.replace(`${pathname}?${nextSearchParams.toString()}`, {
        scroll: false,
      });
    });
  };

  const activeTabLabel =
    tabConfig.find((tab) => tab.value === selectedStatus)?.label ?? "Listings";

  return (
    <Tabs value={selectedStatus} onValueChange={handleStatusChange}>
      <TabsList className="h-auto flex-wrap gap-2 rounded-lg bg-muted/70 p-2">
        {tabConfig.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="min-w-24 rounded-md px-4 py-2 data-[state=active]:bg-background"
            disabled={isPending}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {listings.length === 0 ? (
        <EmptyStateCard
          eyebrow={`No ${activeTabLabel.toLowerCase()}`}
          title={`Nothing is in ${activeTabLabel.toLowerCase()} right now.`}
          description="Listings you create will appear here under their current auction status, so you can separate private drafts from live and completed inventory."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing, index) => (
            <ListingCard
              key={listing.id}
              bidCount={listing.bidCount}
              currentBid={listing.currentBid}
              endAt={listing.endAt ? new Date(listing.endAt) : null}
              href={`/listings/${listing.id}`}
              imageUrl={listing.imageUrl}
              priority={index < 3}
              sellerName={listing.sellerName}
              startAt={listing.startAt ? new Date(listing.startAt) : null}
              status={selectedStatus}
              title={listing.title}
            />
          ))}
        </div>
      )}
    </Tabs>
  );
}
