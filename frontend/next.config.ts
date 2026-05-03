import type { NextConfig } from "next";

/** Express server origin (no path). Set on Vercel for the frontend so /api/v1 proxies to your backend. */
const backendOrigin =
  process.env.BACKEND_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN?.replace(/\/$/, "") ||
  "";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },

  // ── Security Headers ─────────────────────────────────
  // These headers prevent firewalls/WAFs from blocking the app
  // and improve security posture so CDNs cache properly.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent MIME sniffing (firewalls check this)
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // XSS protection
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Referrer policy (privacy-friendly)
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Permissions policy (disable unused browser features)
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
      {
        // Cache static assets aggressively (JS/CSS/images)
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Cache images for 1 day
        source: '/_next/image(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=43200' },
        ],
      },
    ];
  },

  // ── API Proxy to Backend ─────────────────────────────
  async rewrites() {
    if (!backendOrigin) {
      return [];
    }
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendOrigin}/api/v1/:path*`,
      },
    ];
  },

  // ── Performance ──────────────────────────────────────
  // Compress output
  compress: true,
  // Strict React mode for better error detection
  reactStrictMode: true,
  // Reduce bundle size by enabling tree-shaking
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },
};

export default nextConfig;
