# Clink

**Show up. Get rewarded.**

Clink is an event platform that solves the no-show problem and rewards people who actually show up — built on [Arkiv](https://arkiv.network)'s queryable, time-scoped storage on Ethereum.


## Click below to watch the demo
[![Watch the video](https://github.com/user-attachments/assets/4480b300-63fb-4a6b-baff-fd6c8d820846)](https://youtu.be/wogG_TWxd9I)

 

## Overview

Clink addresses the 40–60% no-show rates on free events by:

- **Verifiable attendance** — Check in at events to build on-chain reputation
- **Clink Score** — Reputation based on show-up rate (RSVPs vs. check-ins)
- **Clink connections** — Post-event networking with verified attendees via QR/scan or direct add
- **Data ownership** — Events, RSVPs, and attendance live on Arkiv, not a central database

## Features

### For Everyone

- **Event discovery** — Browse upcoming events without connecting a wallet
- **RSVP system** — Connect wallet (Privy) and RSVP to events
- **Check-in & proof of attendance** — Time-limited 6-character codes; organizers publish, attendees enter; verifiable on-chain
- **Clink Score** — Show-up rate (%), streak, newcomer status — visible on profiles and attendee lists

### For Organizers

- **Create events** — Title, description, date/time, location, capacity, community tag
- **Edit events** — Update details (organizer-only)
- **My Events** — Dashboard of events you created
- **Check-in management** — Publish a check-in code (2-hour expiry) or display QR code for attendees
- **Attendees page** — View RSVPs with Clink Scores, send "Clink" connection requests to verified attendees

### For Attendees

- **Profile** — Display name, Clink Score, total RSVPs, check-ins, streak; editable display name
- **Friends** — Network graph of confirmed connections; accept/decline pending requests; add friends via QR scan or by entering their address
- **Check-in** — Enter code or scan QR at events to prove attendance

### Filtering, Search & UX

- **Multi-filter events feed** — Filter pills: Upcoming / Live / Ended / Cancelled + community tags; keyword search across title, description, location; results update instantly
- **Capacity badge** — "Full" badge when RSVPs ≥ capacity; RSVP button disabled for full/cancelled events
- **Status badges** — Live (green pulsing), Upcoming, Ended, Cancelled — derived from `status` attribute and `event_timestamp`
- **Onboarding tour** — First-time visitors get a 7-step guided tour (nextstepjs); ? button re-triggers it anytime
- **Faucet UX** — Zero-balance wallets automatically see an amber "No funds" pill with a popover linking to the Mendoza faucet; address copy included
- **Wallet abstraction** — Privy handles wallet creation (embedded wallets for email users), chain switching to Mendoza, and all signing; users don't need to know about Arkiv
- **Error states** — Network errors, failed transactions, forbidden access (non-owner edit attempt), and form validation all surface clear messages; no silent failures

## Tech Stack

- **Next.js 16** (App Router) + TypeScript
- **React 19**
- **Tailwind CSS 4** + shadcn/ui + tw-animate-css
- **Privy** — Wallet auth (wallet + email), embedded wallets, Mendoza chain
- **Arkiv SDK** — Decentralized data layer (Mendoza testnet)
- **Framer Motion** — Animations
- **Lucide React** — Icons
- **React Flow (@xyflow/react)** — Friends network graph
- **@yudiel/react-qr-scanner** + **react-qr-code** — QR scan/display
- **styled-components** — Privy modal styling
- **OGL** — 3D/WebGL (pattern graphics)

## Project Structure

```text
src/
├── app/
│   ├── page.tsx              # Landing (hero, HowItWorks, WhyClink, ForOrganizersAttendees, PoweredByArkiv)
│   ├── layout.tsx
│   ├── profile/page.tsx      # User profile, Clink Score, edit display name
│   ├── friends/page.tsx      # Network graph, pending clinks, QR add/scan
│   ├── events/
│   │   ├── page.tsx          # Events feed
│   │   ├── create/page.tsx   # Create event form
│   │   ├── my-events/page.tsx # Organizer's events
│   │   └── [id]/
│   │       ├── page.tsx      # Event detail, RSVP
│   │       ├── edit/page.tsx # Edit event (organizer only)
│   │       ├── checkin/page.tsx # Check-in code/QR (organizer) + code entry (attendee)
│   │       └── attendees/page.tsx # RSVP list, Clink Scores, send Clink
├── components/
│   ├── header.tsx            # Nav, wallet balance, connect/disconnect
│   ├── providers.tsx         # Privy + Auth context
│   ├── events-feed.tsx       # Event cards, query Arkiv
│   ├── how-it-works.tsx
│   ├── why-clink.tsx
│   ├── for-organizers-attendees.tsx
│   ├── powered-by-arkiv.tsx
│   ├── page-transition.tsx
│   ├── pattern-graphic.tsx
│   ├── ribbons.tsx
│   ├── mobile-nav.tsx
│   └── ui/                   # Button, Card, Input, Badge, etc.
└── lib/
    ├── arkiv.ts              # Public client, Mendoza RPC
    ├── arkiv-wallet.ts       # createArkivWalletClient (Privy provider)
    └── utils.ts

scripts/
├── seed-demo.ts              # Demo events, profiles, RSVPs, check-ins, clinks
└── seed-incoming-clinks.ts   # Seed pending clinks for a user (CLINK_RECEIVER)
```

### Architecture

```text
Browser (Next.js App Router)
  ├── Privy           → wallet auth, chain switching, tx signing
  ├── Arkiv SDK       → all reads via publicClient.buildQuery()
  │                     all writes via createArkivWalletClient(privyProvider)
  └── No backend      → zero API routes; all state lives on Arkiv Mendoza
```

All reads are stateless queries against the Arkiv RPC. All writes go through the user's wallet (Privy-managed) via `createArkivWalletClient`, which wraps the EIP-1193 provider from Privy into Arkiv's wallet client. There is no server-side state, no database, and no admin key.

## Arkiv Integration

Clink uses Arkiv as its **only** data layer — no backend, no traditional database. Every event, RSVP, check-in, profile, connection, and cancellation is a queryable, wallet-owned entity on the Mendoza testnet.

### Entity Schema

Seven distinct entity types with typed, queryable attributes:

| Type | Key attributes | Payload | Expiry |
|------|----------------|---------|--------|
| `event` | `type`, `organizer`, `community`, `event_timestamp`, `status` | title, description, location, organizerAddress, capacity, etc. | 30 days |
| `profile` | `type`, `address`, `show_up_rate`, `streak`, `last_checkin`, `newcomer` | displayName, totalRsvps, totalCheckins, showUpRate, currentStreak | 365 days |
| `rsvp` | `type`, `event_key`, `attendee`, `rsvp_timestamp`, `checked_in` | attendeeAddress, attendeeName, eventEntityKey, checkedIn, checkedInTimestamp | 60 days |
| `attendance` | `type`, `attendee`, `community`, `event_date` | attendeeAddress, eventEntityKey, eventTitle, checkinTimestamp | 365 days |
| `checkin_code` | `type`, `event_key`, `code` | code, eventKey, createdAt | **2 hours** |
| `clink` | `type`, `initiator`, `receiver`, `event_key`, `status`, `clink_timestamp` | initiator, receiver, eventEntityKey, eventTitle, status (pending/confirmed) | 365 days |
| `flag` | `type`, `flag_type`, `event_key` | eventKey, eventTitle, cancelledBy, cancelledAt, reason | 30 days |

### Query Model

Queries use Arkiv's native `buildQuery()` API — not application-side filtering:

```typescript
// Events feed: multi-attribute filter + native attribute-based sort
const result = await publicClient.buildQuery()
  .where(eq("type", "event"))
  .where(gt("event_timestamp", nowInSeconds))
  .orderBy(asc("event_timestamp", "number"))   // ← native sort
  .withPayload(true)
  .withAttributes(true)
  .limit(50)
  .fetch();

// My Events: ownedBy() — wallet-level ownership, not attribute matching
const result = await publicClient.buildQuery()
  .where(eq("type", "event"))
  .ownedBy(walletAddress)                       // ← entity owner check
  .withPayload(true)
  .withAttributes(true)
  .limit(50)
  .fetch();

// RSVPs for an event
const result = await publicClient.buildQuery()
  .where(eq("type", "rsvp"))
  .where(eq("event_key", entityKey))
  .withPayload(true)
  .withAttributes(true)
  .fetch();
```

Predicates used: `eq`, `gt`, `asc` from `@arkiv-network/sdk/query`. Sorting is performed by Arkiv at the storage layer.

### Ownership Model

End-user wallets own their entities directly. The organizer's wallet creates and owns event entities — `.ownedBy()` is used to query "my events" by wallet ownership, not by an `organizer` attribute. Attendees own their own RSVPs and attendance records. Profiles are self-owned and self-updated.

Edit/update flows verify wallet ownership before writing to Arkiv. A user who didn't create an event cannot update it (the Arkiv write will fail, and the UI enforces this with a forbidden state).

### Entity Relationships

```text
event ──────────────────────────────────────────────────┐
 └── rsvp (event_key → event)                           │
      └── attendance (event_date, attendee → profile)   │
 └── checkin_code (event_key → event)                   │
 └── flag (event_key → event, flag_type: "cancelled")   │
 └── clink (event_key → event, initiator/receiver → profile)
```

References are maintained on create: every `rsvp`, `attendance`, `checkin_code`, `clink`, and `flag` entity stores the parent `event_key` as a queryable attribute. This enables reliable navigation (load all RSVPs for an event, load all attendances for a user, load all clinks involving an event).

### Differentiated Expiration

Expiration is set per entity type to match real-world data lifecycle:

| Entity | Expiry | Reasoning |
| ------ | ------ | --------- |
| `checkin_code` | **2 hours** | Code must expire quickly — no reuse after event |
| `event` | 30 days | Events are no longer relevant shortly after they end |
| `flag` | 30 days | Cancellation flag lives as long as the event |
| `rsvp` | 60 days | Buffer past event end for post-event flows |
| `attendance` | 365 days | Permanent reputation record |
| `clink` | 365 days | Permanent social connection record |
| `profile` | 365 days | Permanent identity/reputation record |

### Entity Lifecycle Transitions

Events have a four-state lifecycle managed by Arkiv entity updates:

```text
upcoming → active    (organizer publishes check-in code)
active   → past      (time-based, event_timestamp in the past)
upcoming → cancelled (organizer cancels — creates a flag entity)
```

Cancellation uses the **flags-as-entities** pattern: instead of just flipping a status attribute, a separate `flag` entity is created on-chain with `flag_type: "cancelled"` and a reference to the event. This makes cancellation an auditable, queryable, first-class event in the data model — not a silent attribute mutation.

### Advanced Features Summary

| Feature | Description |
| ------- | ----------- |
| `orderBy()` | Native attribute-based sort on `event_timestamp` |
| `ownedBy()` | Wallet-level entity ownership for "my events" |
| Flags as entities | Cancellation flag is a separate Arkiv entity |
| Lifecycle transitions | `upcoming → active → past / cancelled` via entity updates |
| Time-scoped codes | `checkin_code` auto-expires after 2h via Arkiv expiration |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm

### Installation

```bash
pnpm install
```

### Environment Variables

Create `.env.local`:

```bash
# Get your Privy App ID from https://dashboard.privy.io
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id

# For seeding (optional)
SEED_PRIVATE_KEY=0x...   # Funded wallet for creating demo entities
CLINK_RECEIVER=0x...     # Optional: target address for seed-incoming-clinks
```

### Seeding Demo Data

To populate the platform with demo events, RSVPs, profiles, check-ins, and clinks:

```bash
# 1. Generate a wallet and get the address
pnpm run seed

# 2. Fund the printed address at https://mendoza.hoodi.arkiv.network/faucet

# 3. Add the private key to .env.local (or .env):
#    SEED_PRIVATE_KEY=0x...

# 4. Run the seed again
pnpm run seed
```

The seed creates 4 events, 6 attendee profiles, RSVPs with check-ins for the first 2 events, check-in codes, and confirmed clinks between attendees.

### Seed Incoming Clinks

To create pending clink requests for a specific user (e.g. for testing the Friends page):

```bash
CLINK_RECEIVER=0xYourAddress pnpm run seed:clinks
```

Requires `SEED_PRIVATE_KEY` (same funded wallet as main seed).

### Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
pnpm build
pnpm start
```

## Arkiv Network (Mendoza)

- **Chain ID:** `60138453056`
- **RPC:** `https://mendoza.hoodi.arkiv.network/rpc`
- **Faucet:** [mendoza.hoodi.arkiv.network/faucet](https://mendoza.hoodi.arkiv.network/faucet)

Add Mendoza to your wallet to interact with Clink. Privy is configured to use Mendoza by default (embedded wallets + external wallets).

## Design

- **Theme:** Dark (black background, white/primary accents)
- **Primary:** Pink/magenta (`#ff52a2` / `oklch`)
- **Typography:** Malinton (display), Inter (body)
- **Layout:** Brutalist-inspired, bold typography, video hero with logo mask

## License

MIT
