# CLAUDE.md — connector-slack-notification

T1 notification connector implementing `NotificationChannel` via Slack
incoming webhooks. Simplest possible notification connector — read this when
authoring any single-shot webhook-style notification (Discord, MS Teams,
custom internal webhook).

Reading order:

1. Developer kit's `docs/prompt-for-developer-llm.md` — RULES 1-22.
2. `@vincia/sdk/connector/notification.ts` — 2-method `NotificationChannel` contract.
3. This example's `src/index.ts` — note the synthetic message-id + terminal `sent` state.

Preserve when adapting to another webhook-style provider:

- The 2-method shape — `send` + `verifyDelivery`.
- `ctx.outbound.fetch` for the webhook POST; `ctx.secrets.get` for the webhook URL.
- Synthetic message id when the provider doesn't return one.
- Terminal `state: 'sent'` when there's no follow-up delivery API.

Swap when targeting a provider with a real delivery telemetry stream:

- Implement real `verifyDelivery` calling the provider's status endpoint.
- Return `delivered` / `bounced` / `failed` based on the provider's reply.

Out of scope: multi-channel routing, block-kit composition, rate-limit retry. See README.
