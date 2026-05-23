# CLAUDE.md — workflow-node-pdf-export

T2 workflow step that renders a record into a PDF. Read this example when
authoring any T2 step that transforms input data into output state via an
external service.

Reading order:

1. Developer kit's `docs/prompt-for-developer-llm.md` — RULES 1-22.
2. `@vincia/sdk/workflow/index.ts` — `defineStep` + the inputs/outputs schema contract.
3. This example's `src/index.ts` — note the JSON Schema validation surface + ctx.storage usage.
4. This example's `manifest.json` — input + output schemas mirror the `defineStep` ones.

Preserve when adapting to another transform-style workflow step:

- `defineStep<Input, Output>(...)` is the only export.
- Input schema + output schema declared in BOTH `manifest.json` and `defineStep`.
- All HTTP via `ctx.outbound.fetch`. All persistence via `ctx.storage.*`.
- Defaults in JSON Schema so the runner fills omitted fields.

Swap when adapting to a different transform:

- Replace the PDF service URL + payload shape.
- Replace the template substitution with whatever your transform does
  (CSV-to-JSON, image-resize, data-enrichment, etc).
- Adjust the `cpu_ms` + `memory_mb` budget in manifest if heavier.

T2 vs T1 decision: if you're talking to a service exposing a stable capability
surface (payment / storage / notification / auth / mailbox), use T1. T2 is
for steps that don't fit one of those five capabilities.

Out of scope: multi-step workflows (those are blueprints calling N T2 steps),
trigger registration (lives in the blueprint that schedules this step).
