"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Profile } from "@/db/schema";
import { authClient } from "@/lib/auth-client";
import {
  type ProfileUpdateInput,
  profileUpdateSchema,
} from "@/lib/validation/profile";
import { updateProfileAction } from "@/server/actions/profile";

type ProfileFormProps = {
  profile: Pick<Profile, "name" | "image" | "bio" | "location">;
  sessionName: string;
  sessionImage: string | null;
};

export function ProfileForm({
  profile,
  sessionName,
  sessionImage,
}: ProfileFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const defaultValues = useMemo(
    () => ({
      name: profile.name,
      image: profile.image ?? "",
      bio: profile.bio ?? "",
      location: profile.location ?? "",
    }),
    [profile],
  );

  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const result = await updateProfileAction(values);

      if (!result.success) {
        setSubmitError("Unable to update profile.");
        return;
      }

      const nextName = values.name.trim();
      const nextImage = values.image?.trim() ? values.image.trim() : null;

      if (nextName !== sessionName || nextImage !== sessionImage) {
        await authClient.updateUser({
          name: nextName,
          image: nextImage ?? undefined,
        });
      }

      setSubmitSuccess("Profile updated.");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update profile.";
      setSubmitError(message);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" type="text" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Image URL</Label>
        <Input id="image" type="url" {...form.register("image")} />
        {form.formState.errors.image && (
          <p className="text-sm text-destructive">
            {form.formState.errors.image.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input id="location" type="text" {...form.register("location")} />
        {form.formState.errors.location && (
          <p className="text-sm text-destructive">
            {form.formState.errors.location.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" rows={5} {...form.register("bio")} />
        {form.formState.errors.bio && (
          <p className="text-sm text-destructive">
            {form.formState.errors.bio.message}
          </p>
        )}
      </div>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}
      {submitSuccess && (
        <p className="text-sm text-emerald-600">{submitSuccess}</p>
      )}

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
