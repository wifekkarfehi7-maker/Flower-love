"use client";

import { PageHeader } from "@/components/ui/misc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/lib/i18n/provider";

export function RestaurantTabs({
  general,
  branding,
  hours,
  contact,
}: {
  general: React.ReactNode;
  branding: React.ReactNode;
  hours: React.ReactNode;
  contact: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader title={t.restaurant.title} description={t.restaurant.subtitle} />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">{t.restaurant.tabGeneral}</TabsTrigger>
          <TabsTrigger value="branding">{t.restaurant.tabBranding}</TabsTrigger>
          <TabsTrigger value="hours">{t.restaurant.tabHours}</TabsTrigger>
          <TabsTrigger value="contact">{t.restaurant.tabContact}</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="surface p-5">{general}</div>
        </TabsContent>
        <TabsContent value="branding">
          <div className="surface p-5">{branding}</div>
        </TabsContent>
        <TabsContent value="hours">
          <div className="surface p-5">{hours}</div>
        </TabsContent>
        <TabsContent value="contact">
          <div className="surface p-5">{contact}</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
