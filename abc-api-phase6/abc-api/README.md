# Anna's Beauty City: backend (Phase 4)
Next.js + Prisma + PostgreSQL. Untested draft: run through the steps below before trusting it.

## Run it
1. `npm install`
2. `cp .env.example .env` and fill it in (Resend key, owner email, admin token)
3. `docker compose up -d` (Postgres)
4. `npx prisma migrate dev --name init && npm run db:seed`
5. `npm run dev`

## Order flow
1. `POST /api/checkout` validates the cart, prices it from the database, creates a PENDING order, emails Anna, and returns PayFast form fields (or EFT details).
2. PayFast calls `/api/payments/payfast/notify` (needs a public URL such as ngrok). After signature, server, merchant and amount checks the payment becomes AWAITING_APPROVAL and Anna is emailed.
3. Anna approves: `curl -X POST localhost:3000/api/admin/payments/PAYMENT_ID -H "x-admin-token: $ADMIN_API_TOKEN" -H "content-type: application/json" -d '{"action":"approve"}'`. The order moves to PROCESSING, stock drops in one transaction, and the customer is emailed. Reject needs a `reason`.

## Not included yet
- Wiring the storefront checkout to `/api/checkout` (next step)
- Yoco and Ozow adapters, EFT proof-of-payment upload, stock reservation
- Admin UI, Auth.js login, 2FA (Phase 5; `lib/auth.ts` is a temporary token guard)
- Turnstile and rate limiting, lead and contact routes, security headers (Phase 6)

## Phase 6: hardening
- `lib/guard.ts`: Origin check, JSON-only, per-IP rate limit (Postgres, `lib/ratelimit.ts`), Cloudflare Turnstile (fails closed in production)
- `/api/leads` and `/api/contact` added; `/api/checkout` now guarded. Run `npx prisma migrate dev --name hardening` for the new RateLimit table
- `next.config.mjs`: CSP, HSTS and other security headers. If the storefront lives on a different domain you will also need CORS
- `npm test` covers the helpers only (PayFast encoding, phone checks, admin guard). Routes and the database flow are still untested
- See LAUNCH.md before going live
