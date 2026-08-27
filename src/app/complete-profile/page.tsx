import type { Metadata } from "next";
import { Suspense } from "react";

import { CompleteProfileForm } from "@/components/auth/complete-profile-form";

export const metadata: Metadata = {
  title: "إكمال الملف الشخصي — Flower & Love",
};

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={null}>
      <CompleteProfileForm />
    </Suspense>
  );
}
