# Your frontend role on Parre.ug

**Scope update, 18 November 2026:** the user has requested a customer ticket-buying web flow as well as the organiser workspace and a distinct platform admin panel. Accounts are now required for all purchases. The current implementation is described in [web/README.md](../web/README.md); [the payment handoff](payment-gateway-handoff.md) records Thewton Pay's pending connection. This guide retains the original repository inspection and team workflow below. Its earlier backlog and unexecuted integration plan are historical planning records, not the current feature status.

**Backend update, 18 November 2026:** the friend's Express/MySQL backend and database scripts have now been imported from `KAMOGA-AKRAM/parre-ug` with their commit history. The public event array is connected; see [setup and integration scope](backend-integration.md). The separate local account/order test API remains in `web/server/` until the team supplies those endpoints. Earlier browser-local event edits have not been automatically migrated.

## What was inspected

Repository: https://github.com/SamuelNangoli/Parre-Ug

Inspection date: 17 November 2026, Africa/Kampala. Base: `07f732ed1901f24623d77e1e2d550fe5162addd5`. The remote had four commits, one branch (`main`) and only one tracked file (`README.md`). No pull-request head refs were returned. Teammates may still have unpublished work, so tell them which folder you are taking before integration.

The README's directory tree was a proposal, not existing implementation:

| Folder | Owner / purpose | At inspection |
| --- | --- | --- |
| `web/` | You: React organiser dashboard | Not yet created |
| `mobile/` | Mobile developer: customer discovery, booking and payments | Not yet created |
| `backend/` | Backend developer: Express API, database and business rules | Not yet created |
| `assets/` | Shared brand/design assets | Not yet created |
| `docs/` | Team analysis, design and evidence | Not yet created |

The prepared branch adds only `web/` and this frontend guide under `docs/`. The original root README is unchanged. No backend/mobile directories have been created. Nothing has been pushed, merged or deployed.

## What you do, and what happens in parallel

You turn the designer's screens into responsive web components, event/ticket forms, navigation, loading/error/empty states, booking and instalment displays, then connect those screens to the backend. You also document frontend tests and decisions.

You do **not** have to finish before the backend starts. Agree on the fields and API responses, use sample data, and develop in parallel. Your teammate owns database rules, authentication, ownership checks, stock enforcement, payment confirmation and ticket issuance. Frontend validation improves feedback; it cannot enforce security or transaction integrity.

The repository assigns the customer journey to mobile and the organiser tools to web. Confirm that this is still the team's demo plan. If mobile cannot deliver the full customer workflow in time, jointly assign a small customer web flow; do not silently duplicate the mobile developer's work.

## Start the prepared copy

Open a terminal inside the prepared `Parre-Ug` folder:

```bash
git status --short --branch
git branch --show-current
cd web
npm ci
npm run dev
```

Expected branch: `feature/organiser-web`. The prepared files are deliberately uncommitted for review. Open the local URL that Vite prints. Start at `src/App.jsx`, then the event editor and data service to understand how the first slice works.

Do not run another scaffold command over this `web/` folder.

## Safe branch setup for a fresh clone

These are alternative steps for a new copy on another computer. They do not download the unpushed starter from GitHub.

```bash
git clone https://github.com/SamuelNangoli/Parre-Ug.git
cd Parre-Ug
git fetch origin
git status --short --branch
git branch -a
git ls-tree -r --name-only origin/main
git switch -c feature/organiser-web origin/main
```

For an existing clone, save/commit current work before switching branches. If `feature/organiser-web` already exists locally, switch to it rather than recreating it. If it exists on the remote, inspect it and coordinate ownership; do not overwrite it or use `switch -C`. Only scaffold `web/` when the folder is still absent and the team has selected the stack.

The README suggests a fork-and-pull-request contribution flow. If the owner has explicitly added you as a collaborator, a feature branch in the shared repository is also suitable. If you lack push rights, fork on GitHub and push your feature branch to your fork instead. Read access alone does not imply push access.

## Review and commit your first slice

After reviewing and understanding the starter:

```bash
git status --short --branch
git diff -- README.md
cd web
npm test
npm run build
cd ..
git add -- web docs/frontend-guide.md docs/payment-gateway-handoff.md docs/evidence
git diff --cached --stat
git diff --cached
git commit -m "feat(web): add organiser dashboard starter"
```

Review the staged diff before committing. The scoped `git add` avoids accidentally including a teammate's unrelated files. Do not stage `.env`, `node_modules` or build outputs; `web/.gitignore` excludes them.

Before publishing, check for new team work:

```bash
git fetch origin
git diff --stat HEAD...origin/main
```

If main has moved, and your changes are committed with a clean working tree, integrate with `git merge origin/main`, resolve each conflict with its owner, and rerun the build/tests. If both branches have added `web/`, compare the implementations and coordinate rather than replacing either wholesale. Avoid force-push and destructive reset commands.

When ready to share your reviewed work, and if you have collaborator access:

```bash
git push -u origin feature/organiser-web
```

Then create a pull request into the team's agreed integration branch (`main` unless the team chooses another). Describe what works, what remains mocked, and the checks you actually ran. Ask a teammate to review before merging. Nothing in this prepared copy has been pushed on your behalf.

## Build next, in this order

