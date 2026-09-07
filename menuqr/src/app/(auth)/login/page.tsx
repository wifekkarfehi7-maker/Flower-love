import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { Skeleton } from "@/components/ui/skeleton";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { defaultLocale } from "@/lib/i18n/config";

const t = dictionaries[defaultLocale];

export const metadata: Metadata = {
  title: t.auth.login,
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <AuthShell
      title={t.auth.loginTitle}
      subtitle={t.auth.loginSubtitle}
      footer={
        <>
          {t.auth.noAccount}{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            {t.auth.register}
          </Link>
        </>
      }
    >
      <Suspense fallback={<Skeleton className="h-64" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
