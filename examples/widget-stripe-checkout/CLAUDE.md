# CLAUDE.md — widget-stripe-checkout

T3 widget embedding Stripe Elements for inline payment. Read this example
when authoring any T3 widget that participates in form-flow OR that calls a
T1 connector cross-tier.

Reading order:

1. Developer kit's `docs/prompt-for-developer-llm.md` — RULES 1-22.
2. `@vincia/sdk/widget/index.ts` — `defineWidget` + the renderable contract.
3. This example's `src/index.ts` — note cross-tier connector call + form-flow integration.
4. This example's `manifest.json` — see slot_eligibility + auth_rule + config_schema.

Preserve when adapting to another form-aware widget:

- `defineWidget<Config>(...)` is the only export.
- `category` + `slotEligibility` + `authRule` + `configSchema` all declared.
- `capabilities.formAware: true` when reading/writing form-flow state.
- Cross-tier connector calls via `ctx.connector.call(pluginId, method, args)`.
- React injected by the runner — don't import React directly.

Swap when adapting:

- Replace the connector id (`vincia/connector-stripe-payment`) with the
  paired connector for your provider.
- Adjust `configSchema` to your widget's actual config inputs.
- Update `outbound_hosts` if your widget loads other CDNs (your provider's
  client SDK URL, etc).

T3 widget vs T2 workflow step decision: T3 ships a UI surface mounted in the
host page. T2 ships a pure transform with no UI. If your code needs to
render anything to the user, it's T3.

## Visual debug (post-G-S100)

Widgets are the most visual tier. After each edit to `src/widget.tsx` (or
its CSS surface), call `vincia_studio_screenshot(slug: <test-app-slug>,
page: '/checkout')` against the test app you mounted this widget into —
the tool returns an MCP image content block that Claude.ai / ChatGPT
renders inline, so you see the actual rendered widget without switching
to a browser. Pass `viewport: 'mobile' | 'tablet' | 'desktop'` to check
responsive states. Iterate visually: tweak → screenshot → tweak →
screenshot. The 7 mutating studio tools (`add_widget`, `edit_widget`,
`apply_theme`, etc.) ALSO accept `include_screenshot: true` so the
return value of the mutation already contains the rendered after-state.

Out of scope here: subscription billing UI (separate widget),
refunds/reversals (handled out-of-band via the connector), PCI surface
(Stripe Elements isolates card data from us). See README.
