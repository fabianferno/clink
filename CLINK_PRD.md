# Clink — Product Requirements Document

## One-Liner

Clink is an event platform that solves the no-show problem and rewards people who actually show up — built on Arkiv's queryable, time-scoped storage.

---

## Problem

Free/low-cost event platforms (Luma, Eventbrite, Meetup) suffer from a fundamental flaw: **every RSVP is treated equally**. This creates cascading problems:

1. **No-show rates of 40-60%** on free events — organizers can't plan capacity, catering, or venue.
2. **No attendee reputation** — serial no-shows face zero consequences; reliable attendees get no reward.
3. **Post-event networking dies** — you meet people, forget names, lose context within 48 hours.
4. **No continuity between events** — each event is a blank slate. Organizers rebuild from zero every time.
5. **Community data is fragmented** — events on Luma, discussions on Discord, outreach on Twitter. Nothing ties a person's community participation together.

## Why Arkiv

This is not "decentralization for its own sake." The product requires a **structured, temporal, queryable attendance data layer** — which is exactly what Arkiv provides:

- **Queryable attributes** → "Give me everyone who attended 3+ events in the last 90 days" is a native Arkiv query (`gt('attendance_count', 2)` + `gt('last_attended', timestamp90DaysAgo)`).
- **Time-scoped expiration** → Reputation should decay. A streak from 2 years ago shouldn't carry the same weight. `ExpirationTime` lets attendance records and reputation scores naturally age out unless renewed.
- **Entity-based storage** → Events, RSVPs, check-ins, connections ("clinks") are all distinct entities with attributes — fits Arkiv's data model perfectly.
- **Real-time events** → `watchEntities` enables live check-in feeds, real-time attendee counts, and instant connection notifications.

---

## Target User

**Primary: Community event organizers** (tech meetups, web3 events, local communities, hackathon organizers) who run recurring free/low-cost events and are tired of no-shows and lack of attendee data.

**Secondary: Active event attendees** who go to a lot of events and want their participation to mean something — better access, better connections, a portable track record.

---

## Core Product Loop

```
Show up → Check in → Build reputation → Unlock better events → Meet better people → Keep showing up
```

---

## Features

### P0 — Must Have for Hackathon Demo

#### 1. Event Creation & Discovery

- Organizer creates an event with: title, description, date/time, location (or virtual link), capacity, cover image.
- Events are stored as Arkiv entities with queryable attributes.
- Public event feed with basic filtering (upcoming, past, by community).

**Arkiv Data Model — Event Entity:**
```
Entity: Event
Payload (JSON): {
  title: string,
  description: string,
  location: string,
  imageUrl: string,
  organizerAddress: string,
  organizerName: string,
  capacity: number,
  currentRsvps: number
}
Attributes:
  - { key: "type", value: "event" }
  - { key: "community", value: "<community-slug>" }       // string, eq() query
  - { key: "event_timestamp", value: <unix_seconds> }      // numeric, range query
  - { key: "status", value: "upcoming" | "active" | "past" }
ExpiresIn: ExpirationTime.fromDays(30) after event date    // auto-cleanup
```

#### 2. RSVP System

- Attendee connects wallet (MetaMask) and RSVPs to an event.
- RSVP creates an Arkiv entity linking the attendee to the event.
- Organizer sees RSVP list with attendee reputation scores.

**Arkiv Data Model — RSVP Entity:**
```
Entity: RSVP
Payload (JSON): {
  attendeeAddress: string,
  attendeeName: string,
  eventEntityKey: string,
  rsvpTimestamp: number,
  checkedIn: boolean
}
Attributes:
  - { key: "type", value: "rsvp" }
  - { key: "event_key", value: "<event-entity-key>" }      // string, eq() query
  - { key: "attendee", value: "<wallet-address>" }          // string, eq() query
  - { key: "rsvp_timestamp", value: <unix_seconds> }        // numeric
  - { key: "checked_in", value: 0 | 1 }                    // numeric (0=no, 1=yes)
ExpiresIn: ExpirationTime.fromDays(30) after event date
```

#### 3. Check-In & Proof of Attendance

