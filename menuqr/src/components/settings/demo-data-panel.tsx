"use client";

import { FlaskConical } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Alert, AlertText, AlertTitle } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { translateDataError } from "@/lib/auth/error-map";
import { useAuth } from "@/lib/auth/provider";
import { useTranslation } from "@/lib/i18n/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const DEMO_SLUG = "cafe-el-medina";

/**
 * Creates (or drops) the "Café El Medina" sample venue with a full Tunisian
 * menu. Both directions run through database functions that check the caller
 * owns what they are touching, so this is safe to expose in the dashboard.
 */
export function DemoDataPanel() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const run = async (action: "create" | "remove") => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !profile) return;

    setBusy(true);
    setError(null);

    const { error: rpcError } =
      action === "create"
        ? await supabase.rpc("seed_demo_restaurant", { p_owner: profile.id, p_slug: DEMO_SLUG })
        : await supabase.rpc("remove_demo_restaurant", { p_slug: DEMO_SLUG });

    setBusy(false);

    if (rpcError) {
      setError(translateDataError(rpcError.message, t));
      return;
    }

    toast({ title: t.common.success, variant: "success" });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{t.settings.demoDataTitle}</h3>
        <p className="text-sm text-muted-foreground">{t.settings.demoDataText}</p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertText className="text-foreground">{error}</AlertText>
        </Alert>
      ) : null}

      <Alert>
        <FlaskConical aria-hidden className="text-muted-foreground" />
        <div>
          <AlertTitle>{DEMO_SLUG}</AlertTitle>
          <AlertText className="mt-0.5">/menu/{DEMO_SLUG}</AlertText>
        </div>
      </Alert>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" loading={busy} onClick={() => void run("create")}>
          {t.settings.demoDataCreate}
        </Button>
        <Button variant="ghost" loading={busy} onClick={() => void run("remove")}>
          {t.settings.demoDataRemove}
        </Button>
      </div>
    </div>
  );
}
