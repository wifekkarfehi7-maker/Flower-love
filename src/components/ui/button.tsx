import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Buttons are set, not decorated: a 2px corner, medium weight, a breath of
 * tracking in Latin (none in Arabic — see .ui-label) and colour that changes
 * on hover rather than a glow or a scale pop.
 *
 *   primary    solid ink — the one main action on a light ground
 *   secondary  hairline outline — the companion action
 *   text       an underlined line of type — editorial CTAs inside copy
 *   dark       ink with a brass hairline — the "black tie" action, used sparingly
 *   light      solid paper — the main action on a dark ground
 *   accent     brass hairline and text — selected or special states, never a fill
 *   ghost      no chrome until hover — icon buttons and utility actions
 *   whatsapp   the payment and support channel, in a deep rather than neon green
 */
const buttonVariants = cva(
  "ui-label inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-sm font-medium transition-colors duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-ink-900 text-paper hover:bg-ink-700 active:bg-ink-950",
        secondary: "border border-ink-900/20 bg-transparent text-ink-900 hover:border-ink-900 active:bg-ink-900/[0.04]",
        text: "rounded-none text-ink-900 underline decoration-ink-900/25 decoration-1 underline-offset-[6px] hover:decoration-ink-900",
        dark: "bg-ink-950 text-gold-200 ring-1 ring-inset ring-gold-500/40 hover:bg-black hover:text-gold-100",
        light: "bg-paper-raised text-ink-900 hover:bg-gold-50 active:bg-gold-100",
        accent: "border border-gold-500/60 bg-transparent text-gold-700 hover:border-gold-600 hover:bg-gold-50",
        ghost: "bg-transparent text-ink-600 hover:bg-ink-900/[0.04] hover:text-ink-900",
        whatsapp: "bg-[#1F7A4D] text-white hover:bg-[#19653F] active:bg-[#14532F]",
      },
      size: {
        sm: "h-9 px-4 text-[0.8125rem]",
        default: "h-11 px-6 text-[0.875rem]",
        lg: "h-12 px-8 text-[0.9375rem]",
        icon: "h-10 w-10",
      },
    },
    compoundVariants: [
      // A text CTA is a line of type: no box height, no side padding.
      { variant: "text", size: ["sm", "default", "lg"], className: "h-auto px-0 py-1" },
    ],
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
