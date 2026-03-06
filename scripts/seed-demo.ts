/**
 * Clink Demo Seed Script
 *
 * Creates demo data on Arkiv Mendoza testnet: events, RSVPs, profiles,
 * check-ins, clinks, and check-in codes. Uses a single funded wallet to
 * create all entities (payload/attributes store attendee identities).
 *
 * Resumable: skips entities that already exist, so you can re-run after
 * a failure and it will continue from where it left off.
 *
 * Usage:
 *   1. pnpm run seed
 *   2. Fund the printed wallet address at: https://mendoza.hoodi.arkiv.network/faucet
 *   3. Add SEED_PRIVATE_KEY to .env.local (or .env) and run again: pnpm run seed
 */

import { config } from "dotenv";

// Load .env.local (Next.js) and .env so SEED_PRIVATE_KEY is available
config({ path: ".env" });
config({ path: ".env.local" });

import { createWalletClient, http } from "@arkiv-network/sdk";
import { privateKeyToAccount, generatePrivateKey } from "@arkiv-network/sdk/accounts";
import { mendoza } from "@arkiv-network/sdk/chains";
import { eq } from "@arkiv-network/sdk/query";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";
import { ARKIV_RPC, publicClient } from "../src/lib/arkiv";

// Deterministic "attendee" addresses for demo (derived from fixed keys so data is reproducible)
const DEMO_ATTENDEE_KEYS = [
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
  "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
  "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
];

const ATTENDEE_NAMES = ["Alex", "Sam", "Jordan", "Riley", "Casey", "Morgan"];

function getOrCreatePrivateKey(): `0x${string}` | null {
  const env = process.env.SEED_PRIVATE_KEY;
  if (env && env.startsWith("0x") && env.length === 66) {
    return env as `0x${string}`;
  }
  const key = generatePrivateKey();
  const account = privateKeyToAccount(key);
  console.log("\n--- NEW WALLET (no SEED_PRIVATE_KEY set) ---");
  console.log("Address to fund:", account.address);
  console.log("Private key (save to .env as SEED_PRIVATE_KEY):");
  console.log(key);
  console.log("\n1. Fund this address at: https://mendoza.hoodi.arkiv.network/faucet");
  console.log("2. Add to .env: SEED_PRIVATE_KEY=" + key);
  console.log("3. Run again: pnpm run seed");
  console.log("---\n");
  return null;
}

function createWallet(privateKey: `0x${string}`) {
  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    chain: mendoza,
    transport: http(ARKIV_RPC),
    account,
  });
}

function getAttendeeAddresses(): { address: string; name: string }[] {
  return DEMO_ATTENDEE_KEYS.map((key, i) => ({
    address: privateKeyToAccount(key as `0x${string}`).address,
    name: ATTENDEE_NAMES[i] ?? `User${i + 1}`,
  }));
}

