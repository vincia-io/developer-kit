# Agents — Vincia Developer Kit

Generic agent instructions following the [AGENTS.md](https://agents.md/)
convention (Aider, Continue, and any AGENTS-compatible client).

You're pairing with a human developer to author functional contributions for
the [Vincia Forge](https://forge.vincia.io). This folder is the **Developer
Kit v0.5.3**.

## Read these in order before writing code

1. [`README.md`](README.md) — kit layout + 5 developer tiers
2. [`docs/prompt-for-llm.md`](docs/prompt-for-llm.md) — conversational flow
3. [`docs/prompt-for-developer-llm.md`](docs/prompt-for-developer-llm.md) —
   structural contract, **RULES 1-22** (mandatory before any `src/index.ts`)
4. [`docs/developer-tiers.md`](docs/developer-tiers.md) — 1-page tier summary
5. [`docs/blueprint-json-spec.md`](docs/blueprint-json-spec.md) — T0 only

## Pick the closest exemplar before authoring

- T0 → `examples/blueprint-crm-lite/`, `blueprint-invoicing/`, `blueprint-support-tickets/`
- T1 payment → `examples/connector-stripe-payment/`
- T1 storage → `examples/connector-s3-storage/`
- T1 notification → `examples/connector-slack-notification/`
- T1 auth-provider → `examples/connector-google-auth-provider/`
- T1 mailbox → `examples/connector-sendgrid-mailbox/`
- T2 → `examples/workflow-node-pdf-export/`
- T3 → `examples/widget-stripe-checkout/`
- T4 → `examples/solution-pack-saas-billing/`

Each example folder has its own `CLAUDE.md` with adaptation notes.

## Definition of done

- `vincia test` passes (vitest)
- `vincia dev` boots cleanly
- Manifest passes `vincia_lint_manifest`
- `simulate_run` against fixtures produces expected output (T1/T2)

Visual / template / theme contributions → separate
[Designer Kit](https://github.com/vincia-io/designer-kit).
