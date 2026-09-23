import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

/** A field on card stock: hairline border, 2px corner, no shadow; focus tightens the rule to ink. */
export const fieldClass =
  "flex h-12 w-full rounded-sm border bg-paper-raised px-4 text-[0.9375rem] text-ink-900 transition-colors placeholder:text-ink-300 hover:border-ink-900/35 focus-visible:border-ink-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-900 disabled:cursor-not-allowed disabled:opacity-50";

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", invalid, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(fieldClass, invalid ? "border-destructive" : "border-ink-900/15", className)}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
