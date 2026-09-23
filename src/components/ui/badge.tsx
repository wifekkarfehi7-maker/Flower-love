import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  // Small set type in a 2px frame — a label, not a lozenge.
  "ui-label inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[0.6875rem] font-medium leading-5 transition-colors",
  {
    variants: {
      variant: {
        default: "border-ink-900 bg-ink-900 text-paper",
        // Brass is an outline here, never a fill.
        gold: "border-gold-500/50 bg-transparent text-gold-700",
        outline: "border-ink-900/20 bg-transparent text-ink-700",
        rose: "border-rose-300/60 bg-transparent text-rose-700",
        soft: "border-transparent bg-ink-900/[0.05] text-ink-600",
        success: "border-emerald-700/25 bg-transparent text-emerald-800",
        destructive: "border-destructive/30 bg-transparent text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
