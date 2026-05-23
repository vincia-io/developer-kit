# blueprint-crm-lite — reference app blueprint

Category: `app` (whole-app starter).
Archetype: `portal`.

**Status (v0.1.0)**: skeleton `blueprint.json` only. Phase B fills in the
full `steps[]` (contacts / deals / activities collections, kanban for deal
pipeline, calendar for follow-ups, dashboard with KPI cards, lead-capture
form).

## What this app installs

The full scaffold for a lightweight CRM: contacts, deal pipeline (kanban),
activities calendar, a public lead-capture form (when the blueprint is forked
to archetype `website` with customer accounts enabled), a staff dashboard
with KPI tiles.

## Why this is the reference

Demonstrates how an `app` blueprint composes multiple modules' worth of
collections + views into one cohesive whole. The deal-pipeline kanban + the
contacts data-table + the activities calendar show three different widget
families on the same data graph (contacts → deals → activities) — a pattern
most CRM contributors will want to fork.
