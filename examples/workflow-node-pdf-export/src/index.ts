/**
 * workflow-node-pdf-export — T2 workflow step that renders a record into a
 * PDF via the platform's internal PDF service.
 *
 * Workflow steps are pure functions: `execute(input, ctx) → output`. The
 * framework wires inputs from upstream steps (or from workflow trigger
 * args) and persists `output` for downstream steps + the workflow log.
 *
 * Reference: docs/contributor-platform/sdk-types-spec.md § "Workflow steps"
 */
import { defineStep } from '@vincia/sdk/workflow';

interface Input {
  template: string;
  data: Record<string, string | number>;
  fileName?: string;
  format?: 'A4' | 'Letter' | 'Legal';
}

interface Output {
  pdfUrl: string;
  byteCount: number;
}

export default defineStep<Input, Output>({
  id: 'pdf-export',
  version: '1.0.0',
  inputs: {
    type: 'object',
    required: ['template', 'data'],
    properties: {
      template: { type: 'string' },
      data: { type: 'object' },
      fileName: { type: 'string' },
      format: { type: 'string', enum: ['A4', 'Letter', 'Legal'] },
    },
  },
  outputs: {
    type: 'object',
    required: ['pdfUrl', 'byteCount'],
    properties: {
      pdfUrl: { type: 'string' },
      byteCount: { type: 'number' },
    },
  },
  async execute(input, ctx) {
    // 1. Fill the template by substituting {{slot}} against `data`.
    const html = input.template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const v = input.data[key];
      return v == null ? '' : String(v);
    });

    // 2. Hand the filled HTML to the platform's internal PDF renderer.
    //    The renderer runs Chromium headless on the platform side; this
    //    step only ships the HTML over the wire and stores the result.
    const res = await ctx.outbound.fetch('https://pdf.vincia.internal/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html,
        format: input.format ?? 'A4',
      }),
    });
    if (!res.ok) {
      throw new Error(`PDF render failed: ${res.status} ${await res.text()}`);
    }
    const pdfBlob = await res.blob();
    const buf = await pdfBlob.arrayBuffer();

    // 3. Persist the PDF blob into the workflow's collection storage so
    //    downstream steps can reference it. The platform handles auth /
    //    bucket sharding via ctx.storage.
    const fileName = `${input.fileName ?? 'export'}.pdf`;
    // ctx.storage's `put` shape is collection-scoped; for blob storage you
    // typically have a dedicated "files" collection scoped to the tenant.
    // The example uses a synthetic `pdf-exports` collection name; adjust to
    // your blueprint's actual file collection.
    await ctx.storage.put('pdf-exports', fileName, {
      content: buf,
      contentType: 'application/pdf',
    });

    return {
      pdfUrl: `/api/files/pdf-exports/${fileName}`,
      byteCount: buf.byteLength,
    };
  },
});
