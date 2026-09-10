import type { Metadata } from "next";

import { ErrorState } from "@/components/shared/error-state";
import { defaultLocale } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = {
  title: dictionaries[defaultLocale].errors.notFoundTitle,
  robots: { index: false },
};

export default function NotFound() {
  return <ErrorState variant="notFound" />;
}
