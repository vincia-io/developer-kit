# blueprint.json — reference

The single file at the root of every Vincia blueprint package.

> **Status (v0.1.0)**: Phase A.4 ships the v0.1 contract from the existing
> `BlueprintDef` TypeScript type in `@vincia/registry/blueprints`. Phase B
> adds the zod validator, the `fixtures` field shape, and the sandbox
> apply-dry-run path. Phase G adds the provenance + revenue-inheritance
> fields (`derivedFrom`, `revenueInheritance`).

## Skeleton

```jsonc
{
  "id": "alice/invoicing",
  "name": "Invoicing module",
  "description": "Drop-in invoicing flow — clients, invoices, line items, PDF export, outstanding-balance dashboard.",
  "category": "module",
  "iconHint": "Receipt",
  "tags": ["invoicing", "finance"],

  "inputs": [
    {
      "name": "currency",
      "label": "Currency code",
      "type": "select",
      "required": true,
      "options": [
        { "value": "USD", "label": "US Dollar" },
        { "value": "EUR", "label": "Euro" },
        { "value": "INR", "label": "Indian Rupee" }
      ],
      "default": "USD"
    }
  ],

  "steps": [
    {
      "id": "clients-collection",
      "toolName": "add_collection",
      "label": "Add clients collection",
      "args": {
        "slug": "clients",
        "fields": [
          { "name": "name", "label": "Name", "type": "text", "required": true, "identifier": true },
          { "name": "email", "label": "Email", "type": "email", "identifier": true },
          { "name": "phone", "label": "Phone", "type": "tel" }
        ]
      }
    },
    {
      "id": "invoices-collection",
      "toolName": "add_collection",
      "label": "Add invoices collection",
      "args": {
        "slug": "invoices",
        "fields": [
          { "name": "client", "label": "Client", "type": "reference", "required": true,
            "referenceCollection": "clients", "referenceLabelField": "name" },
          { "name": "issued_at", "label": "Issued", "type": "date", "required": true },
          { "name": "due_at", "label": "Due", "type": "date" },
          { "name": "total", "label": "Total", "type": "number", "required": true },
          { "name": "currency", "label": "Currency", "type": "text", "default": "{{input.currency}}" },
          { "name": "status", "label": "Status", "type": "select",
            "options": ["draft", "sent", "paid", "overdue"], "default": "draft" }
        ]
      }
    },
    {
      "id": "invoices-list-view",
      "toolName": "add_view",
      "label": "Add /invoices list view",
      "args": {
        "path": "/invoices",
        "title": "Invoices",
        "widgets": [
          {
            "type": "data-table",
            "config": {
              "dataSource": { "kind": "collection", "slug": "invoices" },
              "title": "Invoices",
              "columns": [
                { "name": "client", "label": "Client" },
                { "name": "issued_at", "label": "Issued" },
                { "name": "total", "label": "Total" },
                { "name": "status", "label": "Status" }
              ]
            }
          }
        ]
      }
    }
  ],

  "flow": {
    "startRoute": "/invoices",
    "authenticatedRoutes": ["/invoices", "/invoices/[id]"],
    "roleGatedRoutes": {
      "/invoices": ["staff"]
    },
    "afterLogin": "/invoices",
    "roles": ["staff"]
  },

  "fixtures": {
    "collections": {
      "clients": [
        { "name": "Acme Co", "email": "billing@acme.test", "phone": "+1-555-0100" }
      ]
    }
  }
}
```

## Fields

| Field                  | Required        | Notes                                                                                              |
| ---------------------- | --------------- | -------------------------------------------------------------------------------------------------- |
| `id`                   | yes             | `<contributor>/<slug>`. Unique across the marketplace.                                             |
| `name`                 | yes             | Human-facing label shown in `/admin/new` picker + marketplace cards.                               |
| `description`          | yes             | 1-2 sentence summary. Drives search relevance.                                                     |
| `category`             | yes             | `'app'` (whole-app starter) or `'module'` (drop-in piece).                                         |
| `iconHint`             | no              | lucide-react icon name for the Studio UI.                                                          |
| `tags`                 | no              | Filter tags surface in the marketplace.                                                            |
| `archetype`            | app-only        | `website` / `portal`. Module blueprints leave undefined. (`website_as_portal` was retired — `website` now covers public + customer-account surfaces.)                     |
| `inputs[]`             | yes (may be []) | Values the applier fills in at apply time.                                                         |
| `steps[]`              | yes             | Ordered tool-call sequence. Args template against `{{input.*}}` and `{{step.<id>.result.<key>}}`.  |
| `flow`                 | no              | Declared user-facing flow — start route, auth-gated routes, after-login destination, roles[].     |
| `fixtures`             | no (Phase D)    | Pre-seed rows + users for the local-preview runtime.                                               |
| `scaffold`             | no              | Per-piece `authStarter` / `controlPanel` / `dataHub` install/skip. App-blueprint use case.        |
| `derivedFrom`          | Phase G         | `<id>@<version>` ancestor list when forked.                                                        |
| `revenueInheritance`   | Phase G         | `'default'` (50/25/25) or `'clean-room'` (publisher keeps $1, manual review).                      |

## What's locked vs. what's deferred

**Locked at v0.1.0** (matches the in-tree `BlueprintDef` type):

- `id`, `name`, `description`, `category`, `iconHint`, `tags`
- `inputs[]`, `steps[]`, `flow`, `archetype`, `scaffold`

**Lands in Phase B**:

- zod validator → `vincia blueprint validate`
- `fixtures` field (full shape — `collections` / `users` / `defaultLoggedInAs`)
- Studio apply-blueprint-dry-run endpoint
- Sandbox app TTL = 24h

**Lands in Phase G**:

- `derivedFrom[]`, `revenueInheritance` semantics
- `vincia blueprint fork / merge / diff / clean-room` commands
- Conflict-resolution rules (collection slug / view route / fixtures union)

**Lands in Phase H**:

- `vincia blueprint types` → generated `.vincia/types.d.ts` per blueprint

Treat this v0.1.0 spec as additive: future fields land alongside, not
replace, what's above.
