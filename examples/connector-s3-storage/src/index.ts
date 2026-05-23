/**
 * connector-s3-storage — T1 storage connector implementing StorageProvider
 * against any S3-compatible bucket (AWS S3, Cloudflare R2, Backblaze B2,
 * MinIO, DigitalOcean Spaces).
 *
 * Auth is AWS SigV4 — the same signing scheme every S3-compatible provider
 * accepts. The endpoint URL is configurable via `s3_endpoint` so the same
 * connector works against AWS (`https://s3.us-east-1.amazonaws.com`),
 * R2 (`https://<account>.r2.cloudflarestorage.com`), and Backblaze
 * (`https://s3.<region>.backblazeb2.com`).
 *
 * Reference: https://docs.aws.amazon.com/general/latest/gr/sigv4_signing.html
 */
import { defineConnector } from '@vincia/sdk/connector';
import type { StorageProvider } from '@vincia/sdk/connector';

export default defineConnector<StorageProvider>({
  id: 'connector-s3-storage',
  capability: 'storage',
  version: '0.1.0',
  implementation: {
    async put(key, content, ctx) {
      const cfg = await loadConfig(ctx);
      // Read the stream into a buffer for signing (S3 requires content-sha256
      // in the canonical request).
      const reader = content.getReader();
      const chunks: Uint8Array[] = [];
      let total = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        chunks.push(value);
        total += value.byteLength;
      }
      const body = new Uint8Array(total);
      let off = 0;
      for (const c of chunks) { body.set(c, off); off += c.byteLength; }
      const hash = await sha256Hex(ctx, body.buffer);
      const url = `${cfg.endpoint}/${cfg.bucket}/${encodeS3Key(key)}`;
      const res = await signedFetch(ctx, cfg, 'PUT', url, body, hash);
      if (!res.ok) throw new Error(`S3 put failed: ${res.status} ${await res.text()}`);
      return { url };
    },

    async get(key, ctx) {
      const cfg = await loadConfig(ctx);
      const url = `${cfg.endpoint}/${cfg.bucket}/${encodeS3Key(key)}`;
      const res = await signedFetch(ctx, cfg, 'GET', url, undefined, EMPTY_SHA256);
      if (!res.ok) throw new Error(`S3 get failed: ${res.status}`);
      if (!res.body) throw new Error('S3 get returned empty body');
      return res.body;
    },

    async delete(key, ctx) {
      const cfg = await loadConfig(ctx);
      const url = `${cfg.endpoint}/${cfg.bucket}/${encodeS3Key(key)}`;
      const res = await signedFetch(ctx, cfg, 'DELETE', url, undefined, EMPTY_SHA256);
      if (!res.ok && res.status !== 404) {
        throw new Error(`S3 delete failed: ${res.status} ${await res.text()}`);
      }
    },

    async list(prefix, ctx) {
      const cfg = await loadConfig(ctx);
      const url = `${cfg.endpoint}/${cfg.bucket}/?list-type=2&prefix=${encodeURIComponent(prefix)}`;
      const res = await signedFetch(ctx, cfg, 'GET', url, undefined, EMPTY_SHA256);
      if (!res.ok) throw new Error(`S3 list failed: ${res.status}`);
      const xml = await res.text();
      // S3 returns XML; for the example we parse the key elements with a
      // small regex. Production connectors should use a real XML parser
      // (DOMParser is available in the isolate).
      const keys: string[] = [];
      const re = /<Key>([^<]+)<\/Key>/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(xml)) !== null) keys.push(m[1]);
      return keys;
    },

    async presignUrl(key, expiresIn, ctx) {
      // Presigned URLs use the same SigV4 algorithm but with the signature
      // in the query string. Clamp `expiresIn` to AWS's 7-day max.
      const cfg = await loadConfig(ctx);
      const clamped = Math.min(expiresIn, 604800);
      const dateIso = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
      const date = dateIso.slice(0, 8);
      const credential = `${cfg.accessKey}/${date}/${cfg.region}/s3/aws4_request`;
      const params = new URLSearchParams({
        'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
        'X-Amz-Credential': credential,
        'X-Amz-Date': dateIso,
        'X-Amz-Expires': String(clamped),
        'X-Amz-SignedHeaders': 'host',
      });
      const host = new URL(cfg.endpoint).host;
      const canonical = [
        'GET',
        `/${cfg.bucket}/${encodeS3Key(key)}`,
        params.toString(),
        `host:${host}\n`,
        'host',
        'UNSIGNED-PAYLOAD',
      ].join('\n');
      const canonicalHash = await sha256Hex(ctx, new TextEncoder().encode(canonical).buffer);
      const stringToSign = [
        'AWS4-HMAC-SHA256',
        dateIso,
        `${date}/${cfg.region}/s3/aws4_request`,
        canonicalHash,
      ].join('\n');
      const sig = await sigV4Signature(ctx, cfg.secretKey, date, cfg.region, 's3', stringToSign);
      params.set('X-Amz-Signature', sig);
      return `${cfg.endpoint}/${cfg.bucket}/${encodeS3Key(key)}?${params.toString()}`;
    },
  },
});

