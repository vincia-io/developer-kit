# Prompt for developer LLMs — plugin authoring

> **How to use:** copy this entire file, paste into a fresh Claude / GPT /
> Gemini chat alongside the **PART A** form filled in at the bottom, hit go.
> The LLM produces a self-contained plugin folder (manifest.json + src/ +
> tests + docs) that the developer commits + ships via `vincia publish`.
>
> **Why this doc exists:** the developer kit's `prompt-for-llm.md` walks the
> conversational intent flow (which tier, which capability, etc). THIS doc
> holds the **structural rules** — the 22 contracts every plugin must follow
> so the platform's registry accepts it, the sidecar runs it, and the
> marketplace lists it. The designer side has the same split (a friendly
> `prompt-for-llm.md` + a deep `prompt-for-designer-llm.md`); this file is
> the developer-side counterpart of the latter.
>
> **Reserved namespace.** All identifiers prefixed `vincia.*`, all
> `manifest.json` top-level keys, all `ctx.*` properties, and the
> `bundleDependencies` field on `package.json` are reserved by Vincia for
> current + future system use. Don't shadow them.

---

# ============================================================
# PART B — STRUCTURAL RULES (LLM MUST FOLLOW EXACTLY)
# ============================================================

> Read this entire section. These rules are non-negotiable. The platform's
> validation pipeline rejects any plugin that violates them.

## RULE 1 — Every plugin is a workspace folder with manifest + src + tests

Your final deliverable is a folder. The developer saves it to disk + commits
to git. Use this layout exactly:

```
<plugin-name>/
├── manifest.json              ← plugin metadata (REQUIRED)
├── src/
│   ├── index.ts               ← entry point (REQUIRED unless T4 solution-pack)
│   └── index.test.ts          ← vitest smoke test (REQUIRED)
├── package.json               ← npm metadata + deps (REQUIRED)
├── tsconfig.json              ← TS config (REQUIRED)
├── README.md                  ← human-facing docs (REQUIRED)
├── CLAUDE.md                  ← agent guidance (RECOMMENDED)
└── .mcp.json                  ← Vincia MCP wiring (RECOMMENDED)
```

For **T4 solution-packs**, the layout is manifest-only — no `src/`, no
`tsconfig.json`. Solution-packs ship as composition recipes, not code.

**Output format:** present each file in your response inside a fenced code
block whose info-string is the relative file path, like:

````
```typescript path=src/index.ts
import { defineConnector } from '@vincia/sdk/connector';
...
```

```json path=manifest.json
{
  "id": "vincia/my-plugin",
  ...
}
```
````

This format is unambiguous and the developer can save each block to disk.

## RULE 2 — Pick exactly ONE tier per plugin

The platform has 5 tiers. Each ships as a separate plugin:

| Tier | What it is | Single export |
|---|---|---|
| **T0** | Blueprint — full app starter (collections + views + flow + steps). Composition only; no executable code. | `defineBlueprint(...)` |
| **T1** | Connector — implements one of 5 capabilities (payment, storage, notification, auth-provider, mailbox). | `defineConnector<I>(...)` |
| **T2** | Workflow node — pure transform with declared input/output schemas. | `defineStep<I, O>(...)` |
| **T3** | Widget — UI surface mounted in the host page (chrome / form-field / data-display). | `defineWidget<Config>(...)` |
| **T4** | Solution-pack — bundles existing plugins with wiring recipes. No code. | (manifest-only) |

**Pick the lowest tier that fits.** Don't author a T3 widget if a T1
connector suffices. Don't bundle a solution-pack for a single plugin.
Don't write a T2 step if you can express it as a T1 connector capability.

## RULE 3 — `manifest.json` declares EVERY external touch the plugin makes

The manifest is the platform's security boundary. The sidecar reads it at
install time and enforces every declaration at runtime. Calling
`ctx.outbound.fetch` for an undeclared host throws. Reading an undeclared
secret throws.

Mandatory fields on every manifest (lowest-tier intersection):

