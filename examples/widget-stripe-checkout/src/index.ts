/**
 * widget-stripe-checkout — T3 widget embedding Stripe Elements for inline
 * payment.
 *
 * Widget code runs inside a sandboxed iframe; only `vincia.widget.*` hooks
 * reach the parent. The widget asks the paired Stripe connector
 * (`vincia/connector-stripe-payment`) for an intent client_secret, then
 * mounts Stripe.js Elements to collect card details + confirm the payment.
 *
 * Reference: https://stripe.com/docs/payments/quickstart
 *            (Server creates the intent; client confirms with Elements.)
 */
import { defineWidget } from '@vincia/sdk/widget';

interface Config {
  amount: number;
  currency: string;
  submit_label?: string;
}

export default defineWidget<Config>({
  id: 'stripe-checkout',
  version: '0.1.0',
  display: {
    label: 'Stripe checkout',
    description: 'Inline Stripe Elements payment form. Pairs with vincia/connector-stripe-payment.',
    category: 'form-field',
    surfaces: ['public'],
  },
  capabilities: {
    formAware: true,
    ssr: false,
  },
  authRule: 'signed-in',
  slotEligibility: ['form-field', 'section-content'],
  configSchema: {
    type: 'object',
    required: ['amount', 'currency'],
    properties: {
      amount: { type: 'number' },
      currency: { type: 'string' },
      submit_label: { type: 'string' },
    },
  },
  // Renderable lives in the widget's iframe; the SDK injects React via the
  // platform's widget runner. The example function below is illustrative —
  // the real surface gives you a hook bag (`useStripe`, `useFormFlow`, etc).
  render({ config, ctx }) {
    // ctx.connector.call('connector-stripe-payment', 'createIntent', {...})
    // dispatches through the paired T1 payment connector. The widget never
    // sees the secret key; the platform proxies the call.
    return makeStripeCheckoutElement({
      amount: config.amount,
      currency: config.currency,
      submitLabel: config.submit_label ?? 'Pay now',
      onConfirm: async () => {
        const intent = await ctx.connector.call('vincia/connector-stripe-payment', 'createIntent', {
          amount: config.amount,
          currency: config.currency,
          order_id: ctx.form.id,
        });
        // Mount Stripe Elements with intent.id; on confirm-success the
        // form-flow advances + the widget marks the form field as filled.
        await ctx.form.markField('payment', { intentId: intent.id, status: 'succeeded' });
        return intent;
      },
    });
  },
});

// --- Renderable factory ------------------------------------------------------
// Real widgets return a `WidgetElement` (structurally compatible with
// React.ReactElement). Real Stripe Elements mount is via @stripe/stripe-js,
// loaded from `js.stripe.com` (declared in manifest outbound_hosts). The
// stub below stands in for the real render so the example typechecks.

declare const React: { createElement: (...args: unknown[]) => unknown };

function makeStripeCheckoutElement(opts: {
  amount: number;
  currency: string;
  submitLabel: string;
  onConfirm: () => Promise<unknown>;
}) {
  // The real implementation loads Stripe.js via a <script> tag, mounts
  // <CardElement>, wires the submit button to `stripe.confirmCardPayment`,
  // and dispatches to `opts.onConfirm` on success.
  // Stripe.js itself is loaded from https://js.stripe.com/v3/stripe.js
  // (declared in manifest.outbound_hosts).
  return React.createElement('div', {
    className: 'stripe-checkout-widget',
    'data-amount': opts.amount,
    'data-currency': opts.currency,
  });
}
