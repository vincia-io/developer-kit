# connector-slack-notification — T1 notification connector example

Simplest possible notification connector — posts to a Slack incoming
webhook. Read this when authoring any single-shot webhook-style notification
connector (Discord, Microsoft Teams, custom internal webhook).

## What this example demonstrates

- **Both NotificationChannel methods** — `send` + `verifyDelivery`.
- **Synthetic message-id** when the provider doesn't return one. Slack
  incoming-webhooks just answer 200 OK; the host still needs a message id
  to correlate, so we generate one from `ctx.trace_id` + timestamp.
- **`verifyDelivery` returns `sent` terminally** when the provider has no
  follow-up status API. Don't fabricate a "delivered" state you can't
  actually observe; the spec accepts `sent` as the practical terminal.
- **Rich payload via `message.metadata`.** Slack supports `attachments`,
  `blocks`, `icon_emoji`, `username` overrides — surface those via
  `metadata` so the host LLM can drive them without inventing channel-
  specific message shapes.

## Adapting to other webhook-style notification providers

| Provider | `to` field semantics | Extra metadata keys |
|---|---|---|
| Slack | Channel name (`#alerts`) | `icon_emoji`, `username`, `attachments`, `blocks` |
| Discord | Channel webhook URL part | `username`, `avatar_url`, `embeds` |
| MS Teams | Webhook URL only | `themeColor`, `sections` |
| Custom internal | Per-team convention | Per-team convention |

For each: replace the Slack-specific JSON keys + endpoint host. The
`NotificationChannel` interface is unchanged.

## What this example deliberately does NOT cover

- **Multi-channel routing.** This connector talks to Slack only. If you
  want one connector to dispatch to email OR SMS OR Slack based on host
  config, that's a different pattern (the host already supports installing
  multiple T1 notification connectors per build).
- **Rate-limit handling.** Slack's incoming-webhook rate limit is
  ~1 message/sec/team. Production connectors should respect the
  `Retry-After` header.
- **Block-kit composition.** Pass complete blocks via `message.metadata.blocks`;
  this connector forwards them as-is.

## Publishing

```bash
vincia test
vincia publish
```
