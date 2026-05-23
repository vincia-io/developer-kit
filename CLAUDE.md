# Claude — Vincia Developer Kit

You're pairing with a human developer to author functional contributions for
the [Vincia Forge](https://forge.vincia.io). This folder is the **Developer
Kit v0.4.0** — blueprints (T0), connectors (T1), workflow-nodes (T2), widgets
(T3), and solution packs (T4) that other Vincia builders install onto their
builds.

## Reading order (do this before writing any code)

1. **[`README.md`](README.md)** — kit layout, the 5 developer tiers, what
   you can ship.
2. **[`docs/prompt-for-llm.md`](docs/prompt-for-llm.md)** — the
   conversational intent-first flow. Walk this when scoping the work.
3. **[`docs/prompt-for-developer-llm.md`](docs/prompt-for-developer-llm.md)** —
   the deep structural contract (**RULES 1-22**). MANDATORY before writing
   `src/index.ts` for any tier. Defines the SDK surface, manifest schema,
   scope rules, contract versioning, the lot.
4. **[`docs/developer-tiers.md`](docs/developer-tiers.md)** — 1-page summary
   of all 5 tiers.
5. **[`docs/blueprint-json-spec.md`](docs/blueprint-json-spec.md)** —
   `BlueprintDef` field-by-field reference (only for T0).

## Pick the closest exemplar before authoring

The kit ships a worked example for every tier × capability:

- **T0 Blueprint** — `examples/blueprint-crm-lite/` (app starter),
  `examples/blueprint-invoicing/` (module),
  `examples/blueprint-support-tickets/` (module)
- **T1 Connector** — one per capability:
  - `payment` → `examples/connector-stripe-payment/`
  - `storage` → `examples/connector-s3-storage/`
  - `notification` → `examples/connector-slack-notification/`
  - `auth-provider` → `examples/connector-google-auth-provider/`
  - `mailbox` → `examples/connector-sendgrid-mailbox/`
- **T2 Workflow-node** — `examples/workflow-node-pdf-export/`
- **T3 Widget** — `examples/widget-stripe-checkout/` (form-aware + cross-tier
  connector call)
- **T4 Solution-pack** — `examples/solution-pack-saas-billing/` (manifest-only
  bundle)

Each example folder has its own `CLAUDE.md` calling out what's load-bearing
and what to swap when adapting.

## Definition of done

- `vincia test` passes (unit tests via vitest)
- `vincia dev` boots cleanly for T1/T2/T3 (devcontainer for T1/T2, in-process
  widget-dev-server for T3)
- Manifest passes `vincia:lint_manifest` MCP tool / `vincia test --remote`
- `simulate_run` against the example's fixtures produces expected output (T1/T2)

## Out of scope here

Visual / template / theme / section-library contributions live in the separate
[Designer Kit](https://github.com/vincia-io/designer-kit). This kit is for
**functional** contributions only.
