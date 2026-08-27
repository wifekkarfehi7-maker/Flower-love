import Link from "next/link";
import { Heart } from "lucide-react";

export default function InvitationNotFound() {
  return (
    <section className="flex min-h-screen items-center justify-center bg-ink-50/60 px-5 py-20 text-center">
      <div className="max-w-md">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-gradient shadow-soft">
          <Heart className="h-6 w-6 text-ink-950" fill="currentColor" />
        </span>
        <h1 className="mt-6 font-heading text-2xl font-bold text-ink-900">الدعوة غير متاحة</h1>
        <p className="mt-3 text-ink-500">هذه الدعوة غير موجودة، أو لم يتم تفعيلها بعد من قبل صاحبها.</p>
        <Link
          href="/"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-gold-gradient px-6 text-base font-semibold text-ink-950 shadow-soft"
        >
          العودة إلى الرئيسية
        </Link>
      </div>
    </section>
  );
}
