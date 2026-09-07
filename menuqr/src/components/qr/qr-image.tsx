"use client";

import * as React from "react";

import { qrDataUrl } from "@/lib/qr/render";
import { cn } from "@/lib/utils";

/**
 * Renders the code as a data-URL image rather than injecting SVG markup, so
 * nothing generated ever reaches the DOM as HTML.
 */
export function QrImage({
  value,
  size = 220,
  className,
  alt = "",
}: {
  value: string;
  size?: number;
  className?: string;
  alt?: string;
}) {
  const [dataUrl, setDataUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    qrDataUrl(value, size * 2)
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!dataUrl) {
    return <div className={cn("skeleton rounded-lg", className)} style={{ width: size, height: size }} aria-hidden />;
  }

  // Not next/image: the source is an in-memory data URL, so the optimizer has
  // nothing to do and would only add a network hop.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={dataUrl} width={size} height={size} alt={alt} className={cn("rounded-lg", className)} />;
}
