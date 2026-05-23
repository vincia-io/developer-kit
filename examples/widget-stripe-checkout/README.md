# widget-stripe-checkout — T3 widget example

Inline Stripe Elements payment widget that participates in form-flow.
Pairs with the `vincia/connector-stripe-payment` T1 connector — the widget
runs in an iframe and asks the connector to create the intent server-side,
then mounts Stripe Elements client-side for the actual card collection.

## What this example demonstrates

- **`defineWidget<Config>(...)` is the only export.** The platform reads
  the default export at install time.
- **`category: 'form-field'`** + `slotEligibility: ['form-field', 'section-content']`
  — the widget can be dropped into a form's fields list AND can stand alone in
  a section. The Composer uses these to know where to offer it.
- **`form_aware: true`** capability flag — the widget consumes the form's
  current state via `ctx.form.*` hooks AND marks fields as filled when the
  payment completes. Without this flag the form runtime treats it as opaque
  content.
- **Cross-tier connector call** via `ctx.connector.call('vincia/connector-stripe-payment', 'createIntent', args)`.
  The widget never reads Stripe's secret key — that lives in the connector's
  isolate, scoped via `secret:stripe_secret_key`. The widget only sees the
  intent client_secret returned by the connector.
- **`auth_rule: 'signed-in'`** — the widget refuses to render for anonymous
  visitors. Stripe Elements requires a known customer for receipt + dispute flow.
- **External script loading**. Stripe Elements ships as `https://js.stripe.com/v3/stripe.js`;
  the manifest declares `outbound:js.stripe.com` so the widget iframe can
  load it. The platform's CSP enforces this at runtime.

## What this example deliberately does NOT do

- **PCI compliance work**. Card data goes from the user's browser straight
  to Stripe. The widget never sees the card number; it only sees the intent
  id Stripe returns post-confirm.
- **Subscription billing UI**. Recurring payments are a different widget
  (`widget-stripe-subscriptions`). One-shot purchase only here.
- **Refunds / reversals**. The platform's order-management UI does that
  out-of-band via the connector's `refund` method.

## Anatomy of a T3 widget

| Field | Purpose |
|---|---|
| `display.label/description` | What the Composer + editor show in the picker. |
| `display.category` | One of the canonical widget categories (`form-field`, `data-display`, `chrome`, etc). |
| `display.surfaces` | `public` (anonymous), `private` (auth-gated), `system` (admin-only). |
| `capabilities.formAware` | True if the widget reads/writes form-flow state. |
| `capabilities.ssr` | True if the widget supports server-side rendering. |
| `authRule` | Gate at the slot level — runtime won't mount if violated. |
| `slotEligibility` | Which slot kinds can host this widget. |
| `configSchema` | JSON Schema for the per-instance config. |

## Anatomy of the render contract

```ts
render({ config, ctx }) {
  // config: per-instance config (typed by the generic param)
  // ctx:    bag of hooks — connector.call, storage, form, log, etc.
  return React.createElement(...);
}
```

The widget runner provides `React` (versioned by the platform); your code
returns a renderable. Don't import React directly — that pins a version on
every widget and breaks platform-version compatibility.

## Publishing

```bash
vincia test
vincia publish
```
