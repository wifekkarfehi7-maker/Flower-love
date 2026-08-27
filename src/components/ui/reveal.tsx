"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: "div" | "span";
  delay?: number;
  animation?: "fade-up" | "fade-in" | "scale-in";
}

/**
 * Reveal fades/slides its children in once they enter the viewport.
 * Respects prefers-reduced-motion by skipping the animation entirely.
 */
export function Reveal({
  className,
  children,
  delay = 0,
  animation = "fade-up",
  ...props
}: RevealProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const animationClass: Record<NonNullable<RevealProps["animation"]>, string> = {
    "fade-up": "animate-fade-up",
    "fade-in": "animate-fade-in",
    "scale-in": "animate-scale-in",
  };

  return (
    <div
      ref={ref}
      className={cn("opacity-0", visible && animationClass[animation], className)}
      style={visible ? { animationDelay: `${delay}ms` } : undefined}
      {...props}
    >
      {children}
    </div>
  );
}
