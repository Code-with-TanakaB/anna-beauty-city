import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard } from "@/lib/guard";
import { mail, esc } from "@/lib/mail";
import { normPhone } from "@/lib/validate";

const Body = z.object({
  name: z.string().trim().min(1).max(60), email: z.string().trim().email().max(254),
  phone: z.string().max(20).optional().transform((v) => (v ? normPhone(v) : "")).refine((v) => v === "" || v.startsWith("+27")),
  subject: z.enum(["Nails", "Scrunchies", "Order enquiry", "Other"]), message: z.string().trim().min(5).max(1000),
  website: z.string().optional(), turnstile: z.string().max(2048).optional(),
}).strict();

export async function POST(req: Request) {
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid details" }, { status: 400 });
  const blocked = await guard(req, { name: "contact", max: 5, windowSec: 3600, token: p.data.turnstile });
  if (blocked) return blocked;
  if (p.data.website) return NextResponse.json({ ok: true });
  const { name, email, phone, subject, message } = p.data;
  await db.contactMessage.create({ data: { name, email, phone: phone || null, subject, message } });
  // No user text in email headers: fixed subject, escaped body.
  await mail(process.env.OWNER_EMAIL!, "New website message", `<p><b>${esc(subject)}</b> from ${esc(name)} (${esc(email)}${phone ? ", " + esc(phone) : ""})</p><p>${esc(message).replace(/\n/g, "<br>")}</p>`);
  return NextResponse.json({ ok: true });
}
