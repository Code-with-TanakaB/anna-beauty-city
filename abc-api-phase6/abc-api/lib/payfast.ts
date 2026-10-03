import crypto from "crypto";
// PayFast expects PHP urlencode semantics.
export const enc = (v: string) =>
  encodeURIComponent(v.trim()).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()).replace(/~/g, "%7E").replace(/%20/g, "+");
export const paramString = (p: [string, string][]) => p.filter(([, v]) => v !== "").map(([k, v]) => `${k}=${enc(v)}`).join("&");
export function sign(p: [string, string][]) {
  const pass = process.env.PAYFAST_PASSPHRASE;
  const s = paramString(p) + (pass ? `&passphrase=${enc(pass)}` : "");
  return crypto.createHash("md5").update(s).digest("hex");
}
export const host = () => (process.env.PAYFAST_SANDBOX === "true" ? "https://sandbox.payfast.co.za" : "https://www.payfast.co.za");
export function checkoutForm(o: { id: string; number: number; totalCents: number; name: string; email: string }) {
  const app = process.env.APP_URL!;
  const f: [string, string][] = [
    ["merchant_id", process.env.PAYFAST_MERCHANT_ID!], ["merchant_key", process.env.PAYFAST_MERCHANT_KEY!],
    ["return_url", `${app}/order/${o.id}`], ["cancel_url", `${app}/cart`], ["notify_url", `${app}/api/payments/payfast/notify`],
    ["name_first", o.name.split(" ")[0]], ["email_address", o.email],
    ["m_payment_id", o.id], ["amount", (o.totalCents / 100).toFixed(2)], ["item_name", `Anna's Beauty City order #${o.number}`],
  ];
  return { url: `${host()}/eng/process`, fields: [...f, ["signature", sign(f)] as [string, string]] };
}
