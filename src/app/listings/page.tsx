import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const exampleListings = [
  {
    id: "LST-001",
    title: "Mid-Century Lounge Chair",
    content:
      "Walnut frame with original leather upholstery in very good condition.",
    createdAt: "2026-02-15T10:30:00.000Z",
    image: "https://picsum.photos/id/1062/900/600",
  },
  {
    id: "LST-002",
    title: "Vintage Camera Set",
    content:
      "35mm analog camera with two prime lenses, case, and original manuals.",
    createdAt: "2026-02-18T14:45:00.000Z",
    image: "https://picsum.photos/id/250/900/600",
  },
  {
    id: "LST-003",
    title: "Abstract Canvas Painting",
    content:
      "Signed mixed-media artwork featuring bold geometric forms and color.",
    createdAt: "2026-02-22T09:15:00.000Z",
    image: "https://picsum.photos/id/1025/900/600",
  },
] as const;

export default function ListingsPage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
          Listings
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Placeholder content for upcoming auction inventory, filtering, and
          category views.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {exampleListings.map((listing, index) => (
          <Card key={listing.id} className="gap-0 overflow-hidden py-0">
            <div className="relative aspect-[3/2]">
              <Image
                src={listing.image}
                alt={listing.title}
                fill
                priority={index === 0}
                loading={index === 0 ? "eager" : "lazy"}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
            <CardContent className="space-y-3 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {listing.id}
              </p>
              <h2 className="text-xl font-semibold text-foreground">
                {listing.title}
              </h2>
              <p className="text-sm text-muted-foreground">{listing.content}</p>
              <p className="text-xs text-muted-foreground">
                Created{" "}
                {new Date(listing.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <Button asChild size="lg">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </section>
  );
}
