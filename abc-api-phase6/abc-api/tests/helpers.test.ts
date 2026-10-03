import { describe, expect, it } from "vitest";
import { enc } from "../lib/payfast";
import { normPhone } from "../lib/validate";
import { requireAdmin } from "../lib/auth";

describe("payfast enc", () => {
  it("matches PHP urlencode", () => expect(enc("Anna's (nail) ~ set!")).toBe("Anna%27s+%28nail%29+%7E+set%21"));
});
describe("normPhone", () => {
  it("normalises valid numbers", () => { expect(normPhone("063 037 3911")).toBe("+27630373911"); expect(normPhone("+27-63-037-3911")).toBe("+27630373911"); });
  it("rejects bad numbers", () => { expect(normPhone("12345")).toBe(""); expect(normPhone("0930373911")).toBe(""); });
});
describe("requireAdmin", () => {
  const req = (t?: string) => new Request("http://x", { headers: t ? { "x-admin-token": t } : {} });
  it("denies when no token is configured", () => { delete process.env.ADMIN_API_TOKEN; expect(() => requireAdmin(req("abc"))).toThrow(); });
  it("denies wrong or missing tokens", () => { process.env.ADMIN_API_TOKEN = "secret-token"; expect(() => requireAdmin(req())).toThrow(); expect(() => requireAdmin(req("secret-tokex"))).toThrow(); });
  it("allows the right token", () => { process.env.ADMIN_API_TOKEN = "secret-token"; expect(requireAdmin(req("secret-token"))).toBe("admin"); });
});
