# solution-pack-saas-billing — T4 solution-pack example

A T4 solution-pack is a **deployment recipe** — it doesn't ship implementation
code, it ships a manifest declaring which existing plugins to install + how
to wire them together + what post-install operations the host should run.

This pack bundles three component plugins into a one-install SaaS-billing
experience.

## What this example demonstrates

- **Manifest-only — NO `src/` directory.** Solution-packs are pure
  composition. The platform reads `manifest.json#contains[]` and installs each
  component plugin at the declared version range.
- **`contains[]` with role + config_template per component**. The role
  field (`payment-processor`, `checkout-widget`, `billing-app`) is what the
  pack's documentation refers to when explaining what each piece does. The
  config_template gives the platform sensible defaults; the host can
  override via the install UI.
- **`post_install_steps[]`** — declarative operations the platform runs
  after every component is installed:
  - `create-collection` adds a subscriptions row to the host's collection set.
  - `add-route` mounts pages at known paths.
  - `configure-widget` drops a configured widget instance into a specific
    slot on a specific page.
- **Version ranges in `contains[]`** so the pack works against minor-version
  updates of its components without re-publishing.

## Why solution-packs exist

End-user value: a host can install ONE thing instead of three, with sensible
wiring out of the box.

Contributor value: bundlers can compose other contributors' plugins into
opinionated experiences. A SaaS-billing pack curator doesn't have to
re-implement the Stripe connector + checkout widget; they reference them.

Marketplace value: solution-packs are the unit that maps to a customer
problem ("I want SaaS billing") rather than a primitive ("I need a payment
connector"). The host LLM offers solution-packs at the top of search results
when a brief matches their domain.

## What this pack deliberately does NOT do

- **Ship implementation code.** Every component is a separately-published
  plugin. If you need a custom workflow node for your pack, publish it as a
  T2 step + reference it in `contains[]`.
- **Hard-pin versions.** `version: "^0.1.0"` allows component minor updates.
  If a component ships a breaking change, the pack maintainer bumps to
  `^0.2.0` and re-publishes the pack.
- **Run arbitrary code at install.** `post_install_steps[]` is a fixed set of
  declarative operations (the platform's installer interprets them). No
  custom JS runs at install time — that would defeat the security model.

## Anatomy of `contains[]`

```jsonc
{
  "id": "vincia/<component-plugin-id>",      // exact package id, with vincia/ namespace
  "version": "^X.Y.Z",                       // semver range
  "role": "kebab-case-description",           // for docs + the install UI
  "config_template": {                        // optional defaults; user can override
    "<config_key>": "<value or {{token:...}}>"
  }
}
```

Recognised `{{token:...}}` substitutions in `config_template`:

- `{{secret:from-host-env-or-prompt}}` — install UI prompts for value
- `{{secret:from-<provider>-dashboard}}` — install UI shows a "fetch from
  Stripe dashboard" affordance with a helper link
- `{{form:<field>}}` — at runtime, read from the host form's field
- `{{user:<field>}}` — at runtime, read from the signed-in user

## Anatomy of `post_install_steps[]`

| Step kind | Purpose | Required fields |
|---|---|---|
| `create-collection` | Add a collection (table) to the host | `name`, `fields[]` |
| `add-route` | Mount a page at a path | `path`, `view`, `auth` |
| `configure-widget` | Drop a widget into a slot | `widget`, `slot`, `config` |
| `set-flag` | Set a build-flag on the host | `flag`, `value` |
| `install-workflow` | Register a workflow definition | `workflow_id`, `definition` |

Steps run in declared order. If any step fails, the platform rolls back the
entire pack install (every component is uninstalled).

## Publishing

```bash
vincia publish    # validates manifest + checks every contains[] resolves
```

You don't `vincia test` a solution-pack — there's no code to test. Publish
validation includes resolving each `contains[]` entry against the
marketplace; if a referenced plugin doesn't exist at the requested version
range, publish fails.

Earnings: $1 per recipient per active month, forever, for every build that
installs this pack. The pack's earnings are SEPARATE from the components'
earnings — both the bundler AND each component author get paid.
