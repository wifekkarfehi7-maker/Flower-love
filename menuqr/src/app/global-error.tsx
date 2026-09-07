"use client";

import { defaultLocale } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";

const t = dictionaries[defaultLocale];

/**
 * Replaces the root layout when it is the layout itself that failed, so it
 * renders its own document and cannot rely on providers or global styles.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ar-TN" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          padding: "2rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#fbfaf9",
          color: "#1c1f23",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>{t.errors.serverErrorTitle}</h1>
        <p style={{ margin: 0, color: "#667085", maxWidth: "24rem" }}>{t.errors.serverErrorText}</p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "0.75rem",
            padding: "0.625rem 1.25rem",
            borderRadius: "0.5rem",
            border: "none",
            background: "#0f766e",
            color: "#fff",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          {t.common.retry}
        </button>
      </body>
    </html>
  );
}
