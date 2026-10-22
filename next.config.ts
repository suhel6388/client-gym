import type { NextConfig } from "next";

/** API base used by the development proxy (always ends in `/api/v1`). */
function apiTarget(): string {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000")
    .trim()
    .replace(/\/+$/, "");
  return /\/api\/v1$/i.test(base) ? base : `${base}/api/v1`;
}

const nextConfig: NextConfig = {
  // Static export is only needed for production builds. `next dev` uses the
  // normal dev server, which supports the API proxy rewrites below.
  ...(process.env.NODE_ENV === "production"
    ? { output: "export" as const }
    : {}),
  trailingSlash: true,
  // Keep /api/v1/... untouched in development. Without this, the dev server
  // redirects API calls to a trailing slash before the proxy sees them.
  skipTrailingSlashRedirect: true,
  // In development the browser calls this app's own origin, and Next proxies
  // /api/v1 to the configured backend. Keeping the browser on one origin makes
  // the HttpOnly session cookie first-party: a direct cross-site request to the
  // deployed API is rejected as a third-party cookie, so /auth/me returns 401
  // right after a successful login. Production builds are served by the
  // backend itself (or use the absolute URL baked in at build time), so the
  // proxy is only needed while running `next dev`.
  ...(process.env.NODE_ENV === "development"
    ? {
        async rewrites() {
          return [
            {
              source: "/api/v1/:path*",
              destination: `${apiTarget()}/:path*`,
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;
