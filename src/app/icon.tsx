import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

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
          borderRadius: "50%",
          background: "linear-gradient(135deg, #f0da96 0%, #c9962e 45%, #87591f 100%)",
          fontSize: 18,
        }}
      >
        ❤️
      </div>
    ),
    size
  );
}
