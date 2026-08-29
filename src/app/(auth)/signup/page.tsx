import Link from "next/link";
import { signup } from "../actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="font-serif text-2xl text-navy">Créer un compte</h1>
        <p className="mt-1 text-sm text-navy/70">
          Créez votre compte gérant, vous pourrez ensuite ajouter votre
          établissement.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-coral/10 px-3 py-2 text-sm text-coral">
            {error}
          </p>
        )}

        <form action={signup} className="mt-6 flex flex-col gap-4">
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
            Créer mon compte
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-navy/70">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-medium text-navy underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
