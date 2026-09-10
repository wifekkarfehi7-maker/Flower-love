import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { defaultLocale } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { getRestaurantContext } from "@/lib/restaurants/get-restaurant-context";

const t = dictionaries[defaultLocale];

export const metadata: Metadata = {
  title: t.onboarding.title,
  robots: { index: false },
};

export default async function OnboardingPage() {
  const { user } = await getCurrentUser();
  if (!user) redirect("/login?next=/onboarding");

  const { active } = await getRestaurantContext();
  if (active) redirect("/dashboard");

  return (
    <div className="flex min-h-dvh flex-col bg-muted/40">
      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="rounded-md focus-visible:ring-2 focus-visible:ring-ring">
          <Logo />
        </Link>
        <LanguageSwitcher variant="outline" />
      </header>

      <main className="flex flex-1 flex-col items-center px-5 pb-16 pt-4">
        <div className="mb-8 max-w-lg text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{t.onboarding.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t.onboarding.subtitle}</p>
        </div>
        <OnboardingWizard userId={user.id} />
      </main>
    </div>
  );
}
