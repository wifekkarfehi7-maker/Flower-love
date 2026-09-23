import { QuietNotice } from "@/components/quiet-notice";

export default function GlobalNotFound() {
  return (
    <QuietNotice
      standalone
      lang="ar"
      eyebrow="404"
      title="الصفحة غير موجودة"
      body="عذراً، الصفحة التي تبحثون عنها غير موجودة أو تم نقلها."
      action={{ href: "/", label: "العودة إلى الرئيسية" }}
    />
  );
}
