# connector-google-auth-provider — T1 auth connector example

Reference implementation of `OAuthProvider` for Google Sign-In. Standard
OAuth 2.0 / OIDC; every method maps 1:1 onto Google's documented endpoints.

## What this example demonstrates

- **All 4 OAuthProvider methods** — `getAuthorizeUrl`, `exchangeCode`,
  `refreshToken`, `getUserInfo`.
- **PKCE support** — when `args.codeChallenge` is set, the connector
  forwards it to Google. Public clients (mobile, SPA) should always send PKCE.
- **`access_type=offline` + `prompt=consent`** so Google always issues a
  refresh token on first authorize. Without these, Google omits the refresh
  token on repeat-consent and the user can't be silently re-auth'd later.
- **Distinct `REFRESH_REVOKED` error** when the refresh fails with 400/401.
  Lets the host distinguish "user revoked us" (re-prompt for consent) from
  "transient network" (retry).
- **`refreshToken` preserves the original** when Google doesn't rotate it.
  Google rotates lazily; treating no-rotation as no-token would break.

## How to read this for your own OAuth provider

| Field | Where it varies |
|---|---|
| `AUTHORIZE_URL` / `TOKEN_URL` / `USERINFO_URL` | Different per provider — start here. |
| Scope syntax | Google uses space-separated. Microsoft uses `+`. GitHub uses comma. Use the provider's accepted format. |
| PKCE support | Most modern providers support it. LinkedIn requires PKCE for public-client mode. |
| `getUserInfo` response shape | Wildly different. Look at the provider's `/me` or `/userinfo` endpoint and map onto `{id, email, emailVerified, name, avatarUrl}`. |
| Email verification claim | OIDC: `email_verified`. GitHub: separate `/user/emails` call needed. Apple Sign In: `email_verified` field in the id_token. |

## Provider-specific tweaks to watch for

- **GitHub**: doesn't return `email` in `/user` unless the scope includes
  `user:email`; you must additionally call `/user/emails` for verified addresses.
- **Apple Sign In**: returns user profile ONLY on first consent. Subsequent
  exchanges return tokens only. Store the profile on first call.
- **LinkedIn**: uses R2 (LinkedIn Marketing API) endpoint conventions; the
  `userinfo` endpoint is `https://api.linkedin.com/v2/userinfo` (OIDC).
- **Microsoft (Azure AD)**: tenant-aware authorize URL
  (`https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize`). Add the
  tenant id as a connector input or hardcode `common` for multi-tenant apps.

## Publishing

```bash
vincia test
vincia publish
```
