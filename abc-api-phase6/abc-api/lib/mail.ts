export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
export const rand = (c: number) => "R " + (c / 100).toFixed(2);
// Never throws: a mail failure must not fail an order. Always escape user data with esc() before putting it in html.
export async function mail(to: string, subject: string, html: string) {
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject: subject.replace(/[\r\n]/g, " "), html }),
    });
    if (!r.ok) console.error("mail failed", r.status);
  } catch (e) { console.error("mail error", e); }
}
