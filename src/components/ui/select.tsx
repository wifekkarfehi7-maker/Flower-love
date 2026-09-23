import * as React from "react";
import { ChevronDown } from "lucide-react";

import { fieldClass } from "./input";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(fieldClass, "appearance-none pe-10", invalid ? "border-destructive" : "border-ink-900/15", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        strokeWidth={1.5}
        className="pointer-events-none absolute end-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
      />
    </div>
  )
);
Select.displayName = "Select";

export { Select };
