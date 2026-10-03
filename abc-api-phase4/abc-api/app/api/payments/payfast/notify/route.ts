import crypto from "crypto";
import { db } from "@/lib/db";
import { mail, rand } from "@/lib/mail";
import { host, paramString, sign } from "@/lib/payfast";

// PayFast ITN. Payment moves to AWAITING_APPROVAL only; Anna still approves it by hand.
export async function POST(req: Request) {
  const pairs = [...new URLSearchParams(await req.text()).entries()];
  const got = pairs.find(([k]) => k === "signature")?.[1] ?? "";
  const data = pairs.filter(([k]) => k !== "signature");
  const want = sign(data);
  if (got.length !== want.length || !crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want))) return new Response("bad signature", { status: 400 });
  const v = Object.fromEntries(data);
  const server = await fetch(`${host()}/eng/query/validate`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: paramString(data) });
  if ((await server.text()).trim() !== "VALID") return new Response("not valid", { status: 400 });

  const pay = await db.payment.findUnique({ where: { orderId: v.m_payment_id }, include: { order: true } });
  if (!pay || v.merchant_id !== process.env.PAYFAST_MERCHANT_ID || v.amount_gross !== (pay.amountCents / 100).toFixed(2)) return new Response("mismatch", { status: 400 });
  if (v.payment_status !== "COMPLETE" || pay.status !== "UNPAID") return new Response("ok"); // idempotent: repeats and non-final states are ignored

  await db.payment.update({ where: { id: pay.id }, data: { status: "AWAITING_APPROVAL", providerRef: v.pf_payment_id } });
  await mail(process.env.OWNER_EMAIL!, `Payment received for order #${pay.order.number}`, `<p>${rand(pay.amountCents)} arrived via PayFast. Please approve or reject it in your dashboard.</p>`);
  return new Response("ok");
}
