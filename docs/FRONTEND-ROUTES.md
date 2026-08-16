# Frontend Route Status

[← Back to docs index](README.md)

**Check this before filing any UI bug.**

- ✅ **Built** — a real screen on live data
- ⚠️ **Partial** — some of the screen is real, some is not
- ⛔ **Placeholder** — renders "Coming soon" on purpose

Totals: **49 routes — 7 built, 42 placeholder.**

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
| `/support` | ⛔ Placeholder | — |
| `/about` | ⛔ Placeholder | Marketing copy pending |
| `/careers` | ⛔ Placeholder | Marketing copy pending |
| `/contact` | ⛔ Placeholder | Marketing copy pending |
| `/terms` | ⛔ Placeholder | Legal copy pending |
| `/privacy` | ⛔ Placeholder | Legal copy pending |
| `/refunds` | ⛔ Placeholder | Legal copy pending |
| `/vendor/onboarding` | ⛔ Placeholder | **Public by design** — no sign-in required |
| `/rider/onboarding` | ⛔ Placeholder | **Public by design** — no sign-in required |

> The two onboarding routes sit outside the guarded portals on purpose. Someone signing up to
> *become* a vendor or rider does not hold that role yet, so a guarded page would be unreachable
> by exactly the people who need it.

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

| Route | Status |
| --- | --- |
| `/vendor` | ⛔ Placeholder content, ✅ shell |
| `/vendor/orders` | ⛔ Placeholder |
| `/vendor/menu` | ⛔ Placeholder |
| `/vendor/staff` | ⛔ Placeholder |
| `/vendor/settings/profile` | ⛔ Placeholder |
| `/vendor/settings/hours` | ⛔ Placeholder |
| `/vendor/settings/gallery` | ⛔ Placeholder |
| `/vendor/support` | ⛔ Placeholder |

---

## Rider portal

| Route | Status |
| --- | --- |
| `/rider` | ⛔ Placeholder content, ✅ shell |
| `/rider/offers` | ⛔ Placeholder |
| `/rider/deliveries` | ⛔ Placeholder |
| `/rider/earnings` | ⛔ Placeholder |
| `/rider/wallet` | ⛔ Placeholder |
| `/rider/withdrawals` | ⛔ Placeholder |
| `/rider/support` | ⛔ Placeholder |

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
