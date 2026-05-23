# CLAUDE.md — agent guidance for connector-stripe-payment

This is a T1 payment connector example for the Vincia developer kit. It's a
PATTERN reference, not a starting template — copy the structure into your own
project to author a new payment connector for a different provider.

Read in this order:

1. The developer kit's `docs/prompt-for-developer-llm.md` — RULES 1-22 for
   plugin authoring.
2. The SDK's `PaymentProvider` interface
   (`@vincia/sdk/connector/payment.ts`) — the 4 methods you implement.
3. This example's `src/index.ts` — see how each method maps onto Stripe.
4. This example's `manifest.json` — see how scopes/outbound/secrets are
   declared.

## Things this example demonstrates that you should preserve in yours

- `defineConnector<PaymentProvider>` is the only export. The platform reads
  the default export at install time; no other top-level code runs.
- `ctx.outbound.fetch` for every HTTP call. Direct `fetch` is blocked.
- `ctx.secrets.get` for every credential read. `process.env` is blocked.
- `ctx.crypto.hmacSha256` + `constantTimeEqual` for signature verification.
  Node's crypto module is blocked.
- Every host in `manifest.outbound_hosts`. Every secret in
  `manifest.scopes_required` as `secret:<name>`. Every outbound as
  `outbound:<host>`.

## What an LLM helper should produce when porting this to another provider

Replicate the file shape (manifest.json + src/index.ts + src/index.test.ts +
package.json + tsconfig.json + README.md + CLAUDE.md + .mcp.json) with:

- Manifest `id` of `vincia/connector-<provider>-<capability>`.
- Manifest `capability: 'payment'` (unchanged).
- Manifest `outbound_hosts` listing the provider's API host(s).
- Manifest `scopes_required` for each secret + each outbound host.
- `src/index.ts` implementing `PaymentProvider` with the provider's API.
- A README explaining what's specific to the provider (idempotency model,
  webhook signature scheme, etc).

## Out of scope

The implementation here covers one-time payments + capture + refund + webhook
verification. Subscription billing has its own pattern; ask the user before
adding subscription methods (they live in a separate `subscription`
capability per the SDK roadmap).
