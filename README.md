# Clink

**Show up. Get rewarded.**

Clink is an event platform that solves the no-show problem and rewards people who actually show up — built on [Arkiv](https://arkiv.network)'s queryable, time-scoped storage on Ethereum.

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

```
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

## Arkiv Data Model

All data is stored on Arkiv Mendoza testnet. Entity types:

| Type | Key attributes | Payload | Expiry |
|------|----------------|---------|--------|
| `event` | `type`, `organizer`, `community`, `event_timestamp`, `status` | title, description, location, organizerAddress, capacity, etc. | 30 days |
| `profile` | `type`, `address`, `show_up_rate`, `streak`, `last_checkin`, `newcomer` | displayName, totalRsvps, totalCheckins, showUpRate, currentStreak | 365 days |
| `rsvp` | `type`, `event_key`, `attendee`, `rsvp_timestamp`, `checked_in` | attendeeAddress, attendeeName, eventEntityKey, checkedIn, checkedInTimestamp | 60 days |
| `attendance` | `type`, `attendee`, `community`, `event_date` | attendeeAddress, eventEntityKey, eventTitle, checkinTimestamp | 365 days |
| `checkin_code` | `type`, `event_key`, `code` | code, eventKey, createdAt | 2 hours |
| `clink` | `type`, `initiator`, `receiver`, `event_key`, `status`, `clink_timestamp` | initiator, receiver, eventEntityKey, eventTitle, status (pending/confirmed) | 365 days |

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
