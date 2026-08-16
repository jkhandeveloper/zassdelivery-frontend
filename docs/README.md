# ZassDelivery Documentation

Manual testing and reference docs for the ZassDelivery platform.

| Document | What it covers |
| --- | --- |
| [SETUP.md](SETUP.md) | Ports, services, starting everything, configuration |
| [TEST-DATA.md](TEST-DATA.md) | Test accounts, passwords, seeded records |
| [FRONTEND-ROUTES.md](FRONTEND-ROUTES.md) | Every route and whether it is actually built |
| [API.md](API.md) | Backend API surface, conventions, rate limits |
| [QA-TESTING.md](QA-TESTING.md) | Step-by-step manual test scenarios |

---

## Read this first

The **backend is complete** — all 250 endpoints work.

The **frontend is not**. It has 49 routes, but only **7 are real screens**. The other 42 are
honest placeholders that say "Coming soon" and list the endpoints they will eventually use.

> **Do not raise bugs against placeholder pages.** A page showing "Coming soon" is working as
> intended. Check [FRONTEND-ROUTES.md](FRONTEND-ROUTES.md) before filing anything.

### What can be tested today

| Area | UI | API | Notes |
| --- | --- | --- | --- |
| Auth (register, sign in, role routing) | ✅ Built | ✅ | Fully testable |
| Restaurant listing + filters | ✅ Built | ✅ | Search, cuisine, price, open-now, pagination |
| Restaurant detail + menu | ✅ Built | ✅ | Variants, add-ons, add to cart |
| Offers | ✅ Built | ✅ | Requires sign-in |
| Home page | ⚠️ Partial | ✅ | Hero and nav real; listing sections pending |
| Cart | ⚠️ Partial | ✅ | Items can be **added**, but `/cart` is a placeholder |
| Checkout, orders | ⛔ Placeholder | ✅ | API only |
| Vendor portal | ⛔ Placeholder | ✅ | Shell and nav real; content API only |
| Rider portal | ⛔ Placeholder | ✅ | Shell and nav real; content API only |
| Admin portal | ⛔ Placeholder | ✅ | Shell and nav real; content API only |

Everything marked ⛔ must be tested **through the API** for now — see [API.md](API.md) and the
API scenarios in [QA-TESTING.md](QA-TESTING.md). Swagger UI at
`http://localhost:3000/api/docs` makes this straightforward.

---

## Quick reference

```
Frontend    http://localhost:8000
Backend     http://localhost:3000/api/v1
Swagger     http://localhost:3000/api/docs
Health      http://localhost:3000/api/v1/health
```

All seeded accounts use the password `Zass@1234`.

| Role | Phone | Lands on |
| --- | --- | --- |
| Super admin | `03000000001` | `/admin` |
| Vendor owner | `03005551234` | `/vendor` |
| Rider | `03009876543` | `/rider` |
| Customer | `03001234567` | `/` |

Full list in [TEST-DATA.md](TEST-DATA.md).
