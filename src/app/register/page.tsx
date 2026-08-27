import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "إنشاء حساب — Flower & Love",
};

export default function RegisterPage() {
  return <ComingSoon variant="register" />;
}
