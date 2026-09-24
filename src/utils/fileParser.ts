import mammoth from 'mammoth';
import { DocumentAttachment, KeyConcept } from '../types';

/** Escapes text so it can be safely inserted into HTML rendered with dangerouslySetInnerHTML. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function newDocId(): string {
  return 'doc-' + Date.now() + '-' +Math.random().toString(36).substring(2, 8);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function parseUploadedFile(file: File): Promise<DocumentAttachment> {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || '';

  if (fileExt === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    try {
      const result = await mammoth.convertToHtml({ arrayBuffer });
      return {
        id: newDocId(),
        name: file.name,
        type: 'docx',
        size: file.size,
        content: result.value || '<p>Empty Word document</p>',
      };
    } catch (err) {
      console.error('Error parsing docx with mammoth:', err);
      // Fallback
      const textResult = await mammoth.extractRawText({ arrayBuffer });
      return {
        id: newDocId(),
        name: file.name,
        type: 'docx',
        size: file.size,
        content: `<pre class="whitespace-pre-wrap font-sans">${escapeHtml(textResult.value || 'Word document loaded.')}</pre>`,
      };
    }
  }

  if (fileExt === 'pdf') {
    // Store as a data URL: blob: URLs die on page reload, so saved PDFs would go blank.
    const dataUrl = await readAsDataUrl(file);
    return {
      id: newDocId(),
      name: file.name,
      type: 'pdf',
      size: file.size,
      url: dataUrl,
      // Provide a clean fallback readable text representation
      content: `<h2>${escapeHtml(file.name)}</h2><p class="text-slate-600">PDF document loaded successfully. Use the PDF preview viewer on the left or download for external inspection.</p>`,
    };
  }

  if (fileExt === 'txt' || fileExt === 'md') {
    const text = await file.text();
    return {
      id: newDocId(),
      name: file.name,
      type: fileExt === 'md' ? 'markdown' : 'text',
      size: file.size,
      // Plain text must be escaped and keep its line breaks when rendered as HTML
      content: `<pre class="whitespace-pre-wrap font-sans">${escapeHtml(text)}</pre>`,
    };
  }

  // Generic fallback
  return {
    id: newDocId(),
    name: file.name,
    type: 'text',
    size: file.size,
    content: `<p>Uploaded file: ${escapeHtml(file.name)} (${Math.round(file.size / 1024)} KB)</p>`,
  };
}

/**
 * Extracts syllabus topics from pasted text or parsed doc text.
 * Finds lines starting with numbers, Roman numerals, "Chapter", "Topic", "Lecture", "Week", etc.
 */
export function extractTopicsFromText(rawText: string): { title: string; summary?: string; concepts: KeyConcept[] }[] {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const topics: { title: string; summary?: string; concepts: KeyConcept[] }[] = [];

  const topicPattern = /^(?:(?:\d+[\.\)]|Topic\s*\d+|Chapter\s*\d+|Lecture\s*\d+|Week\s*\d+|Module\s*\d+|Part\s*\d+|[IVXLCDM]+[\.\)])\s*)(.+)$/i;

  let currentTopic: { title: string; summaryLines: string[]; concepts: KeyConcept[] } | null = null;

  for (const line of lines) {
    const match = line.match(topicPattern);
    if (match) {
      if (currentTopic) {
        topics.push({
          title: currentTopic.title,
          summary: currentTopic.summaryLines.join(' ').trim() || undefined,
          concepts: currentTopic.concepts,
        });
      }
      currentTopic = {
        title: line,
        summaryLines: [],
        concepts: [],
      };
    } else if (currentTopic) {
      // Check if this line looks like a bullet or key concept
      if (/^[-*•–—]\s*(.+)/.test(line)) {
        const conceptText = line.replace(/^[-*•–—]\s*/, '').trim();
        if (conceptText.length > 3) {
          currentTopic.concepts.push({
            id: 'c-' + Math.random().toString(36).substring(2, 8),
            text: conceptText,
            completed: false,
          });
        }
      } else {
        currentTopic.summaryLines.push(line);
      }
    }
  }

  if (currentTopic) {
    topics.push({
      title: currentTopic.title,
      summary: currentTopic.summaryLines.join(' ').trim() || undefined,
      concepts: currentTopic.concepts,
    });
  }

  // If no numbered headings were found, fall back to treating each line as a topic
  if (topics.length === 0 && lines.length > 0) {
    return lines.slice(0, 10).map((l, idx) => ({
      title: `${idx + 1}. ${l}`,
      concepts: [],
    }));
  }

  return topics;
}
