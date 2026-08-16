# Backend API Reference

[← Back to docs index](README.md)

All **250 endpoints are implemented and working**. Base URL:

```
http://localhost:3000/api/v1
```

Use **Swagger UI** at `http://localhost:3000/api/docs` — click **Authorize**, paste an access
token, and every endpoint becomes callable from the browser.

---

## Getting a token

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"03001234567","password":"Zass@1234"}'
```

The access token is at `data.tokens.accessToken` and is valid for **15 minutes**.

```bash
curl http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer <accessToken>"
```

---

## Endpoints by area

| Area | Routes | Access |
| --- | ---: | --- |
| Menu Management | 26 | Vendor owner / staff, admin |
| Riders (self-service) | 23 | Rider |
| Rider Management | 18 | Admin permissions |
| Admin Content (coupons, banners, settings) | 18 | Admin permissions |
| Restaurant Management | 17 | Vendor owner, admin |
| Me (own profile, addresses, favourites) | 15 | Any signed-in user |
| Order Management | 13 | Restaurant, rider, admin |
| Notifications | 12 | Any signed-in user |
| Payment Management | 12 | Admin permissions |
| Cart | 10 | Customer |
| Payments | 10 | Customer |
| Notification Management | 9 | Admin permissions |
| Search | 8 | Public |
| Admin Dashboard | 8 | `analytics.read` |
| Support | 8 | Own tickets; staff see all |
| Users (Admin) | 7 | Admin permissions |
| Orders | 7 | Customer |
| Authentication | 6 | Public |
| Restaurants | 5 | Public |
| Menus | 4 | Public |
| Restaurant Categories | 3 | Admin permissions |
| Realtime | 3 | Signed-in |
| Audit Log | 3 | `audit.read` |
| Health | 3 | Public |
| Payment Webhooks | 2 | Gateway only — signature verified |
| **Total** | **250** | |

---

## Response shape

Every success response is wrapped. List endpoints add `meta`:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": { },
  "meta": {
    "total": 30, "page": 1, "limit": 20,
    "totalPages": 2, "hasPreviousPage": false, "hasNextPage": true
  },
  "requestId": "6fad713e-2888-4544-9b1c-87def895d257",
  "timestamp": "2026-08-16T15:30:50.414Z"
}
```

Errors follow the same discipline — **always capture `requestId`**:

```json
{
  "success": false,
  "statusCode": 404,
  "error": "NOT_FOUND",
  "message": "Menu item with identifier \"abc\" was not found.",
  "errorCode": "RESOURCE_NOT_FOUND",
  "path": "/api/v1/cart/items",
  "requestId": "bbc29fa1-91ef-4241-8e2c-e3047623fd8b",
  "timestamp": "2026-08-16T16:37:29.518Z"
}
```

---

## Conventions worth knowing

| Convention | Detail |
| --- | --- |
| **Unknown fields are rejected** | A typo in a request body returns `400`. It is not silently ignored. |
| **404 can mean "not yours"** | Orders, tickets and restaurant management return `404` rather than `403` for records you cannot see. Do not read `404` as "missing". |
| **Pagination** | `page`, `limit`, `sortBy`, `sortOrder`, `search` on every list endpoint. |
| **Money** | Returned as a number, in PKR. |
| **Variant prices are absolute** | A variant's price replaces the base price; it is not added to it. |
| **Health is unwrapped** | `/health` returns raw Terminus output, not the standard envelope. |

---

## Authentication

| Setting | Value |
| --- | --- |
| Access token TTL | 15 minutes |
| Refresh token TTL | 30 days |
| Refresh behaviour | Rotated on every use; a replayed token revokes the whole session family |
| Sign-out | Revokes server-side immediately via a Redis deny-list |

Key endpoints:

```
POST /auth/register        phone, fullName, password, email?, role?
POST /auth/login           phone, password
POST /auth/refresh         refreshToken
POST /auth/logout          refreshToken?, allDevices?
GET  /auth/me              current user, role and permissions
POST /auth/change-password currentPassword, newPassword
```

`GET /auth/me` is the source of truth for role and permissions — read fresh rather than trusting
token claims.

---

## Roles and permissions

Six roles: `CUSTOMER`, `RIDER`, `VENDOR_OWNER`, `VENDOR_STAFF`, `ADMIN`, `SUPER_ADMIN`.

Most staff endpoints gate on **granular permission strings** rather than role, so a narrow
support or dispatch role can be granted exactly what it needs:

```
users.read      orders.assign     payments.refund   drivers.approve
coupons.create  settings.update   notifications.send
tickets.assign  audit.read        analytics.read
banners.update  payouts.approve
```

`SUPER_ADMIN` bypasses permission checks automatically.

> Some vendor and order endpoints carry **no** role decorator — ownership is enforced inside the
> use-case instead. Swagger will not show a role hint on those, but they are still protected.
> Test them explicitly (see QA-TESTING case API-05).

---

## Order state machine

```
PENDING_PAYMENT → PLACED → CONFIRMED → PREPARING
                → READY_FOR_PICKUP → PICKED_UP → ON_THE_WAY → DELIVERED
```

Terminal states: `DELIVERED`, `CANCELLED`, `REJECTED`, `FAILED`.

Who may perform each transition:

| Transition | Allowed actor |
| --- | --- |
| PLACED → CONFIRMED / REJECTED | Restaurant, admin |
| CONFIRMED → PREPARING | Restaurant, admin |
| PREPARING → READY_FOR_PICKUP | Restaurant, admin |
| READY_FOR_PICKUP → PICKED_UP | Driver, admin |
| PICKED_UP → ON_THE_WAY | Driver, admin |
| ON_THE_WAY → DELIVERED | Driver, admin |
| → CANCELLED | Customer before PREPARING; admin later |

A customer's free-cancel window closes once the order reaches `PREPARING`.

---

## Rate limits

| Endpoint | Limit | On breach |
| --- | --- | --- |
| `POST /auth/register` | 5 per hour | `429` |
| `POST /auth/login` | 10 per 5 minutes | `429` |
| `POST /auth/refresh` | 30 per 5 minutes | `429` |
| `GET /search/autocomplete` | 300 per minute | `429` |

> Repeated sign-in testing will trip the login limit. Wait five minutes rather than reporting a
> lockout bug.

---

## Realtime

Socket.IO on the `/realtime` namespace, authenticated with the access token:

```js
io('http://localhost:3000/realtime', { auth: { token: accessToken } })
```

`GET /realtime/handshake` returns the server's own description of the protocol — rooms, commands
and events — which is the authoritative list rather than anything hardcoded in the client.

Server events include `order:status`, `rider:location`, `delivery:offered`, `restaurant:order`
and `notification:new`. Rooms are joined automatically for your own user, plus `dispatch` for
staff and `rider:<id>` for riders.
