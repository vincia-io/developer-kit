# blueprint-support-tickets — reference module blueprint

Category: `module` (drop-in piece).

**Status (v0.1.0)**: skeleton `blueprint.json` only. Phase B fills in the
full `steps[]` (tickets collection with priority + status, kanban board,
SLA workflow, customer-facing ticket-submit form via the host `website` app
when customer accounts are enabled).

## What this module installs

Two collections — `tickets`, `ticket_messages`. Two views — `/support`
(kanban board for staff to triage by status) and `/support/[id]` (form +
message thread). Two workflows — escalate when `priority=high AND status=open
for > 1h`, send confirmation email on new ticket.

## Why this is the reference

A second module blueprint pattern that complements `blueprint-invoicing`.
Where invoicing is reference-heavy (clients → invoices → line items),
support-tickets is **state-machine-heavy** (status transitions drive
workflows). The two together cover the most common module-blueprint shapes.
