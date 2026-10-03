import crypto from "crypto";
// INTERIM admin guard (deny by default). Phase 5 replaces this with Auth.js sessions, 2FA and lockout.
export function requireAdmin(req: Request) {
  const a = Buffer.from(req.headers.get("x-admin-token") ?? ""), b = Buffer.from(process.env.ADMIN_API_TOKEN ?? "");
  if (!b.length || a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new Response("Unauthorized", { status: 401 });
  return "admin";
}
