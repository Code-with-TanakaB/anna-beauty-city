# Launch checklist
## Must be done before real customers
- [ ] Real admin login (Auth.js, hashed password, lockout, 2FA). `lib/auth.ts` is only a temporary token guard
- [ ] Connect the storefront checkout, lead modal and contact form to `/api/checkout`, `/api/leads`, `/api/contact` (send the Turnstile token as `turnstile`)
- [ ] Discount codes: the lead modal promises WELCOME10, but no code table or checkout check exists yet
- [ ] Replace sample data: prices, ratings, About text, opening hours, phone number (063 037 3911 or 067 818 9775), locations
- [ ] Storefront: set `SAMPLE_FEED=false` and feed the 90-second pop-up from real paid orders (town only), or remove it
- [ ] Legal pages reviewed by a South African lawyer; check Information Regulator (POPIA) registration duties for the business
## Accounts and config
- [ ] PayFast live merchant account, then `PAYFAST_SANDBOX=false` and real keys; set a passphrase in both PayFast and `.env`
- [ ] Email domain verified (SPF, DKIM) with Resend; send a test order email to Anna
- [ ] Cloudflare Turnstile site and secret keys; `TURNSTILE_SECRET_KEY` set (production fails closed without it)
- [ ] `ADMIN_API_TOKEN` is a long random value; HTTPS only; `APP_URL` correct; `ALLOWED_ORIGINS` set if the storefront is on another domain
- [ ] Postgres backups switched on, and a restore tested once
## Test before launch
- [ ] `npm test` passes; `npm audit` reviewed
- [ ] Sandbox order end to end: checkout, PayFast notify, Anna's email, approve, stock drops, customer email
- [ ] Reject flow, out-of-stock approval (expect 409), repeated notify (no double processing)
- [ ] Spam test: 6 quick lead submissions should return 429; honeypot and missing Turnstile token are blocked
- [ ] Security headers visible (check securityheaders.com); form posts to PayFast still work under the CSP
## Not built yet
Yoco and Ozow, EFT proof-of-payment upload, stock reservation, admin UI in the backend project, CSV exports.
