import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Wordmark } from "@/components/brand/wordmark";
import { cn } from "@/lib/utils";

/**
 * A page that has only one thing to say — not found, not yet active. Set
 * like a card slipped into an envelope: a small mark, a line of display type,
 * one sentence, one way back. No icon badge.
 */
export function QuietNotice({
  eyebrow,
  title,
  body,
  action,
  standalone = false,
  lang,
}: {
  eyebrow: string;
  title: string;
  body: string;
  action: { href: string; label: string };
  /** Rendered outside the site layout, so it carries its own brand mark. */
  standalone?: boolean;
  /** For copy written in one fixed language, whatever the visitor's setting. */
  lang?: "ar" | "fr" | "en";
}) {
  return (
    <section
      data-ui=""
      lang={lang}
      dir={lang === "ar" ? "rtl" : undefined}
      className={cn(
        "flex items-center justify-center bg-background px-5 py-section-sm text-center",
        standalone ? "min-h-screen" : "min-h-[calc(100vh-4rem)]"
      )}
    >
      <div className="max-w-md">
        {standalone && (
          <Link href="/" aria-label="Flower & Love" className="mb-block inline-block">
            <Wordmark />
          </Link>
        )}
        <p className="type-meta type-numeral">{eyebrow}</p>
        <h1 className="type-h1 mt-5">{title}</h1>
        <p className="type-body mt-5">{body}</p>
        <Link href={action.href} className={cn(buttonVariants({ variant: "primary" }), "mt-10")}>
          {action.label}
        </Link>
      </div>
    </section>
  );
}
