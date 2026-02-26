import { z } from "zod";

const optionalUrlString = z
  .url("Image must be a valid URL.")
  .optional()
  .or(z.literal(""));

const optionalTrimmedString = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .optional()
    .or(z.literal(""));

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  image: optionalUrlString,
  bio: optionalTrimmedString(280, "Bio"),
  location: optionalTrimmedString(80, "Location"),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
