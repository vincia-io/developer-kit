# CLAUDE.md — solution-pack-saas-billing

T4 solution-pack — a deployment recipe bundling N existing plugins into a
one-install experience. Read this example when authoring ANY solution-pack
(no implementation code required — solution-packs are pure composition).

Reading order:

1. Developer kit's `docs/prompt-for-developer-llm.md` — RULES 1-22.
2. This example's `manifest.json` — the only file. Note `contains[]` +
   `post_install_steps[]`.
3. README — explains the wiring tokens (`{{secret:...}}`, `{{form:...}}`).

Key idea: a solution-pack DOES NOT SHIP CODE. No `src/`, no
`src/index.test.ts`, no `tsconfig.json`. The only artifact is `manifest.json`
declaring what to install.

Preserve when adapting to another solution-pack:

- Manifest-only structure.
- `contains[]` lists component plugins with semver ranges + roles.
- `post_install_steps[]` is declarative — the platform's installer interprets
  it; no custom JS runs at install time.
- Components in `contains[]` must already exist in the marketplace at the
  declared version range; publish fails if a component is missing.

Swap when adapting:

- Replace `contains[]` with your pack's components.
- Replace `post_install_steps[]` with the operations needed to wire them up.
- Pick recognised step kinds only — see README for the canonical list.

When to ship a solution-pack vs separate plugins:

- Ship as a solution-pack when N plugins are commonly installed together AND
  you want to declare wiring (routes, slot placements, collection creation).
- Don't ship as a solution-pack for a single plugin — just publish that
  plugin directly. Solution-packs are bundlers.

Earnings: the pack earns separately from its components. Both you (the
bundler) AND each component author get the $1/recipient/month.
