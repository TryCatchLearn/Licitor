"use client";

import {
  ImagePlus,
  LoaderCircle,
  Star,
  StarOff,
  Trash2,
  Upload,
} from "lucide-react";
import Image from "next/image";

import { ListingSellerControls } from "@/components/listings/listing-seller-controls";
import { useListingDetailsView } from "@/components/listings/use-listing-details-view";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  formatBidCount,
  formatListingCategory,
  formatListingCondition,
  formatListingCurrency,
  getListingStatusTone,
  getListingTimeLabel,
} from "@/lib/listings";
import { cn } from "@/lib/utils";

type ListingDetailsViewProps = {
  bidCount: number;
  category: Parameters<typeof formatListingCategory>[0];
  condition: Parameters<typeof formatListingCondition>[0];
  currentBid: number | null;
  description: string;
  endAt: Date | null;
  id: string;
  images: Array<{
    id: string;
    isMain: boolean;
    url: string;
  }>;
  isOwner: boolean;
  location: string | null;
  reservePrice: number | null;
  sellerName: string;
  startAt: Date | null;
  startingBid: number | null;
  status: Parameters<typeof getListingStatusTone>[0];
  title: string;
};

const fallbackImage = "https://picsum.photos/id/1/1200/900";

export function ListingDetailsView({
  bidCount,
  category,
  condition,
  currentBid,
  description,
  endAt,
  id,
  images,
  isOwner,
  location,
  reservePrice,
  sellerName,
  startAt,
  startingBid,
  status,
  title,
}: ListingDetailsViewProps) {
  const {
    actionError,
    canManageGalleryImages,
    canSetMainImage,
    deleteImage,
    deletingImageId,
    fileInputRef,
    isDragging,
    isMutatingImage,
    isUploading,
    maxImagesReached,
    onDragLeave,
    onDragOver,
    onDropFile,
    onFileInputChange,
    openFilePicker,
    selectedImage,
    selectedImageIndex,
    setMainImage,
    setSelectedImage,
    settingMainImageId,
    uploadError,
    uploadProgress,
    visibleImages,
  } = useListingDetailsView({
    images,
    isOwner,
    listingId: id,
    status,
  });
  const mainImageIndex = visibleImages.findIndex((image) => image.isMain);
  const canSelectMainFromPreview =
    mainImageIndex >= 0 && mainImageIndex !== selectedImageIndex;

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-12">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.22em] text-primary">
          Listing details
        </p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {title}
          </h1>
          <Badge
            variant="outline"
            className={cn(
              "w-fit border px-3 py-1 text-[0.7rem] uppercase tracking-[0.18em] lg:mt-2",
              getListingStatusTone(status),
            )}
          >
            {status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-background/50 px-4 py-3">
          <p className="text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">
            Current price
          </p>
          <p className="mt-2 text-xl font-semibold text-primary">
            {formatListingCurrency(currentBid ?? 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background/50 px-4 py-3">
          <p className="text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">
            Activity
          </p>
          <p className="mt-2 text-base font-semibold text-foreground">
            {formatBidCount(bidCount)}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background/50 px-4 py-3">
          <p className="text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">
            Auction timing
          </p>
          <p className="mt-2 text-base font-semibold text-foreground">
            {getListingTimeLabel({ endAt, startAt, status })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="overflow-hidden border-border/70 bg-card/95 py-0 gap-0 lg:col-span-3">
          <div className="relative aspect-[4/3] bg-background/60">
            <button
              type="button"
              className="absolute inset-0 cursor-pointer"
              disabled={!canSelectMainFromPreview}
              onClick={() => {
                if (mainImageIndex >= 0) {
                  setSelectedImage(mainImageIndex);
                }
              }}
            >
              <Image
                key={selectedImage?.id ?? "fallback"}
                alt={title}
                className="object-cover"
                data-testid="listing-main-image"
                fill
                priority
                src={selectedImage?.url ?? fallbackImage}
              />
              <span className="sr-only">Preview main listing image</span>
            </button>
          </div>

          {visibleImages.length > 0 ? (
            <div className="grid grid-cols-5 border-y-2 border-border/70">
              {visibleImages.map((image, index) => {
                const isSelected = index === selectedImageIndex;
                const isMain = image.isMain;

                return (
                  <div
                    key={image.id}
                    className={cn(
                      "group relative aspect-square overflow-hidden border-r-2 border-border/70 bg-background/60",
                      index === visibleImages.length - 1 && "border-r-0",
                      isSelected &&
                        "shadow-[inset_0_0_0_1px_var(--color-primary)]",
                    )}
                  >
                    <button
                      type="button"
                      className="absolute inset-0 cursor-pointer"
                      data-testid={`listing-thumbnail-${index + 1}`}
                      onClick={() => setSelectedImage(index)}
                    >
                      <Image
                        alt={`${title} thumbnail ${index + 1}`}
                        className="object-cover transition duration-300 group-hover:scale-[1.03]"
                        fill
                        sizes="20vw"
                        src={image.url}
                      />
                      <span className="sr-only">
                        View image {index + 1} for {title}
                      </span>
                    </button>

                    {isOwner ? (
                      <div className="absolute inset-x-2 top-2 flex items-center justify-between gap-2">
                        <Button
                          type="button"
                          size="icon-xs"
                          variant="secondary"
                          className={cn(
                            "bg-black/65 text-white hover:bg-black/80",
                            isMain &&
                              "bg-amber-400/90 text-black hover:bg-amber-300/90",
                          )}
                          aria-pressed={isMain}
                          disabled={
                            !canSetMainImage || isMutatingImage || isMain
                          }
                          onClick={() => {
                            if (!isMain) {
                              setSelectedImage(index);
                              void setMainImage(image.id);
                            }
                          }}
                        >
                          {settingMainImageId === image.id ? (
                            <LoaderCircle className="animate-spin" />
                          ) : (
                            <Star className={cn(isMain && "fill-current")} />
                          )}
                          <span className="sr-only">
                            {isMain
                              ? "Main image selected"
                              : "Set as main image"}
                          </span>
                        </Button>

                        {!isMain && canManageGalleryImages ? (
                          <Button
                            type="button"
                            size="icon-xs"
                            variant="destructive"
                            disabled={isMutatingImage}
                            onClick={() => {
                              void deleteImage(image.id);
                            }}
                          >
                            {deletingImageId === image.id ? (
                              <LoaderCircle className="animate-spin" />
                            ) : (
                              <Trash2 />
                            )}
                            <span className="sr-only">Delete image</span>
                          </Button>
                        ) : (
                          <span />
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}

          <CardContent className="space-y-6 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                <p className="text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">
                  Seller
                </p>
                <p className="mt-2 text-base font-medium text-foreground">
                  {sellerName}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                <p className="text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">
                  Location
                </p>
                <p className="mt-2 text-base font-medium text-foreground">
                  {location ?? "Location pending"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                <p className="text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">
                  Category
                </p>
                <p className="mt-2 text-base font-medium text-foreground">
                  {formatListingCategory(category)}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                <p className="text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">
                  Condition
                </p>
                <p className="mt-2 text-base font-medium text-foreground">
                  {formatListingCondition(condition)}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/50 p-5">
              <p className="text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">
                Description
              </p>
              <p className="mt-3 whitespace-pre-line leading-7 text-muted-foreground">
                {description}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card className="h-fit border-border/70 bg-card/95 py-0">
            <CardHeader className="gap-3 px-6 pt-6 pb-3">
              <p className="text-sm uppercase tracking-[0.2em] text-primary">
                {isOwner ? "Seller controls" : "Bid controls"}
              </p>
              <CardTitle className="text-2xl">
                {isOwner ? "Manage your listing" : "Bidding tools arrive next"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6 pt-0">
              {isOwner ? (
                <ListingSellerControls
                  bidCount={bidCount}
                  category={category}
                  condition={condition}
                  description={description}
                  endAt={endAt}
                  id={id}
                  location={location}
                  reservePrice={reservePrice}
                  startAt={startAt}
                  startingBid={startingBid}
                  status={status}
                  title={title}
                />
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    This listing belongs to {sellerName}. Phase 3 will replace
                    this placeholder with live bid entry, current bid
                    validation, and real-time updates.
                  </p>
                  <div className="rounded-2xl border border-dashed border-border/70 bg-background/50 p-4">
                    <p className="text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">
                      Bidder state
                    </p>
                    <p className="mt-2 text-base font-medium text-foreground">
                      Read-only auction context for non-owners.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {isOwner ? (
            <Card className="border-border/70 bg-card/95 py-0">
              <CardHeader className="gap-2 px-6 pt-6 pb-3">
                <p className="text-sm uppercase tracking-[0.2em] text-primary">
                  Listing images
                </p>
                <CardTitle className="text-xl">
                  Upload and manage gallery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-6 pt-0">
                <input
                  ref={fileInputRef}
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={(event) =>
                    onFileInputChange(event.target.files?.[0] ?? null)
                  }
                />

                <button
                  type="button"
                  className={cn(
                    "mx-0 w-full rounded-2xl border border-dashed p-6 min-h-48 transition",
                    !canManageGalleryImages || maxImagesReached
                      ? "border-border/50 bg-muted/20"
                      : isDragging
                        ? "border-primary/70 bg-primary/10"
                        : "border-border/70 bg-background/50",
                  )}
                  disabled={
                    !canManageGalleryImages ||
                    maxImagesReached ||
                    isMutatingImage
                  }
                  onClick={openFilePicker}
                  onDragLeave={onDragLeave}
                  onDragOver={onDragOver}
                  onDrop={onDropFile}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-foreground">
                      <ImagePlus className="size-4" />
                      <p className="text-sm font-medium">
                        Drag and drop an image here
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Upload starts immediately after drop or file selection.
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant="outline">
                        {visibleImages.length}/5 images
                      </Badge>
                      <span
                        className={buttonVariants({
                          variant: "outline",
                        })}
                      >
                        <Upload />
                        Choose image
                      </span>
                    </div>
                  </div>
                </button>

                {isUploading ? (
                  <div className="space-y-2 rounded-2xl border border-border/70 bg-background/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">
                        Uploading image
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {uploadProgress}%
                      </p>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                ) : null}

                {!canManageGalleryImages ? (
                  <div className="flex items-start gap-2 rounded-2xl border border-border/70 bg-background/60 p-3 text-sm text-muted-foreground">
                    <StarOff className="mt-0.5 size-4 shrink-0" />
                    Uploading and deleting images is only available in draft.
                    Main image can be changed in draft, active, or scheduled.
                  </div>
                ) : null}

                {maxImagesReached ? (
                  <p className="text-sm text-muted-foreground">
                    Maximum image limit reached. Remove a non-main image before
                    adding another.
                  </p>
                ) : null}

                {uploadError ? (
                  <p className="text-sm text-destructive">{uploadError}</p>
                ) : null}
                {actionError ? (
                  <p className="text-sm text-destructive">{actionError}</p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </section>
  );
}
