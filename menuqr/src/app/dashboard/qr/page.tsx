import type { Metadata } from "next";

import { QrManagerView } from "@/components/qr/qr-manager-view";
import { defaultLocale } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { getQrEntries } from "@/lib/qr/get-qr-entries";
import { getRestaurantContext } from "@/lib/restaurants/get-restaurant-context";

export const metadata: Metadata = {
  title: dictionaries[defaultLocale].qr.title,
  robots: { index: false },
};

export default async function QrPage() {
  const { active } = await getRestaurantContext();
  const entries = active ? await getQrEntries(active.id) : [];

  return <QrManagerView initialEntries={entries} />;
}
