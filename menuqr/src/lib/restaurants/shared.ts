import type { Restaurant, RestaurantRole } from "@/types/database";

/** Selects which of the user's venues the dashboard is working on. */
export const ACTIVE_RESTAURANT_COOKIE = "menuqr-restaurant";

export interface RestaurantMembership {
  restaurant: Restaurant;
  role: RestaurantRole;
}
