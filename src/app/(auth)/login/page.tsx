import { SignInForm } from "@/components/login/sign-in-form";
import { CardSectionHeader } from "@/components/shared/card-section-header";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl justify-center px-6 py-16 md:py-24">
      <Card className="w-full max-w-md py-6">
        <CardSectionHeader title="Sign In" titleClassName="text-2xl" />
        <CardContent>
          <SignInForm />
        </CardContent>
      </Card>
    </section>
  );
}
