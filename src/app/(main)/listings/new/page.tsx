import { CreateListingWorkspace } from "@/components/create-listing/create-listing-workspace";
import { PageHeader } from "@/components/shared/page-header";

export default function CreateListingPage() {
  return (
    <section className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden px-6 py-4 md:py-5">
      <PageHeader
        eyebrow="Seller studio"
        title="Create a new listing"
        className="space-y-2"
      />

      <div className="flex min-h-0 flex-1 py-3 md:py-4">
        <CreateListingWorkspace />
      </div>
    </section>
  );
}
