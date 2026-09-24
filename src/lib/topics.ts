import { StoredDocument, Topic } from '../types';
import { saveDocument } from './fileStore';
import { parseFile, titleFromFileName } from './fileParser';
import { newId } from './storage';

export function makeTopic(courseId: string, title: string, order: number, doc?: StoredDocument): Topic {
  return {
    id: newId('topic'),
    courseId,
    title,
    order,
    status: 'course',
    progress: 0,
    document: doc ? { id: doc.id, name: doc.name, type: doc.type, size: doc.size } : undefined,
    notes: '',
    secondsStudied: 0,
  };
}

export function nextOrder(topics: Topic[], courseId: string): number {
  return topics.filter(t => t.courseId === courseId).reduce((max, t) => Math.max(max, t.order), 0) + 1;
}

/**
 * Turns uploaded files (one topic per file) and typed titles (one topic per line)
 * into topics. Files that can't be read are reported in `errors` instead of failing the batch.
 */
export async function buildTopics(
  courseId: string,
  startOrder: number,
  files: File[],
  titles: string[],
): Promise<{ topics: Topic[]; errors: string[] }> {
  const topics: Topic[] = [];
  const errors: string[] = [];
  let order = startOrder;

  for (const file of files) {
    try {
      const doc = await parseFile(file);
      await saveDocument(doc);
      topics.push(makeTopic(courseId, titleFromFileName(file.name), order++, doc));
    } catch (err) {
      errors.push(err instanceof Error ? err.message : `${file.name}: could not be read`);
    }
  }
  for (const title of titles) {
    topics.push(makeTopic(courseId, title, order++));
  }
  return { topics, errors };
}

export function parseTitleLines(text: string): string[] {
  return text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
}