- At the event, organizer opens a check-in page (generates a time-limited QR code or check-in code).
- Attendee scans/enters code → RSVP entity is updated with `checked_in: 1`.
- Check-in window is time-limited (opens 15 min before event, closes 1 hour after start) — enforced via the code expiring, not on-chain expiration.
- Checked-in attendees receive a **proof of attendance** — a separate Arkiv entity that persists longer than the event.

**Arkiv Data Model — Attendance Proof Entity:**
```
Entity: AttendanceProof
Payload (JSON): {
  attendeeAddress: string,
  eventEntityKey: string,
  eventTitle: string,
  eventDate: number,
  community: string,
  checkinTimestamp: number
}
Attributes:
  - { key: "type", value: "attendance" }
  - { key: "attendee", value: "<wallet-address>" }
  - { key: "community", value: "<community-slug>" }
  - { key: "event_date", value: <unix_seconds> }
ExpiresIn: ExpirationTime.fromDays(365)                    // renew annually via extendEntity — attendance proofs are permanent records
```

#### 4. Reputation Score (Clink Score) — Fully On-Chain

- **All computation happens on-chain via Arkiv queries** — no off-chain scoring service.
- On each check-in, the frontend/client queries all RSVP entities for the user in the last 90 days (`eq('attendee', address)` + `gt('rsvp_timestamp', 90DaysAgoUnix)`), counts `checked_in: 1` vs total, and writes the updated score to the user's profile entity.
- This means the score is transparent, auditable, and verifiable by anyone querying Arkiv.
- Displayed on the attendee's profile and visible to organizers on the RSVP list.
- **Organizers see full attendee details** — including individual no-show history, not just aggregates. This data is critical for event planning.

**Cold-Start: Newcomer System**
- Users with fewer than 3 RSVPs are tagged as "Newcomers" (`newcomer` attribute = 1).
- Newcomers display a "New" badge instead of a Clink Score — no misleading 0% or 100% from one event.
- Newcomers can RSVP to **any** event, including reputation-gated events, during their first 3 RSVPs. This prevents a chicken-and-egg problem where new users can't attend events to build a score.
- After 3 RSVPs, their actual Clink Score activates and the `newcomer` attribute is set to 0. Gating rules apply normally from that point.

**Arkiv Data Model — User Profile Entity:**
```
Entity: UserProfile
Payload (JSON): {
  address: string,
  displayName: string,
  bio: string,
  totalRsvps: number,
  totalCheckins: number,
  showUpRate: number,              // 0.0 to 1.0
  currentStreak: number,           // consecutive events attended
  lastCheckinTimestamp: number
}
Attributes:
  - { key: "type", value: "profile" }
  - { key: "address", value: "<wallet-address>" }
  - { key: "show_up_rate", value: <0-100> }                // numeric, for gating queries
  - { key: "streak", value: <number> }
  - { key: "last_checkin", value: <unix_seconds> }
  - { key: "newcomer", value: 1 | 0 }                     // numeric, 1 = fewer than 3 RSVPs
ExpiresIn: ExpirationTime.fromDays(365)                    // renews on activity
```

#### 5. "Clink" — Post-Event Connection

This is the signature feature. After an event, attendees who checked in can send a "clink" (connection request) to other attendees. Both parties must have been verified as present.

- Attendee views the post-event attendee list (only checked-in attendees visible).
- Sends a clink request → creates a pending connection entity.
- Other person accepts → entity updated to confirmed.
- Clink connections persist and form a verifiable social graph.

**Arkiv Data Model — Clink Connection Entity:**
```
Entity: ClinkConnection
Payload (JSON): {
  initiator: string,
  receiver: string,
  eventEntityKey: string,
  eventTitle: string,
  status: "pending" | "confirmed",
  message: string,                  // optional intro message
  timestamp: number
}
Attributes:
  - { key: "type", value: "clink" }
  - { key: "initiator", value: "<wallet-address>" }
  - { key: "receiver", value: "<wallet-address>" }
  - { key: "event_key", value: "<event-entity-key>" }
  - { key: "status", value: "pending" | "confirmed" }
  - { key: "clink_timestamp", value: <unix_seconds> }
ExpiresIn: ExpirationTime.fromDays(365)                    // long-lived
```

