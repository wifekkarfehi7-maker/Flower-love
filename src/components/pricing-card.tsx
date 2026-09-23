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
        "relative flex h-full flex-col",
        highlighted ? "border-ink-900" : "border-ink-900/10"
      )}
    >
      <div className="flex flex-1 flex-col p-7 sm:p-8">
        {badgeLabel && (
          <Badge variant="gold" className="mb-4 w-fit">
            {badgeLabel}
          </Badge>
        )}
        <h3 className="type-h2">{name}</h3>
        <p className="type-small mt-2">{description}</p>

        <div className="mt-8 flex items-baseline gap-2 border-t border-ink-900/10 pt-6">
          <span className="type-display type-numeral">{price}</span>
          <span className="type-small text-ink-700">{currency}</span>
          <span className="type-small text-ink-400">/ {period}</span>
        </div>

        <ul className="mt-8 flex flex-1 flex-col gap-3.5">
          {features.map((feature) => (
            <li key={feature} className="type-small flex items-start gap-3 text-ink-600">
              <Check strokeWidth={1.5} className="mt-1 h-3.5 w-3.5 shrink-0 text-gold-600" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <Button asChild variant={highlighted ? "dark" : "secondary"} className="mt-10 w-full">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      </div>
    </Card>
  );
}
