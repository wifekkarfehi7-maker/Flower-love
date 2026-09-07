import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PrintSheet } from "@/components/qr/print-sheet";
import { defaultLocale } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { getQrEntries } from "@/lib/qr/get-qr-entries";
import { getRestaurantContext } from "@/lib/restaurants/get-restaurant-context";

export const metadata: Metadata = {
  title: dictionaries[defaultLocale].qr.printAll,
  robots: { index: false },
};

export default async function QrPrintPage() {
  const { active } = await getRestaurantContext();
  if (!active) notFound();

  const entries = await getQrEntries(active.id);

  return <PrintSheet restaurant={active} entries={entries} />;
}
