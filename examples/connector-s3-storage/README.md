# connector-s3-storage — T1 storage connector example

Reference implementation of `StorageProvider` against any S3-compatible
bucket. The same code works against AWS S3, Cloudflare R2, Backblaze B2,
MinIO, and DigitalOcean Spaces — only the `s3_endpoint` secret value
changes.

## What this example demonstrates

- **All 5 StorageProvider methods** — `put` + `get` + `delete` + `list` +
  `presignUrl`.
- **AWS SigV4 signing implemented inline.** No AWS SDK; every signing step
  uses `ctx.crypto.digest('sha256', ...)` + `ctx.crypto.hmac('sha256', ...)`,
  the two primitives the SDK exposes inside the isolate. The presigned-URL
  variant (signature in query string) is shown alongside the
  `Authorization`-header variant.
- **Streaming put/get.** `put` accepts a `ReadableStream` (consumed for
  signing); `get` returns one (forwarded from the upstream response).
- **`endpoint`-configurable** so the same connector targets multiple
  providers — that's the entire reason S3-compatible APIs exist.
- **Idempotent delete** — silently treats 404 as success per S3 semantics.

## What this example deliberately does NOT do

- **Multipart upload.** Single-PUT only; presign + multipart can be a
  follow-up example. Files > 5 GB would need multipart.
- **Range-GET / partial reads.** `get` returns the whole object.
- **Server-side encryption.** Headers like `x-amz-server-side-encryption`
  belong on the put — add them if your provider requires.
- **Production XML parsing for list.** The example uses a regex over
  `<Key>` elements. Real connectors should use DOMParser (available in the
  isolate).

## Provider quirks worth knowing

| Provider | `s3_endpoint` example | Notes |
|---|---|---|
| AWS S3 | `https://s3.us-east-1.amazonaws.com` | Vanilla — the reference. |
| Cloudflare R2 | `https://<account>.r2.cloudflarestorage.com` | Region is always `auto`. |
| Backblaze B2 | `https://s3.<region>.backblazeb2.com` | S3-API mode only — use the s3-compatible bucket. |
| MinIO (self-host) | `https://minio.example.com` | Region is whatever you set; certs must be valid. |
| DigitalOcean Spaces | `https://<region>.digitaloceanspaces.com` | Region is the slug (e.g. `nyc3`). |

## LLM authoring notes

When porting this to a non-S3-compatible storage API:

- **Replace the auth path** — the SigV4 dance is S3-specific. Azure Blob,
  Google Cloud Storage, and others use different signing.
- **Keep the 5-method shape** — `StorageProvider` is the contract. If your
  provider lacks one (rare), implement it via the next-best primitive (e.g.
  no native list → walk a separate index file).
- **Add every upstream host to `manifest.outbound_hosts`** — Azure +
  Google + others use one specific host per service/region.

## Publishing

```bash
vincia test       # vitest sanity check
vincia publish    # to Forge marketplace
```
