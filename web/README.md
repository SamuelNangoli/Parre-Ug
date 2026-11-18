# Parre.ug web app

Customer ticketing, organiser tools and a separate platform admin panel, using the supplied Parre.ug brand. All purchases require an account. Browsing events is public.

## Start locally

Use Node 22.22.1 (or the compatible Node versions listed in `package.json`) and npm:

First configure and start the team's Express/MySQL event service on port 3000 using [backend setup](../backend/README.md). It is included in `backend/` with its author's history. In another terminal:

```bash
cd web
npm ci
npm run dev
```

The web development command starts the separate local account/order test API on `127.0.0.1:4174` and Vite, which prints the web address. The public `/api/events` feed is proxied to the team backend on port 3000. If a port is occupied, set `PARRE_API_PORT` to an unused local port. For example:

```bash
PARRE_API_PORT=4176 npm run dev -- --port 5201
```

`npm run build` builds the frontend. To inspect that build, keep the Express backend running, run `npm run api` in one terminal and `npm run preview` in another. Both Vite development and preview route `/api/events` to port 3000 and other `/api` calls to the local adapter. `PARRE_EVENTS_API_URL` can change the team backend origin. A static frontend build alone cannot provide accounts or saved orders. See [connection details and deployment limits](../docs/backend-integration.md).

## Areas and local test accounts

| Area | Route | Test email | Test password |
| --- | --- | --- | --- |
| Customer | `#/` then create an account, or `#/login` | `alex@parre.test` | `ParreCustomer!2026` |
| Organiser | `#/organiser/overview` | `organiser@parre.test` | `ParreOrganiser!2026` |
| Platform admin | `#/admin/overview` | `admin@parre.test` | `ParreAdmin!2026` |
| Second organiser | `#/organiser/overview` | `riverside@parre.test` | `ParreRiverside!2026` |

These are fictitious, publicly documented development accounts. They must never be used for a production deployment. Registration always creates a customer; the browser cannot assign itself an admin role.

## What works

- Customer event search and category filtering, including the team's public database-backed events.
- The five-field team feed is displayed with its supplied price and Kampala date/time; its events show “Tickets available soon” until booking and stock endpoints exist. Existing local managed events keep the test checkout below.
- Quicket poster/reference listings link to the original ticket seller; prices remain in rand. The supplied concert photograph fills the balanced sign-in/sign-up layout. See [media sources](../docs/media-sources.md).
- Event details, General/VIP ticket selection, quantity validation and full-payment or four-instalment plans.
- Account registration, password sign-in, persistent sessions and sign-out.
- Protected checkout. Ticket prices, quantities, availability and payment amounts are checked by the API.
- Mobile Money number entry and a separate Visa/Mastercard payment option.
- Explicitly labelled **local test payments** with success/failure paths; no money moves.
- Customer bookings, payment history, instalment balances and a sample ticket reference after full payment.
- Organiser event/ticket management and bookings, limited to that organiser's events.
- Admin overview, all events/orders, account suspension/restoration and customer support.
- Customer support requests and organiser/admin responses, visible in the customer's booking.
- Responsive branded layouts, favicon, app icons, standalone manifest and browser navigation history.

Unpaid reservations expire after 15 minutes. A successful first instalment holds the booking; this prototype does not yet implement an event-date payment deadline, cancellation or automatic refund policy. Agree these business rules before live deployment.

## Thewton Pay status

The requested gateway is [Thewton Pay](https://pay.thewtontech.com/). Its public site advertises MTN, Airtel, card collections and test mode. On 18 November 2026, opening its API reference redirected to sign-in. No merchant account was created, no subscription was purchased and no gateway API calls were made.

This app is **not connected** to Thewton Pay. The checkout is ready for the integration, but uses a local test adapter. The card option does not collect a PAN, CVV or expiry date. Once the provider's documented hosted-checkout/card-field flow is available, card data should go directly to that provider.

See [the gateway handoff](../docs/payment-gateway-handoff.md) for the information still required. API credentials belong on the server, never in `VITE_*` variables or frontend source. Real payment success must come from a verified gateway response/webhook, not a browser redirect or the current test button.

## Code map

```text
src/App.jsx                         public routing and role gates
src/ManagementApp.jsx               organiser/admin workspace
src/pages/DiscoverPage.jsx          public event catalogue
src/pages/EventPage.jsx             event details and ticket selection
src/pages/AuthPage.jsx              registration and sign-in
src/pages/CheckoutPage.jsx          authenticated checkout
src/pages/MyTicketsPage.jsx         own-account bookings
src/pages/BookingPage.jsx           balances, ticket reference and support
src/pages/ManagementExtras.jsx      admin accounts and support inbox
src/components/PaymentPanel.jsx     Mobile Money/card choice and test preview
src/components/AccountProvider.jsx  session state
src/services/api.js                 frontend API client
src/services/organiser.js           management API adapter
src/lib/backend-events.js          team event-array validation and field mapping
server/app.js                      isolated local development API
server/app.test.js                 account, order and access-control checks
scripts/dev.js                    starts the API and Vite together
```

## Storage and limits

The API persists its development data in `web/.data/parre.json`, which is ignored by Git. Passwords are salted scrypt hashes. Sessions use random tokens in HttpOnly, SameSite cookies; the server stores token hashes. Authenticated changes require a per-session CSRF token. Customer orders and organiser event ownership are checked by the API.

The development API binds to loopback and refuses `NODE_ENV=production`. It uses a single-process JSON store rather than the team's planned Express/PostgreSQL backend. Its HTTP cookie setup is for localhost, not a production security claim. Production needs HTTPS/Secure cookies, an appropriate database, email ownership verification, password recovery, deployment controls, monitoring and an agreed payment/fulfilment policy.

No email, OTP, SMS or Mobile Money prompt is sent. Test ticket references are explicitly not valid for event entry; signed QR generation/scanning remains a backend integration task. Use fictitious details only in this version.

The older browser-local storage entry `parre.organiser.demo.v1` is left untouched. The new API uses its own seed data; any earlier locally edited events are not automatically migrated. Coordinate a reviewed import if those edits are needed.

## Verify

```bash
npm test
npm run build
```

The tests cover the team event contract, Kampala dates, invalid/duplicate feed records, account-required local purchases, role escalation attempts, customer/organiser ownership, CSRF, server-side pricing, stock, failed payments, idempotent retries, instalments, full-payment ticket eligibility, support, session revocation and credential storage.

## Brand and exam handoff

The supplied logo artwork is used in `public/brand/`; browser icon variants retain its shapes and lettering. The palette is black `#000000`, orange `#FF5A00`, text `#1F1F1F`, surface `#F2F2F4` and white `#FFFFFF`. The manifest supports a standalone display; no offline service worker is included.

Keep `server/` inside `web/` until the backend owner replaces this local adapter. The team's original root README is unchanged. The friend's `backend/` and `database/` are imported through a Git merge rather than replacing his history. Review and understand the assisted implementation, declare AI use as the exam requires, and capture final evidence against the submitted Git commit.
