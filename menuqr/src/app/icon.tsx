import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** A QR finder-pattern square with a "menu line" through it. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f766e",
          borderRadius: 7,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ display: "flex", gap: 3 }}>
            <div style={{ width: 7, height: 7, border: "2px solid #ffffff", borderRadius: 1 }} />
            <div style={{ width: 7, height: 7, border: "2px solid #ffffff", borderRadius: 1 }} />
          </div>
          <div style={{ display: "flex", gap: 3 }}>
            <div style={{ width: 7, height: 7, border: "2px solid #ffffff", borderRadius: 1 }} />
            <div style={{ width: 7, height: 7, background: "#f59e0b", borderRadius: 1 }} />
          </div>
        </div>
      </div>
    ),
    size
  );
}
