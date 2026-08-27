import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { BUSINESS_WHATSAPP } from "@/lib/config";

export const metadata: Metadata = {
  title: "شروط الاستخدام — Flower & Love",
  description: "الشروط والأحكام الخاصة باستخدام منصة Flower & Love.",
};

const formattedWhatsapp = `+${BUSINESS_WHATSAPP.slice(0, 3)} ${BUSINESS_WHATSAPP.slice(3, 5)} ${BUSINESS_WHATSAPP.slice(5, 8)} ${BUSINESS_WHATSAPP.slice(8)}`;

export default function TermsPage() {
  return (
    <section className="bg-background py-20 sm:py-28">
      <Container className="max-w-3xl">
        <span className="text-sm font-semibold tracking-wide text-gold-600">قانوني</span>
        <h1 className="mt-3 font-heading text-3xl font-bold text-ink-900 sm:text-4xl">شروط الاستخدام</h1>
        <p className="mt-4 text-sm text-ink-400">آخر تحديث: 2026</p>

        <div className="prose prose-neutral mt-10 max-w-none space-y-8 text-ink-600">
          <div>
            <h2 className="font-heading text-xl font-semibold text-ink-900">١. طبيعة الخدمة</h2>
            <p className="mt-3 leading-relaxed">
              Flower &amp; Love منصة لإنشاء دعوات زفاف رقمية وتخصيصها. يمكنكم إنشاء دعوة ومعاينتها مجاناً،
              أما نشر الدعوة وتفعيلها بشكل نهائي فيتطلب اختيار باقة مدفوعة.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl font-semibold text-ink-900">٢. آلية الدفع اليدوي عبر واتساب</h2>
            <p className="mt-3 leading-relaxed">
              بعد اختيار الباقة، يتم إنشاء طلب في حسابكم وتوجيهكم للتواصل معنا عبر واتساب على الرقم{" "}
              <span dir="ltr" className="font-semibold text-ink-900">
                {formattedWhatsapp}
              </span>{" "}
              لإتمام الدفع بالطريقة المتفق عليها معكم. تُفعَّل الدعوة رسمياً فقط بعد تأكيد فريقنا لاستلام
              الدفع.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl font-semibold text-ink-900">٣. مسؤولية المحتوى</h2>
            <p className="mt-3 leading-relaxed">
              أنتم مسؤولون عن دقة المعلومات والصور التي تُضيفونها إلى دعوتكم. يُمنع رفع محتوى مخالف للقانون
              أو للآداب العامة، ونحتفظ بالحق في إيقاف أي دعوة تخالف هذه الشروط.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl font-semibold text-ink-900">٤. الاسترجاع والإلغاء</h2>
            <p className="mt-3 leading-relaxed">
              نظراً لطبيعة الخدمة الرقمية المخصصة، تُدرس طلبات الاسترجاع أو الإلغاء حالة بحالة بالتواصل
              المباشر معنا عبر واتساب.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl font-semibold text-ink-900">٥. التواصل</h2>
            <p className="mt-3 leading-relaxed">
              لأي سؤال يتعلق بهذه الشروط، تواصلوا معنا عبر واتساب على الرقم{" "}
              <span dir="ltr" className="font-semibold text-ink-900">
                {formattedWhatsapp}
              </span>
              .
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
