# connector-stripe-payment — T1 payment connector example

A complete reference implementation of `PaymentProvider` against Stripe. Read
this when you're authoring any T1 `capability: 'payment'` connector — the
pattern is identical for Razorpay, PhonePe, PayPal, Square, etc; only the URL
+ auth header + response field names change.

## What this example demonstrates

- **All 4 PaymentProvider methods** — `createIntent` + `capture` + `refund` +
  `verifyWebhook` — with realistic argument plumbing.
- **`ctx.outbound.fetch`** for every HTTP call. Direct `fetch()` is blocked
  inside the isolate; outbound goes through the SDK's gated fetcher so the
  manifest's `outbound:api.stripe.com` scope is checked at call time.
- **`ctx.secrets.get`** for credential reads. Stripe's secret key + webhook
  signing secret never appear in source; they come from the host's secret
  store via scoped reads (`secret:stripe_secret_key`,
  `secret:stripe_webhook_secret`).
- **`ctx.crypto.hmacSha256` + `constantTimeEqual`** for webhook signature
  verification. The Node crypto module isn't available inside the isolate —
  use the SDK-provided primitives.
- **Idempotent capture + refund** — Stripe's API is naturally idempotent on
  intent id; the connector doesn't need its own retry-dedupe layer.
- **Manifest declares every host + secret + scope it uses.** The platform
  enforces those declarations at runtime; calling `ctx.outbound.fetch` for an
  undeclared host throws.

## What this example deliberately does NOT do

- **Subscription billing** is left to a follow-up example
  (`connector-stripe-subscriptions`). Subscription lifecycle has its own
  capability (`subscription`) per the SDK roadmap; this example covers
  one-time + auth-and-capture only.
- **Webhook event-handling beyond signature verification**. The
  `verifyWebhook` method returns true/false; the platform calls back into
  host-side `handlers/stripe-webhook.ts` to actually process events.
- **PCI surface**. Card data never reaches this connector. The hosted Stripe
  checkout URL handles card entry; the connector only knows about intent ids.

## How to read this for your own connector

1. Look at `manifest.json` first. Note `capability: "payment"` + the
   `scopes_required` list + `outbound_hosts`. Your manifest should declare
   the exact provider URL + every secret name you'll read.
2. Look at `src/index.ts`. Each method maps 1:1 onto a PaymentProvider
   interface method. Copy the structure; replace Stripe-specific URL +
   payload shapes with your provider's.
3. The `verifyWebhook` shape is the most provider-divergent piece. Look at
   your provider's webhook docs first; the SDK's HMAC primitives cover the
   most common case (HMAC-SHA256 over timestamp + payload), but some
   providers use RSA signatures or HMAC-SHA1 — adjust accordingly.

## LLM authoring notes

When an LLM client is helping a developer author a NEW payment connector:

- Read `prompt-for-developer-llm.md` first (the developer-side structural
  contract — RULES 1-22).
- Find the provider's API docs (Stripe / Razorpay / etc) and identify each
  endpoint: create-intent equivalent, capture, refund, webhook.
- Match each provider endpoint onto one of `PaymentProvider`'s 4 methods.
- Use `ctx.outbound.fetch` + `ctx.secrets.get` for every external call +
  credential read. Direct `fetch` / `process.env` / Node modules are NOT
  available inside the isolate.
- Add `manifest.outbound_hosts` for every host you contact.
- Add `manifest.scopes_required` for every `secret:*` and `outbound:*` your
  code touches.

## Publishing

```bash
vincia test       # runs vitest against src/index.test.ts
vincia publish    # validates the manifest + submits to the Forge marketplace
```

Earnings: $1 per recipient per active month, forever, for every Vincia build
that installs this connector. Confirmed via your Forge dashboard at
`/admin/contributor`.
