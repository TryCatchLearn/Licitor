"use client";

import type { DragEvent } from "react";
import { useEffect, useReducer, useRef } from "react";

import {
  deleteCloudinaryImage,
  uploadImageToCloudinary,
} from "@/lib/cloudinary-upload";
import { isCreateListingImageFile } from "@/lib/create-listing";
import type { ListingStatus } from "@/lib/db/schema";
import {
  addListingImageAction,
  deleteListingImageAction,
  setMainListingImageAction,
} from "@/server/actions/listings";
import {
  createInitialListingDetailsState,
  hasReachedListingImageLimit,
  type ListingDetailsImage,
  listingDetailsReducer,
} from "./listing-details-view-state";

const imageLimit = 5;

export const useListingDetailsView = ({
  images,
  isOwner,
  listingId,
  status,
}: {
  images: ListingDetailsImage[];
  isOwner: boolean;
  listingId: string;
  status: ListingStatus;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadRequestRef = useRef<XMLHttpRequest | null>(null);
  const [state, dispatch] = useReducer(
    listingDetailsReducer,
    images,
    createInitialListingDetailsState,
  );

  useEffect(() => {
    return () => {
      uploadRequestRef.current?.abort();
    };
  }, []);

  const canSetMainImage =
    isOwner &&
    (status === "Draft" || status === "Active" || status === "Scheduled");
  const canManageGalleryImages = isOwner && status === "Draft";
  const maxImagesReached = hasReachedListingImageLimit(state.images.length);
  const isMutatingImage =
    state.isUploading ||
    Boolean(state.deletingImageId) ||
    Boolean(state.settingMainImageId);
  const visibleImages = state.images.slice(0, imageLimit);
  const selectedImage =
    visibleImages[state.selectedImageIndex] ?? visibleImages[0] ?? null;

  const openFilePicker = () => {
    if (!canManageGalleryImages || maxImagesReached || isMutatingImage) {
      return;
    }

    fileInputRef.current?.click();
  };

  const uploadImage = async (file: File) => {
    if (!canManageGalleryImages) {
      dispatch({
        type: "upload/error",
        message: "Images can only be uploaded while listing is in draft.",
      });
      return;
    }

    if (maxImagesReached) {
      dispatch({
        type: "upload/error",
        message: "A listing can only include up to 5 images.",
      });
      return;
    }

    if (!isCreateListingImageFile(file)) {
      dispatch({
        type: "upload/error",
        message: "Choose a valid image file.",
      });
      return;
    }

    dispatch({ type: "upload/start" });

    let uploadedAsset: Awaited<
      ReturnType<typeof uploadImageToCloudinary>
    > | null = null;

    try {
      uploadedAsset = await uploadImageToCloudinary(file, {
        onProgress: (progress) => {
          dispatch({ type: "upload/progress", progress });
        },
        onRequestChange: (request) => {
          uploadRequestRef.current = request;
        },
      });

      dispatch({ type: "upload/processing" });

      const result = await addListingImageAction({
        imageUrl: uploadedAsset.secureUrl,
        listingId,
        publicId: uploadedAsset.publicId,
      });

      dispatch({
        type: "upload/success",
        image: result.image,
      });
    } catch (error) {
      if (uploadedAsset) {
        try {
          await deleteCloudinaryImage(uploadedAsset.publicId);
        } catch {
          // Best effort rollback for uploaded Cloudinary image.
        }
      }

      dispatch({
        type: "upload/error",
        message:
          error instanceof Error ? error.message : "Image upload failed.",
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onFileInputChange = (file: File | null) => {
    if (!file) {
      return;
    }

    void uploadImage(file);
  };

  const onDragOver = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();

    if (!canManageGalleryImages || maxImagesReached || isMutatingImage) {
      return;
    }

    dispatch({ type: "drag/start" });
  };

  const onDragLeave = () => {
    dispatch({ type: "drag/end" });
  };

  const onDropFile = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    dispatch({ type: "drag/end" });

    if (!canManageGalleryImages || maxImagesReached || isMutatingImage) {
      return;
    }

    const file = event.dataTransfer.files?.[0] ?? null;

    if (!file) {
      return;
    }

    void uploadImage(file);
  };

  const setSelectedImage = (index: number) => {
    dispatch({
      type: "selected-image/set",
      index,
    });
  };

  const deleteImage = async (imageId: string) => {
    if (!canManageGalleryImages || isMutatingImage) {
      return;
    }

    dispatch({ type: "delete/start", imageId });

    try {
      await deleteListingImageAction({
        imageId,
        listingId,
      });

      dispatch({ type: "delete/success", imageId });
    } catch (error) {
      dispatch({
        type: "delete/error",
        message:
          error instanceof Error ? error.message : "Unable to delete image.",
      });
    }
  };

  const setMainImage = async (imageId: string) => {
    if (!canSetMainImage || isMutatingImage) {
      return;
    }

    dispatch({ type: "set-main/start", imageId });

    try {
      await setMainListingImageAction({
        imageId,
        listingId,
      });

      dispatch({ type: "set-main/success", imageId });
    } catch (error) {
      dispatch({
        type: "set-main/error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to set this image as main.",
      });
    }
  };

  return {
    actionError: state.actionError,
    canManageGalleryImages,
    canSetMainImage,
    deleteImage,
    deletingImageId: state.deletingImageId,
    fileInputRef,
    images: state.images,
    isDragging: state.isDragging,
    isMutatingImage,
    isUploading: state.isUploading,
    maxImagesReached,
    onDragLeave,
    onDragOver,
    onDropFile,
    onFileInputChange,
    openFilePicker,
    selectedImage,
    selectedImageIndex: state.selectedImageIndex,
    setMainImage,
    setSelectedImage,
    settingMainImageId: state.settingMainImageId,
    uploadError: state.uploadError,
    uploadProgress: state.uploadProgress,
    visibleImages,
  };
};
