import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { BUSINESS_WHATSAPP } from "@/lib/config";

export const metadata: Metadata = {
  title: "سياسة الخصوصية — Flower & Love",
  description: "كيف تجمع Flower & Love بياناتك وتستخدمها وتحميها.",
};

const formattedWhatsapp = `+${BUSINESS_WHATSAPP.slice(0, 3)} ${BUSINESS_WHATSAPP.slice(3, 5)} ${BUSINESS_WHATSAPP.slice(5, 8)} ${BUSINESS_WHATSAPP.slice(8)}`;

export default function PrivacyPage() {
  return (
    <section className="bg-background py-20 sm:py-28">
      <Container className="max-w-3xl">
        <span className="text-sm font-semibold tracking-wide text-gold-600">قانوني</span>
        <h1 className="mt-3 font-heading text-3xl font-bold text-ink-900 sm:text-4xl">سياسة الخصوصية</h1>
        <p className="mt-4 text-sm text-ink-400">آخر تحديث: 2026</p>

        <div className="prose prose-neutral mt-10 max-w-none space-y-8 text-ink-600">
          <div>
            <h2 className="font-heading text-xl font-semibold text-ink-900">١. البيانات التي نجمعها</h2>
            <p className="mt-3 leading-relaxed">
              عند إنشاء حساب على منصة Flower &amp; Love، نجمع الاسم الكامل، البريد الإلكتروني، رقم
              الواتساب، الدولة، واللغة المفضلة. كما نجمع بيانات دعوتكم (أسماء، صور، تواريخ، نصوص) وبيانات
              الضيوف التي تُدخلونها لأغراض إدارة تأكيد الحضور (RSVP).
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl font-semibold text-ink-900">٢. لماذا نطلب رقم الواتساب</h2>
            <p className="mt-3 leading-relaxed">
              رقم الواتساب الخاص بك مطلوب حتى نتمكن من التواصل معك بخصوص دعوتك، الدفع، وطلبك. نستخدمه
              حصرياً للتنسيق حول تفعيل دعوتكم وتقديم الدعم الفني، ولا نستخدمه لأي غرض تسويقي غير مرغوب فيه.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl font-semibold text-ink-900">٣. عدم بيع أو مشاركة بياناتكم</h2>
            <p className="mt-3 leading-relaxed">
              لا نبيع ولا نشارك رقم واتسابكم أو بيانات ضيوفكم مع أي طرف ثالث لأغراض تجارية. بيانات ضيوفكم
              (الأسماء، أرقام الهواتف، الرسائل) خاصة تماماً بحسابكم ولا تُعرض للعامة أبداً.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl font-semibold text-ink-900">٤. أمان البيانات</h2>
            <p className="mt-3 leading-relaxed">
              نعتمد إجراءات تقنية وتنظيمية لحماية بياناتكم، بما في ذلك التحكم في الصلاحيات بحيث لا يصل إلى
              معلومات التواصل الخاصة بكم سوى فريق الإدارة المصرح له.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl font-semibold text-ink-900">٥. ملفات تعريف الارتباط والتحليلات</h2>
            <p className="mt-3 leading-relaxed">
              نستخدم تخزيناً محلياً بسيطاً (مثل تفضيل اللغة) لتحسين تجربتكم، وقد نجمع إحصائيات مجهولة الهوية
              حول زيارات صفحات الدعوات (عدد المشاهدات) لمساعدتكم على متابعة أداء دعوتكم.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl font-semibold text-ink-900">٦. تواصلوا معنا</h2>
            <p className="mt-3 leading-relaxed">
              لأي استفسار يخص خصوصيتكم أو بياناتكم، يمكنكم التواصل معنا مباشرة عبر واتساب على الرقم{" "}
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
