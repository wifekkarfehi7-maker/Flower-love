import * as React from "react";
import { MessageCircle } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

interface WhatsAppButtonProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">,
    VariantProps<typeof buttonVariants> {
  /** Pre-filled message sent to WhatsApp. */
  message: string;
  /** Target phone number (digits, with country code). Defaults to the business number. */
  phone?: string;
  /** Hide the WhatsApp glyph. */
  hideIcon?: boolean;
}

/**
 * Reusable WhatsApp CTA — a real `<a href="https://wa.me/...">` link, never a
 * decorative fake button. Used for support, orders, payment and customer
 * contact throughout the platform.
 */
export const WhatsAppButton = React.forwardRef<HTMLAnchorElement, WhatsAppButtonProps>(
  ({ message, phone, hideIcon, variant = "whatsapp", size, className, children, ...props }, ref) => {
    const href = buildWhatsAppUrl(message, phone);
    return (
      <a
        ref={ref}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {!hideIcon && <MessageCircle aria-hidden="true" />}
        {children}
      </a>
    );
  }
);
WhatsAppButton.displayName = "WhatsAppButton";
