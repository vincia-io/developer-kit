/**
 * connector-google-auth-provider — T1 auth connector implementing
 * OAuthProvider for Google Sign-In.
 *
 * Standard OAuth 2.0 / OIDC flow. The four OAuthProvider methods map
 * directly onto Google's documented endpoints. PKCE is supported when
 * the caller passes `codeChallenge`.
 *
 * Reference: https://developers.google.com/identity/protocols/oauth2
 */
import { defineConnector } from '@vincia/sdk/connector';
import type { OAuthProvider } from '@vincia/sdk/connector';

const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

export default defineConnector<OAuthProvider>({
  id: 'connector-google-auth-provider',
  capability: 'auth-provider',
  version: '0.1.0',
  implementation: {
    async getAuthorizeUrl(args, ctx) {
      const clientId = await ctx.secrets.get('google_oauth_client_id');
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: args.redirectUri,
        response_type: 'code',
        scope: args.scope || 'openid email profile',
        state: args.state,
        access_type: 'offline',     // request refresh_token on first consent
        prompt: 'consent',          // force-issue refresh_token even if previously granted
      });
      if (args.codeChallenge) {
        params.set('code_challenge', args.codeChallenge);
        params.set('code_challenge_method', args.codeChallengeMethod ?? 'S256');
      }
      return `${AUTHORIZE_URL}?${params.toString()}`;
    },

    async exchangeCode(code, ctx) {
      const clientId = await ctx.secrets.get('google_oauth_client_id');
      const clientSecret = await ctx.secrets.get('google_oauth_client_secret');
      const body = new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        // The redirect_uri MUST match the one used at authorize time. The
        // sidecar restores it from the OAuth-flow row; we don't store it
        // in this connector.
        redirect_uri: '__RESTORED_BY_HOST__',
        grant_type: 'authorization_code',
      });
      const res = await ctx.outbound.fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      if (!res.ok) {
        throw new Error(`Google exchangeCode failed: ${res.status} ${await res.text()}`);
      }
      const data = await res.json() as {
        access_token: string;
        refresh_token?: string;
        expires_in: number;
        token_type: string;
        scope?: string;
        id_token?: string;
      };
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        tokenType: data.token_type,
        scope: data.scope,
        idToken: data.id_token,
      };
    },

    async refreshToken(refreshToken, ctx) {
      const clientId = await ctx.secrets.get('google_oauth_client_id');
      const clientSecret = await ctx.secrets.get('google_oauth_client_secret');
      const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });
      const res = await ctx.outbound.fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      if (res.status === 400 || res.status === 401) {
        // Provider has revoked the refresh token. Surface a clear error so
        // the host can prompt the user to re-consent.
        throw new Error('REFRESH_REVOKED');
      }
      if (!res.ok) {
        throw new Error(`Google refreshToken failed: ${res.status} ${await res.text()}`);
      }
      const data = await res.json() as {
        access_token: string;
        expires_in: number;
        token_type: string;
        scope?: string;
        id_token?: string;
      };
      return {
        accessToken: data.access_token,
        // Google rotates refresh tokens lazily; if it didn't issue a new
        // one, the original remains valid.
        refreshToken,
        expiresIn: data.expires_in,
        tokenType: data.token_type,
        scope: data.scope,
        idToken: data.id_token,
      };
    },

    async getUserInfo(accessToken, ctx) {
      const res = await ctx.outbound.fetch(USERINFO_URL, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        throw new Error(`Google getUserInfo failed: ${res.status} ${await res.text()}`);
      }
      const data = await res.json() as {
        sub: string;
        email?: string;
        email_verified?: boolean;
        name?: string;
        picture?: string;
      };
      return {
        id: data.sub,
        email: data.email ?? null,
        emailVerified: data.email_verified === true,
        name: data.name ?? null,
        avatarUrl: data.picture ?? null,
      };
    },
  },
});
