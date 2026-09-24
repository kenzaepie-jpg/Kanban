import { Topic } from '../types';

/**
 * Picks the topic to study after `currentId`: the first unfinished topic that comes
 * after it in course order, wrapping around to earlier unfinished topics if needed.
 */
export function findNextTopic(courseTopics: Topic[], currentId: string): Topic | undefined {
  const current = courseTopics.find(t => t.id === currentId);
  const incomplete = courseTopics
    .filter(t => t.id !== currentId && t.status !== 'done')
    .sort((a, b) => a.order - b.order);
  if (!current) return incomplete[0];
  return incomplete.find(t => t.order > current.order) || incomplete[0];
}

/** Next free `order` value for a course (max + 1), so orders stay unique after deletions. */
export function nextOrderForCourse(topics: Topic[], courseId: string): number {
  return topics
    .filter(t => t.courseId === courseId)
    .reduce((max, t) => Math.max(max, t.order), 0) + 1;
}
