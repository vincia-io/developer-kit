# CLAUDE.md — connector-sendgrid-mailbox

T1 mailbox connector implementing `MailboxProvider` via SendGrid's v3 API.
Outbound-only — read this when authoring any transactional-email connector
(AWS SES, Mailgun, Postmark, Resend, etc).

Reading order:

1. Developer kit's `docs/prompt-for-developer-llm.md` — RULES 1-22.
2. `@vincia/sdk/connector/mailbox.ts` — 3-method `MailboxProvider` contract.
3. This example's `src/index.ts` — note the no-op `sync` + multi-part content + attachments.

Preserve when adapting to another outbound-only mail provider:

- The 3-method shape — `connect`, `sync`, `send`.
- `sync` returns 0 messages when there's no inbox to read.
- Synthetic accountId from `from` address.
- Multi-part content (text + html); reject sends with neither.
- Attachments forwarded base64 + filename + content-type.

Swap when targeting a bidirectional mailbox (Gmail API, IMAP, MS Graph):

- Implement `sync` to actually pull new mail via the provider's polling API.
- Persist messages via `ctx.storage.bulkInsert('messages', ...)`.
- `connect` should bind a real account-level credential (OAuth tokens, IMAP creds).

Out of scope here: inbox/folder management, label/tag application, threading
beyond In-Reply-To headers. See README.
