import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

/**
 * Chrome (header/footer) for marketing + app pages. Deliberately excluded
 * from the public invitation preview/view routes, which render full-bleed
 * with their own design system (see PLAN: "the dashboard/builder UI and
 * the public invitation should have separate design systems").
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
