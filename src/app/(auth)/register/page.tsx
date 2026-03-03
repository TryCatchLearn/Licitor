import { RegisterForm } from "@/components/register/register-form";
import { CardSectionHeader } from "@/components/shared/card-section-header";
import { Card, CardContent } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl justify-center px-6 py-16 md:py-24">
      <Card className="w-full max-w-md py-6">
        <CardSectionHeader title="Create Account" titleClassName="text-2xl" />
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </section>
  );
}
