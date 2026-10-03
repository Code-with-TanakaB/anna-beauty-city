import { NextResponse } from "next/server";
import { limit } from "@/lib/ratelimit";

// x-forwarded-for is only trustworthy behind a proxy you control (Vercel, Cloudflare, nginx). Check your host.
export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";

async function turnstile(token: string | undefined, ip: string) {
  if (!token) return false;
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY!, response: token, remoteip: ip }),
  });
  return ((await r.json()) as { success?: boolean }).success === true;
}

// Origin check (CSRF), per-IP rate limit, then Turnstile. Returns a response to send back, or null to continue.
export async function guard(req: Request, o: { name: string; max: number; windowSec: number; token?: string }) {
  const origin = req.headers.get("origin");
  const ok = [new URL(process.env.APP_URL!).origin, ...(process.env.ALLOWED_ORIGINS ?? "").split(",").filter(Boolean)];
  if (origin && !ok.includes(origin)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!req.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ error: "Bad request" }, { status: 415 });
  const ip = clientIp(req);
  if (!(await limit(`${o.name}:${ip}`, o.max, o.windowSec))) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(o.windowSec) } });
  if (!process.env.TURNSTILE_SECRET_KEY) {
    if (process.env.NODE_ENV === "production") { console.error("TURNSTILE_SECRET_KEY missing"); return NextResponse.json({ error: "Unavailable" }, { status: 503 }); }
    return null; // local development only
  }
  if (!(await turnstile(o.token, ip))) return NextResponse.json({ error: "Bot check failed" }, { status: 403 });
  return null;
}
