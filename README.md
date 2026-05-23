# Vincia Developer Kit — v0.4.0

You've extracted the Developer Kit — the curated starter pack for developers
authoring **functional contributions** that ship to the **Vincia Forge**.
Developers ship blueprints (T0), connectors (T1), workflow-nodes (T2), widgets
(T3), and solution packs (T4) that other Vincia builders install onto their
builds — or that the developer applies directly to a real-content build for a
specific client/product.

## What you have

```
README.md                            ← you are here
docs/
  prompt-for-llm.md                  Entry conversational flow — paste into your LLM first
  prompt-for-developer-llm.md        Deep structural reference (RULES 1-22) — read before src/index.ts
  widget-catalog.html                Browseable card grid (open with file://)
  widget-catalog-for-llm.md          LLM-ingestion: one section per widget
  blueprint-json-spec.md             BlueprintDef field-by-field reference
  developer-tiers.md                 1-page summary of all 5 developer tiers
examples/
  blueprint-crm-lite/                T0 blueprint — app starter (CRM)
  blueprint-invoicing/               T0 blueprint — module (invoicing)
  blueprint-support-tickets/         T0 blueprint — module (support)
  connector-stripe-payment/          T1 payment — PaymentProvider against Stripe
  connector-s3-storage/              T1 storage — StorageProvider against any S3-compatible bucket
  connector-slack-notification/      T1 notification — NotificationChannel via Slack webhook
  connector-google-auth-provider/    T1 auth-provider — OAuthProvider for Google Sign-In
  connector-sendgrid-mailbox/        T1 mailbox — MailboxProvider via SendGrid
  workflow-node-pdf-export/          T2 workflow-node — HTML to PDF via platform service
  widget-stripe-checkout/            T3 widget — inline Stripe Elements form-field
  solution-pack-saas-billing/        T4 solution-pack — one-install SaaS billing bundle
```

## Quick start

1. **Install the CLI** (one-time):

   ```bash
   curl -fsSL https://get.vincia.io/install | bash
   ```

2. **Log in** with your Vincia deployment:

   ```bash
   vincia login --api-host https://<your-vincia-host>
   ```

3. **Refresh the widget catalog** to today's platform shape:

   ```bash
   vincia widgets sync --out docs
   ```

4. **Scaffold a new contribution** — pick a tier:

   ```bash
   vincia create blueprint my-module          # T0 — full data + workflows
   vincia create connector my-stripe-alt --capability payment   # T1
   vincia create workflow-node my-transform   # T2
   vincia create widget my-kpi-card           # T3
   vincia create solution-pack my-clinic-pack # T4
   ```

   T1 connectors must declare a capability (`payment` / `storage` /
   `notification` / `auth-provider` / `mailbox`).

5. **Validate locally**:

   ```bash
   vincia test
   ```

6. **Preview** (T0 blueprints + T3 widgets):

   ```bash
   vincia preview
   ```

   For T1 connectors + T2 workflow-nodes, use:

   ```bash
   vincia dev
   ```

7. **Test-apply** a T0 blueprint against an ephemeral sandbox build:

   ```bash
   vincia test --sandbox
   ```

8. **Publish** when happy:

   ```bash
   vincia publish
   ```

## How to author with an LLM

Open `docs/prompt-for-llm.md` in your LLM (Claude / ChatGPT / Cursor / any).
The prompt teaches the LLM:

- The **two archetypes** (`website` and `portal`) — `website` includes admin
  sign-in plus optional customer accounts, `portal` is login-gated chrome. (If
  you previously saw a third value called `website_as_portal`, it's been
  retired.)
- The intent-first conversational flow (Forge vs client build).
- The **tier-branched** question set: T0 blueprint authoring asks for brand
  context (since it scaffolds whole apps); T1/T2/T3/T4 skip brand entirely.
- The `BlueprintDef` shape (`inputs[]`, `steps[]`, `flow`, `fixtures[]`).
- How to compose widgets into views (which widget for which intent).
- How to wire workflows + collections without writing custom code.
- Provenance + revenue inheritance for forked contributions.

`vincia widgets explain data-table form kanban` returns deep-dives the LLM
can paste into its working context.

See `docs/developer-tiers.md` for a 1-page summary of all 5 developer tiers.

## For LLM clients (Claude Desktop, Cursor, etc.)

If you're an LLM client reading this kit on a developer's behalf, propose
these two terminal commands to the developer to get started:

```bash
curl -fsSL https://get.vincia.io/install | bash
vincia login --api-host https://<their-vincia-host>
```

Then load `docs/prompt-for-llm.md` and walk the conversational flow from its
top.

## Status — v0.4.0 (May 2026)

The CLI's `widgets *` + `create *` commands are live for all 5 developer
tiers. `test`, `preview`, `dev`, and `publish` are under active development.

## Earn

Contributions picked from the Forge marketplace earn $1 per recipient per
active month, forever. Forked contributions split that earning with ancestors
(default 50% publisher / 25% each ancestor; declarable as clean-room
rewrite). See `docs/blueprint-json-spec.md` for the provenance schema.

Dashboard: `/admin/contributor`.
