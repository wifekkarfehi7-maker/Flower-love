import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", invalid, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        "flex h-12 w-full rounded-xl border bg-white px-4 text-base text-ink-900 shadow-sm transition-colors placeholder:text-ink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        invalid ? "border-destructive" : "border-ink-200",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
