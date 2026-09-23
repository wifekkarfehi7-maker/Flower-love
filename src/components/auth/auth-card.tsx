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
    <section className="flex min-h-[calc(100vh-4rem)] items-center bg-background px-5 py-section-sm">
      <div className={cn("mx-auto w-full", maxWidth)}>
        <div className="sm:rounded-md sm:border sm:border-ink-900/10 sm:bg-paper-raised sm:px-12 sm:py-14">
          <h1 className="type-h1 text-center">{title}</h1>
          {subtitle && <p className="type-body mt-4 text-center">{subtitle}</p>}
          <div className="mt-10">{children}</div>
        </div>
      </div>
    </section>
  );
}
