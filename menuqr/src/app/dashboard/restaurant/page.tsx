import type { Metadata } from "next";

import { RestaurantBrandingForm } from "@/components/restaurant/restaurant-branding-form";
import { RestaurantContactForm } from "@/components/restaurant/restaurant-contact-form";
import { RestaurantGeneralForm } from "@/components/restaurant/restaurant-general-form";
import { RestaurantHoursForm } from "@/components/restaurant/restaurant-hours-form";
import { RestaurantTabs } from "@/components/restaurant/restaurant-tabs";
import { defaultLocale } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = {
  title: dictionaries[defaultLocale].restaurant.title,
  robots: { index: false },
};

export default function RestaurantPage() {
  return (
    <RestaurantTabs
      general={<RestaurantGeneralForm />}
      branding={<RestaurantBrandingForm />}
      hours={<RestaurantHoursForm />}
      contact={<RestaurantContactForm />}
    />
  );
}
