import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/config";

/**
 * QR finder-pattern mark: three corner squares plus one filled accent square,
 * which reads as both "QR code" and "menu grid" at 20px.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("size-7", className)} aria-hidden focusable="false">
      <rect width="24" height="24" rx="6" className="fill-primary" />
      <rect x="5" y="5" width="6" height="6" rx="1.4" className="stroke-primary-foreground" strokeWidth="1.8" />
      <rect x="13" y="5" width="6" height="6" rx="1.4" className="stroke-primary-foreground" strokeWidth="1.8" />
      <rect x="5" y="13" width="6" height="6" rx="1.4" className="stroke-primary-foreground" strokeWidth="1.8" />
      <rect x="13.5" y="13.5" width="5" height="5" rx="1.2" className="fill-accent" />
    </svg>
  );
}

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      {showText ? <span className="text-lg font-semibold tracking-tight">{SITE_NAME}</span> : null}
    </span>
  );
}
