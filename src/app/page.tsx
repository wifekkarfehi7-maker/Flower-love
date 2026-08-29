import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <h1 className="font-serif text-5xl text-navy">Skanini</h1>
      <p className="max-w-md text-navy/80">
        Le menu digital et la commande par QR code pour votre établissement —
        sans application à télécharger.
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-full bg-coral px-6 py-3 font-medium text-white transition hover:brightness-105"
        >
          Espace gérant
        </Link>
      </div>
    </main>
  );
}