// --- Helpers (isolated-safe; Node crypto + AWS SDK blocked) ------------------

interface S3Config {
  accessKey: string;
  secretKey: string;
  bucket: string;
  region: string;
  endpoint: string;
}

const EMPTY_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

async function loadConfig(ctx: import('@vincia/sdk/runtime').PluginContext): Promise<S3Config> {
  return {
    accessKey: await ctx.secrets.get('s3_access_key_id'),
    secretKey: await ctx.secrets.get('s3_secret_access_key'),
    bucket: await ctx.secrets.get('s3_bucket'),
    region: await ctx.secrets.get('s3_region'),
    endpoint: await ctx.secrets.get('s3_endpoint'),
  };
}

function encodeS3Key(key: string): string {
  // S3 keys URL-encode with `/` left literal so prefix-listing works.
  return key.split('/').map(encodeURIComponent).join('/');
}

async function sha256Hex(ctx: import('@vincia/sdk/runtime').PluginContext, data: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(await ctx.crypto.digest('sha256', data));
  return bytesToHex(bytes);
}

function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0');
  return out;
}

async function sigV4Signature(
  ctx: import('@vincia/sdk/runtime').PluginContext,
  secretKey: string,
  date: string,
  region: string,
  service: string,
  stringToSign: string,
): Promise<string> {
  const enc = new TextEncoder();
  const kDate = await ctx.crypto.hmac('sha256', enc.encode(`AWS4${secretKey}`).buffer, enc.encode(date).buffer);
  const kRegion = await ctx.crypto.hmac('sha256', kDate, enc.encode(region).buffer);
  const kService = await ctx.crypto.hmac('sha256', kRegion, enc.encode(service).buffer);
  const kSigning = await ctx.crypto.hmac('sha256', kService, enc.encode('aws4_request').buffer);
  const sig = await ctx.crypto.hmac('sha256', kSigning, enc.encode(stringToSign).buffer);
  return bytesToHex(new Uint8Array(sig));
}

async function signedFetch(
  ctx: import('@vincia/sdk/runtime').PluginContext,
  cfg: S3Config,
  method: string,
  urlStr: string,
  body: Uint8Array | undefined,
  payloadHash: string,
): Promise<Response> {
  const url = new URL(urlStr);
  const dateIso = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const date = dateIso.slice(0, 8);
  const canonicalQuery = url.search ? url.search.slice(1) : '';
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonical = [
    method,
    url.pathname,
    canonicalQuery,
    `host:${url.host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${dateIso}`,
    '',
    signedHeaders,
    payloadHash,
  ].join('\n');
  const canonicalHash = await sha256Hex(ctx, new TextEncoder().encode(canonical).buffer);
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    dateIso,
    `${date}/${cfg.region}/s3/aws4_request`,
    canonicalHash,
  ].join('\n');
  const sig = await sigV4Signature(ctx, cfg.secretKey, date, cfg.region, 's3', stringToSign);
  const auth = `AWS4-HMAC-SHA256 Credential=${cfg.accessKey}/${date}/${cfg.region}/s3/aws4_request, SignedHeaders=${signedHeaders}, Signature=${sig}`;
  return ctx.outbound.fetch(urlStr, {
    method,
    headers: {
      'Authorization': auth,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': dateIso,
    },
    body: body as BodyInit | undefined,
  });
}
