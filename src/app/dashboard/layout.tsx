import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";
import type { Tenant } from "@/lib/supabase/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle<Tenant>();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-navy/10 bg-white px-6 py-4">
        <Link href="/dashboard" className="font-serif text-xl text-navy">
          Skanini
        </Link>
        <div className="flex items-center gap-4 text-sm text-navy/70">
          {tenant && (
            <>
              <span className="hidden sm:inline">{tenant.nom}</span>
              <Link href="/dashboard/cuisine" className="font-medium text-navy hover:underline">
                Cuisine
              </Link>
              <Link href="/dashboard/menu" className="font-medium text-navy hover:underline">
                Menu
              </Link>
              <Link href="/dashboard/tables" className="font-medium text-navy hover:underline">
                Tables
              </Link>
            </>
          )}
          <form action={logout}>
            <button type="submit" className="text-navy hover:underline">
              Déconnexion
            </button>
          </form>
        </div>
      </header>
      <main className="flex flex-1 flex-col px-6 py-10">{children}</main>
    </div>
  );
}
