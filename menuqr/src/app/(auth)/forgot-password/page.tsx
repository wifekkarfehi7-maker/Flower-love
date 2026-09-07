import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { defaultLocale } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";

const t = dictionaries[defaultLocale];

export const metadata: Metadata = {
  title: t.auth.forgotTitle,
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title={t.auth.forgotTitle}
      subtitle={t.auth.forgotSubtitle}
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t.auth.backToLogin}
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
