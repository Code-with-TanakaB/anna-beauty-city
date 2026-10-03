// Static CSP. 'unsafe-inline' scripts keep Next.js working; a nonce-based CSP in middleware is stronger if you have time.
const csp = ["default-src 'self'", "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com", "frame-src https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", "font-src https://fonts.gstatic.com", "img-src 'self' data: blob:", "connect-src 'self'",
  "form-action 'self' https://www.payfast.co.za https://sandbox.payfast.co.za", "frame-ancestors 'none'", "base-uri 'self'", "object-src 'none'"].join("; ");
export default {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: [
      { key: "Content-Security-Policy", value: csp },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "X-Content-Type-Options", value: "nosniff" }, { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ] }];
  },
};
