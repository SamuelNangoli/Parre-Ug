# Thewton Pay integration handoff

Requested gateway: https://pay.thewtontech.com/

Checked 18 November 2026, Africa/Kampala. The public homepage advertises MTN MoMo, Airtel Money, Visa/Mastercard, an API and test mode. The API reference at `/docs` redirected to `/login`; its authenticated API specification was not available in this session. No endpoints, authentication headers, webhook signatures, card capabilities or fees have been invented.

## Present implementation

Payments run entirely inside the local development API. The UI explicitly labels them as test payments. The API computes amounts from saved orders and records simulated success/failure; it makes no request to Thewton Pay and cannot charge money. No card number, CVV, OTP or mobile-money PIN is collected. Phone numbers are used for input validation in the local test request; only their last four digits are retained in the payment record.

The account requirement applies to full payments and instalments. Anyone can browse; signed-in customers can access only their own bookings. Staff access is checked on the API, not just hidden in the interface.

## Needed from the gateway account

After the owner has account access, provide the official integration documentation or its non-secret export. Configure test credentials through a server-side environment/secret mechanism; do not paste production secrets into chat or commit them.

Confirm these points from the actual account documentation:

- Whether test mode is available before paid/live activation and whether the account has been approved for each requested payment method.
- The sandbox base URL, authentication mechanism and test credentials.
- Mobile Money collection request format, supported networks, test numbers and pending/failed/success states.
- Hosted checkout or hosted card fields for Visa/Mastercard, including 3-D Secure and callback behaviour.
- Transaction status lookup, idempotency support, merchant references and expiry rules.
- Webhook event body, signature verification, replay protection and retry behaviour.
- Amount units, UGX support, transaction minimums, fees and whether instalment-sized collections are permitted.
- Refund/cancellation API and required merchant verification for live operation.

## Integration work

1. Replace the local `pay` branch in `server/app.js` with a backend-owned gateway adapter based on those documents. The eventual Express/PostgreSQL backend should own this implementation.
2. Create a pending payment using the server's saved order price and authenticated account. The browser must not choose the payable amount.
3. For Mobile Money, let the provider initiate the phone prompt. For cards, direct the customer to provider-hosted checkout or hosted fields; never add raw card fields that submit to this app's API.
4. Verify the provider's signed webhook/status response before increasing a balance, issuing a ticket or showing final success. A browser success URL is not confirmation.
5. Reconcile retries using unique merchant/payment references and provider idempotency. Keep failed/expired payments from changing balances and avoid double-crediting duplicate notifications.
6. Test success, pending, cancellation, failures, tampered amounts, duplicate webhooks, replayed events, out-of-stock orders and final-instalment ticket release in the provider's sandbox.
7. Replace the current test-only ticket reference with backend-generated signed QR tickets and check-in verification.

Do not activate live payments during the exam demonstration; the supplied exam requires mock or sandbox payments and fictitious data.

## Primary references

- [Thewton Pay](https://pay.thewtontech.com/) — requested provider and public product claims; API details require account access.
- [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) — the local adapter uses scrypt `N=2^15`, `r=8`, `p=3` with independent salts.
- [OWASP session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) — session tokens, cookies and expiry.
- [Stripe integration security](https://docs.stripe.com/security/guide) — an example of the hosted payment-data pattern, not the selected provider or proof of Thewton's implementation.