```json
{
  "id": "vincia/<plugin-name>",
  "version": "0.1.0",
  "tier": "T0" | "T1" | "T2" | "T3" | "T4",
  "name": "Human-readable plugin name",
  "description": "One-paragraph plugin description.",
  "platform_contract_version": "^1.0",
  "monetization": "free" | "paid",
  "license": "MIT" | "Apache-2.0" | ...
}
```

Tier-specific REQUIRED fields:

| Tier | Required-additional fields |
|---|---|
| T0 (blueprint) | `archetype`, `views`, `collections`, `requires_plugins` |
| T1 (connector) | `capability`, `scopes_required`, `outbound_hosts`, `resource_budget` |
| T2 (workflow-node) | `inputs` (JSON Schema), `outputs` (JSON Schema), `scopes_required`, `resource_budget` |
| T3 (widget) | `category`, `auth_rule`, `slot_eligibility`, `resource_budget`, `config_schema` |
| T4 (solution-pack) | `contains[]`, `post_install_steps[]` |

Universal-recommended fields:

- `iconHint` — Lucide icon name the marketplace uses for the listing.
- `tags` — 3-6 lowercase kebab-case tags for search.
- `outbound_hosts` — exact hosts your code contacts (T1/T2/T3 only).
- `scopes_required` — `outbound:<host>`, `secret:<name>`, `connector:<id>` strings.

## RULE 4 — Plugin id format: `vincia/<kebab-case-slug>`

Examples: `vincia/connector-stripe-payment`, `vincia/widget-data-table`,
`vincia/solution-pack-saas-billing`.

Rules:

- `vincia/` namespace prefix on EVERY plugin (3rd-party namespacing is a
  follow-up; today every plugin lives in the `vincia/` namespace).
- Slug must match `^[a-z][a-z0-9-]{2,62}[a-z0-9]$`.
- Tier-prefixed slugs are convention: `connector-`, `workflow-node-`,
  `widget-`, `blueprint-`, `solution-pack-`. Helps marketplace search.
- Provider names go after the tier: `connector-stripe-payment` not
  `payment-connector-stripe`. Sorts well in `vincia search`.

## RULE 5 — `defineXyz<I>(...)` is the only export

The platform reads the **default export** at install time. Don't export
named symbols at the top level (helpers live as non-exported functions or
under an `__testHelpers` object that's clearly internal).

```ts
// CORRECT
import { defineConnector } from '@vincia/sdk/connector';
import type { PaymentProvider } from '@vincia/sdk/connector';

export default defineConnector<PaymentProvider>({
  id: 'connector-stripe-payment',
  capability: 'payment',
  version: '0.1.0',
  implementation: { /* ... */ },
});

// Internal helpers — not part of the contract surface
function sha256Hex(...) { /* ... */ }
export const __testHelpers = { sha256Hex };
```

The platform's compatibility check inspects the default export's shape; it
ignores everything else. If your plugin's runtime behavior is sensitive to
side-effects at module load, that's an anti-pattern (sidecar isolates
re-import the module per build; load-time side effects don't persist).

## RULE 6 — Every method receives a `PluginContext` (`ctx`)

The sidecar passes a fresh `ctx` object on every invocation. It's your ONLY
gateway to the outside world. Direct `fetch()`, `process.env`, Node's
`crypto`, `fs`, `http`, `child_process` etc. are all blocked inside the
isolate.

The `ctx` shape (from `@vincia/sdk/runtime`):

```ts
interface PluginContext {
  build_id: string;          // <manifest-id>@<version>+<content-hash>
  tenant_id: string;         // the build using your plugin
  user_id?: string;          // end-user id when invocation is user-bound
  trace_id: string;          // OpenTelemetry trace id for log correlation

  outbound: VinciaOutbound;  // ctx.outbound.fetch(url, init)
  storage: VinciaStorage;    // ctx.storage.{get,put,list,delete,bulkInsert}
  secrets: VinciaSecrets;    // ctx.secrets.get(name)
  workflow: VinciaWorkflow;  // ctx.workflow.{trigger,status}
  log: VinciaLog;            // ctx.log.{debug,info,warn,error}
  metrics: VinciaMetrics;    // ctx.metrics.{counter,histogram,gauge}
  queue: VinciaQueue;        // ctx.queue.{enqueue,deferUntil}
  crypto: VinciaCrypto;      // ctx.crypto.{digest,hmac}
  events: VinciaEvents;      // ctx.events.{emit,subscribe}
}
```

**Read the SDK types** (`@vincia/sdk/runtime`) for the exact callable
signatures before authoring any method. The signatures are the v1.0 frozen
contract; the platform won't accept calls outside them.

## RULE 7 — Outbound HTTP via `ctx.outbound.fetch` ONLY

```ts
// CORRECT
const res = await ctx.outbound.fetch('https://api.stripe.com/v1/payment_intents', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${apiKey}` },
  body: payload,
});

