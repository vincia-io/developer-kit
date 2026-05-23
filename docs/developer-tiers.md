# Vincia developer tiers — one-page summary

The Vincia Forge accepts five developer-tier contributions. Each one is
scaffolded by a different `vincia create <type> <name>` command.

For deep reference on any tier, see the corresponding tier guide on the
Forge: https://forge.vincia.io/docs/tier-guides/<slug>

---

## T0 — Blueprint

**What it is**: A declarative description of an app's data + workflows + view
wiring. The platform applies a blueprint by dispatching its `steps[]` array
through the shared tool-call pipeline. A blueprint can be **app-scale**
(scaffolds a whole app from scratch) or **module-scale** (drops collections
+ views + workflows into an existing app).

**Scaffold**:

```bash
vincia create blueprint my-invoicing
```

**Reference**: `examples/blueprint-invoicing/` (module), `examples/blueprint-crm-lite/` (app).

**Earn**: $1/recipient/month while active.

**Full guide**: https://forge.vincia.io/docs/tier-guides/blueprint

---

## T1 — Connector

**What it is**: A single external-capability adapter the platform dispatches
through whenever an app needs that capability. Five capability kinds:

| Capability      | Interface              | Examples                                  |
| --------------- | ---------------------- | ----------------------------------------- |
| `payment`       | `PaymentProvider`      | Stripe-alike, PhonePe, Razorpay           |
| `storage`       | `StorageProvider`      | S3-alike, R2, Cloudflare Images           |
| `notification`  | `NotificationChannel`  | Push / SMS / in-app notifier              |
| `auth-provider` | `OAuthProvider`        | Google, Microsoft, GitHub OAuth           |
| `mailbox`       | `MailboxProvider`      | Mailgun, SES, Postmark                    |

**Scaffold**:

```bash
vincia create connector my-payment-alt --capability payment
```

`--capability` is required for T1.

**Earn**: $1/recipient/month while active.

**Full guide**: https://forge.vincia.io/docs/tier-guides/connector

---

## T2 — Workflow-node

**What it is**: A single workflow step the platform's workflow engine
dispatches when a DAG node reaches it. Pure logic + I/O — no UI. Compose
many workflow-nodes into a workflow via the registry.

Common examples: `split_csv_string`, `parse_iso_date`, `fetch_url_as_text`,
`hash_password`.

**Scaffold**:

```bash
vincia create workflow-node my-csv-split
```

**Earn**: $1/recipient/month while active.

**Full guide**: https://forge.vincia.io/docs/tier-guides/workflow

---

## T3 — Widget

**What it is**: A single visual widget (React) that ships into tenant
runtimes. Rendered inside any app's chrome — inherits the build's theme via
CSS variables. Widgets declare their config schema in `manifest.json`;
builders configure them per placement.

Common examples: a custom KPI tile, a charity-thermometer, a live-feed
ticker, a calendar heatmap.

**Scaffold**:

```bash
vincia create widget my-kpi-tile
```

**Earn**: $1/recipient/month while active.

**Full guide**: https://forge.vincia.io/docs/tier-guides/widget

---

## T4 — Solution pack

**What it is**: A curated bundle of T0–T3 contributions designed for one use
case. The pack's manifest lists which contributions to install + any
cross-contribution config wiring. Useful for "complete suite" contributions
(small-clinic intake, restaurant ordering, gym booking).

**Scaffold**:

```bash
vincia create solution-pack my-clinic-suite
```

**Earn**: $1/recipient/month, with the pack's earnings split across bundled
contributions per their provenance rules.

**Full guide**: https://forge.vincia.io/docs/tier-guides/solution-pack

---

## Branching the LLM flow by tier

The `docs/prompt-for-llm.md` flow asks different questions per tier:

| Tier | Asks for brand context? | Asks for archetype? | Asks for capability? |
| ---- | ----------------------- | ------------------- | -------------------- |
| T0   | yes (app-scale only)    | yes (app-scale only)| no                   |
| T1   | no                      | no                  | yes (one of five)    |
| T2   | no                      | no                  | no                   |
| T3   | no                      | no                  | no                   |
| T4   | no                      | no                  | no                   |

T0 is the only tier that may need brand context — because an app-scale
blueprint scaffolds chrome that needs theming for the local preview to feel
real. Module-scale T0 blueprints install into an existing app's chrome and
skip brand entirely.

T1/T2/T3/T4 never collect brand — they don't render chrome.

## Common gotchas

- **`vincia create connector` without `--capability`** errors with
  `capability_required`. Re-run with one of the five capability values.
- **`vincia create blueprint` defaults to `category: 'module'`.** Pass
  `--app` if you mean app-scale; the LLM prompt walks you through the
  archetype decision in that case.
- **Don't fabricate a workflow-node or connector capability that doesn't
  exist.** If the developer's intent needs one, route them to the
  workflow-node / connector proposal flow rather than inventing.
- **All contributions inherit revenue from ancestors.** Forking carries
  `derivedFrom[]` with the ancestor's `<id>@<version>`; revenue splits per
  `revenueInheritance` (`default` = 50% publisher / 25% each ancestor;
  `clean-room` = publisher keeps $1, manual review at publish).
