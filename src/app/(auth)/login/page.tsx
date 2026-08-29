import Link from "next/link";
import { login } from "../actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="font-serif text-2xl text-navy">Connexion gérant</h1>
        <p className="mt-1 text-sm text-navy/70">
          Accédez au back-office de votre établissement.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-coral/10 px-3 py-2 text-sm text-coral">
            {error}
          </p>
        )}

        <form action={login} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-navy">
            Email
            <input
              type="email"
              name="email"
              required
              className="rounded-lg border border-navy/20 px-3 py-2 outline-none focus:border-navy"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-navy">
            Mot de passe
            <input
              type="password"
              name="password"
              required
              minLength={6}
              className="rounded-lg border border-navy/20 px-3 py-2 outline-none focus:border-navy"
            />
          </label>
          <button
            type="submit"
            className="mt-2 rounded-full bg-coral px-4 py-2 font-medium text-white transition hover:brightness-105"
          >
            Se connecter
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-navy/70">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="font-medium text-navy underline">
            Créer un établissement
          </Link>
        </p>
      </div>
    </main>
  );
}
