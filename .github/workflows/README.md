# Kit-repo GitHub Actions

Workflow files designed to be dropped into `vincia-io/designer-kit` and
`vincia-io/developer-kit` (G-S78 — public kit distribution).

## `publish-to-get-vincia.yml`

Mirrors a release's source archives from GitHub to `get.vincia.io/kits/` so
the public bootstrap one-liner (`curl -fsSL https://get.vincia.io/kit | bash -s
<kind> <dir>`) always pulls the latest tag. Also updates the `-latest` aliases
and purges Cloudflare's edge cache.

### Install

In **each** kit repo (`vincia-io/designer-kit` and `vincia-io/developer-kit`):

```bash
mkdir -p .github/workflows
cp <this-dir>/publish-to-get-vincia.yml .github/workflows/
git add .github/workflows/publish-to-get-vincia.yml
git commit -m "ci: mirror releases to get.vincia.io/kits/"
git push
```

### Required secrets

Set these in **each** kit repo at `Settings → Secrets and variables → Actions`:

| Secret | Value | How to get it |
|---|---|---|
| `GET_VINCIA_HOST` | `139.84.222.189` | studio VM IP |
| `GET_VINCIA_USER` | `vincia` | non-root user with write to `/opt/vincia/get-vincia-io/kits/` |
| `GET_VINCIA_SSH_KEY` | private key PEM | generate a dedicated deploy keypair (don't reuse `.claude/keys/vincia_ed25519`); add the **public** key to `~vincia/.ssh/authorized_keys` on the VM |
| `GET_VINCIA_KNOWN_HOSTS` | `ssh-keyscan -H 139.84.222.189` output | run `ssh-keyscan -H 139.84.222.189` and paste the full line(s) |
| `CF_API_TOKEN` | Cloudflare API token | create at https://dash.cloudflare.com/profile/api-tokens — **only** `Zone → Cache Purge → Purge` on the `vincia.io` zone |
| `CF_ZONE_ID` | Cloudflare zone id for `vincia.io` | shown in the Cloudflare dashboard sidebar of the `vincia.io` zone |

### Why a dedicated deploy keypair

The `.claude/keys/vincia_ed25519` key in this repo is for operator (laptop) use.
GitHub Actions runs in a public-cloud context — it should have its own keypair
whose authorized scope is documented and revocable independently. Generate with:

```bash
ssh-keygen -t ed25519 -f /tmp/get_vincia_ci_key -N "" -C "github-actions:vincia-io/*-kit"
# Public key → paste into ~vincia/.ssh/authorized_keys on 139.84.222.189
cat /tmp/get_vincia_ci_key.pub
# Private key → paste into GET_VINCIA_SSH_KEY secret in each kit repo
cat /tmp/get_vincia_ci_key
rm /tmp/get_vincia_ci_key /tmp/get_vincia_ci_key.pub
```

The same keypair can be reused across both kit repos.

### Why minimum-scope Cloudflare token

`CF_API_TOKEN` with only **Zone → Cache Purge** scoped to the `vincia.io` zone
can't modify DNS, edit Pages, or read account secrets — if the GitHub Actions
context is ever compromised, the worst it can do is purge cache. Do **not**
reuse the existing `CF_API_TOKEN` from the Caddy container (which has
DNS-edit permissions for the Let's Encrypt DNS-01 challenge).

### First run (manual seed)

After committing the workflow + setting secrets, kick off the first run from
the Actions tab using **Run workflow** → enter `v0.3.0` (designer-kit) or
`v0.4.0` (developer-kit). Subsequent releases trigger automatically on
`release: published`.

Note: the **initial mirror** of v0.3.0 + v0.4.0 was already seeded by
`p:/tmp/_deploy_g_s78_kits_mirror.py` during G-S78 — see
[../deploy.md](../deploy.md) (G-S78 section). The workflow handles **future**
releases.
