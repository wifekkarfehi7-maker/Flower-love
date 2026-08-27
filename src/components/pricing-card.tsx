import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  currency: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  highlighted?: boolean;
  badgeLabel?: string;
}

/** Reusable pricing plan card, rendered from `pricing_plans` rows fetched from the database. */
export function PricingCard({
  name,
  price,
  period,
  currency,
  description,
  features,
  ctaLabel,
  ctaHref,
  highlighted,
  badgeLabel,
}: PricingCardProps) {
  return (
    <Card
      className={cn(
        "relative flex h-full flex-col overflow-hidden p-2",
        highlighted ? "border-gold-400/60 shadow-luxe" : "border-ink-100"
      )}
    >
      {highlighted && (
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-gold-gradient" />
      )}
      <div className="flex flex-1 flex-col p-6">
        {badgeLabel && (
          <Badge variant="gold" className="mb-4 w-fit">
            {badgeLabel}
          </Badge>
        )}
        <h3 className="font-heading text-xl font-bold text-ink-900">{name}</h3>
        <p className="mt-1.5 text-sm text-ink-500">{description}</p>

        <div className="mt-6 flex items-baseline gap-2">
          <span className="font-heading text-4xl font-bold text-ink-900">{price}</span>
          <span className="text-sm font-semibold text-ink-500">{currency}</span>
          <span className="text-xs text-ink-400">/ {period}</span>
        </div>

        <ul className="mt-6 flex flex-1 flex-col gap-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm text-ink-600">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <Button asChild variant={highlighted ? "gold" : "outline"} className="mt-8 w-full">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      </div>
    </Card>
  );
}
