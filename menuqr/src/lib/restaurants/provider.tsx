"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { can, type Capability } from "@/lib/permissions";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Restaurant, RestaurantRole, RestaurantSettings } from "@/types/database";
import { ACTIVE_RESTAURANT_COOKIE, type RestaurantMembership } from "./get-restaurant-context";

interface RestaurantContextValue {
  restaurant: Restaurant;
  role: RestaurantRole;
  settings: RestaurantSettings | null;
  memberships: RestaurantMembership[];
  can: (capability: Capability) => boolean;
  refresh: () => void;
  switchRestaurant: (restaurantId: string) => void;
  setRestaurant: React.Dispatch<React.SetStateAction<Restaurant>>;
  setSettings: React.Dispatch<React.SetStateAction<RestaurantSettings | null>>;
}

const RestaurantCtx = React.createContext<RestaurantContextValue | null>(null);

export function RestaurantProvider({
  children,
  initialRestaurant,
  role,
  initialSettings,
  memberships,
}: {
  children: React.ReactNode;
  initialRestaurant: Restaurant;
  role: RestaurantRole;
  initialSettings: RestaurantSettings | null;
  memberships: RestaurantMembership[];
}) {
  const router = useRouter();
  const [restaurant, setRestaurant] = React.useState(initialRestaurant);
  const [settings, setSettings] = React.useState(initialSettings);

  React.useEffect(() => {
    setRestaurant(initialRestaurant);
    setSettings(initialSettings);
  }, [initialRestaurant, initialSettings]);

  const switchRestaurant = React.useCallback(
    (restaurantId: string) => {
      document.cookie = `${ACTIVE_RESTAURANT_COOKIE}=${encodeURIComponent(restaurantId)}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    },
    [router]
  );

  const value = React.useMemo<RestaurantContextValue>(
    () => ({
      restaurant,
      role,
      settings,
      memberships,
      can: (capability: Capability) => can(role, capability),
      refresh: () => router.refresh(),
      switchRestaurant,
      setRestaurant,
      setSettings,
    }),
    [restaurant, role, settings, memberships, router, switchRestaurant]
  );

  return <RestaurantCtx.Provider value={value}>{children}</RestaurantCtx.Provider>;
}

export function useRestaurant() {
  const ctx = React.useContext(RestaurantCtx);
  if (!ctx) {
    throw new Error("useRestaurant must be used inside a RestaurantProvider");
  }
  return ctx;
}

/** Browser Supabase client that throws a typed error when unconfigured. */
export function useSupabase() {
  return React.useMemo(() => getSupabaseBrowserClient(), []);
}
