import type { RestaurantRole } from "@/types/database";

/**
 * Capability names rather than role checks scattered through the UI: adding a
 * role later means adding a row here, not auditing every component. The
 * database enforces the same split independently (see the RLS policies), so
 * this only decides what the interface offers.
 */
export type Capability =
  | "menu:write"
  | "tables:write"
  | "qr:write"
  | "availability:toggle"
  | "analytics:view"
  | "restaurant:write"
  | "settings:write"
  | "team:manage"
  | "subscription:manage";

const ROLE_CAPABILITIES: Record<RestaurantRole, Capability[]> = {
  owner: [
    "menu:write",
    "tables:write",
    "qr:write",
    "availability:toggle",
    "analytics:view",
    "restaurant:write",
    "settings:write",
    "team:manage",
    "subscription:manage",
  ],
  manager: ["menu:write", "tables:write", "qr:write", "availability:toggle", "analytics:view", "settings:write"],
  staff: ["availability:toggle"],
};

export function can(role: RestaurantRole | null | undefined, capability: Capability) {
  if (!role) return false;
  return ROLE_CAPABILITIES[role].includes(capability);
}

export const ROLE_ORDER: RestaurantRole[] = ["owner", "manager", "staff"];
