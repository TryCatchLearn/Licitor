import { z } from "zod";

import { listingCategories, listingConditions } from "@/lib/db/schema";

const parseMoneyToCents = (value: string) => {
  const normalized = value.trim();

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const amount = Number(normalized);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return Math.round(amount * 100);
};

const requiredDateTimeField = (message: string) =>
  z.preprocess(
    (value) => {
      if (value instanceof Date) {
        return value;
      }

      if (typeof value !== "string") {
        return value;
      }

      const normalized = value.trim();

      if (!normalized) {
        return value;
      }

      return new Date(normalized);
    },
    z.date({ error: message }),
  );

const optionalTextField = z
  .string()
  .trim()
  .max(120, "Location must be 120 characters or fewer.")
  .optional()
  .transform((value) => {
    if (!value) {
      return null;
    }

    return value;
  });

const optionalDateTimeField = z
  .preprocess((value) => {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value !== "string") {
      return value;
    }

    const normalized = value.trim();

    if (!normalized) {
      return null;
    }

    return new Date(normalized);
  }, z.date({ error: "Choose a valid date and time." }).nullable())
  .superRefine((value, context) => {
    if (value && Number.isNaN(value.getTime())) {
      context.addIssue({
        code: "custom",
        message: "Choose a valid date and time.",
      });
    }
  });

const optionalPriceField = (label: string) =>
  z.preprocess(
    (value) => {
      if (value === null || value === undefined || value === "") {
        return null;
      }

      if (typeof value === "number") {
        return value;
      }

      if (typeof value !== "string") {
        return value;
      }

      const normalized = value.trim();

      if (!normalized) {
        return null;
      }

      return parseMoneyToCents(normalized) ?? Number.NaN;
    },
    z
      .number({ error: `${label} must be a valid dollar amount.` })
      .int()
      .min(0, `${label} must be zero or greater.`)
      .nullable(),
  );

const optionalStartingBidField = z
  .preprocess((value) => {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value === "string") {
      const normalized = value.trim();

      if (!normalized) {
        return null;
      }

      return parseMoneyToCents(normalized) ?? Number.NaN;
    }

    if (typeof value === "number") {
      return value;
    }

    return value;
  }, z
    .number()
    .int()
    .min(0, "Starting bid must be zero or greater.")
    .nullable()
    .optional())
  .transform((value) => {
    return value ?? null;
  });

export const createDraftListingSchema = z.object({
  imageUrl: z.string().url("A hosted image URL is required."),
  publicId: z.string().min(1, "A Cloudinary public id is required."),
});

export const addListingImageSchema = z.object({
  listingId: z.string().min(1, "Listing id is required."),
  imageUrl: z.string().url("A hosted image URL is required."),
  publicId: z.string().min(1, "A Cloudinary public id is required."),
});

export const deleteListingImageSchema = z.object({
  listingId: z.string().min(1, "Listing id is required."),
  imageId: z.string().min(1, "Listing image id is required."),
});

export const setMainListingImageSchema = z.object({
  listingId: z.string().min(1, "Listing id is required."),
  imageId: z.string().min(1, "Listing image id is required."),
});

export const updateListingDraftSchema = z
  .object({
    category: z.enum(listingCategories, {
      error: "Choose a category.",
    }),
    condition: z.enum(listingConditions, {
      error: "Choose a condition.",
    }),
    description: z
      .string()
      .trim()
      .min(20, "Description must be at least 20 characters."),
    endAt: requiredDateTimeField("An end date is required.").superRefine(
      (value, context) => {
        if (Number.isNaN(value.getTime())) {
          context.addIssue({
            code: "custom",
            message: "Choose a valid end date and time.",
          });
        }
      },
    ),
    location: optionalTextField,
    reservePrice: optionalPriceField("Reserve price"),
    startAt: optionalDateTimeField,
    startingBid: optionalStartingBidField.default(null),
    title: z.string().trim().min(8, "Title must be at least 8 characters."),
  })
  .superRefine((value, context) => {
    if (value.startAt && value.startAt.getTime() <= Date.now()) {
      context.addIssue({
        code: "custom",
        message: "Start time must be in the future.",
        path: ["startAt"],
      });
    }

    if (value.startAt && value.endAt <= value.startAt) {
      context.addIssue({
        code: "custom",
        message: "End time must be after the start time.",
        path: ["endAt"],
      });
    }

    if (
      value.reservePrice !== null &&
      value.startingBid !== null &&
      value.startingBid !== undefined &&
      value.reservePrice < value.startingBid
    ) {
      context.addIssue({
        code: "custom",
        message: "Reserve price must be at least the starting bid.",
        path: ["reservePrice"],
      });
    }
  });

export type UpdateListingDraftInput = z.input<typeof updateListingDraftSchema>;
export type UpdateListingDraftValues = z.output<
  typeof updateListingDraftSchema
>;
export type CreateDraftListingInput = z.infer<typeof createDraftListingSchema>;
export type AddListingImageInput = z.infer<typeof addListingImageSchema>;
export type DeleteListingImageInput = z.infer<typeof deleteListingImageSchema>;
export type SetMainListingImageInput = z.infer<
  typeof setMainListingImageSchema
>;
