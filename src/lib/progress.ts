import { Course, Topic, UserData } from '../types';

/** Work-in-progress limit: at most this many courses on the study board at once. */
export const WIP_LIMIT = 2;

export function topicProgress(topic: Topic): number {
  return topic.status === 'done' ? 100 : topic.progress;
}

/** Course completion = average reading progress of its topics (done topics count as 100%). */
export function courseProgress(topics: Topic[]): number {
  if (topics.length === 0) return 0;
  const total = topics.reduce((sum, t) => sum + topicProgress(t), 0);
  return Math.round(total / topics.length);
}

export function topicsOf(data: UserData, courseId: string): Topic[] {
  return data.topics.filter(t => t.courseId === courseId).sort((a, b) => a.order - b.order);
}

export function isCourseComplete(topics: Topic[]): boolean {
  return topics.length > 0 && topics.every(t => t.status === 'done');
}

export type CourseState = 'empty' | 'not-started' | 'on-board' | 'paused' | 'completed';

export function courseState(data: UserData, course: Course): CourseState {
  const topics = topicsOf(data, course.id);
  if (topics.length === 0) return 'empty';
  if (isCourseComplete(topics)) return 'completed';
  if (data.board.includes(course.id)) return 'on-board';
  return topics.some(t => t.status !== 'course' || t.progress > 0) ? 'paused' : 'not-started';
}

/** The topic to read after `currentId`: another open topic first, then the next unstarted one. */
export function findNextTopic(courseTopics: Topic[], currentId: string): Topic | undefined {
  const others = courseTopics.filter(t => t.id !== currentId);
  return others.find(t => t.status === 'in-process') || others.find(t => t.status === 'course');
}

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
