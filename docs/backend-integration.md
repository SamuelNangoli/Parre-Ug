# Frontend and team backend integration

The `feature/organiser-web` branch imports the backend author's commits from [KAMOGA-AKRAM/parre-ug](https://github.com/KAMOGA-AKRAM/parre-ug), including the MySQL events change, using a history-preserving merge. It adds the React frontend without replacing the team's root README.

## Start both parts

Follow [backend setup](../backend/README.md) to configure a local MySQL/MariaDB database. Then use two terminals from the repository root:

```bash
# Terminal 1: database-backed public event feed, port 3000
cd backend
npm ci
npm start
```

```bash
# Terminal 2: React frontend plus isolated account/order test adapter
cd web
npm ci
npm run dev
```

Use the Vite address printed by terminal 2. All browser requests are same-origin; no permissive CORS setting is needed for local development. `PARRE_EVENTS_API_URL` optionally changes the backend origin (default `http://127.0.0.1:3000`). `PARRE_API_PORT` optionally changes the separate local adapter port (default 4174). These server-side Vite settings require a restart.

## Routing and data

| Browser request | Service | Purpose |
| --- | --- | --- |
| `/api/events` | Team Express server on 3000 | Public database-backed event array; no authentication |
| `/api/local-events` | Local development adapter on 4174 | Published local events used by existing ticket checkout |
| Other `/api/*` | Local development adapter on 4174 | Existing test accounts, organiser/admin tools, orders and simulated payments |

`web/src/lib/backend-events.js` maps `name` to `title`, preserves `venue`, formats `startsAt` in Africa/Kampala time, and displays the exact integer `priceUgx` in UGX. UI IDs use a `backend-` prefix so they cannot collide with locally managed events. Invalid feeds and duplicate IDs are rejected. Unavailable services produce a visible message and retry action; reference listings and any working local events can still be browsed.

The upstream schema has no ticket categories, capacity, booking API or organiser ownership. Its events are therefore browseable with a price and an explicit “Tickets available soon” state. They cannot enter the local payment flow, including through a manually entered checkout URL. Local managed events retain their account-required test checkout. Quicket reference events link to their original seller in native ZAR prices.

## Next backend contract to agree

Provide documented registration/sign-in/session endpoints; role and event ownership checks; ticket tiers, available capacity and event detail endpoints; authoritative priced booking creation; payment initialisation/status/webhook verification; and paid ticket issuance. Replace the local adapter when these are available. Never send a frontend-calculated payment total as the authoritative charge or mark a ticket paid from a browser redirect.

Thewton Pay remains unconnected. No money is collected by this version. See [payment handoff](payment-gateway-handoff.md).

## Production hosting

Vite's development/preview proxy is not part of the built static files. A deployed web server must route `/api/events` to the deployed Express API and other endpoints to the team's production backend. A visitor's `localhost:3000` cannot reach another computer. The current loopback-only account/order test adapter refuses production mode and must not be used as the production service.
