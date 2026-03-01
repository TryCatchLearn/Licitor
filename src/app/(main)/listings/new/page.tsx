import { CreateListingWorkspace } from "@/components/listings/create-listing-workspace";

export default function CreateListingPage() {
  return (
    <section className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden px-6 py-4 md:py-5">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.22em] text-primary">
          Seller studio
        </p>
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
          Create a new listing
        </h1>
      </div>

      <div className="flex min-h-0 flex-1 py-3 md:py-4">
        <CreateListingWorkspace />
      </div>
    </section>
  );
}