async function main() {
  const privateKey = getOrCreatePrivateKey();
  if (!privateKey) {
    process.exit(0);
  }
  const wallet = createWallet(privateKey);
  const organizerAddress = wallet.account!.address;
  const organizerName = `${organizerAddress.slice(0, 6)}...${organizerAddress.slice(-4)}`;
  const attendees = getAttendeeAddresses();
  const now = Math.floor(Date.now() / 1000);
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const futureDate = (daysFromNow: number, hour: number, minute: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysFromNow);
    return {
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      time: `${pad(hour)}:${pad(minute)}`,
    };
  };

  console.log("Seeding Clink demo data on Arkiv Mendoza...");
  console.log("Organizer:", organizerAddress);
  console.log("Using future dates from:", today.toISOString().slice(0, 10));

  // ─── Events (dates relative to today so they're always upcoming) ─────────
  const d1 = futureDate(7, 18, 0);
  const d2 = futureDate(14, 10, 0);
  const d3 = futureDate(18, 19, 30);
  const d4 = futureDate(21, 14, 0);
  const events = [
    {
      title: "Web3 Builders Meetup",
      description: "Monthly gathering for builders in the ecosystem. Bring ideas, find co-founders.",
      location: "The Hive, Downtown",
      date: d1.date,
      time: d1.time,
      community: "eth-chennai",
    },
    {
      title: "Arkiv Hackathon Kickoff",
      description: "48-hour hackathon focused on Arkiv-powered apps. Prizes for best use of time-scoped storage.",
      location: "Virtual + Bangalore Hub",
      date: d2.date,
      time: d2.time,
      community: "arkiv",
    },
    {
      title: "Community Dinner",
      description: "Informal dinner for the core community. No agenda, just good food and conversation.",
      location: "Secret location (RSVP for details)",
      date: d3.date,
      time: d3.time,
      community: "general",
    },
    {
      title: "Clink Demo Day",
      description: "See Clink in action. Learn how reputation and check-ins work on Arkiv.",
      location: "Online",
      date: d4.date,
      time: d4.time,
      community: "clink",
    },
  ];

  const eventKeys: string[] = [];
  for (const ev of events) {
    const eventTimestamp = Math.floor(new Date(`${ev.date}T${ev.time}`).getTime() / 1000);
    const existingQ = publicClient.buildQuery();
    const existing = await existingQ
      .where(eq("type", "event"))
      .where(eq("community", ev.community))
      .where(eq("event_timestamp", eventTimestamp))
      .withPayload(true)
      .limit(5)
      .fetch();
    const ours = existing.entities.find((e) => {
      const p = e.toJson() as Record<string, unknown>;
      return (p.organizerAddress as string)?.toLowerCase() === organizerAddress.toLowerCase();
    });
    if (ours) {
      eventKeys.push(ours.key);
      console.log("  Skipped (exists) event:", ev.title, "→", ours.key);
    } else {
      const { entityKey } = await wallet.createEntity({
        payload: jsonToPayload({
          title: ev.title,
          description: ev.description,
          location: ev.location,
          imageUrl: "",
          organizerAddress,
          organizerName,
          capacity: 50,
          currentRsvps: 0,
        }),
        contentType: "application/json",
        attributes: [
          { key: "type", value: "event" },
          { key: "community", value: ev.community },
          { key: "event_timestamp", value: eventTimestamp },
          { key: "status", value: "upcoming" },
        ],
        expiresIn: ExpirationTime.fromDays(30),
      });
      eventKeys.push(entityKey);
      console.log("  Created event:", ev.title, "→", entityKey);
    }
  }

  // ─── Profiles (varied: newcomers, veterans, different show-up rates) ─────
  const profileSpecs = [
    { totalRsvps: 2, totalCheckins: 2, newcomer: 1 },
    { totalRsvps: 5, totalCheckins: 4, newcomer: 0 },
    { totalRsvps: 1, totalCheckins: 0, newcomer: 1 },
    { totalRsvps: 8, totalCheckins: 8, newcomer: 0 },
    { totalRsvps: 3, totalCheckins: 2, newcomer: 0 },
    { totalRsvps: 4, totalCheckins: 4, newcomer: 0 },
  ];

  for (let i = 0; i < attendees.length; i++) {
    const a = attendees[i]!;
    const spec = profileSpecs[i]!;
    const profileQ = publicClient.buildQuery();
    const existingProfile = await profileQ
      .where(eq("type", "profile"))
      .where(eq("address", a.address))
      .limit(1)
      .fetch();
    if (existingProfile.entities.length > 0) {
      console.log("  Skipped (exists) profile:", a.name);
      continue;
    }
    const showUpRate = spec.totalRsvps > 0 ? Math.round((spec.totalCheckins / spec.totalRsvps) * 100) : 0;
    await wallet.createEntity({
      payload: jsonToPayload({
        address: a.address,
        displayName: a.name,
        bio: "",
        totalRsvps: spec.totalRsvps,
        totalCheckins: spec.totalCheckins,
        showUpRate: showUpRate / 100,
        currentStreak: spec.totalCheckins >= 2 ? 2 : spec.totalCheckins,
        lastCheckinTimestamp: spec.totalCheckins > 0 ? now - 86400 : 0,
      }),
      contentType: "application/json",
      attributes: [
        { key: "type", value: "profile" },
        { key: "address", value: a.address },
        { key: "show_up_rate", value: String(showUpRate) },
        { key: "streak", value: String(spec.totalCheckins >= 2 ? 2 : spec.totalCheckins) },
        { key: "last_checkin", value: String(spec.totalCheckins > 0 ? now - 86400 : 0) },
        { key: "newcomer", value: String(spec.newcomer) },
      ],
      expiresIn: ExpirationTime.fromDays(365),
    });
    console.log("  Created profile:", a.name);
  }

  // ─── RSVPs + check-ins for first 2 events ────────────────────────────────
  const rsvpTimestamp = now - 3600;
  const checkinTimestamp = now - 1800;

  for (let eIdx = 0; eIdx < Math.min(2, eventKeys.length); eIdx++) {
    const eventKey = eventKeys[eIdx]!;
    const eventPayload = events[eIdx]!;
    const eventTs = Math.floor(new Date(`${eventPayload.date}T${eventPayload.time}`).getTime() / 1000);

    // Check-in code for this event
    const code = "DEMO" + String(eIdx + 1).padStart(2, "0");
    const codeQ = publicClient.buildQuery();
    const existingCode = await codeQ
      .where(eq("type", "checkin_code"))
      .where(eq("event_key", eventKey))
      .where(eq("code", code))
      .limit(1)
      .fetch();
    if (existingCode.entities.length === 0) {
      await wallet.createEntity({
        payload: jsonToPayload({
          code,
          eventKey,
          createdAt: now,
        }),
        contentType: "application/json",
        attributes: [
          { key: "type", value: "checkin_code" },
          { key: "event_key", value: eventKey },
          { key: "code", value: code },
        ],
        expiresIn: ExpirationTime.fromHours(2),
      });
      console.log("  Created check-in code:", code, "for event", eIdx + 1);
    } else {
      console.log("  Skipped (exists) check-in code:", code);
    }

    // RSVPs: first 4 attendees RSVP and check in
    for (let aIdx = 0; aIdx < 4; aIdx++) {
      const a = attendees[aIdx]!;
      const checkedIn = true;
      const rsvpQ = publicClient.buildQuery();
      const existingRsvp = await rsvpQ
        .where(eq("type", "rsvp"))
        .where(eq("event_key", eventKey))
        .where(eq("attendee", a.address))
        .limit(1)
        .fetch();
      if (existingRsvp.entities.length === 0) {
        await wallet.createEntity({
          payload: jsonToPayload({
            attendeeAddress: a.address,
            attendeeName: a.name,
            eventEntityKey: eventKey,
            rsvpTimestamp,
            checkedIn,
            checkedInTimestamp: checkedIn ? checkinTimestamp : 0,
          }),
          contentType: "application/json",
          attributes: [
            { key: "type", value: "rsvp" },
            { key: "event_key", value: eventKey },
            { key: "attendee", value: a.address },
            { key: "rsvp_timestamp", value: String(rsvpTimestamp) },
            { key: "checked_in", value: checkedIn ? "1" : "0" },
          ],
          expiresIn: ExpirationTime.fromDays(60),
        });
      }

      const attQ = publicClient.buildQuery();
      const existingAtt = await attQ
        .where(eq("type", "attendance"))
        .where(eq("attendee", a.address))
        .where(eq("event_date", String(eventTs)))
        .limit(1)
        .fetch();
      if (existingAtt.entities.length === 0) {
        await wallet.createEntity({
          payload: jsonToPayload({
            attendeeAddress: a.address,
            eventEntityKey: eventKey,
            eventTitle: eventPayload.title,
            eventDate: eventTs,
            community: eventPayload.community,
            checkinTimestamp,
          }),
          contentType: "application/json",
          attributes: [
            { key: "type", value: "attendance" },
            { key: "attendee", value: a.address },
            { key: "community", value: eventPayload.community },
            { key: "event_date", value: String(eventTs) },
          ],
          expiresIn: ExpirationTime.fromDays(365),
        });
      }
    }
    console.log("  RSVPs + check-ins for event", eIdx + 1);
  }

  // ─── RSVPs only (no check-in) for events 3 and 4 ────────────────────────
  for (let eIdx = 2; eIdx < eventKeys.length; eIdx++) {
    const eventKey = eventKeys[eIdx]!;
    for (let aIdx = 0; aIdx < attendees.length; aIdx++) {
      const a = attendees[aIdx]!;
      if (aIdx >= 4) continue;
      const rsvpQ2 = publicClient.buildQuery();
      const existingRsvp2 = await rsvpQ2
        .where(eq("type", "rsvp"))
        .where(eq("event_key", eventKey))
        .where(eq("attendee", a.address))
        .limit(1)
        .fetch();
      if (existingRsvp2.entities.length > 0) continue;
      await wallet.createEntity({
        payload: jsonToPayload({
          attendeeAddress: a.address,
          attendeeName: a.name,
          eventEntityKey: eventKey,
          rsvpTimestamp,
          checkedIn: false,
          checkedInTimestamp: 0,
        }),
        contentType: "application/json",
        attributes: [
          { key: "type", value: "rsvp" },
          { key: "event_key", value: eventKey },
          { key: "attendee", value: a.address },
          { key: "rsvp_timestamp", value: String(rsvpTimestamp) },
          { key: "checked_in", value: "0" },
        ],
        expiresIn: ExpirationTime.fromDays(60),
      });
    }
    console.log("  RSVPs (no check-in) for event", eIdx + 1);
  }

  // ─── Clinks (confirmed connections between attendees) ──────────────────────
  const clinkPairs: [number, number][] = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 3],
    [0, 3],
  ];
  const firstEventKey = eventKeys[0]!;
  const firstEventTitle = events[0]!.title;
  let clinksCreated = 0;

  for (const [i, j] of clinkPairs) {
    const initiator = attendees[i]!;
    const receiver = attendees[j]!;
    const clinkQ = publicClient.buildQuery();
    const existingClink = await clinkQ
      .where(eq("type", "clink"))
      .where(eq("initiator", initiator.address))
      .where(eq("receiver", receiver.address))
      .where(eq("event_key", firstEventKey))
      .limit(1)
      .fetch();
    if (existingClink.entities.length > 0) continue;
    await wallet.createEntity({
      payload: jsonToPayload({
        initiator: initiator.address,
        receiver: receiver.address,
        eventEntityKey: firstEventKey,
        eventTitle: firstEventTitle,
        status: "confirmed",
        message: "",
        timestamp: now,
      }),
      contentType: "application/json",
      attributes: [
        { key: "type", value: "clink" },
        { key: "initiator", value: initiator.address },
        { key: "receiver", value: receiver.address },
        { key: "event_key", value: firstEventKey },
        { key: "status", value: "confirmed" },
        { key: "clink_timestamp", value: String(now) },
      ],
      expiresIn: ExpirationTime.fromDays(365),
    });
    clinksCreated++;
  }
  console.log("  Created", clinksCreated, "clinks (skipped", clinkPairs.length - clinksCreated, "existing)");

  console.log("\n✅ Demo data seeded successfully!");
  console.log("\n--- FUND THIS WALLET ---");
  console.log("Address:", organizerAddress);
  console.log("Faucet:  https://mendoza.hoodi.arkiv.network/faucet");
  console.log("\nEvents created:", eventKeys.length);
  for (let i = 0; i < eventKeys.length; i++) {
    console.log(`  ${i + 1}. ${events[i]!.title} → /events/${eventKeys[i]}`);
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
