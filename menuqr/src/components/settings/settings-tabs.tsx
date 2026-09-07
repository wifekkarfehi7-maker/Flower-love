"use client";

import { PageHeader } from "@/components/ui/misc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/lib/i18n/provider";
import { useRestaurant } from "@/lib/restaurants/provider";

export function SettingsTabs({
  menu,
  account,
  team,
  demo,
}: {
  menu: React.ReactNode;
  account: React.ReactNode;
  team: React.ReactNode;
  demo: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { can } = useRestaurant();

  return (
    <div className="space-y-6">
      <PageHeader title={t.settings.title} description={t.settings.subtitle} />

      <Tabs defaultValue="menu">
        <TabsList>
          <TabsTrigger value="menu">{t.settings.tabMenu}</TabsTrigger>
          <TabsTrigger value="account">{t.settings.tabAccount}</TabsTrigger>
          <TabsTrigger value="team">{t.settings.tabTeam}</TabsTrigger>
        </TabsList>

        <TabsContent value="menu">
          <div className="surface p-5">{menu}</div>
        </TabsContent>

        <TabsContent value="account">
          <div className="surface p-5">{account}</div>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <div className="surface p-5">{team}</div>
          {can("subscription:manage") ? <div className="surface p-5">{demo}</div> : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
