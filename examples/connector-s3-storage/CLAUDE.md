# CLAUDE.md — connector-s3-storage

T1 storage connector implementing `StorageProvider` against any S3-compatible
bucket. Read this example when authoring a connector for any blob-store
provider whose API supports S3 SigV4.

Reading order:

1. Developer kit's `docs/prompt-for-developer-llm.md` — RULES 1-22.
2. `@vincia/sdk/connector/storage.ts` — the 5-method `StorageProvider` contract.
3. This example's `src/index.ts` — note the SigV4 signing helpers + per-method auth.
4. This example's `manifest.json` — every host + secret is declared.

Preserve when adapting to a non-S3-compatible storage API:

- The 5-method shape — `put`, `get`, `delete`, `list`, `presignUrl`.
- All HTTP via `ctx.outbound.fetch`. All credentials via `ctx.secrets.get`.
- Crypto via `ctx.crypto.digest` / `ctx.crypto.hmac` (Node's crypto blocked).
- Declare every contact host in `manifest.outbound_hosts`.

Swap when targeting Azure Blob / GCS / Backblaze native:

- Replace the SigV4 signing helpers with the provider's auth scheme.
- Replace the XML list parser (S3-specific) with whatever the provider returns.

Out of scope: multipart upload, server-side encryption, range reads. See README.
