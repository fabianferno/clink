# Clink

**Show up. Get rewarded.**

Clink is an event platform that solves the no-show problem and rewards people who actually show up — built on [Arkiv](https://arkiv.network)'s queryable, time-scoped storage.

## Features

- **Event creation & discovery** — Create events, browse upcoming events
- **RSVP system** — Connect wallet and RSVP to events
- **Check-in & proof of attendance** — Time-limited check-in codes, verifiable attendance
- **Clink Score** — Reputation based on show-up rate (coming soon)
- **Clink connections** — Post-event networking with verified attendees (coming soon)

## Tech Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS** + shadcn/ui
- **Privy** — Wallet auth
- **Arkiv SDK** — Decentralized data layer (Mendoza testnet)
- **Framer Motion** — Animations
- **Lucide React** — Icons

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
```

### Seeding Demo Data

To populate the platform with demo events, RSVPs, profiles, and clinks:

```bash
# 1. Generate a wallet and get the address
pnpm run seed

# 2. Fund the printed address at https://mendoza.hoodi.arkiv.network/faucet

# 3. Add the private key to .env.local (or .env):
#    SEED_PRIVATE_KEY=0x...

# 4. Run the seed again
pnpm run seed
```

The seed creates 4 events, 6 attendee profiles, RSVPs with check-ins, and clink connections.

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

## Arkiv Network

Clink stores all data on Arkiv (Mendoza testnet):

- **Events** — Stored as entities with queryable attributes
- **RSVPs** — Link attendees to events
- **Attendance proofs** — Verifiable check-in records
- **User profiles** — Clink Score, attendance history

Add Mendoza to your wallet:
- Chain ID: `60138453056`
- RPC: `https://mendoza.hoodi.arkiv.network/rpc`
- [Faucet](https://mendoza.hoodi.arkiv.network/faucet)

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/      # React components
├── lib/             # Utilities, Arkiv clients
```

## License

MIT
