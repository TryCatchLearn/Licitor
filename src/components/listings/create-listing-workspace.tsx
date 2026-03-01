"use client";

import { ArrowUpFromLine, ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  describeCreateListingImage,
  isCreateListingImageFile,
} from "@/lib/create-listing";
import { cn } from "@/lib/utils";

type PreviewState = {
  file: File;
  url: string;
};

const explainerSteps = [
  {
    description:
      "Drop a single image to set the visual anchor for this auction draft.",
    title: "Choose the hero image",
  },
  {
    description:
      "Phase 1E stops at preview. The upload button is present, but no network request runs yet.",
    title: "Confirm the preview",
  },
  {
    description:
      "Signed Cloudinary upload, progress, and draft creation arrive in the next phase.",
    title: "Continue into listing details",
  },
];

export function CreateListingWorkspace() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [preview]);

  const clearPreview = () => {
    if (preview) {
      URL.revokeObjectURL(preview.url);
    }

    setPreview(null);
    setErrorMessage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const setNextPreview = (file: File | null) => {
    if (!file) {
      return;
    }

    if (!isCreateListingImageFile(file)) {
      setErrorMessage("Choose a valid image file to preview this listing.");
      return;
    }

    setErrorMessage(null);
    setPreview((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview.url);
      }

      return {
        file,
        url: URL.createObjectURL(file),
      };
    });
  };

  return (
    <div className="grid h-full min-h-0 w-full gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(17rem,0.85fr)]">
      <Card className="min-h-0 overflow-hidden border-border/70 bg-card/95 py-0 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
        <CardContent className="flex h-full min-h-0 flex-col gap-3 p-4 md:p-5">
          <input
            ref={fileInputRef}
            hidden
            accept="image/*"
            type="file"
            onChange={(event) =>
              setNextPreview(event.target.files?.[0] ?? null)
            }
          />

          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <button
              className={cn(
                "group relative flex min-h-[20rem] flex-1 flex-col justify-center overflow-hidden rounded-[1.75rem] border transition duration-200 lg:min-h-0",
                preview
                  ? "border-border/70 bg-background/65"
                  : isDragging
                    ? "border-primary/70 border-dashed bg-primary/12 shadow-[0_0_0_1px_rgba(252,211,77,0.25),0_20px_60px_rgba(0,0,0,0.2)]"
                    : "border-border/70 border-dashed bg-background/45 hover:border-primary/45 hover:bg-background/65",
              )}
              type="button"
              onClick={() => {
                if (!preview) {
                  fileInputRef.current?.click();
                }
              }}
              onDragLeave={() => setIsDragging(false)}
              onDragOver={(event) => {
                event.preventDefault();
                if (!preview) {
                  setIsDragging(true);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                setNextPreview(event.dataTransfer.files?.[0] ?? null);
              }}
            >
              {preview ? (
                <>
                  <Image
                    alt={preview.file.name}
                    className="h-full w-full object-cover"
                    fill
                    unoptimized
                    src={preview.url}
                  />
                  <div className="absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-3 bg-gradient-to-b from-black/70 via-black/20 to-transparent p-4">
                    <Badge className="max-w-full truncate rounded-full bg-black/55 px-3 py-1 text-xs text-white backdrop-blur-sm">
                      {preview.file.name}
                    </Badge>
                    <Badge className="rounded-full bg-black/55 px-3 py-1 text-xs text-white backdrop-blur-sm">
                      {describeCreateListingImage(preview.file)}
                    </Badge>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center px-6 py-8 text-center md:py-10">
                  <div className="flex size-[4.5rem] items-center justify-center rounded-[1.5rem] border border-primary/25 bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
                    <ImagePlus className="size-8" />
                  </div>
                  <div className="mt-6 space-y-3">
                    <p className="text-sm uppercase tracking-[0.22em] text-primary">
                      Step 1
                    </p>
                    <h2 className="text-2xl font-semibold text-foreground md:text-3xl">
                      Drag a listing image here
                    </h2>
                    <p className="mx-auto max-w-xl text-sm text-muted-foreground md:text-base">
                      Drop a photo anywhere in this panel or click to open your
                      file picker. The preview stays local until upload support
                      ships in the next phase.
                    </p>
                  </div>
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <span className={buttonVariants({ size: "lg" })}>
                      Choose image
                    </span>
                    <span className="rounded-full border border-border/70 bg-card/70 px-4 py-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      JPEG, PNG, WebP, AVIF
                    </span>
                  </div>
                  {errorMessage ? (
                    <p className="mt-4 text-sm text-destructive">
                      {errorMessage}
                    </p>
                  ) : (
                    <p className="mt-4 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Single image only. No upload occurs yet.
                    </p>
                  )}
                </div>
              )}
            </button>

            <div className="flex shrink-0 justify-end gap-3">
              <Button disabled={!preview} size="lg" type="button">
                <ArrowUpFromLine className="size-4" />
                Upload
              </Button>
              <Button
                disabled={!preview}
                size="lg"
                type="button"
                variant="outline"
                onClick={clearPreview}
              >
                <X className="size-4" />
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="min-h-0 border-border/70 bg-card/95 py-0 shadow-[0_18px_60px_rgba(0,0,0,0.2)]">
        <CardContent className="flex h-full min-h-0 flex-col justify-center gap-3 p-4 md:p-5">
          <div className="space-y-3">
            {explainerSteps.map(({ description, title }, index) => (
              <div
                key={title}
                className="rounded-[1.5rem] border border-border/70 bg-background/45 p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <span className="text-sm font-semibold">0{index + 1}</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-foreground">
                      {title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
