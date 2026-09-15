import mammoth from 'mammoth';
import { DocumentAttachment, KeyConcept } from '../types';

export async function parseUploadedFile(file: File): Promise<DocumentAttachment> {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || '';

  if (fileExt === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    try {
      const result = await mammoth.convertToHtml({ arrayBuffer });
      return {
        id: 'doc-' + Date.now(),
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
        id: 'doc-' + Date.now(),
        name: file.name,
        type: 'docx',
        size: file.size,
        content: `<pre class="whitespace-pre-wrap font-sans">${textResult.value || 'Word document loaded.'}</pre>`,
      };
    }
  }

  if (fileExt === 'pdf') {
    // Generate an object URL for PDF preview/iframe
    const objectUrl = URL.createObjectURL(file);
    return {
      id: 'doc-' + Date.now(),
      name: file.name,
      type: 'pdf',
      size: file.size,
      url: objectUrl,
      // Provide a clean fallback readable text representation
      content: `<h2>${file.name}</h2><p class="text-slate-600">PDF document loaded successfully. Use the PDF preview viewer on the left or download for external inspection.</p>`,
    };
  }

  if (fileExt === 'txt' || fileExt === 'md') {
    const text = await file.text();
    return {
      id: 'doc-' + Date.now(),
      name: file.name,
      type: fileExt === 'md' ? 'markdown' : 'text',
      size: file.size,
      content: text,
    };
  }

  // Generic fallback
  return {
    id: 'doc-' + Date.now(),
    name: file.name,
    type: 'text',
    size: file.size,
    content: `<p>Uploaded file: ${file.name} (${Math.round(file.size / 1024)} KB)</p>`,
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

  // If regex found fewer than 2 items, fallback to line-by-line if there are separated items
  if (topics.length === 0 && lines.length > 0) {
    return lines.slice(0, 10).map((l, idx) => ({
      title: `${idx + 1}. ${l}`,
      concepts: [],
    }));
  }

  return topics;
}
