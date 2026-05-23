/**
 * connector-sendgrid-mailbox — T1 mailbox connector implementing
 * MailboxProvider via SendGrid's v3 API.
 *
 * SendGrid is outbound-only: there's no IMAP-style inbox to read, so `sync`
 * is a no-op. `connect` binds the API key to a host-side account id; `send`
 * does the actual API call.
 *
 * Reference: https://docs.sendgrid.com/api-reference/mail-send/mail-send
 */
import { defineConnector } from '@vincia/sdk/connector';
import type { MailboxProvider } from '@vincia/sdk/connector';

const MAIL_SEND_URL = 'https://api.sendgrid.com/v3/mail/send';

export default defineConnector<MailboxProvider>({
  id: 'connector-sendgrid-mailbox',
  capability: 'mailbox',
  version: '0.1.0',
  implementation: {
    async connect(_creds, ctx) {
      // For SendGrid the credentials live entirely in ctx.secrets
      // (api_key + from-address); there's no per-connection state to bind.
      // We return a synthetic account id keyed by the from-address so the
      // host can correlate sends.
      const from = await ctx.secrets.get('sendgrid_from_address');
      return { accountId: `sendgrid:${from}` };
    },

    async sync(_accountId, _ctx) {
      // SendGrid is send-only. No inbox to poll, so always 0 new messages.
      // A real IMAP / Gmail-API connector would pull new mails here.
      return { newMessages: 0 };
    },

    async send(message, ctx) {
      const apiKey = await ctx.secrets.get('sendgrid_api_key');
      const fromAddr = await ctx.secrets.get('sendgrid_from_address');
      const fromName = await ctx.secrets.get('sendgrid_from_name');

      const personalizations: Record<string, unknown> = {
        to: message.to.map((addr) => ({ email: addr })),
      };
      if (message.cc?.length) personalizations.cc = message.cc.map((a) => ({ email: a }));
      if (message.bcc?.length) personalizations.bcc = message.bcc.map((a) => ({ email: a }));

      const content: Array<{ type: string; value: string }> = [];
      if (message.text) content.push({ type: 'text/plain', value: message.text });
      if (message.html) content.push({ type: 'text/html', value: message.html });
      if (content.length === 0) {
        throw new Error('OutgoingMessage must have at least one of text/html');
      }

      const body: Record<string, unknown> = {
        personalizations: [personalizations],
        from: { email: fromAddr, name: fromName },
        subject: message.subject,
        content,
      };
      if (message.inReplyTo) {
        body.headers = { 'In-Reply-To': message.inReplyTo, 'References': message.inReplyTo };
      }
      if (message.attachments?.length) {
        body.attachments = message.attachments.map((a) => ({
          content: a.content,
          filename: a.filename,
          type: a.contentType ?? 'application/octet-stream',
          disposition: 'attachment',
        }));
      }

      const res = await ctx.outbound.fetch(MAIL_SEND_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(`SendGrid send failed: ${res.status} ${await res.text()}`);
      }
      // SendGrid returns 202 with no body on success. The message id is in
      // the X-Message-Id response header.
      const messageId = res.headers.get('X-Message-Id') ?? `sendgrid-${ctx.trace_id}`;
      return { messageId };
    },
  },
});
