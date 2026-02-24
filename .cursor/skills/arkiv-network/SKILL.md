---
name: arkiv-network
description: Build applications with Arkiv — a decentralized data layer on Ethereum with queryable, time-scoped storage. Use when working with Arkiv, @arkiv-network/sdk, temporary/cost-efficient blockchain storage, entity CRUD, attribute-based queries, or Expires In data management.
---

# Arkiv Network

Arkiv is a decentralized data layer on Ethereum: queryable storage with built-in expiration and attributes. No external indexing; pay only for storage duration.

## Core Concepts

- **Entities** — Data records with content, attributes, and expiration time
- **Attributes** — Key-value pairs for querying: `{ key: "type", value: "note" }` (string) or `{ key: "priority", value: 5 }` (numeric)
- **Expires In** — Automatic expiration in seconds (use `ExpirationTime` helper)

## Network (Mendoza Testnet)

| Resource | Value |
|----------|-------|
| Chain ID | 60138453056 |
| RPC | `https://mendoza.hoodi.arkiv.network/rpc` |
| WebSocket | `wss://mendoza.hoodi.arkiv.network/rpc/ws` |
| Explorer | explorer.mendoza.hoodi.arkiv.network |
| Faucet | mendoza.hoodi.arkiv.network/faucet |

## Client Setup

**Install:** `pnpm add @arkiv-network/sdk` (or `bun add` / `npm install`)

### Wallet (read/write) — requires private key

```typescript
import { createWalletClient, http } from "@arkiv-network/sdk"
import { privateKeyToAccount } from "@arkiv-network/sdk/accounts"
import { mendoza } from "@arkiv-network/sdk/chains"

const walletClient = createWalletClient({
  chain: mendoza,
  transport: http(),
  account: privateKeyToAccount(process.env.PRIVATE_KEY),
})
```

### Public (read-only) — no private key

```typescript
import { createPublicClient, http } from "@arkiv-network/sdk"
import { mendoza } from "@arkiv-network/sdk/chains"

const publicClient = createPublicClient({
  chain: mendoza,
  transport: http(),
})
```

### Browser (MetaMask)

```typescript
import { createWalletClient, custom } from "@arkiv-network/sdk"
const walletClient = createWalletClient({
  chain: mendoza,
  transport: custom(window.ethereum),
})
```

Add network to MetaMask: `wallet_addEthereumChain` with `chainId: '0xe0087f840'`, `rpcUrls: ['https://mendoza.hoodi.arkiv.network/rpc']`.

## CRUD Operations

```typescript
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils"

// Create
const { entityKey, txHash } = await walletClient.createEntity({
  payload: jsonToPayload({ message: "Hello" }),
  contentType: 'application/json',
  attributes: [{ key: 'type', value: 'greeting' }],
  expiresIn: ExpirationTime.fromMinutes(30),
})

// Get
const entity = await publicClient.getEntity(entityKey)

// Update
await walletClient.updateEntity({
  entityKey,
  payload: jsonToPayload(updatedData),
  contentType: 'application/json',
  attributes: [...],
  expiresIn: ExpirationTime.fromHours(24),
})

// Delete
await walletClient.deleteEntity({ entityKey })

// Extend lifetime
await walletClient.extendEntity({
  entityKey,
  additionalTime: ExpirationTime.fromHours(24),
})
```

## Querying

```typescript
import { eq, gt, gte, lt, lte, or, and } from "@arkiv-network/sdk/query"

const query = publicClient.buildQuery()
const results = await query
  .where(eq('type', 'note'))
  .where(gt('priority', 3))
  .where(gt('created', 1672531200))
  .withAttributes(true)
  .withPayload(true)
  .limit(100)
  .fetch()
```

Use numeric attributes for range queries (`gt`, `gte`, `lt`, `lte`); string attributes use `eq` or `or([eq(...), eq(...)])`.

## Real-time Events

```typescript
const unwatch = publicClient.watchEntities({
  onCreated: (e) => console.log("Created:", e.entityKey),
  onUpdated: (e) => console.log("Updated:", e.entityKey),
  onDeleted: (e) => console.log("Deleted:", e.entityKey),
  onExtended: (e) => console.log("Extended:", e.entityKey),
  pollingInterval: 2000,
})
// unwatch() when done
```

## Batch Operations

```typescript
const results = await Promise.all(
  items.map(item => walletClient.createEntity({ ... }))
)
```

## Expiration Time Reference

| Use Case | Example |
|----------|---------|
| Session / cache | `ExpirationTime.fromMinutes(30)` |
| Clipboard | `ExpirationTime.fromHours(1)` |
| Daily notes | `ExpirationTime.fromHours(12)` or `fromDays(1)` |
| Weekly data | `ExpirationTime.fromDays(7)` |
| Monthly backup | `ExpirationTime.fromDays(30)` |

## Best Practices

1. **Use `createPublicClient` for read-only** — no private key, safe for frontend
2. **Use `ExpirationTime` helper** — never hardcode seconds
3. **Numeric attributes for range queries** — `{ key: 'priority', value: 5 }` enables `gt()`, `lt()`
4. **Add `.limit()` to queries** — avoid unbounded results
5. **Never expose private keys** — use env vars; write operations via backend API

## Python SDK

```python
from arkiv_sdk import create_client, create_ro_client, Tagged, Annotation

# Full client
client = await create_client(
    60138453056, key, rpc_url, ws_url
)

# Read-only
ro_client = await create_ro_client(60138453056, rpc_url, ws_url)
entities = await ro_client.query_entities('type = "greeting"')
```

## Error Handling

- `insufficient funds` → Get test ETH from faucet
- `entity not found` → Entity expired or doesn't exist

## Common Use Cases

- Temporary session data, cross-device clipboard
- Event logs, analytics with cleanup
- File metadata, chunked file storage (64KB chunks)
- Real-time chat, collaborative tools

## Full Reference

For detailed API docs, JSON-RPC, integration examples (Next.js, Express), file storage, testing, and deployment, see [ARKIV_DOCS.md](../../../ARKIV_DOCS.md) in the project root.
