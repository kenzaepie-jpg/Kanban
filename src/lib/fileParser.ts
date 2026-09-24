import { DocType, StoredDocument } from '../types';
import { newId } from './storage';

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

/** "03_Cell-Biology.pdf" → "03 Cell Biology" */
export function titleFromFileName(name: string): string {
  return name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim() || name;
}

function extensionOf(name: string): string {
  return name.split('.').pop()?.toLowerCase() || '';
}

export function isSupportedFile(file: File): boolean {
  return ['pdf', 'docx', 'txt', 'md'].includes(extensionOf(file.name));
}

export async function parseFile(file: File): Promise<StoredDocument> {
  const ext = extensionOf(file.name);
  const base = { id: newId('doc'), name: file.name, size: file.size };

  if (ext === 'pdf') {
    return { ...base, type: 'pdf', blob: file };
  }

  if (ext === 'docx') {
    // Loaded on demand: mammoth is large and only needed for Word uploads
    const { default: mammoth } = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    try {
      const result = await mammoth.convertToHtml({ arrayBuffer });
      return { ...base, type: 'docx', html: result.value || '<p>This Word document is empty.</p>' };
    } catch {
      const text = await mammoth.extractRawText({ arrayBuffer });
      return { ...base, type: 'docx', html: `<pre>${escapeHtml(text.value)}</pre>` };
    }
  }

  if (ext === 'txt' || ext === 'md') {
    const text = await file.text();
    const type: DocType = ext === 'md' ? 'markdown' : 'text';
    return { ...base, type, html: `<pre>${escapeHtml(text)}</pre>` };
  }

  throw new Error(`${file.name}: unsupported file type (use PDF, Word, .txt or .md)`);
}
