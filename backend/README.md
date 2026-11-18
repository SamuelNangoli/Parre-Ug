# Team events API

Imported from [KAMOGA-AKRAM/parre-ug](https://github.com/KAMOGA-AKRAM/parre-ug), including its Git history and latest MySQL event query. The frontend repository's original root README is retained.

## Run

1. Use an existing local MySQL/MariaDB development database, or create a separate development database and user. Grant that user access only to its database.
2. Apply `database/schema.sql` and, optionally, `database/seed.sql` to that database. Both paths are relative to the repository root. The seed contains two fictitious events; it does not overwrite an existing row with the same ID. Event timestamps are stored in UTC.
3. Copy `.env.example` to `.env.mysql` inside `backend/` and set your actual local database settings. This file is ignored by Git. Port 3307 is the upstream default; change `MYSQL_PORT` to 3306 if that is where your database runs.
4. In `backend/`, run `npm ci`, then `npm start`.

Do not commit database passwords or reuse the public frontend test credentials as database credentials.

## Contract

- `GET http://localhost:3000/health` returns `{ "status": "ok" }`. This checks the HTTP server, not database connectivity.
- `GET http://localhost:3000/api/events` requires no authentication and returns an array:

```json
[
  {
    "id": 1,
    "name": "Kampala Live Night",
    "venue": "Demo Arena",
    "startsAt": "2026-12-12T15:00:00.000Z",
    "priceUgx": 50000
  }
]
```

Database errors return HTTP 503. This backend currently has no account, booking, stock, organiser ownership or payment endpoints. `npm test` is the upstream placeholder, not a passing test suite. Frontend adapter tests live in `web/`.

See [frontend connection details](../docs/backend-integration.md) for the proxy, field mapping, scope and deployment requirements.
