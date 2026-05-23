# CLAUDE.md — connector-google-auth-provider

T1 auth connector implementing `OAuthProvider` for Google Sign-In. Standard
OAuth 2.0 + OIDC. Read this example when authoring any T1 auth connector for
an OAuth-based identity provider (GitHub, Microsoft, Apple, LinkedIn, etc).

Reading order:

1. Developer kit's `docs/prompt-for-developer-llm.md` — RULES 1-22.
2. `@vincia/sdk/connector/auth.ts` — 4-method `OAuthProvider` contract.
3. This example's `src/index.ts` — see the standard flow + PKCE + refresh handling.

Preserve when adapting to another OAuth provider:

- The 4-method shape — `getAuthorizeUrl`, `exchangeCode`, `refreshToken`, `getUserInfo`.
- PKCE plumbing on the authorize URL when `args.codeChallenge` is provided.
- Distinct `REFRESH_REVOKED` error so the host can prompt for re-consent.
- `refreshToken` preserves the original when the provider doesn't rotate.

Swap when targeting another provider:

- Replace `AUTHORIZE_URL` / `TOKEN_URL` / `USERINFO_URL` with the provider's.
- Adjust the `getUserInfo` response mapping to fit the provider's user shape.
- Provider-specific quirks: see the README for GitHub, Apple, LinkedIn, MS notes.

Out of scope: SAML, legacy OAuth 1.0a, password-grant flows. See README.
