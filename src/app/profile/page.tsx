import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/auth/profile-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getCurrentProfile } from "@/server/queries/profile";

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export default async function ProfilePage() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const profile = await getCurrentProfile(session.user.id);

  if (!profile) {
    throw new Error("Profile not found.");
  }

  const displayName = profile.name || session.user.name;

  return (
    <section className="mx-auto flex w-full max-w-6xl px-6 py-12 md:py-16">
      <div className="grid w-full gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit py-6">
          <CardHeader>
            <CardTitle className="text-xl">My Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Avatar size="lg" className="size-20">
              <AvatarImage src={profile.image ?? undefined} alt={displayName} />
              <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
            </Avatar>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium text-foreground">{displayName}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Bio</p>
              <p className="text-sm text-foreground/90">
                {profile.bio || "No bio added yet."}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="text-sm text-foreground/90">
                {profile.location || "No location added yet."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="py-6">
          <CardHeader>
            <CardTitle className="text-xl">Edit Details</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm
              profile={{
                name: profile.name,
                image: profile.image,
                bio: profile.bio,
                location: profile.location,
              }}
              sessionName={session.user.name}
              sessionImage={session.user.image ?? null}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
