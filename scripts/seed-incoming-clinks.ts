/**
 * Seed incoming clinks for a specific user address.
 * Creates pending clink requests from demo attendees to the target address.
 *
 * Usage:
 *   CLINK_RECEIVER=0xA979b9A676aE24Aa3A062443798c87f7af37948B pnpm run seed:clinks
 *
 * Requires SEED_PRIVATE_KEY in .env.local (same funded wallet as main seed).
 */

import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local" });

import { createWalletClient, http } from "@arkiv-network/sdk";
import { privateKeyToAccount } from "@arkiv-network/sdk/accounts";
import { mendoza } from "@arkiv-network/sdk/chains";
import { eq } from "@arkiv-network/sdk/query";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";
import { ARKIV_RPC, publicClient } from "../src/lib/arkiv";

const DEMO_ATTENDEE_KEYS = [
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
  "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
];

const ATTENDEE_NAMES = ["Alex", "Sam", "Jordan", "Riley", "Casey"];

const DEFAULT_RECEIVER = "0xA979b9A676aE24Aa3A062443798c87f7af37948B";

async function main() {
  const privateKey = process.env.SEED_PRIVATE_KEY as `0x${string}` | undefined;
  if (!privateKey || !privateKey.startsWith("0x") || privateKey.length !== 66) {
    console.error("SEED_PRIVATE_KEY required in .env.local. Run the main seed first.");
    process.exit(1);
  }

  const receiver = (process.env.CLINK_RECEIVER || DEFAULT_RECEIVER).trim();
  if (!receiver.startsWith("0x") || receiver.length !== 42) {
    console.error("Invalid CLINK_RECEIVER. Use a valid 0x-prefixed address.");
    process.exit(1);
  }

  const wallet = createWalletClient({
    chain: mendoza,
    transport: http(ARKIV_RPC),
    account: privateKeyToAccount(privateKey),
  });

  const attendees = DEMO_ATTENDEE_KEYS.map((key, i) => ({
    address: privateKeyToAccount(key as `0x${string}`).address,
    name: ATTENDEE_NAMES[i] ?? `User${i + 1}`,
  }));

  const now = Math.floor(Date.now() / 1000);

  // Get an event for context (optional - use "direct" if none found)
  let eventKey = "direct";
  let eventTitle = "Direct Add";
  try {
    const eventQ = publicClient.buildQuery();
    const events = await eventQ
      .where(eq("type", "event"))
      .withPayload(true)
      .limit(1)
      .fetch();
    if (events.entities.length > 0) {
      eventKey = events.entities[0].key;
      const payload = events.entities[0].toJson() as Record<string, unknown>;
      eventTitle = (payload.title as string) || "an event";
    }
  } catch {
    // use defaults
  }

  console.log("Seeding incoming clinks for:", receiver);
  console.log("Event context:", eventTitle, "→", eventKey);
  console.log("");

  let created = 0;
  for (const initiator of attendees) {
    if (initiator.address.toLowerCase() === receiver.toLowerCase()) continue;

    const existingQ = publicClient.buildQuery();
    const existing = await existingQ
      .where(eq("type", "clink"))
      .where(eq("initiator", initiator.address))
      .where(eq("receiver", receiver))
      .where(eq("event_key", eventKey))
      .limit(1)
      .fetch();

    if (existing.entities.length > 0) {
      console.log("  Skipped (exists):", initiator.name, "→", receiver.slice(0, 10) + "...");
      continue;
    }

    await wallet.createEntity({
      payload: jsonToPayload({
        initiator: initiator.address,
        receiver,
        eventEntityKey: eventKey,
        eventTitle,
        status: "pending",
        message: "",
        timestamp: now,
      }),
      contentType: "application/json",
      attributes: [
        { key: "type", value: "clink" },
        { key: "initiator", value: initiator.address },
        { key: "receiver", value: receiver },
        { key: "event_key", value: eventKey },
        { key: "status", value: "pending" },
        { key: "clink_timestamp", value: String(now) },
      ],
      expiresIn: ExpirationTime.fromDays(365),
    });

    console.log("  Created:", initiator.name, "→ you");
    created++;
  }

  console.log("\n✅ Done. Created", created, "incoming clinks.");
  console.log("Check /friends to see pending requests.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