---

### P1 — Nice to Have (if time allows)

#### 6. Reputation-Gated Events

- Organizer can set a minimum Clink Score to RSVP (e.g., "only 70%+ show-up rate").
- Frontend queries the user's profile entity and checks `show_up_rate` before allowing RSVP.
- **Newcomer exception:** Users with `newcomer: 1` bypass gating for their first 3 events to solve the cold-start problem.
- This creates the core flywheel: attend → build reputation → access better events.

#### 7. Live Event Dashboard

- Organizer sees real-time check-in feed using `watchEntities` on RSVP entities for their event.
- Shows: total RSVPs, checked-in count, no-show count (after check-in window closes), average Clink Score of attendees.

#### 8. Community Pages

- Group events under a community (e.g., "ETH Chennai", "Indie Hackers Mumbai").
- Community page shows upcoming events, past events, top attendees by streak/score.
- Query: `eq('type', 'event')` + `eq('community', 'eth-chennai')` + `gt('event_timestamp', now)`.

#### 9. Expiring Early-Bird / VIP Access

- Organizer creates a time-limited access tier (e.g., "first 20 RSVPs in 24 hours get front-row seats").
- Implemented as a separate entity with short expiration that gates a special RSVP attribute.

---

### P2 — Future / Post-Hackathon

