import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { mail, esc, rand } from "@/lib/mail";
import { checkoutForm } from "@/lib/payfast";

const OPT = { poly: { name: "Poly gel upgrade", cents: 4000 }, xl: { name: "XL length", cents: 3000 } };
const Body = z.object({
  customer: z.object({
    name: z.string().trim().min(1).max(80), email: z.string().trim().email().max(254),
    phone: z.string().regex(/^(\+27|0)[1-8]\d{8}$/), address: z.string().trim().min(5).max(200), province: z.string().trim().max(40),
  }).strict(),
  items: z.array(z.object({ slug: z.string().max(80), qty: z.number().int().min(1).max(20), options: z.array(z.enum(["poly", "xl"])).max(2).default([]) }).strict()).min(1).max(30),
  method: z.enum(["payfast", "eft"]),
  website: z.string().optional(), // honeypot
}).strict();

// TODO(Phase 6): Cloudflare Turnstile + per-IP/email rate limiting on this route.
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid details" }, { status: 400 });
  const { customer: c, items, method, website } = parsed.data;
  if (website) return NextResponse.json({ ok: true }); // bot: pretend success

  // Prices always come from the database, never from the browser.
  const prods = await db.product.findMany({ where: { slug: { in: items.map((i) => i.slug) } } });
  const lines = items.map((i) => {
    const p = prods.find((x) => x.slug === i.slug);
    if (!p) throw new Error("UNKNOWN_PRODUCT");
    const opts = p.isService ? [...new Set(i.options)] : [];
    return { productId: p.id, name: p.name, qty: i.qty, isService: p.isService, options: opts.map((o) => OPT[o].name).join(", ") || null,
      unitCents: p.priceCents + opts.reduce((a, o) => a + OPT[o].cents, 0) };
  });
  const subtotal = lines.reduce((a, l) => a + l.unitCents * l.qty, 0);
  const ships = lines.some((l) => !l.isService);
  const delivery = !ships || subtotal >= +process.env.FREE_OVER_CENTS! ? 0 : +process.env.DELIVERY_CENTS!;
  const total = subtotal + delivery;

  const order = await db.order.create({
    data: { ...c, subtotalCents: subtotal, deliveryCents: delivery, totalCents: total,
      items: { create: lines.map(({ isService, ...l }) => l) }, payment: { create: { provider: method, amountCents: total } } },
  });
  const rows = lines.map((l) => `<li>${esc(l.name)} x ${l.qty}${l.options ? ` (${esc(l.options)})` : ""} - ${rand(l.unitCents * l.qty)}</li>`).join("");
  await mail(process.env.OWNER_EMAIL!, `New order #${order.number} (${rand(total)})`,
    `<h2>New order #${order.number}</h2><ul>${rows}</ul><p>Total ${rand(total)} via ${method}.</p><p>${esc(c.name)}, ${esc(c.phone)}, ${esc(c.email)}<br>${esc(c.address)}, ${esc(c.province)}</p><p>Approve the payment in your dashboard once it arrives.</p>`);
  await mail(c.email, `We got your order #${order.number}`, `<p>Thanks ${esc(c.name.split(" ")[0])}! Anna will confirm your order once your payment is approved.</p>`);

  return NextResponse.json({ orderId: order.id, token: order.accessToken, number: order.number,
    ...(method === "payfast" ? { redirect: checkoutForm({ id: order.id, number: order.number, totalCents: total, name: c.name, email: c.email }) } : { eft: process.env.EFT_DETAILS }) });
}
