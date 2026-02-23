# @tpmjs/tools-cloudflare

Cloudflare API tools for AI agents. Manage DNS records, zones, Workers, KV namespaces, and purge cache.

## Installation

```bash
npm install @tpmjs/tools-cloudflare
```

## Setup

Set your Cloudflare API token and account ID:

```bash
export CLOUDFLARE_API_TOKEN="..."
export CLOUDFLARE_ACCOUNT_ID="..."  # Required for Workers and KV operations
```

## Usage

```typescript
import { listZones, listDnsRecords, createDnsRecord } from '@tpmjs/tools-cloudflare';

const zones = await listZones.execute({ per_page: 10 });
const records = await listDnsRecords.execute({ zone_id: 'abc123', type: 'A' });
const newRecord = await createDnsRecord.execute({
  zone_id: 'abc123',
  type: 'A',
  name: 'app.example.com',
  content: '1.2.3.4',
  proxied: true,
});
```

## Tools

| Tool | Description |
|------|-------------|
| `listZones` | List zones with name and status filters |
| `getZone` | Get details of a specific zone |
| `purgeCache` | Purge cached content by URLs or purge everything |
| `listDnsRecords` | List DNS records with type and name filters |
| `createDnsRecord` | Create a new DNS record |
| `updateDnsRecord` | Update an existing DNS record |
| `deleteDnsRecord` | Delete a DNS record |
| `listWorkers` | List all Workers scripts |
| `getWorker` | Get metadata for a Worker script |
| `deleteWorker` | Delete a Worker script |
| `listKvNamespaces` | List KV namespaces |
| `listKvKeys` | List keys in a KV namespace |
| `getKvValue` | Get a value from KV |
| `putKvValue` | Write a key-value pair to KV |
| `deleteKvKey` | Delete a key from KV |

## License

MIT
