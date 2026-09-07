"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState variant="server" onRetry={reset} />;
}
