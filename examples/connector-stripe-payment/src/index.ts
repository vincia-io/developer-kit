/**
 * connector-stripe-payment — T1 payment connector implementing PaymentProvider
 * against Stripe.
 *
 * Methods run inside a V8 isolate; only `ctx.*` APIs are available to talk to
 * the outside world. `ctx.outbound.fetch` reaches Stripe only because the
 * manifest declares `outbound:api.stripe.com`; `ctx.secrets.get` reads
 * STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET only because the manifest declares
 * those secret-scope reads.
 *
 * Reference: https://stripe.com/docs/payments/payment-intents
 *            https://stripe.com/docs/webhooks/signatures
 */
import { defineConnector } from '@vincia/sdk/connector';
import type { PaymentProvider } from '@vincia/sdk/connector';

const STRIPE_BASE = 'https://api.stripe.com/v1';

export default defineConnector<PaymentProvider>({
  id: 'connector-stripe-payment',
  capability: 'payment',
  version: '0.1.0',
  implementation: {
    async createIntent(args, ctx) {
      const secretKey = await ctx.secrets.get('stripe_secret_key');
      const body = new URLSearchParams({
        amount: String(args.amount),
        currency: args.currency.toLowerCase(),
        'metadata[order_id]': args.order_id,
      });
      if (args.customer_email) body.set('receipt_email', args.customer_email);
      for (const [k, v] of Object.entries(args.metadata ?? {})) {
        body.set(`metadata[${k}]`, v);
      }
      const res = await ctx.outbound.fetch(`${STRIPE_BASE}/payment_intents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Stripe createIntent failed: ${res.status} ${errBody}`);
      }
      const intent = await res.json() as {
        id: string;
        client_secret: string;
        status: string;
        amount: number;
        currency: string;
      };
      return {
        id: intent.id,
        // Stripe Elements (client-side) confirms the intent using client_secret;
        // we surface a payment-page URL the host's chrome can redirect to.
        checkoutUrl: `https://checkout.stripe.com/pay/${intent.client_secret}`,
        status: intent.status === 'succeeded' ? 'succeeded' :
                intent.status === 'requires_payment_method' || intent.status === 'requires_confirmation' ? 'pending' :
                'failed',
        amount: intent.amount,
        currency: intent.currency.toUpperCase(),
      };
    },

    async capture(intentId, ctx) {
      const secretKey = await ctx.secrets.get('stripe_secret_key');
      const res = await ctx.outbound.fetch(`${STRIPE_BASE}/payment_intents/${intentId}/capture`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${secretKey}` },
      });
      if (!res.ok) {
        throw new Error(`Stripe capture failed: ${res.status} ${await res.text()}`);
      }
    },

    async refund(intentId, amount, ctx) {
      const secretKey = await ctx.secrets.get('stripe_secret_key');
      const body = new URLSearchParams({
        payment_intent: intentId,
        amount: String(amount),
      });
      const res = await ctx.outbound.fetch(`${STRIPE_BASE}/refunds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });
      if (!res.ok) {
        throw new Error(`Stripe refund failed: ${res.status} ${await res.text()}`);
      }
    },

    async verifyWebhook(payload, signature, ctx) {
      // Stripe signs webhooks as `t=<timestamp>,v1=<hmacSha256(t.payload)>`.
      // The webhook secret comes from the Stripe dashboard + lives in ctx.secrets.
      // Inside the isolate Node's `crypto` module is blocked; use
      // `ctx.crypto.hmac` which is the SDK's audited HMAC primitive.
      const webhookSecret = await ctx.secrets.get('stripe_webhook_secret');
      const parts = signature.split(',').reduce<Record<string, string>>((acc, p) => {
        const [k, v] = p.split('=');
        if (k && v) acc[k] = v;
        return acc;
      }, {});
      if (!parts.t || !parts.v1) return false;
      const raw = `${parts.t}.${typeof payload === 'string' ? payload : JSON.stringify(payload)}`;
      const enc = new TextEncoder();
      const macBytes = await ctx.crypto.hmac(
        'sha256',
        enc.encode(webhookSecret).buffer,
        enc.encode(raw).buffer,
      );
      const expected = bytesToHex(new Uint8Array(macBytes));
      return constantTimeEqual(expected, parts.v1);
    },
  },
});

// --- Helpers (isolated-safe; no Node crypto) ---------------------------------

function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

/**
 * Constant-time string compare. Stripe's docs explicitly warn that naive
 * `===` here is timing-attack vulnerable; this implementation walks every
 * byte regardless of mismatch position.
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// Re-export of helpers for tests; the platform reads `default` only.
export const __testHelpers = { bytesToHex, constantTimeEqual };
