import Link from "next/link";
import { Heart } from "lucide-react";

import { cn } from "@/lib/utils";

export function AuthCard({
  title,
  subtitle,
  children,
  maxWidth = "max-w-md",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <section className="flex min-h-[calc(100vh-5rem)] items-center bg-ink-50/60 px-5 py-16">
      <div className={cn("mx-auto w-full", maxWidth)}>
        <div className="rounded-[2rem] border border-ink-100 bg-white p-6 shadow-card sm:p-10">
          <Link href="/" className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-gradient shadow-soft">
            <Heart className="h-6 w-6 text-ink-950" fill="currentColor" />
          </Link>
          <h1 className="mt-6 text-center font-heading text-2xl font-bold text-ink-900 sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-center text-sm text-ink-500">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </section>
  );
}
