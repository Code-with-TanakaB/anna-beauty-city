import { db } from "@/lib/db";
// Payment is approved by a human. Only AWAITING_APPROVAL payments on PENDING orders can be decided.
export async function decidePayment(paymentId: string, admin: string, action: "approve" | "reject", reason?: string) {
  return db.$transaction(async (tx) => {
    const p = await tx.payment.findUnique({ where: { id: paymentId }, include: { order: { include: { items: { include: { product: true } } } } } });
    if (!p || p.status !== "AWAITING_APPROVAL" || p.order.status !== "PENDING") throw new Error("NOT_PENDING");
    const to = action === "approve" ? "PROCESSING" : "REJECTED";
    if (action === "approve") {
      for (const i of p.order.items.filter((i) => !i.product.isService)) {
        const r = await tx.product.updateMany({ where: { id: i.productId, stock: { gte: i.qty } }, data: { stock: { decrement: i.qty } } });
        if (r.count === 0) throw new Error("OUT_OF_STOCK");
      }
    }
    await tx.payment.update({ where: { id: p.id }, data: { status: action === "approve" ? "APPROVED" : "REJECTED", approvedBy: admin, approvedAt: new Date() } });
    await tx.order.update({ where: { id: p.orderId }, data: { status: to } });
    await tx.statusLog.create({ data: { orderId: p.orderId, from: p.order.status, to, by: admin, note: reason ?? null } });
    return p.order;
  });
}
