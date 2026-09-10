"use client";

import { DirectionProvider } from "@radix-ui/react-direction";
import type { User } from "@supabase/supabase-js";
import * as React from "react";

import { AuthProvider } from "@/lib/auth/provider";
import type { Locale } from "@/lib/i18n/config";
import { LanguageProvider, useTranslation } from "@/lib/i18n/provider";
import { ToastProvider } from "@/components/ui/toast";
import type { Profile } from "@/types/database";

/** Keeps Radix's popper/menu alignment in sync with the interface language. */
function DirectionBridge({ children }: { children: React.ReactNode }) {
  const { dir } = useTranslation();
  return <DirectionProvider dir={dir}>{children}</DirectionProvider>;
}

export function Providers({
  children,
  user = null,
  profile = null,
  initialLocale,
  persistLocale = true,
}: {
  children: React.ReactNode;
  user?: User | null;
  profile?: Profile | null;
  initialLocale?: Locale;
  persistLocale?: boolean;
}) {
  return (
    <LanguageProvider initialLocale={initialLocale} persist={persistLocale}>
      <DirectionBridge>
        <ToastProvider>
          <AuthProvider initialUser={user} initialProfile={profile}>
            {children}
          </AuthProvider>
        </ToastProvider>
      </DirectionBridge>
    </LanguageProvider>
  );
}