// WRONG — fetch is blocked
const res = await fetch(url, init);  // throws inside the isolate

// WRONG — no http module
import http from 'http';  // not available
```

Every host you contact must appear in `manifest.outbound_hosts` AND as
`outbound:<host>` in `manifest.scopes_required`. Wildcards are allowed:
`*.s3.amazonaws.com` matches every regional S3 endpoint.

## RULE 8 — Credentials via `ctx.secrets.get` ONLY

```ts
// CORRECT
const apiKey = await ctx.secrets.get('stripe_secret_key');

// WRONG — process.env is blocked
const apiKey = process.env.STRIPE_SECRET_KEY;  // undefined inside isolate

// WRONG — hardcoded credentials
const apiKey = 'sk_test_...';  // platform's lint rejects literals matching common API-key patterns
```

Every secret you read must appear in `manifest.scopes_required` as
`secret:<name>`. The host's secret-management UI prompts admins for each
declared secret at install time.

Secret name conventions:

- `<provider>_api_key` — top-level API access.
- `<provider>_webhook_secret` — webhook signature verification.
- `<provider>_oauth_client_id` / `<provider>_oauth_client_secret` — OAuth credentials.
- Provider-specific: `s3_access_key_id`, `s3_secret_access_key`, etc.

## RULE 9 — Crypto via `ctx.crypto.*` ONLY

Node's `crypto` module is blocked. The SDK exposes two primitives:

```ts
ctx.crypto.digest(algorithm: 'sha256' | 'sha512', data: ArrayBuffer): Promise<ArrayBuffer>;
ctx.crypto.hmac(algorithm: 'sha256', key: ArrayBuffer, data: ArrayBuffer): Promise<ArrayBuffer>;
```

Common patterns:

```ts
// SHA256 hex digest
const enc = new TextEncoder();
const hash = new Uint8Array(await ctx.crypto.digest('sha256', enc.encode(input).buffer));
const hex = Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');

// HMAC-SHA256 for webhook signatures
const mac = new Uint8Array(await ctx.crypto.hmac('sha256', enc.encode(secret).buffer, enc.encode(payload).buffer));

// AWS SigV4 chained HMACs — see connector-s3-storage example
```

Constant-time string compare (NOT provided by the SDK; ship inline):

```ts
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
```

## RULE 10 — Errors via `Error` instances; preserve provider context

```ts
// CORRECT — clear, structured error
if (!res.ok) {
  throw new Error(`Stripe createIntent failed: ${res.status} ${await res.text()}`);
}

// CORRECT — distinct error code for retry-vs-prompt-re-auth distinction
if (res.status === 400 || res.status === 401) {
  throw new Error('REFRESH_REVOKED');  // host catches this + prompts for re-consent
}

