# QA Manual Testing Guide

[← Back to docs index](README.md)

Step-by-step scenarios for manual testing.

- [UI scenarios](#ui-scenarios) — the 7 screens that are actually built
- [API scenarios](#api-scenarios) — everything the UI does not cover yet
- [Session and auth edge cases](#session-and-auth-edge-cases)
- [Known gotchas](#known-gotchas) — expected behaviour that reads like a bug
- [Reporting a bug](#reporting-a-bug)

Before starting: confirm the environment is healthy ([SETUP.md](SETUP.md)) and check
[FRONTEND-ROUTES.md](FRONTEND-ROUTES.md) so you do not test placeholder pages.

---

## UI scenarios

### UI-01 — Registration

1. Open `/register`.
   - **Expect:** three role choices — *Order food*, *Deliver*, *List a restaurant*, with *Order food* selected.
2. Submit the empty form.
   - **Expect:** inline validation on name, phone and password. No network request.
3. Enter password `abc`.
   - **Expect:** "Use at least 8 characters".
4. Enter password `abcdefgh`.
   - **Expect:** "Include at least one letter and one number".
5. Enter phone `12345`.
   - **Expect:** a message asking for a valid mobile number.
6. Register a fresh number with a valid password, role **Deliver**.
   - **Expect:** signed in immediately and redirected to `/rider`.
7. Register again with the same number.
   - **Expect:** "An account already exists for that phone number."

### UI-02 — Sign-in and role routing

1. Sign in as `03000000001` / `Zass@1234`.
   - **Expect:** lands on `/admin`, admin sidebar visible, your name in the top bar.
2. Sign out, then sign in as `03009876543`.
   - **Expect:** lands on `/rider`.
3. Repeat for `03005551234` and `03001234567`.
   - **Expect:** `/vendor` and `/` respectively.
4. Sign in with a wrong password.
   - **Expect:** "That phone number and password do not match." Never a raw error or stack trace.
5. Try the same number as `03001234567`, `923001234567` and `+923001234567`.
   - **Expect:** all three sign in successfully.
6. While signed out, open `/admin` directly.
   - **Expect:** redirected to `/login?next=%2Fadmin`. After signing in as an admin, you land back on `/admin`.
7. Sign in as a **customer**, then open `/admin`.
   - **Expect:** "This area isn't yours" with a button back to your own dashboard — not a blank page.

### UI-03 — Restaurant browsing and filters

1. Open `/restaurants`.
   - **Expect:** 3 restaurants; the count reads "3 restaurants".
2. Search `kabab`.
   - **Expect:** narrows to Chapli Kabab House; count reads "1 restaurant"; URL gains `?q=kabab`.
3. Reload that URL.
   - **Expect:** the filter survives and the search box still shows `kabab`.
4. Clear the search, then set price to **Premium**.
   - **Expect:** empty state — "No restaurants match those filters" with a **Clear filters** button.
5. Click **Clear**, then toggle **Open now**.
   - **Expect:** only restaurants currently accepting orders; the button reads as pressed.
6. Filter by a cuisine from the dropdown.
   - **Expect:** results narrow; combining with search applies both.
7. Use browser Back.
   - **Expect:** the previous filter state returns.

### UI-04 — Restaurant menu and add to cart

1. From the listing, open **Chapli Kabab House**.
   - **Expect:** header with rating, prep time, minimum order and address; menu grouped into **Kababs**, **Karahi** and **Drinks** with Urdu names.
2. Check item details.
   - **Expect:** spice levels shown (Hot, Medium), a leaf marker on vegetarian items, prices in rupees.
3. **Signed out**, click **Add** on any item, then confirm in the dialog.
   - **Expect:** redirected to sign-in rather than a silent failure.
4. Sign in as a customer and open **Chapli Kabab**.
   - **Expect:** a size choice (Single Rs 250 / Plate of 3 Rs 700) and an optional "Add bread" group, max 2.
5. Select **Plate of 3**, add **Naan**, set quantity to 2.
   - **Expect:** the button reads **Add for Rs 1,460** — `(700 + 30) × 2`.
6. Try selecting a third bread option.
   - **Expect:** blocked once two are chosen.
7. Confirm the add.
   - **Expect:** a success toast; the dialog closes.
8. Add an item from a **different** restaurant.
   - **Expect:** "Your cart has items from another restaurant…" — carts are single-restaurant.
9. Reopen a different dish.
   - **Expect:** fresh choices — options must not carry over between dishes.

> `/cart` is still a placeholder, so verify cart contents with `GET /cart` rather than the UI.

### UI-05 — Offers

1. Open `/offers` while signed out.
   - **Expect:** "Sign in to see your offers" with a sign-in button — not an error.
2. Sign in as a customer and return.
   - **Expect:** three coupons — FREEDEL, WELCOME20 and ZASS100, each showing its minimum spend.
3. Check WELCOME20.
   - **Expect:** a **First order only** marker and "Up to Rs 300".
4. Click **Copy**.
   - **Expect:** the button confirms "Copied" and the code is on the clipboard.

### UI-06 — Portal shells and navigation

1. Sign in as super admin and open each sidebar link.
   - **Expect:** every link loads a page. None should 404. Content saying "Coming soon" is expected.
2. Repeat for the vendor and rider portals.
   - **Expect:** same — navigation works throughout.
3. Visit `/admin/does-not-exist`.
   - **Expect:** a genuine 404 page.
4. Toggle light / system / dark in the top bar.
   - **Expect:** the theme changes with no flash, and survives a reload.
5. Narrow the window to phone width.
   - **Expect:** the sidebar collapses to a drawer; no horizontal page scroll.

---

## API scenarios

Get a token first — see [API.md](API.md) — then use Swagger's **Authorize** button or an
`Authorization: Bearer <token>` header.

### API-01 — Customer order, end to end

1. `GET /restaurants`, then `GET /restaurants/{id}/menu-items` — note an item id.
2. `POST /cart/items` with `menuItemId` and `quantity`.
   - **Expect:** `201`, cart totals recalculated by the server.
3. `PATCH /cart/items/{itemId}` with `{"quantity": 0}`.
   - **Expect:** the line is removed.
4. `GET /me/addresses`, then `PATCH /cart/address` with an address id.
   - **Expect:** delivery fee and ETA appear on the cart.
5. `POST /cart/coupon` with `{"code":"ZASS100"}`.
   - **Expect:** `discountAmount` becomes 100 if the subtotal is at least Rs 500; otherwise a clear rejection.
6. `POST /orders` with `{"paymentMethod":"CASH_ON_DELIVERY"}`.
   - **Expect:** `201`, an order number, status `PLACED`, and the cart is emptied.
7. `GET /orders/{id}/timeline` and `/invoice`.
   - **Expect:** a status history, and an invoice whose totals match the order.
8. `POST /orders/{id}/cancel`.
   - **Expect:** allowed before `PREPARING`; refused with a clear reason afterwards.

### API-02 — Vendor order queue

Sign in as `03005551234`.

1. `GET /restaurant-management/mine` — note the restaurant id.
2. `GET /order-management/restaurants/{id}`.
   - **Expect:** only this restaurant's orders.
3. Move an order through `/accept` → `/preparing` → `/ready`.
   - **Expect:** each step returns the updated order; the timeline records who changed it.
4. Attempt `/delivered` as the vendor.
   - **Expect:** refused — only a driver or admin may complete a delivery.
5. Attempt to accept an order belonging to **another** restaurant.
   - **Expect:** refused. Important authorisation check.
6. `PATCH /restaurant-management/{id}/accepting-orders` with `false`.
   - **Expect:** the restaurant now shows as not taking orders on the public listing.

### API-03 — Rider delivery flow

Sign in as `03009876543`.

1. `PATCH /riders/me/availability` with `{"availability":"ONLINE"}`.
2. `GET /riders/me/offers?liveOnly=true`, then accept one.
   - **Expect:** the assignment moves to `ACCEPTED`. An expired offer cannot be accepted.
3. `POST /riders/me/deliveries/{orderId}/pickup`.
   - **Expect:** a delivery confirmation code is issued to the customer.
4. `POST /riders/me/deliveries/{orderId}/confirm` with a **wrong** 4-digit code.
   - **Expect:** rejected. This protects against false delivery claims.
5. Confirm with the correct code.
   - **Expect:** order `DELIVERED` and an earnings breakdown returned.
6. `GET /riders/me/earnings/summary` and `/wallet`.
   - **Expect:** the balance reflects the delivery just completed.
7. `POST /riders/me/withdrawals` for more than the balance.
   - **Expect:** refused with a clear message.

### API-04 — Admin oversight

Sign in as `03000000001`.

1. `GET /admin/dashboard`.
   - **Expect:** totals, queue counts and a 14-day trend.
2. `GET /admin/reports/sales` with `from` and `to`.
   - **Expect:** figures consistent with the dashboard for the same window.
3. `GET /users?role=RIDER` and `?status=ACTIVE`.
   - **Expect:** filters apply, and `meta.total` matches the rows returned.
4. `PATCH /users/{id}/status` to `SUSPENDED`, then sign in as that user.
   - **Expect:** sign-in refused while suspended.
5. `POST /coupons`, redeem it on a cart, then `GET /admin/reports/coupons`.
   - **Expect:** the redemption is reflected in the report.
6. `POST /payment-management/payments/{id}/refund` for more than the amount paid.
   - **Expect:** refused. Over-refunding must never be possible.
7. `GET /audit-logs`.
   - **Expect:** the actions you just performed are recorded with your account as the actor.

### API-05 — Authorisation (the checks that matter most)

1. Call any admin endpoint with a **customer** token.
   - **Expect:** `403` — never data.
2. `GET /orders/{id}` for an order belonging to another customer.
   - **Expect:** `404` (deliberately, not `403`).
3. Call any protected endpoint with no `Authorization` header.
   - **Expect:** `401`.
4. Call one with a tampered token (change a character).
   - **Expect:** `401`.
5. As a vendor, read another vendor's restaurant via `/restaurant-management/{id}`.
   - **Expect:** refused.
6. Send an unknown field in any request body.
   - **Expect:** `400` — unknown fields are rejected, not ignored.

---

## Session and auth edge cases

| Setting | Value | Why it matters |
| --- | --- | --- |
| Access token | 15 minutes | Expires mid-session; refresh should be invisible |
| Refresh token | 30 days | Rotated on every use |
| Token storage | `localStorage`, key `zass.auth` | — |

### SEC-01 — Silent token refresh

1. Sign in and leave the tab idle for more than 15 minutes.
2. Navigate to a page that loads data, such as `/offers`.
   - **Expect:** content loads normally. The expired token is refreshed behind the scenes — you should **not** be sent to sign-in.

### SEC-02 — Corrupt session recovery *(regression)*

This previously froze every guarded page on a loading skeleton forever. Worth re-testing after
any auth change.

1. Sign in, then in the DevTools console run:
   ```js
   localStorage.setItem('zass.auth', '{broken')
   ```
2. Reload `/admin`.
   - **Expect:** redirected to sign-in. **Not** a permanent "Checking your access" skeleton.
3. Repeat with `'not-json-at-all'` and `'{"unexpected":true}'`.
   - **Expect:** the same clean recovery every time.

### SEC-03 — Redirect safety

1. Signed out, open `/login?next=https://example.com` and sign in.
   - **Expect:** you land inside ZassDelivery — **never** on the external site. An off-site redirect here is a serious bug.
2. Open `/login?next=%2Foffers` and sign in.
   - **Expect:** you land on `/offers`.

### SEC-04 — Sign-out

1. Sign in, then sign out from the top bar.
   - **Expect:** returned to sign-in, and `zass.auth` is cleared.
2. Press Back.
   - **Expect:** the protected page does not reappear with data.
3. Reuse the old access token against the API.
   - **Expect:** `401` — sign-out revokes the session server-side.

---

## Known gotchas

Expected behaviour that reads like a bug. Check here before filing.

| You see | Explanation |
| --- | --- |
| "Coming soon" on most pages | Not built yet. See [FRONTEND-ROUTES.md](FRONTEND-ROUTES.md). |
| "Reconnecting…" in the header | The live-updates socket dropped. In development this happens on every code change while the server recompiles, and clears by itself. Only report it if it persists with no edits happening. |
| Items add to the cart but `/cart` is empty | `/cart` is a placeholder. Verify through `GET /cart`. |
| `404` instead of `403` | Deliberate for orders, tickets and restaurant management — it avoids confirming that someone else's record exists. |
| `429` when signing in repeatedly | Rate limit: 10 attempts per 5 minutes. Wait it out. |
| Restaurants show no photos | Seed data has no image URLs. The coloured tile with an initial is the intended fallback. |
| Cannot add dishes from two restaurants | By design — one cart, one kitchen. Empty the cart to switch. |
| Adding an item is refused for a closed restaurant | Correct. "Closed" and "open but not taking orders" are different states and are shown differently. |
| A previously working coupon is refused | Usage limits are consumed by testing and do not reset. Re-seed the database. |

---

## Reporting a bug

> **Always include the `requestId`.** Every API response carries one, and error screens show it
> as a reference. It links your report straight to the server logs — a report with one is worth
> several without.

### Before filing

1. Confirm the page is **Built** in [FRONTEND-ROUTES.md](FRONTEND-ROUTES.md).
2. Check [Known gotchas](#known-gotchas).
3. Confirm the backend is healthy: `GET /api/v1/health`.
4. Reproduce once more in a private window, to rule out stale local state.

### What to include

- **Account and role** used — behaviour is role-dependent throughout.
- **Exact URL**, including query string.
- **Steps**, expected result, actual result.
- **`requestId`** from the response or error screen.
- **Console and network errors** from DevTools, plus the failing status code.
- **Screenshot** for anything visual.
- Whether it reproduces in **both light and dark** themes, and at phone width.

### Severity

| Level | Means | Examples |
| --- | --- | --- |
| **Critical** | Data loss, or the wrong person can see or do something | Seeing another customer's order; a customer reaching admin functions; an off-site redirect after sign-in |
| **High** | A core journey is blocked | Cannot sign in; orders cannot be placed; money calculated wrongly |
| **Medium** | A feature misbehaves but has a workaround | A filter ignores one option; a total displays unformatted |
| **Low** | Cosmetic or copy | Misalignment; a typo; a missing empty state |

> **Money and permissions deserve extra scrutiny.** Totals, discounts, refunds and payouts are
> where mistakes are most costly, and role boundaries are where they are most dangerous. When
> testing either, check the number or the refusal rather than assuming the happy path held.
