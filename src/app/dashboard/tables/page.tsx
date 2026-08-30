import { headers } from "next/headers";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import type { RestaurantTable, Tenant } from "@/lib/supabase/types";
import { creerTable, supprimerTable } from "./actions";

async function urlDeBase() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;

  const enTetes = await headers();
  const hote = enTetes.get("host") ?? "localhost:3000";
  const protocole = hote.startsWith("localhost") ? "http" : "https";
  return `${protocole}://${hote}`;
}

export default async function PageTables({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle<Tenant>();

  if (!tenant) redirect("/dashboard");

  const { data: tables } = await supabase
    .from("tables")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("numero", { ascending: true })
    .returns<RestaurantTable[]>();

  const base = await urlDeBase();

  const tablesAvecQr = await Promise.all(
    (tables ?? []).map(async (table) => {
      const url = `${base}/${tenant.slug}/table/${encodeURIComponent(table.numero)}`;
      const qr = await QRCode.toDataURL(url, {
        width: 512,
        margin: 1,
        color: { dark: "#2F3C7E", light: "#FFFFFF" },
      });
      return { table, url, qr };
    }),
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div>
        <h1 className="font-serif text-3xl text-navy">Tables &amp; QR codes</h1>
        <p className="mt-2 text-navy/70">
          Chaque table a son QR code. Imprimez-le et posez-le sur la table :
          le client le scanne et tombe directement sur votre menu.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-coral/10 px-3 py-2 text-sm text-coral">
          {error}
        </p>
      )}

      <form
        action={creerTable}
        className="flex items-end gap-3 rounded-2xl bg-white p-4 shadow-sm"
      >
        <label className="flex flex-1 flex-col gap-1 text-sm text-navy">
          Numéro de table
          <input
            type="text"
            name="numero"
            required
            placeholder="12"
            className="rounded-lg border border-navy/20 px-3 py-2 outline-none focus:border-navy"
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-navy px-5 py-2 font-medium text-white transition hover:brightness-110"
        >
          Ajouter
        </button>
      </form>

      {tablesAvecQr.length === 0 ? (
        <p className="text-navy/60">Aucune table pour l&apos;instant.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {tablesAvecQr.map(({ table, url, qr }) => (
            <li
              key={table.id}
              className="flex flex-col items-center gap-3 rounded-2xl bg-white p-5 text-center shadow-sm"
            >
              <h2 className="font-serif text-xl text-navy">
                Table {table.numero}
              </h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qr}
                alt={`QR code de la table ${table.numero}`}
                className="size-44 rounded-lg"
              />
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="break-all text-xs text-navy/60 underline"
              >
                {url}
              </a>
              <form action={supprimerTable}>
                <input type="hidden" name="table_id" value={table.id} />
                <button
                  type="submit"
                  className="text-sm text-coral hover:underline"
                >
                  Supprimer la table
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
