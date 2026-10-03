import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard } from "@/lib/guard";
import { normPhone } from "@/lib/validate";

const Body = z.object({
  email: z.string().trim().toLowerCase().email().max(254), name: z.string().trim().max(60).optional(),
  phone: z.string().max(20).transform(normPhone).refine((v) => v !== ""),
  consent: z.literal(true), website: z.string().optional(), turnstile: z.string().max(2048).optional(),
}).strict();

export async function POST(req: Request) {
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid details" }, { status: 400 });
  const blocked = await guard(req, { name: "leads", max: 5, windowSec: 3600, token: p.data.turnstile });
  if (blocked) return blocked;
  if (p.data.website) return NextResponse.json({ ok: true }); // honeypot filled: pretend success
  const { email, name, phone } = p.data;
  await db.lead.upsert({ where: { email }, update: { name, phone }, create: { email, name, phone, consentAt: new Date(), source: "modal" } });
  return NextResponse.json({ ok: true }); // same answer for new and existing emails
}
