import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "تعيين كلمة سر جديدة — Flower & Love",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
