# workflow-node-pdf-export — T2 workflow step example

Reference implementation of a workflow step that renders an HTML template
into a PDF via the platform's internal PDF service. The pattern applies to
ANY T2 step that transforms input data into output state — the differences
are only in the input/output schemas + the body of `execute`.

## What this example demonstrates

- **`defineStep<Input, Output>(...)` is the only export.** Workflow runner
  reads the default export at install time.
- **Input + output schemas declared as JSON Schema** in the manifest AND
  passed to `defineStep`. The runner validates inputs at call time + outputs
  at return time; mismatches throw.
- **`ctx.outbound.fetch`** for the upstream call (the internal PDF service).
- **`ctx.storage.put`** for persisting the rendered blob into a
  collection-scoped file area. The path returned in `output.pdfUrl` is what
  downstream steps see.
- **Template substitution inline** — a tiny `{{slot}}` interpolation
  replacing values from `input.data`. Real HTML templating engines (mustache,
  handlebars) are heavier and rarely needed for transactional PDFs.
- **Defaults declared in JSON Schema** so the runner fills them when the
  caller omits — `fileName` defaults to `export`, `format` to `A4`.

## When to reach for a T2 workflow step vs a T1 connector

| Use case | Tier |
|---|---|
| Talks to an external service exposing a stable capability surface (payment, storage, etc) | T1 connector — pick the capability + implement the interface. |
| Multi-step transformation of host data with no single capability fit | T2 workflow step — define your own input/output schemas. |
| Reusable single transformation that any workflow can call | T2 workflow step. |
| The host wants to embed your output in a page | T3 widget. |
| One-off business logic specific to one app | Inline in a blueprint's `steps[]`; don't ship as a plugin. |

## Other T2 step patterns

- **`data-transform-csv-to-json`** — slurp a CSV from `ctx.storage.get`, emit
  rows as `output.rows`.
- **`send-transactional-receipt`** — composes a receipt body, looks up the
  customer's email, dispatches via a T1 notification connector.
- **`record-archive`** — moves rows older than N days into archive storage.
- **`webhook-fan-out`** — POSTs a payload to N declared subscriber URLs.

The common shape: input schema declares what the runner must give you,
output schema declares what downstream steps can rely on, `execute` does
the work.

## Publishing

```bash
vincia test
vincia publish
```
