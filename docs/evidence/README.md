# Current web app verification

Checked on 18 November 2026, Africa/Kampala. Source: `feature/organiser-web`, including the imported team Express/MySQL backend. The commerce walkthrough below predates the photographic layout; the public catalogue, authentication layouts and backend connection were checked again after that update. All accounts, payments and local tickets used here are fictitious.

## Automated checks

- `npm test`: **28 reported tests passed, 0 failed**. The count includes the enclosing integration test.
- `npm run build`: **passed**.
- [Test output](commerce-tests.tap), [build output](commerce-build.txt) and [current verification record](commerce-verification.json).

Coverage includes required accounts, role escalation rejection, customer/organiser ownership, CSRF, saved server prices, capacity, failed payments, idempotent retries, instalments, single full payments, ticket eligibility, support, session revocation and salted credential storage.

The added feed checks cover the exact upstream array, invalid and duplicate records, whole UGX values, Kampala dates across UTC midnight and explicit partial-service failures. The actual imported Express API was run against its supplied SQL schema/seed in a separate local MariaDB database. Direct and proxied event arrays matched with HTTP 200 and no authentication; see [backend integration evidence](backend-integration.json). No pre-existing database was changed.

All eight catalogue photos loaded on desktop. The catalogue and sign-up layouts were inspected at a 390px browser viewport with no page-wide horizontal overflow. Customer sign-in, sign-up and organiser sign-in use the supplied photograph; equal desktop columns and the stacked phone layout were visually checked.

## Browser walkthrough

The in-app browser was used for public discovery, required registration with checkout return, Mobile Money number entry, a failed test payment, a successful first instalment, a Visa test payment of the final balance, ticket release, support creation and admin response. A customer was denied admin access. Admin account/order views and organiser draft creation were checked, including persistence after refresh.

Customer layouts were inspected at 390px and 360px; the 390px admin menu and mobile full-payment quote were checked. No page-wide horizontal overflow was found in those inspected views. An initial development hot-reload context issue was corrected by separating account context from its provider before the final walkthrough.

## Screenshots

- [Customer home](customer-home.png)
- [Customer home on a phone](customer-mobile.png)
- [Customer sign-in](customer-login.png), [sign-up](customer-signup.png), [phone sign-up](customer-signup-mobile.png) and [organiser sign-in](organiser-login.png)
- [Database-backed event details](backend-event-detail.png)
- [Mobile checkout with number entry](customer-checkout-mobile.png)
- [Mobile Money checkout](customer-checkout-mobile-money.png)
- [Instalment balance and locked ticket](customer-instalment.png)
- [Visa option](customer-visa-option.png) and [card test preview](card-payment-preview.png)
- [Paid sample ticket](customer-paid-ticket.png)
- [Customer denied admin access](customer-admin-denied.png)
- [Admin overview](admin-overview.png), [accounts](admin-accounts.png) and [phone view](admin-mobile.png)
- [Organiser events on a phone](organiser-events-mobile.png)

Some screenshots contain the fictitious booking and draft created during this walkthrough, so their totals differ from a fresh seed database.

## Limits

Thewton Pay is not connected. No real card data, Mobile Money PIN, OTP or payment was submitted. Provider sandbox/live calls, email/SMS delivery, email ownership verification, password recovery, production hosting and signed QR scanning were not tested or implemented. Current tickets are test references, not valid entry tickets. Upstream database-backed events are browse-only until the backend supplies booking, stock and payment endpoints; local checkout is kept separate.

The earlier `frontend-smoke-results.json` and `organiser-desktop.png`/`organiser-mobile.png` are historical records of the pre-account organiser starter; they are not current access-control or commerce evidence.
