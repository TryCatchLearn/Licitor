import { ProfileForm } from "@/components/profile/profile-form";
import { CardSectionHeader } from "@/components/shared/card-section-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { requireCurrentUserSession } from "@/lib/auth-session";
import { getCurrentProfile } from "@/server/queries/profile";

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export default async function ProfilePage() {
  const session = await requireCurrentUserSession();

  const profile = await getCurrentProfile(session.user.id);

  if (!profile) {
    throw new Error("Profile not found.");
  }

  const displayName = profile.name || session.user.name;

  return (
    <section className="mx-auto flex w-full max-w-6xl px-6 py-12 md:py-16">
      <div className="grid w-full gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit py-6">
          <CardSectionHeader title="My Profile" />
          <CardContent className="space-y-5">
            <Avatar className="mx-auto !h-auto !w-3/4 aspect-square rounded-2xl">
              <AvatarImage src={profile.image ?? undefined} alt={displayName} />
              <AvatarFallback className="rounded-2xl text-xl">
                {getInitials(displayName)}
              </AvatarFallback>
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
          <CardSectionHeader title="Edit Details" />
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