// WRONG — string throw loses stack + breaks instanceof
throw 'failed';
```

Recognized special error codes the platform handles:

- `REFRESH_REVOKED` (OAuth) — host re-prompts for consent.
- `RATE_LIMITED` — host retries with backoff.
- `IDEMPOTENCY_CONFLICT` — host treats as already-applied.

For everything else, include the provider's status + body so logs are
actionable.

## RULE 11 — Idempotency — every operation must be safely retriable

The sidecar may retry your method up to 3 times on transient failure
(network blip, isolate cold start, etc). Design every method to be
**idempotent** on the same logical input:

- Use the provider's idempotency-key support where available (Stripe's
  `Idempotency-Key` header, AWS SigV4 + content-sha256, etc).
- Cache the operation-id in `ctx.storage` keyed by trace_id + operation.
- Make `delete` operations treat 404 as success.

Non-idempotent operations (sending the same notification twice, charging
twice) are bugs. The platform's compat-check can't verify this; reviewers
look for it on publish.

## RULE 12 — `resource_budget` declared honestly

```json
"resource_budget": {
  "cpu_ms": 200,
  "memory_mb": 64,
  "outbound_calls": 4
}
```

The sidecar enforces these at runtime. Going over kills the invocation.

| Field | Meaning | Typical range |
|---|---|---|
| `cpu_ms` | Wall-clock budget for one invocation | 100–4000 |
| `memory_mb` | Peak heap budget | 32–256 |
| `outbound_calls` | Max `ctx.outbound.fetch` calls per invocation | 1–10 |

Declare what you actually need; the sidecar over-allocates CPU to the
declared budget at scheduling time. Over-declaring wastes capacity; under-
declaring means kills under load. Measure during dev with `vincia test
--bench`.

## RULE 13 — Tests in `src/index.test.ts` — runnable without secrets

`vincia test` runs vitest against `src/index.test.ts`. Tests MUST:

- Run without any real credentials (no `ctx.secrets.get` returning real
  values).
- Not contact the network (no real `ctx.outbound.fetch`).
- Cover at least: defineConnector/defineStep/defineWidget metadata + method
  signatures present + happy-path return shape.

> **Sandbox-loop equivalent (post-G-S97).** If the developer is in chat-first
> mode, `vincia_sandbox_run(draft_id, fixture)` replaces `vincia test` as the
> exercise step: it boots a sandbox-anyapp tenant, drives the plugin against
> the named fixture, and returns a `tool_result.trace_calls[]` array the LLM
> can assert on. The vitest assertions you'd write locally become
> `trace_calls` assertions on outbound URLs, secret reads, and storage
> writes. Same fixtures, same SDK, same workerd binary as prod — the only
> difference is who's holding the keyboard.

Use `@vincia/sdk/testing` fixtures to stub `ctx`:

```ts
import { describe, test, expect } from 'vitest';
import { createMockContext } from '@vincia/sdk/testing';
import connector from './index.js';

