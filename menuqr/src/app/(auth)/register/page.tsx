import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { defaultLocale } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";

const t = dictionaries[defaultLocale];

export const metadata: Metadata = {
  title: t.auth.register,
  robots: { index: false },
};

export default function RegisterPage() {
  return (
    <AuthShell
      title={t.auth.registerTitle}
      subtitle={t.auth.registerSubtitle}
      footer={
        <>
          {t.auth.hasAccount}{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            {t.auth.login}
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
