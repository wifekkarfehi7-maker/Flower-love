import Link from "next/link";
import { QrCode } from "lucide-react";

import { LogoMark } from "@/components/brand/logo";
import { SITE_NAME } from "@/lib/config";
import { defaultLocale } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";

const t = dictionaries[defaultLocale];

export default function MenuNotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <QrCode className="size-8" aria-hidden />
      </span>
      <h1 className="mt-5 text-xl font-semibold">{t.menu.notFoundTitle}</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{t.menu.notFoundText}</p>
      <Link href="/" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
        <LogoMark className="size-5" />
        {SITE_NAME}
      </Link>
    </div>
  );
}
