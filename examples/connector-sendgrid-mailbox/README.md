# connector-sendgrid-mailbox — T1 mailbox connector example

Reference for an outbound-only transactional-email mailbox connector. The
pattern is identical for AWS SES, Mailgun, Postmark, etc — only the API URL,
auth scheme, and JSON body shape change.

## What this example demonstrates

- **All 3 MailboxProvider methods** — `connect`, `sync`, `send`.
- **Send-only mailbox**. `sync` returns 0 new messages because there's no
  inbox to poll. The `connect` method binds the api-key + from-address to a
  synthetic accountId.
- **Multi-part content** — `text/plain` + `text/html` in the same send when
  both are provided. SendGrid (and most providers) require at least one.
- **Attachments** — base64 content + filename + content-type, forwarded
  verbatim to SendGrid's expected shape.
- **Threading via `In-Reply-To` headers** so replies bucket into the
  original conversation in the recipient's client.

## Adapting to other transactional providers

| Provider | API endpoint | Auth | Body format |
|---|---|---|---|
| SendGrid | `api.sendgrid.com/v3/mail/send` | `Bearer <api_key>` | JSON, this shape |
| AWS SES (V2 API) | `email.<region>.amazonaws.com/v2/email/outbound-emails` | SigV4 | JSON |
| Mailgun | `api.mailgun.net/v3/<domain>/messages` | Basic, `api:<api_key>` | multipart/form-data |
| Postmark | `api.postmarkapp.com/email` | `X-Postmark-Server-Token` | JSON, similar shape |
| Resend | `api.resend.com/emails` | `Bearer <api_key>` | JSON, simpler shape |

For each: replace the endpoint, auth header, and JSON keys. The
`MailboxProvider` interface is unchanged.

## When you actually need a real mailbox connector (with `sync`)

The `sync` method matters when you're connecting to:

- **IMAP / Microsoft Graph / Gmail API** — full mailbox with inbox + folders.
  Pull mail in `sync` via the provider's polling API, persist messages via
  `ctx.storage.bulkInsert('messages', ...)`.
- **SES inbound rules** — when SES is configured to receive mail into S3,
  `sync` walks the S3 prefix + persists.

In those cases the connector is bidirectional and `sync` does real work.
This example is the outbound-only end of the spectrum; reach for it as the
template when your provider lacks an inbox API.

## Publishing

```bash
vincia test
vincia publish
```
