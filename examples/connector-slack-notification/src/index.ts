/**
 * connector-slack-notification — T1 notification connector implementing
 * NotificationChannel via Slack incoming webhooks.
 *
 * Incoming-webhook URLs are the simplest Slack integration: POST a JSON
 * payload, Slack posts the message. No real-time delivery callback, so
 * `verifyDelivery` reports "sent" as terminal — Slack incoming-webhooks
 * have no after-delivery telemetry.
 *
 * Reference: https://api.slack.com/messaging/webhooks
 */
import { defineConnector } from '@vincia/sdk/connector';
import type { NotificationChannel } from '@vincia/sdk/connector';

export default defineConnector<NotificationChannel>({
  id: 'connector-slack-notification',
  capability: 'notification',
  version: '0.1.0',
  implementation: {
    async send(message, ctx) {
      const webhookUrl = await ctx.secrets.get('slack_webhook_url');
      const payload: Record<string, unknown> = {
        text: message.body,
        channel: message.to, // e.g. "#alerts"
      };
      if (message.subject) payload.username = message.subject;
      if (message.metadata?.icon_emoji) payload.icon_emoji = message.metadata.icon_emoji;
      if (message.metadata?.attachments) payload.attachments = message.metadata.attachments;
      if (message.metadata?.blocks) payload.blocks = message.metadata.blocks;

      const res = await ctx.outbound.fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Slack webhook failed: ${res.status} ${await res.text()}`);
      }
      // Slack incoming webhooks don't return a message id — synthesise one
      // from the trace id so the host can still correlate logs.
      return { messageId: `slack-${ctx.trace_id}-${Date.now()}` };
    },

    async verifyDelivery(_messageId, _ctx) {
      // Incoming webhooks have no follow-up status API. Slack accepts the
      // POST or rejects it; once we've returned `sent` from `send`, that's
      // terminal for this channel.
      return {
        state: 'sent',
        updatedAt: new Date().toISOString(),
      };
    },
  },
});