test('createIntent calls Stripe with the right body', async () => {
  const ctx = createMockContext({
    secrets: { stripe_secret_key: 'sk_test_fake' },
    outbound: {
      'https://api.stripe.com/v1/payment_intents': () => new Response(
        JSON.stringify({ id: 'pi_fake', client_secret: 'cs_fake', status: 'requires_confirmation', amount: 1000, currency: 'usd' }),
      ),
    },
  });
  const intent = await connector.implementation.createIntent({ amount: 1000, currency: 'USD', order_id: 'order-1' }, ctx);
  expect(intent.id).toBe('pi_fake');
});
```

## RULE 14 — Bundle dependencies declared inline; sharp left external

Plugin code runs in an isolate. Workspace deps (`@vincia/sdk`,
`@vincia/sdk-types`) are bundled via npm's `bundleDependencies` field in
`package.json`. Native deps (sharp, sqlite3) are NOT bundled — they require
specific binaries the platform builds against.

For most plugins, the only dep you need is `@vincia/sdk`:

```json
"dependencies": {
  "@vincia/sdk": "https://get.vincia.io/cli/0.1.0/vincia-sdk-0.1.0.tgz"
}
```

If you need additional npm deps, declare them in `dependencies` AND list them
in a `bundleDependencies` array. Native modules are rejected at publish time.

> **`vincia_sandbox_publish` ≡ `vincia publish` (post-G-S97).** The chat-first
> loop's `vincia_sandbox_publish(draft_id)` and the local-first
> `vincia publish` both call the SAME `submitVersion` endpoint hardened in
> G-S91 + reused in G-S97 Pin 1. Identical PG row shape, identical MinIO
> bundle path, identical review-queue entry. The marketplace listing,
> revenue-share math, and review SLA are the same whichever loop you
> shipped from. So pick the loop that fits the surface you're already in;
> don't switch loops "to be safe" — there's no behavioral difference at
> publish time.

## RULE 15 — T1 connectors implement EXACTLY ONE capability

T1 connectors declare `capability: 'payment' | 'storage' | 'notification' |
'auth-provider' | 'mailbox'`. Each capability has a fixed interface in
`@vincia/sdk/connector`:

- `PaymentProvider` — 4 methods: createIntent, capture, refund, verifyWebhook.
- `StorageProvider` — 5 methods: put, get, delete, list, presignUrl.
- `NotificationChannel` — 2 methods: send, verifyDelivery.
- `OAuthProvider` — 4 methods: getAuthorizeUrl, exchangeCode, refreshToken, getUserInfo.
- `MailboxProvider` — 3 methods: connect, sync, send.

Implement EVERY method of your declared capability interface. If your
provider doesn't natively support one, implement the closest equivalent +
document the limitation in README (e.g., SendGrid's `sync` is a no-op
because it's send-only).

To support multiple capabilities, ship multiple T1 connector plugins. One
connector = one capability.

## RULE 16 — T2 workflow nodes declare BOTH input + output schemas

Both `manifest.json#inputs` AND the `inputs` arg to `defineStep` must
declare a JSON Schema. They MUST match — the platform validates at publish
time.

```json
// manifest.json
"inputs": {
  "type": "object",
  "required": ["template", "data"],
  "properties": {
    "template": { "type": "string" },
    "data": { "type": "object" }
  }
}
```

```ts
// src/index.ts
export default defineStep<Input, Output>({
  id: 'pdf-export',
  inputs: {
    type: 'object',
    required: ['template', 'data'],
    properties: {
      template: { type: 'string' },
      data: { type: 'object' },
    },
  },
  // ...
});
```

The runner validates inputs against this schema at call time + outputs at
return time. Mismatches throw. Add JSON Schema `default` values for
optional fields so the runner fills them automatically.

## RULE 17 — T3 widgets declare slot eligibility + auth + config

```json
"category": "form-field" | "data-display" | "chrome" | "section-content" | "navigation",
"auth_rule": "public" | "signed-in" | "role-based" | "creator-only",
"slot_eligibility": ["form-field", "section-content"],
"config_schema": { "type": "object", ... },
"form_aware": true | false,
"ssr": true | false
```

| Field | Effect |
|---|---|
| `category` | Used by the Composer + editor to filter the widget picker. |
| `auth_rule` | Runtime gate — widget doesn't mount when violated. |
| `slot_eligibility` | Which slot kinds host this widget. |
| `config_schema` | Per-instance config validated at install time. |
| `form_aware` | If true, the widget reads/writes form-flow state via `ctx.form.*`. |
| `ssr` | If true, the widget supports server-side rendering for first paint. |

Cross-tier connector calls from T3 widgets: declare the dependency in
`scopes_required` as `connector:<plugin-id>`. The platform proxies
`ctx.connector.call(pluginId, method, args)` through the host without
exposing the connector's secrets to the widget.

## RULE 18 — T0 blueprints declare collections + views + flow

T0 blueprints are app starters. The platform's installer creates the
declared collections, mounts the declared views, sets up the declared flow.

```json
{
  "tier": "T0",
  "category": "app" | "module",
  "archetype": "website" | "portal",
  "iconHint": "Users",
  "inputs": [
    { "name": "default_pipeline_stages", "type": "string", "required": true, ... }
  ],
  "collections": [
    { "name": "contacts", "fields": [...] },
    { "name": "deals", "fields": [...] }
  ],
  "views": [
    { "path": "/contacts", "view": "contacts-table", "auth": "signed-in" }
  ],
  "flow": {
    "startRoute": "/login",
    "publicRoutes": ["/login", "/signup"],
    "authenticatedRoutes": ["/", "/contacts", "/deals"],
    "afterLogin": "/",
    "afterLogout": "/login",
    "roles": ["staff", "manager"]
  },
  "requires_plugins": [],
  "scaffold": { "authStarter": "install", "controlPanel": "install" }
}
```

