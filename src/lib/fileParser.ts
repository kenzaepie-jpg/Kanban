import { DocType } from '../types';

export const ACCEPTED_FILES = '.pdf,.docx,.txt,.md';

/** Escapes text so it can be safely inserted into HTML rendered with dangerouslySetInnerHTML. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isSupportedFile(file: File): boolean {
  return ['pdf', 'docx', 'txt', 'md'].includes(file.name.split('.').pop()?.toLowerCase() || '');
}

export type RenderedDocument = { kind: 'pdf'; blob: Blob } | { kind: 'html'; html: string };

/** Turns a topic file downloaded from the server into something the reader can show. */
export async function renderDocument(blob: Blob, type: DocType): Promise<RenderedDocument> {
  if (type === 'pdf') {
    return { kind: 'pdf', blob: new Blob([blob], { type: 'application/pdf' }) };
  }

  if (type === 'docx') {
    // Loaded on demand: mammoth is large and only needed for Word files
    const { default: mammoth } = await import('mammoth');
    const arrayBuffer = await blob.arrayBuffer();
    try {
      const result = await mammoth.convertToHtml({ arrayBuffer });
      return { kind: 'html', html: result.value || '<p>This Word document is empty.</p>' };
    } catch {
      const text = await mammoth.extractRawText({ arrayBuffer });
      return { kind: 'html', html: `<pre>${escapeHtml(text.value)}</pre>` };
    }
  }

  const text = await blob.text();
  // Only the built-in sample course uses HTML files
  if (type === 'html') return { kind: 'html', html: text };
  return { kind: 'html', html: `<pre>${escapeHtml(text)}</pre>` };
}