- Clink Score portable across platforms (any app can query Arkiv for a user's attendance history).
- Event co-hosting (multiple organizer wallets).
- Ticket payments (integrate with on-chain payments).
- Event templates and recurring events.
- Push notifications for clink requests and event reminders.

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Data Layer** | Arkiv (Mendoza Testnet) | Core storage for all entities |
| **Frontend** | Next.js (App Router) + Tailwind CSS | Fast to build, good DX |
| **Wallet** | MetaMask via `window.ethereum` | Standard web3 wallet |
| **Arkiv SDK** | `@arkiv-network/sdk` | Entity CRUD, queries, real-time |
| **Auth** | Wallet-based (sign message to prove ownership) | No passwords, no email |
| **Hosting** | Vercel | Zero-config deploy for Next.js |

---

## Page Structure

```
/                       → Landing page + upcoming events feed
/events/create          → Create event form (wallet required)
/events/[id]            → Event detail page (RSVP, attendee list, check-in)
/events/[id]/checkin    → Check-in page (organizer generates code, attendees enter it)
/events/[id]/attendees  → Post-event attendee list + clink functionality
/profile/[address]      → User profile (Clink Score, attendance history, connections)
/community/[slug]       → Community page (events, members, leaderboard)
```

---

## Key User Flows

### Flow 1: Organizer Creates Event
1. Connect wallet on `/events/create`.
2. Fill in event details (title, description, date, location, capacity).
3. Submit → `walletClient.createEntity()` with event payload and attributes.
4. Redirect to `/events/[entityKey]`.

### Flow 2: Attendee RSVPs
1. Browse events on `/`.
2. Click into event → see details, organizer info, current RSVP count.
3. Connect wallet → click "RSVP".
4. Frontend queries user's profile entity. If no profile exists, create one with `newcomer: 1`.
5. If event is reputation-gated: allow RSVP if user is a newcomer (`newcomer: 1`) OR meets the minimum `show_up_rate`. Block otherwise.
6. If capacity allows, create RSVP entity.

### Flow 3: Check-In at Event
1. Organizer opens `/events/[id]/checkin` → generates a 6-character alphanumeric code (stored in app state or as a short-lived Arkiv entity).
2. Attendee opens event page on their phone → enters check-in code.
3. Backend/frontend verifies code, updates RSVP entity (`checked_in: 1`), creates AttendanceProof entity.
4. User's profile entity is updated (increment `totalCheckins`, recalculate `showUpRate`, update `streak`).

### Flow 4: Post-Event Clink
1. After event ends, attendees visit `/events/[id]/attendees`.
2. See list of checked-in attendees (query: `eq('type', 'rsvp')` + `eq('event_key', id)` + `eq('checked_in', 1)`).
3. Click "Clink" on someone → creates ClinkConnection entity with `status: "pending"`.
4. Other person sees pending clink on their profile → accepts → entity updated to `status: "confirmed"`.

### Other features
- Adding Friends
- Incognito attendance
- Social Graph

---

## Arkiv Query Cheat Sheet

| What you need | Query |
|---|---|
| All upcoming events | `eq('type', 'event')` + `gt('event_timestamp', nowUnix)` |
| Events for a community | `eq('type', 'event')` + `eq('community', slug)` |
| RSVPs for an event | `eq('type', 'rsvp')` + `eq('event_key', eventKey)` |
| Checked-in attendees | `eq('type', 'rsvp')` + `eq('event_key', eventKey)` + `eq('checked_in', 1)` |
| User's attendance history | `eq('type', 'attendance')` + `eq('attendee', address)` |
| User's profile | `eq('type', 'profile')` + `eq('address', walletAddress)` |
| Pending clinks for a user | `eq('type', 'clink')` + `eq('receiver', address)` + `eq('status', 'pending')` |
| All clinks for a user | `eq('type', 'clink')` + `or([eq('initiator', address), eq('receiver', address)])` |
| High-reputation users | `eq('type', 'profile')` + `gt('show_up_rate', 70)` |

---

## UI/UX Notes

- **Keep it simple and fast.** This is not a web3 app for web3 people — it should feel like Luma but with a reputation layer.
- **Wallet connection should be one-click**, not a scary modal. Use friendly copy: "Connect to build your event reputation."
- **Clink Score should be prominent** — show it as a percentage badge next to every user's name. Color-coded: green (80%+), yellow (50-79%), red (<50%), gray (new user, no history).
- **The "Clink" action should feel fun** — use an animation (two glasses clinking) when a connection is made.
- **Mobile-first** — most check-ins happen on phones at events.
- **Dark mode by default** — matches the event/nightlife vibe.

---

## Hackathon Demo Script (3 minutes)

1. **Problem** (30s): "40-60% of people who RSVP to free events don't show up. Organizers are frustrated. Reliable attendees get nothing for being reliable."
2. **Create event** (30s): Show organizer creating an event on Clink.
3. **RSVP + Check-in** (45s): Show two attendees RSVPing, then checking in with the code at the event. Show the live dashboard updating.
4. **Clink Score** (30s): Show the attendee profiles — one has a 90% show-up rate, one is new. Show how the score appears on the RSVP list.
5. **Clink connection** (30s): Show two attendees "clinking" after the event. Show the mutual connection appear on both profiles.
6. **Gated event** (15s): Show an exclusive event that requires 70%+ show-up rate — the reliable attendee can RSVP, the new one can't yet.
7. **Closing** (15s): "Clink makes showing up matter. Built on Arkiv."

---

## Success Metrics (Post-Hackathon)

- No-show rate reduction for events using Clink vs baseline (target: <25%).
- % of attendees who complete at least one "clink" connection post-event.
- Repeat usage: organizers creating 2+ events.
- Clink Score distribution: are users actually building reputation over time?

---

## Design Decisions (Resolved)

- **Clink Score is fully on-chain.** All scoring is computed client-side by querying Arkiv entities directly. No off-chain scoring service. Transparent and auditable. Trade-off: gameable in theory, but the cost of creating fake check-ins (need physical presence + valid code) makes it impractical.
- **Cold-start: Newcomer grace period.** Users with <3 RSVPs get a "New" badge instead of a score, and can RSVP to any event (including gated ones). After 3 RSVPs, their real score activates. This prevents the chicken-and-egg problem without letting serial no-shows exploit the system indefinitely.
- **Organizers see everything.** Full attendee-level data: who RSVPed, who checked in, who no-showed, individual Clink Scores. This is the whole point — organizers need this data to plan better events.
- **Attendance proofs don't expire.** They are permanent historical records. Arkiv requires an `expiresIn`, so we set `ExpirationTime.fromDays(365)` and run periodic `extendEntity` calls to keep them alive indefinitely. The *reputation score* weights recent activity via query time-range filters (last 90 days), not by expiring the underlying data.
