import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const featuredLots = [
  {
    title: "1967 Mustang Fastback",
    bid: "$84,500",
    endsIn: "2h 14m",
  },
  {
    title: "Rare Sapphire Bracelet",
    bid: "$12,300",
    endsIn: "5h 02m",
  },
  {
    title: "Mid-Century Walnut Desk",
    bid: "$3,900",
    endsIn: "8h 47m",
  },
];

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,color-mix(in_oklab,var(--primary)_25%,transparent)_0%,transparent_45%)]" />
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16 md:py-24">
        <div className="space-y-6">
          <Badge
            variant="outline"
            className="border-primary/40 bg-primary/10 px-4 py-1 uppercase tracking-[0.18em] text-primary"
          >
            Premium live auctions
          </Badge>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-foreground md:text-6xl">
            Win rare finds at the right moment.
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
            Licitor connects collectors with verified sellers through curated,
            fast-moving auctions.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href="/listings">Browse Listings</Link>
            </Button>
            <Button variant="outline" size="lg" type="button">
              Become a Seller
            </Button>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          {featuredLots.map((lot) => (
            <Card key={lot.title} className="gap-0 py-5">
              <CardHeader className="gap-2 px-5">
                <p className="text-sm text-muted-foreground">Featured lot</p>
                <CardTitle className="text-lg">{lot.title}</CardTitle>
              </CardHeader>
              <CardContent className="mt-6 flex items-end justify-between px-5">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Current bid
                  </p>
                  <p className="text-2xl font-semibold text-primary">
                    {lot.bid}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Ends in
                  </p>
                  <p className="text-base font-medium text-foreground">
                    {lot.endsIn}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </section>
    </div>
  );
}
