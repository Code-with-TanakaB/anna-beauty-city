import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { decidePayment } from "@/lib/orders";
import { mail, esc } from "@/lib/mail";

const Body = z.object({ action: z.enum(["approve", "reject"]), reason: z.string().trim().max(300).optional() }).strict();

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = requireAdmin(req);
    const b = Body.safeParse(await req.json().catch(() => null));
    if (!b.success || (b.data.action === "reject" && !b.data.reason)) return NextResponse.json({ error: "Reject needs a reason" }, { status: 400 });
    const order = await decidePayment((await params).id, admin, b.data.action, b.data.reason);
    await mail(order.email, `Order #${order.number} ${b.data.action === "approve" ? "confirmed" : "update"}`,
      b.data.action === "approve" ? "<p>Your payment is approved and your order is being processed. Thank you!</p>" : `<p>We could not approve your payment: ${esc(b.data.reason!)}. Please contact us on 063 037 3911.</p>`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    const m = e instanceof Error ? e.message : "";
    return NextResponse.json({ error: m }, { status: m === "NOT_PENDING" || m === "OUT_OF_STOCK" ? 409 : 500 });
  }
}
