import * as React from "react";

import { cn } from "@/lib/utils";

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn("mb-2 block text-[0.8125rem] font-medium text-ink-700", className)} {...props} />
  )
);
Label.displayName = "Label";

export { Label };