Blueprints don't ship `src/`. They're pure metadata.

## RULE 19 — T4 solution-packs are manifest-only

Solution-packs declare what to install + how to wire it up:

```json
{
  "tier": "T4",
  "contains": [
    { "id": "vincia/connector-stripe-payment", "version": "^0.1.0", "role": "payment-processor" },
    { "id": "vincia/widget-stripe-checkout", "version": "^0.1.0", "role": "checkout-widget" }
  ],
  "post_install_steps": [
    { "kind": "create-collection", "name": "subscriptions", "fields": [...] },
    { "kind": "add-route", "path": "/billing", "view": "billing-dashboard", "auth": "signed-in" },
    { "kind": "configure-widget", "widget": "vincia/widget-stripe-checkout", "slot": "/checkout/:plan#payment-section", "config": {...} }
  ]
}
```

Recognized `post_install_steps` kinds: `create-collection`, `add-route`,
`configure-widget`, `set-flag`, `install-workflow`.

Solution-packs have NO `src/`. If you need custom logic, ship it as a T2 step
+ reference in `contains[]`.

## RULE 20 — Observability: structured logs + metrics

Every plugin SHOULD emit:

```ts
ctx.log.info('intent.created', { intentId: intent.id, amount, currency });
ctx.metrics.counter('payment.intent.created', 1, { provider: 'stripe' });
ctx.metrics.histogram('payment.api.latency_ms', Date.now() - startTs, { method: 'createIntent' });
```

The platform's audit log indexes every `ctx.log.*` call with the plugin's
build_id + trace_id. Metrics are exported to the host's monitoring dashboard.

Don't `console.log` — it's a no-op inside the isolate. Use `ctx.log.*`.

## RULE 21 — Cross-tier deps: declare in `scopes_required`

T3 widgets that call T1 connectors:

```json
"scopes_required": [
  "connector:vincia/connector-stripe-payment"
]
```

T0 blueprints that require plugins to be installed:

```json
"requires_plugins": [
  { "id": "vincia/connector-stripe-payment", "version": "^0.1.0" },
  { "id": "vincia/widget-stripe-checkout", "version": "^0.1.0" }
]
```

T4 solution-packs that bundle plugins: use `contains[]` (per RULE 19).

The platform refuses to install a plugin whose declared dependencies aren't
present. The marketplace UI surfaces "missing dependency" warnings before
the user installs.

## RULE 22 — README + CLAUDE.md ship in every plugin

`README.md` (50-150 lines): for the human developer reading the plugin
later. Sections:

- What this plugin does (1-2 sentences).
- What it demonstrates (bullet list).
- What it deliberately does NOT do (bullet list).
- Provider-specific quirks worth knowing.
- How to publish.

`CLAUDE.md` (20-50 lines): for LLM agents picking up the plugin in a future
session. Sections:

- What this plugin is (1-2 lines).
- Reading order for someone new.
- Things to preserve when adapting (the structural contracts).
- Things to swap when adapting (the provider-specific bits).
- What's out of scope.

Both files matter — the platform's review process reads them; the
marketplace UI surfaces excerpts to potential installers.

---

# ============================================================
# PART C — QUALITY BAR (≥9.5/10)
# ============================================================

