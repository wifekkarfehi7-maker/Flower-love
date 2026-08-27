import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "استعادة كلمة السر — Flower & Love",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
