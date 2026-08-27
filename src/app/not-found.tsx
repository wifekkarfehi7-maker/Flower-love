import Link from "next/link";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  return (
    <section className="flex min-h-[calc(100vh-5rem)] items-center bg-ink-50/60 py-20">
      <Container className="max-w-md text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-gradient shadow-soft">
          <Heart className="h-6 w-6 text-ink-950" fill="currentColor" />
        </span>
        <h1 className="mt-6 font-heading text-3xl font-bold text-ink-900">404</h1>
        <p className="mt-3 text-ink-500">عذراً، الصفحة التي تبحثون عنها غير موجودة.</p>
        <Button asChild variant="gold" className="mt-8">
          <Link href="/">العودة إلى الرئيسية</Link>
        </Button>
      </Container>
    </section>
  );
}
