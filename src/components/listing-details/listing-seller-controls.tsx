"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { ListingActionAlertDialog } from "@/components/listing-details/listing-action-alert-dialog";
import { RefineListingDialog } from "@/components/listing-details/refine-listing-dialog";
import { Button } from "@/components/ui/button";
import { formatDateTimeInput, formatMoneyInput } from "@/lib/utils";
import type {
  UpdateListingDraftInput,
  UpdateListingDraftValues,
} from "@/lib/validators/listings";
import { updateListingDraftSchema } from "@/lib/validators/listings";
import {
  deleteListingAction,
  publishListingAction,
  returnListingToDraftAction,
  updateListingDraftAction,
} from "@/server/actions/listings";
import type { ListingDetailsDto } from "@/types/listings";

type ListingSellerControlsProps = {
  listing: ListingDetailsDto;
};

export function ListingSellerControls({ listing }: ListingSellerControlsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const startAt = listing.startAt ? new Date(listing.startAt) : null;
  const endAt = listing.endAt ? new Date(listing.endAt) : null;

  const defaultValues: UpdateListingDraftInput = {
    category: listing.category,
    condition: listing.condition,
    description: listing.description,
    endAt: formatDateTimeInput(endAt),
    location: listing.location ?? "",
    reservePrice: formatMoneyInput(listing.reservePrice),
    startAt: formatDateTimeInput(startAt),
    startingBid: formatMoneyInput(listing.startingBid),
    title: listing.title,
  };

  const form = useForm<
    UpdateListingDraftInput,
    undefined,
    UpdateListingDraftValues
  >({
    defaultValues,
    resolver: zodResolver(updateListingDraftSchema),
  });

  const resetFeedback = () => {
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const openEditDialog = () => {
    resetFeedback();
    form.reset(defaultValues);
    setDialogOpen(true);
  };

  const saveDraft = form.handleSubmit(async (values) => {
    resetFeedback();

    try {
      await updateListingDraftAction(listing.id, values);
      setDialogOpen(false);
      setSubmitSuccess("Draft saved.");
      router.refresh();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to save draft.",
      );
    }
  });

  const publishListing = () => {
    resetFeedback();
    startTransition(async () => {
      try {
        await publishListingAction(listing.id);
        setDialogOpen(false);
        router.refresh();
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : "Unable to publish listing.",
        );
      }
    });
  };

  const returnToDraft = () => {
    resetFeedback();
    startTransition(async () => {
      try {
        await returnListingToDraftAction(listing.id);
        router.refresh();
      } catch (error) {
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Unable to return listing to draft.",
        );
      }
    });
  };

  const deleteListing = () => {
    resetFeedback();
    startTransition(async () => {
      try {
        await deleteListingAction(listing.id);
        router.push("/my-listings");
        router.refresh();
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : "Unable to delete listing.",
        );
      }
    });
  };

  const isDraft = listing.status === "Draft";
  const isActive = listing.status === "Active";
  const isScheduled = listing.status === "Scheduled";
  const canRefine = isDraft;
  const canPublish = isDraft;
  const canDelete = isDraft;
  const canReturnToDraft = isActive || isScheduled;
  const editingLocked = listing.bidCount > 0 || listing.status === "Ended";
  const publishLabel =
    startAt && startAt.getTime() > Date.now()
      ? "Publish as scheduled"
      : "Publish now";

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3">
          {canRefine ? (
            <Button
              type="button"
              variant="outline"
              className="h-11 border-border/80 bg-background/70 font-medium tracking-[0.02em] hover:border-primary/45 hover:bg-primary/5"
              disabled={isPending || editingLocked}
              onClick={openEditDialog}
            >
              Refine listing
            </Button>
          ) : null}

          {canPublish ? (
            <Button
              type="button"
              className="h-11 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 font-semibold tracking-[0.02em] text-zinc-950 shadow-[0_10px_25px_-15px_rgba(245,158,11,0.9)] transition hover:brightness-95"
              disabled={isPending || editingLocked}
              onClick={publishListing}
            >
              {publishLabel}
            </Button>
          ) : null}

          {canReturnToDraft ? (
            <ListingActionAlertDialog
              actionLabel="Move to draft"
              cancelLabel="Keep listed"
              description="This removes the listing from public bidding until you publish it again. Listings lock permanently after the first bid."
              disabled={isPending}
              onAction={returnToDraft}
              title="Return listing to draft?"
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 border-border/80 bg-background/70 font-medium tracking-[0.02em] hover:border-primary/45 hover:bg-primary/5"
                  disabled={isPending}
                >
                  Return to draft
                </Button>
              }
            />
          ) : null}

          {canDelete ? (
            <ListingActionAlertDialog
              actionClassName="bg-destructive text-white hover:bg-destructive/90"
              actionLabel="Delete permanently"
              cancelLabel="Cancel"
              description="This permanently removes the listing and its Cloudinary images. This action cannot be undone."
              disabled={isPending}
              onAction={deleteListing}
              title="Delete this listing?"
              trigger={
                <Button
                  type="button"
                  variant="destructive"
                  className="h-11 bg-gradient-to-r from-rose-700 via-rose-600 to-red-500 font-semibold tracking-[0.02em] text-white shadow-[0_10px_25px_-15px_rgba(225,29,72,0.85)] transition hover:brightness-95"
                  disabled={isPending}
                >
                  Delete listing
                </Button>
              }
            />
          ) : null}

          {!canRefine && !canPublish && !canReturnToDraft && !canDelete ? (
            <div className="rounded-2xl border border-border/70 bg-background/50 p-4 text-sm text-muted-foreground">
              Seller actions are not available for this listing status.
            </div>
          ) : null}
        </div>

        {submitError ? (
          <p className="text-sm text-destructive">{submitError}</p>
        ) : null}
      </div>

      <RefineListingDialog
        form={form}
        onOpenChange={setDialogOpen}
        onSubmit={saveDraft}
        open={dialogOpen}
        submitError={submitError}
        submitSuccess={submitSuccess}
      />
    </>
  );
}
