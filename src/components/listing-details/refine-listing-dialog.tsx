"use client";

import { type UseFormReturn, useFormState } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { listingCategories, listingConditions } from "@/lib/db/schema";
import type {
  UpdateListingDraftInput,
  UpdateListingDraftValues,
} from "@/lib/validators/listings";

type RefineListingDialogProps = {
  form: UseFormReturn<
    UpdateListingDraftInput,
    undefined,
    UpdateListingDraftValues
  >;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  open: boolean;
};

const fieldClassName =
  "border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

export function RefineListingDialog({
  form,
  onOpenChange,
  onSubmit,
  open,
}: RefineListingDialogProps) {
  const { errors, isSubmitting } = useFormState({
    control: form.control,
  });
  const rootErrorMessage =
    errors.root?.server?.message ?? errors.root?.message ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Refine listing</DialogTitle>
          <DialogDescription>
            Save draft changes here. Publishing remains a separate seller
            action.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" noValidate onSubmit={onSubmit}>
          {rootErrorMessage ? (
            <p className="text-sm text-destructive">{rootErrorMessage}</p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              aria-invalid={Boolean(errors.title)}
              {...form.register("title")}
            />
            {errors.title ? (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              aria-invalid={Boolean(errors.description)}
              rows={6}
              {...form.register("description")}
            />
            {errors.description ? (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              aria-invalid={Boolean(errors.location)}
              {...form.register("location")}
            />
            {errors.location ? (
              <p className="text-sm text-destructive">
                {errors.location.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                aria-invalid={Boolean(errors.category)}
                className={fieldClassName}
                {...form.register("category")}
              >
                {listingCategories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              {errors.category ? (
                <p className="text-sm text-destructive">
                  {errors.category.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <select
                id="condition"
                aria-invalid={Boolean(errors.condition)}
                className={fieldClassName}
                {...form.register("condition")}
              >
                {listingConditions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              {errors.condition ? (
                <p className="text-sm text-destructive">
                  {errors.condition.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startingBid">Starting Bid</Label>
              <Input
                id="startingBid"
                aria-invalid={Boolean(errors.startingBid)}
                inputMode="decimal"
                placeholder="Optional (defaults to 0.00)"
                {...form.register("startingBid")}
              />
              {errors.startingBid ? (
                <p className="text-sm text-destructive">
                  {errors.startingBid.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reservePrice">Reserve Price</Label>
              <Input
                id="reservePrice"
                aria-invalid={Boolean(errors.reservePrice)}
                inputMode="decimal"
                placeholder="Optional"
                {...form.register("reservePrice")}
              />
              {errors.reservePrice ? (
                <p className="text-sm text-destructive">
                  {errors.reservePrice.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startAt">Start At</Label>
              <Input
                id="startAt"
                type="datetime-local"
                aria-invalid={Boolean(errors.startAt)}
                {...form.register("startAt")}
              />
              {errors.startAt ? (
                <p className="text-sm text-destructive">
                  {errors.startAt.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endAt">Ends At</Label>
              <Input
                id="endAt"
                type="datetime-local"
                aria-invalid={Boolean(errors.endAt)}
                {...form.register("endAt")}
              />
              {errors.endAt ? (
                <p className="text-sm text-destructive">
                  {errors.endAt.message}
                </p>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save draft"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