| Priority | Your frontend task | Coordinate with | Done when |
| --- | --- | --- | --- |
| 1 | Review the starter; agree organiser scope, Figma screens, colours and responsive states | Product manager + designer | Team accepts the screen list and you can explain every starter component |
| 2 | Refine event create/edit and ticket categories; add agreed descriptions, times and validation | Designer + backend | Saved event is visible after refresh; errors are clear; existing bookings stay valid |
| 3 | Connect event list/create/update through the service adapter | Backend developer | Changes persist in the shared API and appear in the mobile event list |
| 4 | Add organiser login/session handling and protected navigation | Backend + QA | Signed-out access and customer-role access fail at the API as well as in the UI |
| 5 | Integrate bookings, instalment balances, payment history and failure/loading states | Payments + backend developers | Backend-confirmed paid/balance/status values match on both clients |
| 6 | Add the agreed organiser support/order-status view; reconcile mobile's after-sales flow | Product manager + mobile developer | A customer can submit a fictitious support request and see its outcome |
| 7 | Responsive/accessibility checks, integration tests and evidence | QA/deployment | Keyboard, phone, errors and reproducible setup are verified against the submitted revision |

Authentication is required before presenting the integrated system as role-protected. Keep early UI work on mock data while the backend builds that boundary.

Start today by running the app, creating a draft event, refreshing, editing a ticket price, and tracing those actions through `EventEditor.jsx` and `services/organiser.js`. Then agree the API below with your backend teammate.

## API discussion sheet (proposed, not implemented or agreed)

| Purpose | Proposed endpoint | Agree these details |
| --- | --- | --- |
| Current user | `GET /api/me` | User ID, role, organiser ID; session expiry; 401/403 behaviour |
| Organiser events | `GET /api/organiser/events` | Ownership filtering, pagination, empty list |
| Create/update event | `POST /api/organiser/events`, `PATCH /api/organiser/events/:id` | Name, venue, start time with timezone, status, categories, price/capacity validation |
| Booking list | `GET /api/organiser/bookings` | Booking/event IDs, quantity, historical total, paid amount, balance and status |
| Payment history | `GET /api/organiser/bookings/:id/payments` | Confirmed mock transaction IDs, amounts, status and timestamps |
| Support | Agree with customer/mobile owner | Ticket/order link, request status, response, fictitious data |

Use UGX and agree whether every API amount is a whole-shilling integer. The starter uses whole UGX integers, date-only events, fixed General/VIP categories and title/venue fields; a real contract may rename or expand them. Map responses in the service adapter. Do not invent API availability from these proposals.

Agree the error body (for example `{ "message": "Capacity is below existing bookings", "field": "capacity" }`), request authentication, CORS during local development and deployment configuration. Server ownership checks must prevent one organiser reading another organiser's records. Never embed a payment secret in frontend code. The server must enforce prices, reservation expiry, capacity, payment confirmation and QR eligibility after full payment.

## Protect your exam marks with evidence

The uploaded MGT3151 exam paper specifies five phases of 20 marks (100 total); the earlier chat says the course result is out of 40. Confirm the lecturer's conversion rather than treating a predicted 35/40 as guaranteed. The functional prototype alone does not cover all five phases.

The required e-commerce sequence is discovery/search -> selection -> cart/order -> mock checkout/payment -> fulfilment/status -> after-sales. An organiser dashboard alone cannot demonstrate that sequence. The team must connect your organiser-created event to the customer flow and backend state.

For each phase, keep identifiable frontend contribution evidence:

- Analysis: a stakeholder need, measurable current-process problem and your input to the redesigned flow.
- Journey/model: organiser persona, customer touchpoints, wireframes and a requirement-to-screen mapping.
- Prototype: commits, an event management walkthrough, integration screenshots and executed tests.
- Architecture/security: web-to-API boundary, data fields, role/session behaviour, threat mitigations and validation ownership.
- Report/defense: setup steps, exact submitted revision, contribution statement and ability to explain your implementation.

The paper requires at least eight documented tests: five positive, two validation/error and one access-control. Use the following as a **team integration plan**, not completed evidence. All are unexecuted until the complete system is available.

| ID | Type | Scenario | Expected result | Actual / evidence / status |
| --- | --- | --- | --- | --- |
| E01 | Positive | Customer searches for an organiser-published event | Matching event appears with the saved details | Not run |
| E02 | Positive | Customer chooses a ticket and creates an order | Quantity, locked price and order total are correct | Not run |
| E03 | Positive | Customer completes a full mock payment | Backend marks paid; eligible digital ticket appears | Not run |
| E04 | Positive | Customer makes an instalment | Confirmed balance updates on customer and organiser screens | Not run |
| E05 | Positive | Customer opens an after-sales request and organiser responds | Request and outcome persist and are visible to the customer | Not run |
| E06 | Error | Invalid quantity or unavailable capacity is submitted | UI gives an error; API rejects invalid booking | Not run |
| E07 | Error | Mock payment fails | Order balance stays unchanged; retry feedback appears | Not run |
| E08 | Access control | A customer calls an organiser-only route/API | UI denies access and API rejects it without returning organiser data | Not run |

Also verify that the final instalment makes a QR ticket eligible and that an unpaid order cannot retrieve one directly through the API. Record expected result, actual result, revision, screenshot/log and pass/fail for every executed test. The starter's unit checks and UI smoke checks do not replace these integration tests.

Use fictitious records and mock payments only. Do not ask for real mobile-money PINs, OTPs or production credentials. Document AI assistance in the report appendix as required by the paper. State that the starter was AI-assisted, identify what you reviewed/changed/tested yourself, and avoid claiming tasks you did not complete. The exam describes AI support for ideation/editing; follow the examiner's interpretation of permitted code assistance before submitting generated code.

## Useful references

- [Repository and original architecture](https://github.com/SamuelNangoli/Parre-Ug)
- [Vite setup and Node requirements](https://vite.dev/guide/)
- [GitHub pull requests and collaboration models](https://docs.github.com/en/pull-requests/reference/pull-requests)
- Uploaded source: MGT3151 E-business, E-Commerce and E-Governance exam PDF, especially instructions and phases 3–5.
