import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { defaultLocale } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";

const t = dictionaries[defaultLocale];

export const metadata: Metadata = {
  title: t.auth.resetTitle,
  robots: { index: false },
};

export default function ResetPasswordPage() {
  return (
    <AuthShell title={t.auth.resetTitle} subtitle={t.auth.resetSubtitle}>
      <ResetPasswordForm />
    </AuthShell>
  );
}
