# blueprint-invoicing — reference module blueprint

Category: `module` (drop-in piece, stamps into an existing app).

**Status (v0.1.0)**: skeleton `blueprint.json` only. Phase B fills in:
- the full `steps[]` (add collections, views, workflows for PDF export +
  payment reminders)
- the `fixtures[]` so local preview shows realistic invoices on first load
- a sandbox dry-run that verifies the apply-step DAG runs cleanly

## What this module installs

Three collections — `clients`, `invoices`, `invoice_lines`. Three views —
`/invoices` (data-table), `/invoices/[id]` (form + line-items table),
`/invoices/new` (multi-step-form). Two workflows — generate PDF on status
change to `sent`, send overdue reminder when `due_at < today AND status != paid`.

## Why this is the reference

The invoicing pattern hits every load-bearing piece of the blueprint DSL:
reference fields, computed totals, status-driven workflows, fixture seeding,
PDF service stub. A contributor who reads this end-to-end has seen 80% of
the surface they'll need for their own blueprint.
