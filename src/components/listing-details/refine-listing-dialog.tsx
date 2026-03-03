"use client";

import type { FormEventHandler } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useFormState } from "react-hook-form";

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
  onSubmit: FormEventHandler<HTMLFormElement>;
  open: boolean;
  submitError: string | null;
  submitSuccess: string | null;
};

const fieldClassName =
  "border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

export function RefineListingDialog({
  form,
  onOpenChange,
  onSubmit,
  open,
  submitError,
  submitSuccess,
}: RefineListingDialogProps) {
  const { errors, isSubmitting } = useFormState({
    control: form.control,
  });

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

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...form.register("title")} />
            {errors.title ? (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
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
            <Input id="location" {...form.register("location")} />
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
                {...form.register("endAt")}
              />
              {errors.endAt ? (
                <p className="text-sm text-destructive">
                  {errors.endAt.message}
                </p>
              ) : null}
            </div>
          </div>

          {submitSuccess ? (
            <p className="text-sm text-emerald-600">{submitSuccess}</p>
          ) : null}
          {submitError ? (
            <p className="text-sm text-destructive">{submitError}</p>
          ) : null}

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
