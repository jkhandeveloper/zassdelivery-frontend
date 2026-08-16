# Test Accounts and Seeded Data

[← Back to docs index](README.md)

## Accounts

All seeded accounts share the password **`Zass@1234`**.

Signing in redirects by role, so use the account that matches the portal you intend to test.

| Phone | Role | Name | Lands on |
| --- | --- | --- | --- |
| `03000000001` | SUPER_ADMIN | Platform Super Admin | `/admin` |
| `03000000002` | ADMIN | Operations Admin | `/admin` |
| `03005551234` | VENDOR_OWNER | Chapli Kabab House Owner | `/vendor` |
| `03005551235` | VENDOR_OWNER | Peshawar BBQ Owner | `/vendor` |
| `03005551236` | VENDOR_STAFF | Kitchen Staff | `/vendor` |
| `03009876543` | RIDER | Bilal Shah | `/rider` |
| `03009876544` | RIDER | Imran Gul | `/rider` |
| `03001234567` | CUSTOMER | Ahmad Khan | `/` |
| `03007654321` | CUSTOMER | Sana Bibi | `/` |

### Phone number formats

The API accepts all three of these and normalises them to E.164 (`+923001234567`):

```
03001234567
923001234567
+923001234567
```

All three are worth testing on the sign-in form.

### Registering new accounts

- Self-service signup allows **CUSTOMER**, **RIDER** and **VENDOR_OWNER** only.
- Staff and admin accounts can only be created by an admin via `POST /users`.
- Password rule: at least 8 characters, including a letter and a digit.
- Each phone number can register once — a repeat returns `409`.

---

## Seeded records

| Records | Count | Detail |
| --- | --- | --- |
| Users | 10 | Across all six roles |
| Restaurants | 3 | All ACTIVE |
| Menu items | 10 | Some with variants and add-ons |
| Orders | 30 | 26 DELIVERED, 2 READY_FOR_PICKUP, 2 PLACED |
| Coupons | 3 | One of each discount type |
| Cities / zones | 3 / 9 | Pabbi, Nowshera, Peshawar |
| Cuisine categories | 6 | Desi, BBQ, Karahi, Fast Food, Pizza, … |
| Riders | 2 | Both approved |
| Support tickets | 2 | For the admin support queue |
| Banners | 2 | For the home page, once built |

---

## Restaurants

| Name | URL slug | Useful for |
| --- | --- | --- |
| Chapli Kabab House | `chapli-kabab-house-pabbi` | Richest menu — has variants **and** add-ons |
| Peshawar BBQ & Grill | `peshawar-bbq-and-grill` | Multiple cuisine tags |
| Nowshera Pizza Point | `nowshera-pizza-point` | Different city and zone |

### Chapli Kabab House menu

The most useful restaurant for testing, because it exercises every menu feature.

| Category | Item | Price | Notes |
| --- | --- | --- | --- |
| Kababs | Seekh Kabab | Rs 180 | Spice level: Hot |
| Kababs | Chapli Kabab | Rs 250 | 2 variants + 1 add-on group |
| Karahi | Chicken Karahi | Rs 1,100 | 2 variants |
| Drinks | Soft Drink 500ml | Rs 100 | Vegetarian |
| Drinks | Fresh Lassi | Rs 150 | Vegetarian |

**Chapli Kabab** is the key test item:

- Variants: `Single` Rs 250 (default), `Plate of 3` Rs 700
- Add-on group "Add bread" — optional, maximum 2: `Naan` +Rs 30, `Roghani Naan` +Rs 60

> Variant prices are **absolute**, not added to the base price. Selecting `Plate of 3` means
> Rs 700, not Rs 250 + Rs 700.

Worked example — `Plate of 3` + `Naan`, quantity 2:

```
(700 + 30) × 2 = Rs 1,460
```

---

## Coupons

| Code | Type | Value | Minimum spend | Notes |
| --- | --- | --- | --- | --- |
| `FREEDEL` | Free delivery | — | Rs 700 | 500 uses, 5 per customer |
| `WELCOME20` | Percentage | 20% | Rs 400 | First order only, capped at Rs 300 |
| `ZASS100` | Fixed amount | Rs 100 | Rs 500 | — |

> **Coupon usage does not reset.** Redemptions are consumed by testing and count against the
> limits above. Re-seed when a previously working coupon starts being refused.

---

## Order states in seed data

| Status | Count | Useful for |
| --- | --- | --- |
| DELIVERED | 26 | Order history, reports, invoices |
| READY_FOR_PICKUP | 2 | Rider pickup flow |
| PLACED | 2 | Vendor accept/reject flow |

---

## Resetting

```bash
cd /var/www/zassdelivery
npm run prisma:seed
```
