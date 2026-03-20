/** @type {import('next').NextConfig} */

const securityHeaders = [
  // Prevent DNS prefetch leaking visited subresources
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // Enforce HTTPS for 2 years (including subdomains)
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Prevent the page from being embedded in a frame on another origin
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Stop browsers from MIME-sniffing the content type
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Legacy XSS filter (belt-and-suspenders for older browsers)
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Limit referrer information sent to third parties
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable sensitive browser features not required by the app
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js requires unsafe-inline for its runtime scripts/styles
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      // Allow images from any https source plus data URIs (canvas/SVG exports)
      "img-src 'self' data: https:",
      // Allow XHR/WS to Supabase, Upstash, and any configured API URL
      "connect-src 'self' https: wss:",
      "font-src 'self'",
      // Never allow the app to be embedded as a frame
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

module.exports = nextConfig;
