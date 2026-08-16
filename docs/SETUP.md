# Environment Setup

[← Back to docs index](README.md)

## Services

| Service | Address | Notes |
| --- | --- | --- |
| Frontend | `http://localhost:8000` | Next.js 16 |
| Backend API | `http://localhost:3000/api/v1` | NestJS. Every route sits under this prefix |
| Swagger UI | `http://localhost:3000/api/docs` | Interactive — the main tool for API testing |
| Health check | `http://localhost:3000/api/v1/health` | Reports database and Redis status |
| PostgreSQL | `localhost:5433` | Docker container `zass_postgres` |
| Redis | `localhost:6379` | Docker container `zass_redis` |

> **Port 5433 is deliberate.** PostgreSQL runs on 5433, not the default 5432, because most
> machines already have a local PostgreSQL. Connecting to the wrong one produces a confusing
> authentication error rather than a clear failure.

---

## Starting everything

```bash
# 1. Dependencies (from the backend directory)
cd /var/www/zassdelivery
docker compose up -d postgres redis

# 2. Backend  →  http://localhost:3000
npm run start:dev

# 3. Frontend →  http://localhost:8000
cd /var/www/zassdeliver-frontend
npm run dev
```

### Confirm it is up before testing

```bash
curl http://localhost:3000/api/v1/health
```

A healthy response reports `"status":"ok"` with both `database` and `redis` up:

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up", "responseTimeMs": 21 },
    "redis":    { "status": "up", "responseTimeMs": 6 },
    "memory_heap": { "status": "up" }
  }
}
```

If either dependency is down, stop and fix that first — failures downstream will look like
application bugs.

---

## Frontend configuration

Set in `.env.local`. If the API moves, **both** values must change together:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

---

## Useful commands

### Frontend

```bash
npm run dev         # dev server on :8000
npm run build       # production build
npm start           # serve the production build
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
```

### Backend

```bash
npm run start:dev     # watch mode
npm run start:prod    # run the compiled build
npm run build         # compile
npm run prisma:seed   # reset seeded data
```

---

## Resetting the data

Testing consumes coupon usage limits, changes order states and creates accounts. When the data
drifts too far from a clean baseline:

```bash
cd /var/www/zassdelivery
npm run prisma:seed
```

---

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `EADDRINUSE :3000` | The backend is already running. Check with `ss -ltnp \| grep :3000` before starting another. |
| `password authentication failed for user "zass"` | You are talking to a PostgreSQL on 5432 instead of 5433. Check `DATABASE_URL`. |
| Frontend loads but all data fails | Backend is down, or `NEXT_PUBLIC_API_URL` is wrong. Check the health endpoint. |
| Swagger returns 404 | Swagger is disabled in production mode. Run the backend with `NODE_ENV=development`. |
| "Reconnecting…" in the header | The live-updates socket dropped. In development this happens on every code change while the server recompiles, and clears by itself. |