| Dimension | What 9.5+ looks like |
|---|---|
| **Manifest hygiene** | Every host declared, every secret declared, every scope tight. No wildcards beyond what the provider requires. |
| **Implementation completeness** | Every method on the declared interface implemented. No-op stubs only when the provider genuinely doesn't support the operation (and noted in README). |
| **Error surfacing** | Every error includes provider status + body. Distinct error codes for retry-vs-prompt-re-auth. |
| **Idempotency** | Every operation safe to retry. Use idempotency keys where the provider supports them. |
| **Resource budget** | Declared honestly. CPU ms + memory ≤ what you actually use under normal load. |
| **Test coverage** | Smoke test for metadata + every method's happy path. Mock contexts where real network would be needed. |
| **Documentation** | README explains the WHY (why this provider, what tradeoffs). CLAUDE.md explains the structural contracts. |
| **Scope discipline** | Doesn't do work outside its declared tier. T1 doesn't render UI; T3 doesn't read secrets. |
| **Provider knowledge** | Demonstrates understanding of provider quirks (signature schemes, refresh-token rotation, etc). Not just "I read the API docs once". |

When in doubt, ask: "Could this plugin, installed on a production Vincia
build with real traffic, run for a year without surprising the operator?"
If yes → 9.5+. If "it'll probably work" → revise.

---

# ============================================================
# PART D — TIER-SPECIFIC AUTHORING GUIDES
# ============================================================

## Authoring a T1 connector

1. **Pick the capability.** One of payment / storage / notification /
   auth-provider / mailbox. If your provider doesn't fit, your work might
   be a T2 step instead.
2. **Read the SDK's capability interface** in `@vincia/sdk/connector/`.
   Print it via `vincia interfaces <capability>`.
3. **Read the closest worked example** under
   `examples/connector-*` in this kit. Pick the one whose provider style
   matches yours (Stripe for HTTPS-API + webhooks; S3 for SigV4-signed;
   Slack for webhook-only; Google for OAuth; SendGrid for transactional API).
4. **Author your plugin folder** following the example's shape. Replace
   provider-specific URLs + body shapes + signature schemes. Keep the
   capability interface methods.
5. **Test with `@vincia/sdk/testing` mock contexts.** Don't hit the real
   provider in tests.
6. **Verify scopes.** Every `ctx.outbound.fetch` host appears in
   `manifest.outbound_hosts`. Every `ctx.secrets.get` name appears in
   `manifest.scopes_required` as `secret:<name>`.
7. **Publish.** `vincia publish` runs the full validation pipeline.

## Authoring a T2 workflow node

1. **Decide your input + output shapes.** What does the upstream step
   provide? What does the downstream step need? Both go in JSON Schema.
2. **Read `examples/workflow-node-pdf-export/`** for the canonical shape.
3. **`defineStep<Input, Output>(...)`** is the only export. `execute(input,
   ctx)` does the work. Return `output` matching the declared schema.
4. **Persist via `ctx.storage`**. If your step produces a blob (PDF, CSV,
   ZIP), write it to a collection via `ctx.storage.put` + return the URL in
   `output`. Don't ship blobs through workflow variables (they'd hit the
   per-step memory budget).
5. **Declare resource_budget honestly.** Heavy transforms (PDF render,
   image processing) need more cpu_ms + memory_mb than light ones (CSV
   parse).
6. **Test the schemas + the execute happy path.** Mock `ctx.outbound.fetch`
   + `ctx.storage` via `@vincia/sdk/testing`.

## Authoring a T3 widget

1. **Pick `category` + `slot_eligibility`.** Where in the host page does
   the widget mount? Form-field? Section-content? Chrome region?
2. **Read `examples/widget-stripe-checkout/`** for the canonical shape.
3. **`defineWidget<Config>(...)`** is the only export. The render contract
   gives you a `config` object (typed by the generic) + a `ctx` hook bag.
4. **Use `ctx.form.*`** when `form_aware: true`. Mark fields as filled
   when the widget's state changes. The form runtime advances based on
   field state.
5. **Cross-tier connector calls** via `ctx.connector.call(pluginId,
   method, args)`. Declare the dependency in `scopes_required` as
   `connector:<pluginId>`. The platform proxies through the host without
   exposing connector secrets.
6. **Don't import React directly** — the runner injects the right version
   for the host's platform release.
7. **`ssr: true`** when the widget supports server-side rendering for
   first paint. False is fine for interactive widgets (forms, modals).

