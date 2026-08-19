# Frontend Route Status

[← Back to docs index](README.md)

**Check this before filing any UI bug.**

- ✅ **Built** — a real screen on live data
- ⚠️ **Partial** — some of the screen is real, some is not
- ⛔ **Placeholder** — renders "Coming soon" on purpose

Totals: **49 routes — 25 built, 24 placeholder.** The rider and vendor portals are
now built in full; the admin portal and the customer marketing/legal pages are not.

---

## Public and customer

| Route | Status | Notes |
| --- | --- | --- |
| `/` | ⚠️ Partial | Hero and navigation real; category and featured sections pending |
| `/restaurants` | ✅ Built | Search, cuisine, price, open-now, pagination |
| `/restaurants/[slug]` | ✅ Built | Menu by category, item dialog, add to cart |
| `/offers` | ✅ Built | Requires sign-in |
| `/login` | ✅ Built | — |
| `/register` | ✅ Built | With role selection |
| `/design-system` | ✅ Built | Component reference, not a user-facing page |
| `/cart` | ⛔ Placeholder | Items **can** be added from a menu; this page cannot show them yet |
| `/checkout` | ⛔ Placeholder | — |
| `/orders` | ⛔ Placeholder | — |
| `/profile` | ⛔ Placeholder | — |
| `/favorites` | ⛔ Placeholder | — |
| `/notifications` | ⛔ Placeholder | — |
| `/support` | ⛔ Placeholder | Rider and vendor support are built at `/rider/support` and `/vendor/support` |
| `/about` | ⛔ Placeholder | Marketing copy pending |
| `/careers` | ⛔ Placeholder | Marketing copy pending |
| `/contact` | ⛔ Placeholder | Marketing copy pending |
| `/terms` | ⛔ Placeholder | Legal copy pending |
| `/privacy` | ⛔ Placeholder | Legal copy pending |
| `/refunds` | ⛔ Placeholder | Legal copy pending |
| `/vendor/onboarding` | ✅ Built | **Public by design** — vendor registers their own restaurant |
| `/rider/onboarding` | ✅ Built | **Public by design** — rider files their own application, then uploads documents |

> The two onboarding routes sit outside the guarded portals on purpose. Someone signing up to
> *become* a vendor or rider does not hold that role yet, so a guarded page would be unreachable
> by exactly the people who need it.
>
> Both are **self-registration**. A vendor owner registers their own restaurant with
> `POST /restaurant-management`, and a rider files their own application with
> `POST /riders/register`; each is created in a pending state. An administrator only
> **approves or rejects** what the applicant filed — there is no path where staff register a
> restaurant or a rider on someone's behalf.

---

## Admin portal

Shell (sidebar, navigation, role guard, sign-out) is ✅ **built**. All content pages are ⛔ placeholder.

| Route | Status |
| --- | --- |
| `/admin` | ⛔ Placeholder content, ✅ shell |
| `/admin/reports` | ⛔ Placeholder |
| `/admin/dispatch` | ⛔ Placeholder |
| `/admin/restaurants` | ⛔ Placeholder |
| `/admin/riders` | ⛔ Placeholder |
| `/admin/users` | ⛔ Placeholder |
| `/admin/payments` | ⛔ Placeholder |
| `/admin/coupons` | ⛔ Placeholder |
| `/admin/banners` | ⛔ Placeholder |
| `/admin/support` | ⛔ Placeholder |
| `/admin/audit-log` | ⛔ Placeholder |
| `/admin/settings` | ⛔ Placeholder |

---

## Vendor portal

Every screen renders through a gate that handles the states before a live listing:
no restaurant registered yet, awaiting approval, rejected, suspended.

| Route | Status | Notes |
| --- | --- | --- |
| `/vendor` | ✅ Built | Live counts, today's takings, accepting-orders switch |
| `/vendor/orders` | ✅ Built | Live queue, grouped new / cooking / ready; **realtime** |
| `/vendor/menu` | ✅ Built | Search, status filter, sold-out and stock adjustment |
| `/vendor/staff` | ✅ Built | Owner creates kitchen accounts |
| `/vendor/settings/profile` | ✅ Built | Name, contact, trading terms |
| `/vendor/settings/hours` | ✅ Built | The week, per day |
| `/vendor/settings/gallery` | ✅ Built | Add, reorder, remove photos |
| `/vendor/support` | ✅ Built | Tickets and threads, inside the vendor shell |

---

## Rider portal

Every screen renders through a gate that handles the states before an approved rider:
application not filed, awaiting approval, rejected, suspended.

| Route | Status | Notes |
| --- | --- | --- |
| `/rider` | ✅ Built | Availability, earnings summary, live offers, active run |
| `/rider/offers` | ✅ Built | Countdown per offer, accept/decline; **realtime** |
| `/rider/deliveries` | ✅ Built | Active run with the pickup → code steps, plus history |
| `/rider/earnings` | ✅ Built | Summary tiles and the full ledger |
| `/rider/wallet` | ✅ Built | Balance and statement |
| `/rider/withdrawals` | ✅ Built | Request, track, cancel |
| `/rider/support` | ✅ Built | Tickets and threads, inside the rider shell |

> Support in both portals is deliberately `/{portal}/support`, **not** `/support`. The customer
> support page lives in the storefront layout, so linking a rider or vendor there dropped them
> behind the customer navbar — complete with a cart and a restaurant list.

---

## What a genuine 404 looks like

Any URL **not** in the lists above should return the "This page has moved on" 404 page. For
example:

```
/admin/does-not-exist   →  404  ✅ correct
/restaurants/no-such-place →  error state, not a crash
```

That is correct behaviour, not a bug. Placeholder routes were written as explicit files rather
than catch-alls precisely so that mistyped URLs still fail properly.

---

## Access control

The portal route guards are real and testable even though the content is not.

| Test | Expected |
| --- | --- |
| Visit `/admin` signed out | Redirect to `/login?next=%2Fadmin` |
| Visit `/admin` as a customer | "This area isn't yours" with a link to your own dashboard |
| Visit `/vendor` as a rider | "This area isn't yours" |
| Sign in as each role | Redirected to that role's home route |

> The client-side guard is a **UX** guard, not a security boundary. The API authorises every
> request independently — which is what actually protects the data. Both are worth testing
> separately; see [QA-TESTING.md](QA-TESTING.md) case API-05.
