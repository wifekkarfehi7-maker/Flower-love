import type { SubscriptionPlan } from "@/types/database";

export type BillingPeriod = "monthly" | "yearly";

export interface CheckoutRequest {
  restaurantId: string;
  planCode: string;
  period: BillingPeriod;
  currency: string;
}

export type CheckoutResult =
  | { status: "redirect"; url: string }
  | { status: "manual"; instructions: "contact_support" }
  | { status: "unavailable"; reason: "no_provider_configured" };

/**
 * Payments are deliberately behind an interface with no gateway attached.
 * Tunisian providers (Konnect, Flouci, Paymee, ClicToPay…) each have their own
 * flow, so the app commits to none of them: adding one means implementing this
 * interface and returning a redirect from startCheckout, with no other change
 * to the subscription UI or schema.
 *
 * Nothing here pretends a payment happened. Until a provider exists, upgrades
 * are arranged directly and applied by an administrator.
 */
export interface PaymentProvider {
  readonly id: string;
  readonly isEnabled: boolean;
  startCheckout(request: CheckoutRequest): Promise<CheckoutResult>;
}

const manualProvider: PaymentProvider = {
  id: "manual",
  isEnabled: false,
  async startCheckout() {
    return { status: "manual", instructions: "contact_support" };
  },
};

export function getPaymentProvider(): PaymentProvider {
  return manualProvider;
}

export function planPrice(plan: SubscriptionPlan, period: BillingPeriod) {
  return period === "yearly" ? Number(plan.price_yearly) : Number(plan.price_monthly);
}

export function planFeatureKeys(plan: SubscriptionPlan): string[] {
  return Array.isArray(plan.features) ? plan.features.filter((value): value is string => typeof value === "string") : [];
}
