/**
 * The Supabase origin is whatever NEXT_PUBLIC_SUPABASE_URL points at, so both
 * the image allow-list and the CSP are derived from it rather than hard-coding
 * supabase.co. Without this, menu images 404 (or crash next/image) on a local
 * `supabase start` stack and on any self-hosted Supabase behind a custom domain.
 */
function supabaseOrigin() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return { protocol: url.protocol.replace(":", ""), hostname: url.hostname, port: url.port, origin: url.origin };
  } catch {
    return null;
  }
}

const supabase = supabaseOrigin();

const imageRemotePatterns = [
  { protocol: "https", hostname: "**.supabase.co" },
  ...(supabase && supabase.hostname !== "**.supabase.co"
    ? [
        {
          protocol: supabase.protocol,
          hostname: supabase.hostname,
          port: supabase.port,
          pathname: "/storage/v1/object/public/**",
        },
      ]
    : []),
];

const supabaseSources = ["https://*.supabase.co", ...(supabase ? [supabase.origin] : [])].join(" ");
const supabaseSockets = ["wss://*.supabase.co", ...(supabase ? [supabase.origin.replace(/^http/, "ws")] : [])].join(" ");

// CSP is production-only: Next's dev-mode webpack (HMR/React Refresh) needs
// 'unsafe-eval', and we'd rather scope that to development than weaken the
// real policy. script-src keeps 'unsafe-inline' for the no-flash-locale
// bootstrap script (next/script beforeInteractive) — deliberately *not*
// using CSP nonces here, since Next 14.2.x has an open advisory for XSS via
// nonce-based CSP in the App Router (GHSA-ffhc-5mcf-pf4q); unsafe-inline
// sidesteps that specific attack surface instead of walking into it.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseSources}`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseSources} ${supabaseSockets}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  ...(process.env.NODE_ENV === "production" ? [{ key: "Content-Security-Policy", value: CSP }] : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: imageRemotePatterns,
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