## Authoring a T0 blueprint

1. **Decide the archetype.** `website` or `portal`. Blueprints don't
   support intermediate states.
2. **List the collections + their fields** the app needs. Every blueprint
   ships its own collection set; collections aren't shared across
   blueprints.
3. **List the views + routes.** Each view maps to a path + a page
   composition. Views can be inline-composed (e.g. `view: "kpi-grid"` →
   built-in tile layout) or compose section presets.
4. **Define the `flow`.** What routes are public? What needs auth? What
   roles exist?
5. **List `requires_plugins[]`** — T1 connectors / T3 widgets the
   blueprint depends on. The installer refuses if missing.
6. **No `src/`** — blueprints are pure metadata.

Read `examples/blueprint-crm-lite/blueprint.json` for a worked example.

## Authoring a T4 solution-pack

1. **Decide what's bundled.** Two or more plugins commonly installed
   together for one customer outcome.
2. **List `contains[]`** with semver ranges + `role` + optional
   `config_template`.
3. **List `post_install_steps[]`** — declarative ops the platform runs
   after every component is installed.
4. **No `src/`, no tests.** Solution-packs are recipes, not code.
5. **Verify every component exists** at the declared version range BEFORE
   publishing. `vincia publish` resolves `contains[]` against the
   marketplace; missing components fail publish.

Read `examples/solution-pack-saas-billing/manifest.json` for a worked
example.

---

# ============================================================
# PART A — YOUR PLUGIN INPUTS (FILL THIS IN)
# ============================================================

> The developer fills this in for each plugin they want produced. The LLM
> uses it as direction within Part B's structural rules.

```
TIER: <T0 | T1 | T2 | T3 | T4>

PLUGIN NAME: <kebab-case slug, e.g. connector-razorpay-payment>

DESCRIPTION (1 paragraph):
<What this plugin does + who installs it + what it depends on.>

PROVIDER / DOMAIN (if applicable):
<For T1 connectors: which provider? Stripe? S3? Slack? Google? SendGrid?
 For T2/T3: what business domain? PDF rendering? Data table? Calendar?>

CAPABILITY (T1 only):
<payment | storage | notification | auth-provider | mailbox>

INPUTS / OUTPUTS (T2 only):
<JSON Schema for inputs:>
<JSON Schema for outputs:>

CATEGORY + SLOT ELIGIBILITY (T3 only):
<form-field | data-display | chrome | section-content | navigation>
<which slot kinds host this widget>

CONFIG SCHEMA (T3 only):
<JSON Schema for per-instance widget config>

COLLECTIONS + VIEWS (T0 only):
<list of collections with their fields>
<list of views with paths + auth rules>

CONTAINS (T4 only):
<list of plugins + their version ranges + role>

POST-INSTALL STEPS (T4 only):
<sequence of declarative ops>

PROVIDER QUIRKS:
<Anything non-obvious about the provider's API or behavior the LLM should know.>

RESOURCE BUDGET ESTIMATE:
<cpu_ms / memory_mb / outbound_calls — honest estimate>

LICENSE:
<MIT | Apache-2.0 | UNLICENSED | other>

MONETIZATION:
<free | paid>
```

---

# ============================================================
# OUTPUT INSTRUCTIONS
# ============================================================

Produce the plugin now as a series of fenced code blocks, one per file, with
`path=<relative-file-path>` in the info-string. Files in this order:

1. `manifest.json`
2. `src/index.ts`     (skip for T4 solution-pack)
3. `src/index.test.ts` (skip for T4 solution-pack)
4. `package.json`
5. `tsconfig.json`    (skip for T4 solution-pack)
6. `README.md`
7. `CLAUDE.md`
8. `.mcp.json`

After all files, end with one short paragraph (≤4 sentences) summarizing the
design choices + any assumptions you made. Nothing else.

Quality goal: this plugin, when installed on a production Vincia build with
real traffic, must run for a year without surprising the operator. The
manifest must be airtight; the implementation must be idempotent; the tests
must pin the metadata contract.
