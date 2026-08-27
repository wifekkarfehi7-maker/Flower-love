import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "تسجيل الدخول — Flower & Love",
};

export default function LoginPage() {
  return <ComingSoon variant="login" />;
}
