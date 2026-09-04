# QA — Order Lifecycle and Live Rider Tracking

[← Back to docs index](README.md)

Step-by-step manual test process for the whole journey an order takes:

**customer places → vendor accepts → nearest rider is offered it → rider collects → customer
follows the rider on a live map → rider confirms with the customer's code.**

- [Before you start](#before-you-start)
- [Who you need signed in](#who-you-need-signed-in)
- [How the flow actually works](#how-the-flow-actually-works)
- [OL-01 — Full happy path](#ol-01--full-happy-path-four-windows)
- [OL-02 — Dispatch picks the nearest rider](#ol-02--dispatch-picks-the-nearest-rider)
- [OL-03 — Offer expiry and re-offer](#ol-03--offer-expiry-and-re-offer)
- [OL-04 — Rider declines](#ol-04--rider-declines)
- [OL-05 — Vendor staff, not just the owner](#ol-05--vendor-staff-not-just-the-owner)
- [OL-06 — Live tracking under a bad connection](#ol-06--live-tracking-under-a-bad-connection)
- [OL-07 — Delivery code](#ol-07--delivery-code)
- [OL-08 — Rejection and cancellation](#ol-08--rejection-and-cancellation)
- [OL-09 — Vendor delivers their own order](#ol-09--vendor-delivers-their-own-order)
- [Permission and access checks](#permission-and-access-checks)
- [Known behaviour that reads like a bug](#known-behaviour-that-reads-like-a-bug)
- [Reporting a bug](#reporting-a-bug)

---

## Before you start

### 1. Bring the stack up

```bash
cd /var/www/zassdelivery
docker compose up -d postgres redis minio
npm run start:dev

cd /var/www/zassdeliver-frontend
npm run dev
```

### 2. Confirm the ports match

This is the single most common cause of a "nothing is live" report. The frontend talks to
whatever `.env.local` names, **not** to whatever the backend happens to be on:

```bash
cat /var/www/zassdeliver-frontend/.env.local
```

Both values must point at the running API:

```
NEXT_PUBLIC_API_URL=http://localhost:3002/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3002
```

> The frontend dev server runs on **8005** (`npm run dev`). [SETUP.md](SETUP.md) still says 8000
> and 3000 in places — trust `package.json` and `.env.local` over the prose.

### 3. Confirm the API is healthy

```bash
curl http://localhost:3002/api/v1/health
```

Both `database` and `redis` must report `"up"`. **Redis matters here** — it backs the socket
adapter, and live updates are the whole subject of this document.

### 4. Reset to a clean baseline

```bash
cd /var/www/zassdelivery
npm run prisma:seed
```

### 5. Confirm the live connection before testing anything else

Sign in as any user and look at the header. It must **not** say "Reconnecting…". If it does,
every test below will fail for the same reason and none of those failures are real bugs.

---

## Who you need signed in

This flow has four actors and you cannot test it from one browser session — signing in as the
rider signs you out as the customer. Use **four separate browser profiles or windows**, one per
actor. Regular tabs in the same profile share the session and will fight each other.

| Window | Sign in as | Phone | Password | Opens |
| --- | --- | --- | --- | --- |
| A — Customer | Ahmad Khan | `03001234567` | `Zass@1234` | `/restaurants` |
| B — Vendor | Chapli Kabab House Owner | `03005551234` | `Zass@1234` | `/vendor/orders` |
| C — Rider | Bilal Shah | `03009876543` | `Zass@1234` | `/rider` |
| D — Second rider | Imran Gul | `03009876544` | `Zass@1234` | `/rider` |

Window D is only needed for [OL-02](#ol-02--dispatch-picks-the-nearest-rider),
[OL-03](#ol-03--offer-expiry-and-re-offer) and [OL-04](#ol-04--rider-declines).

### Faking a rider's location

Riders are ranked by how far they are from the restaurant, so a rider whose browser reports a
real position in your city will rank badly against a restaurant in Pabbi. Override it:

**Chrome / Edge** — DevTools → ⋮ (top-right of the drawer) → **Sensors** → Location → **Other…**
and enter the coordinates. **Firefox** — `about:config` → set `geo.provider.network.url` to a
`data:` URL, or use the Location Guard extension.

| Point | Latitude | Longitude |
| --- | --- | --- |
| Chapli Kabab House (Pabbi) | `34.0151` | `71.7938` |
| ~1 km from the restaurant | `34.0240` | `71.7938` |
| ~6 km from the restaurant | `34.0680` | `71.7938` |
| ~20 km away (outside the radius) | `34.1950` | `71.7938` |

Grant the location permission when the browser asks. A rider who denies it still gets offers,
but ranks below every rider who can be located — and their dot never appears on the customer's
map, which is exactly what you are here to test.

---

## How the flow actually works

Read this once. Most "bugs" in this area are the tester expecting a different sequence.

1. **The customer places the order.** It becomes `PLACED`. The vendor is notified — with a push
   notification, because the customer is watching a clock.
2. **The vendor accepts.** `PLACED → CONFIRMED`.
3. **Dispatch starts *at* `CONFIRMED`, not when the food is ready.** The moment the vendor
   accepts, the platform offers the run to the nearest available rider so they can ride to the
   restaurant while the food cooks. Waiting until `READY_FOR_PICKUP` would add the whole travel
   time to every delivery.
4. **The rider has 60 seconds to answer.** An unanswered offer expires and the order goes back
   into the queue for the next-best rider. A background sweep runs **every 10 seconds** and
   re-offers anything still waiting, so an order placed when every rider was busy is picked up
   as soon as one frees up — nobody has to press anything.
5. **The vendor drives the kitchen statuses** — `CONFIRMED → PREPARING → READY_FOR_PICKUP` —
   independently of what the rider is doing.
6. **The rider collects.** `READY_FOR_PICKUP → PICKED_UP`. A four-digit code is generated and
   sent to the customer at this moment; only its hash is stored.
7. **The rider sets off.** `PICKED_UP → ON_THE_WAY`. The customer is notified and the map goes
   live.
8. **The rider confirms at the door** with the customer's four digits. `ON_THE_WAY → DELIVERED`,
   and the rider's earnings are credited.

**Who may make each move is enforced server-side.** A rider cannot accept an order on the
restaurant's behalf, a customer cannot mark their own order delivered, and a terminal order
(`DELIVERED`, `CANCELLED`, `REJECTED`, `FAILED`) never moves again.

### Ranking, and the numbers behind it

A rider is offered a run only if they are `ACTIVE`, `ONLINE`, and not already holding an offer
or a delivery. Among those, ranking is **distance 60%, home zone 25%, rating 15%**.

| Setting | Default |
| --- | --- |
| Offer timeout | 60 seconds |
| Search radius | 8 km |
| Location freshness | 10 minutes |
| Dispatch sweep interval | 10 seconds |

A rider whose last position is older than 10 minutes is treated as unlocatable: still offered
work, but ranked below anyone who can actually be found.

---

## OL-01 — Full happy path (four windows)

The core scenario. Run this first; the rest are variations on it.

### Setup

1. **Window C (rider Bilal):** set the browser location to `34.0240, 71.7938` (~1 km from the
   restaurant). Open `/rider` and press **Online**.
   - **Expect:** a toast, "You're online — offers will start coming through." If it says "Turn
     on location so nearby runs reach you first", the location permission was denied — fix that
     before continuing, or the map half of this test cannot pass.
2. **Window D (rider Imran):** leave this rider **Offline** for now.
3. **Window B (vendor):** open `/vendor/orders` and leave it open. Do not refresh it again for
   the rest of this test — the point is that it updates itself.

### Place the order

4. **Window A (customer):** open `/restaurants`, choose **Chapli Kabab House**, add
   **Chapli Kabab** (variant *Plate of 3*, add-on *Naan*) and check out.
   - **Expect:** the order is placed and you land on the confirmation.
5. **Window A:** open `/orders`.
   - **Expect:** the order is at the top of **Active orders**, status **Placed**, with a
     **Track** button beside the status.
6. **Window B (vendor), without refreshing:**
   - **Expect:** a toast, "New order ZD-…", and the ticket appears in the **New** column on its
     own within a second or two.

### Vendor accepts — and the rider hears about it

7. **Window C (rider), before touching anything:** watch this window during the next step.
8. **Window B:** press **Accept** on the ticket.
   - **Expect (B):** the ticket moves to **In the kitchen**; status **Confirmed**.
   - **Expect (C):** within a second or two, and **with no refresh**, a toast — "New run from
     Chapli Kabab House" — and an offer card appears under **Offers** showing the earning, the
     pickup distance (~1 km), and a countdown starting near 60 seconds.
   - **Expect (A):** the customer's tracking screen (if open) moves to **Accepted**; a
     notification toast appears wherever they are in the app.

> This is the requirement "the nearest rider receives the order notification **after** the
> vendor accepts". If the offer appears before step 8, that is a bug. If it never appears, work
> through [Known behaviour](#known-behaviour-that-reads-like-a-bug) first.

### Rider accepts

9. **Window C:** press **Accept** on the offer card.
   - **Expect (C):** "Run accepted — head to the restaurant". The run appears under
     **Carrying now** with the full pickup and drop-off addresses and the customer's phone
     number, which were hidden until this moment.
   - **Expect (C):** the availability control is replaced by a non-interactive **On a delivery**
     badge — a rider cannot claim to be online while carrying an order.
   - **Expect (A):** the customer's tracking screen gains a **Your rider** card with Bilal
     Shah's name and a **Call** button.
   - **Expect (B):** the vendor's ticket shows the rider's name and number.

### The customer opens tracking

10. **Window A:** press **Track** on the order (or open `/orders/<id>` directly).
    - **Expect:** a progress strip with **Order placed** and **Accepted** ticked and the current
      step pulsing; a map; and a **Live** indicator with a green pulsing dot beside the map.
    - **Expect on the map:** an orange pin at the restaurant, a violet pin at the delivery
      address, and — once the rider's app has reported at least one position — a pulsing cyan
      dot for the rider, with a dashed line from the rider to the delivery address.
    - **Expect below the map:** "About N km away", matching roughly what the rider's screen
      says.

### The rider moves

11. **Window C:** change the browser's simulated location a few times (`34.0240` →
    `34.0200` → `34.0180`, same longitude).
    - **Expect (A):** the cyan dot moves within a second or two of each change, **with no
      refresh**, and the "About N km away" figure falls.
    - **Expect (A):** if you drag the map away, it does *not* snap back on every update — it
      only re-centres when the rider leaves the visible frame.

> Movements under about 20 m are deliberately not broadcast. Move the simulated position by a
> meaningful distance, not by a decimal place.

### Kitchen statuses

12. **Window B:** press **Start cooking**, then **Ready for pickup**.
    - **Expect (A):** the progress strip advances to **Being prepared**, then **Ready** — live,
      no refresh.
    - **Expect (C):** the rider's delivery panel now offers **I've collected the order**. It was
      not offered before this point.

### Collection — and the code

13. **Window C:** press **I've collected the order**.
    - **Expect (C):** "Order collected. Ask the customer for their four-digit code at the door."
    - **Expect (A):** status becomes **Collected**; a card appears saying to have the
      four-digit code ready.
    - **Expect (A):** a notification carrying the actual four digits. Note them down — they are
      never shown again, and only a hash is stored server-side.
14. **Window C:** press **I'm on the way**.
    - **Expect (C):** "On the way. The customer can now follow your progress."
    - **Expect (A):** status **On the way**, plus a notification — "Your rider is on the way".

### The door

15. **Window C:** enter the four digits from step 13 and press **Confirm delivery**.
    - **Expect (C):** "Delivery confirmed. Rs. N has been added to your wallet", with the
      earnings breakdown (base fare, per-km, tip share).
    - **Expect (A):** status **Delivered**; the map and the rider card disappear — there is
      nothing left to follow.
    - **Expect (A):** a notification, "Order ZD-… delivered".
    - **Expect (B):** the ticket leaves the board.
    - **Expect (C):** the rider is free again; the run appears under **Completed** and the
      availability control returns.
16. **Window A:** open `/orders` → **Previous orders**.
    - **Expect:** the order is listed, **Delivered**, with **no** Track button.

---

## OL-02 — Dispatch picks the nearest rider

1. Re-seed, or use a fresh order.
2. **Window C (Bilal):** location `34.0680, 71.7938` (~6 km out). Go **Online**.
3. **Window D (Imran):** location `34.0240, 71.7938` (~1 km out). Go **Online**.
4. Place an order (Window A) and accept it (Window B).
   - **Expect:** the offer goes to **Imran** (Window D), not Bilal — nearer wins.
   - **Expect:** Bilal's screen shows nothing. An order only ever has one live offer out at a
     time; it is not a race between riders.
5. Now put **Imran offline** and repeat with a new order.
   - **Expect:** the offer goes to Bilal at 6 km — inside the 8 km radius.
6. Move Bilal to `34.1950, 71.7938` (~20 km) and repeat with a new order.
   - **Expect:** **no offer at all.** Nobody is inside the radius. The order sits at
     `CONFIRMED` with no rider, and the vendor can still cook it.
   - **Expect:** bring a rider back inside the radius and the sweep offers it within ~10
     seconds, with nobody pressing anything.

---

## OL-03 — Offer expiry and re-offer

1. Both riders online, Imran nearer.
2. Place and accept an order. The offer lands on Imran.
3. **Window D:** do nothing. Watch the countdown.
   - **Expect:** the countdown turns red under 30 seconds, then reads **Expired** at zero, and
     the Accept and Decline buttons are disabled.
4. Keep watching Bilal's window (C).
   - **Expect:** within ~10 seconds of the expiry, the same run is offered to **Bilal**.
5. **Window D:** try to accept the expired offer anyway (if the button is still reachable).
   - **Expect:** refused — "This offer has expired and has been passed to another rider." The
     deadline is re-checked server-side, so winning a race against the sweep is not possible.

---

## OL-04 — Rider declines

1. Both riders online, Imran nearer. Place and accept an order.
2. **Window D:** press **Decline**.
   - **Expect (D):** "Passed on — it'll go to another rider", and the offer leaves the inbox.
3. **Expect (C):** within ~10 seconds the run is offered to Bilal.
4. Now decline it in Window C too, and watch both.
   - **Expect:** it is **not** re-offered to either rider. A rider who has declined a specific
     order is not asked about it again — the rejection is kept as the record of why the order
     sat unassigned.
   - **Expect:** the order stays at `CONFIRMED` with no rider until a different rider comes
     online.

---

## OL-05 — Vendor staff, not just the owner

The requirement is that the **owner or the staff** can change the status. Both must work.

1. Sign into Window B as **Kitchen Staff** — `03005551236` / `Zass@1234`.
   - **Expect:** lands on `/vendor`, and `/vendor/orders` shows **Chapli Kabab House's** queue —
     the one restaurant that account is pinned to, with no id in the address bar.
2. Run steps 4–12 of [OL-01](#ol-01--full-happy-path-four-windows) as the staff account.
   - **Expect:** Accept, Turn down, Start cooking, Ready for pickup and Mark delivered all work
     exactly as they do for the owner.
3. While signed in as staff, try to reach another restaurant's data (edit a URL, or call
   `GET /order-management/restaurants/<other-restaurant-id>` from Swagger with the staff token).
   - **Expect:** refused. Staff are scoped to their own restaurant.

---

## OL-06 — Live tracking under a bad connection

1. Get to `ON_THE_WAY` with the customer's tracking screen open.
2. **Window A:** DevTools → Network → **Offline**.
   - **Expect:** the indicator beside the map changes from **Live** to **Reconnecting…** (or
     **Not connected**) within a few seconds. The last known rider position stays on the map —
     it does not vanish.
3. Move the rider's simulated position while the customer is offline.
4. **Window A:** set the network back to **Online**.
   - **Expect:** the indicator returns to **Live**, and the rider dot jumps to its *current*
     position rather than replaying the moves that were missed. The screen resyncs from a fresh
     snapshot instead of trying to reason about the gap.
5. Reload the tracking page mid-delivery.
   - **Expect:** the map is correct immediately — restaurant pin, delivery pin, and the rider's
     last known position — without waiting for the rider's next report.

### The same, from the rider's side

6. **Window C:** put the *rider* offline in DevTools for ~30 seconds while moving the simulated
   position, then back online.
   - **Expect (A):** updates stop, then resume. They may resume less often for a moment: with
     the socket down the rider's app falls back to an HTTP write at most once every 15 seconds,
     and returns to per-movement updates once the socket is back.

---

## OL-07 — Delivery code

1. Get to `ON_THE_WAY`.
2. **Window C:** enter `0000` (or any wrong four digits) and confirm.
   - **Expect:** refused, and the order stays `ON_THE_WAY`.
3. Enter a wrong code several times.
   - **Expect:** the attempts are counted and the code locks out. A wrong guess that is not
     counted is an unlimited guess, so a failed attempt must still cost something.
4. Enter the correct code.
   - **Expect:** delivered, and the rider is paid.
5. **Window A:** check that the plaintext code appears **only** in the customer's notification —
   never on the rider's screen, and never in the order API response.

---

## OL-08 — Rejection and cancellation

### Vendor turns the order down

1. Place an order (Window A). In Window B press **Turn down** and give a reason of at least 5
   characters.
   - **Expect (B):** the ticket leaves the board.
   - **Expect (A):** a notification naming the restaurant, and the order moves to **Previous
     orders** as **Rejected**, with **no** Track button.
   - **Expect:** no rider is ever offered it.

### Customer cancels before cooking starts

2. Place an order. **Window A:** open `/orders` and press **Cancel order** while the status is
   still **Placed**.
   - **Expect:** cancelled, and anything paid is returned to the wallet.
3. Place another order, have the vendor accept **and** press **Start cooking**, then try to
   cancel as the customer.
   - **Expect:** refused — "The restaurant has already started preparing this order." Free
     cancellation stops once the kitchen has committed food to it. The Cancel button should not
     be offered at all at that point.

### Cancelling a run a rider is holding

4. Get an order to `CONFIRMED` with a rider who has **accepted** it, then cancel from the admin
   dispatch board (`/admin/dispatch`, signed in as `03000000001`).
   - **Expect:** allowed, and the rider is told — "This run is off. You are free for the next
     offer."
5. Try the same once the rider has **collected** the order.
   - **Expect:** refused — "The rider is already carrying this order. Mark the delivery failed
     instead." An order in a rider's bag has to be delivered or explicitly failed, not quietly
     detached.

---

## OL-09 — Vendor delivers their own order

Not every order sees a rider — a cafeteria handing a bag over the counter, for instance.

1. Get an order to `READY_FOR_PICKUP` with **no rider** (all riders offline).
2. **Window B:** press **Mark delivered**.
   - **Expect:** allowed. `READY_FOR_PICKUP → DELIVERED`.
   - **Expect (A):** delivered, with no rider ever shown and no map.

---

## Permission and access checks

Run these with the API directly (Swagger at `http://localhost:3002/api/docs`) — they are the
checks a UI cannot be trusted to enforce on its own.

| Attempt | Expected |
| --- | --- |
| Customer opens `/orders/<someone-else's-id>` | Not found — the same answer as an order that does not exist, so ids cannot be probed |
| Customer subscribes to another customer's order over the socket | `subscription:error`, "That order is not available to you." |
| Rider reports a position naming somebody else's order in the payload | The payload's order is ignored entirely; the position is attributed to the rider's own accepted run or to nothing |
| Rider calls `POST /order-management/<id>/accept` | Refused — a rider may not accept on the restaurant's behalf |
| Customer calls `POST /order-management/<id>/delivered` | Refused |
| Rider A opens rider B's assignment id | Not found |
| Anyone moves a `DELIVERED` order | Refused — terminal statuses never change |
| Rider who has not been approved goes online | Refused — approval gates going online, not the portal itself |

---

## Known behaviour that reads like a bug

| What you see | Why it is correct |
| --- | --- |
| The rider's dot does not move when you nudge the simulated location slightly | Movements under ~20 m are not broadcast. A parked rider would otherwise fill the customer's connection with a stationary dot. |
| The offer appears before the food is ready | Deliberate. Dispatch opens at `CONFIRMED` so the rider travels while the food cooks. |
| No offer arrives even though a rider is online | Check, in order: the rider is **approved** (not pending); **online** (not on break); not already holding an offer or a delivery; within **8 km**; and has a position **fresher than 10 minutes**. |
| The offer went to the "wrong" rider | Distance is 60% of the score, not 100%. Home zone (25%) and rating (15%) can flip two riders who are similarly close. |
| An order sits at `CONFIRMED` with no rider for a while | Normal at busy times. The sweep retries every 10 seconds; nothing is stuck and nobody needs to intervene. |
| The customer is told "picked up" and "on the way" as two separate events | They are two separate states. The rider has the bag at `PICKED_UP` and has left the restaurant at `ON_THE_WAY`. |
| No push notification on the desktop | Push needs a registered device token. In-app notifications and live updates work regardless — test those. |
| Map tiles look inverted in dark mode | Intended. There is one tile set; dark mode re-hues it rather than pulling in a second provider. |
| The dashed line to the address is straight | It is the distance remaining, not a route. Drawing a road the app has not actually computed would be a promise it cannot keep. |
| "Reconnecting…" in the header during development | The dev server restarts the socket on every code change. It clears itself. |
| A rider who denied location still gets offers | Intended — they simply rank below every rider who can be located. Their dot will never appear on the customer's map. |

---

## Reporting a bug

Include all of these, or the report is not actionable:

1. **Which window/actor** — customer, vendor, rider, admin — and the phone number signed in.
2. **The order number** (`ZD-…`) and, if relevant, the assignment.
3. **The status the order was in** when it happened, and the status you expected.
4. **Whether the header said "Live"** at the time. A dropped socket explains most missing-update
   reports and is not itself a bug.
5. **The simulated coordinates** in use for every rider involved.
6. **The browser console and the API log** around the moment — the backend logs every dispatch
   decision, including why an order was *not* dispatched.
