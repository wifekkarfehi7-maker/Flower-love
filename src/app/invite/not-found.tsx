import { QuietNotice } from "@/components/quiet-notice";

export default function InvitationNotFound() {
  return (
    <QuietNotice
      standalone
      lang="ar"
      eyebrow="دعوة"
      title="الدعوة غير متاحة"
      body="هذه الدعوة غير موجودة، أو لم يتم تفعيلها بعد من قبل صاحبها."
      action={{ href: "/", label: "العودة إلى الرئيسية" }}
    />
  );
}
