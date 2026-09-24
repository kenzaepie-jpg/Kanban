/** Kanban columns on the study board: COURSE (not started) → IN PROCESS → DONE. */
export type TopicStatus = 'course' | 'in-process' | 'done';

export type DocType = 'pdf' | 'docx' | 'text' | 'markdown' | 'html';

/** Info about a topic's file; the file itself is stored on the server. */
export interface DocumentMeta {
  name: string;
  type: DocType;
  size: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  level: string;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  code: string;
  color: string;
  createdAt: string;
  completedAt?: string;
}

export interface Topic {
  id: string;
  courseId: string;
  title: string;
  order: number;
  status: TopicStatus;
  /** Reading progress 0–100, tracked while the student reads. */
  progress: number;
  document?: DocumentMeta;
  notes: string;
  secondsStudied: number;
  startedAt?: string;
  completedAt?: string;
}

export interface Settings {
  breakReminder: boolean;
}

/** Everything that belongs to one signed-in student. */
export interface UserData {
  courses: Course[];
  topics: Topic[];
  /** Course ids currently on the study board (being studied), limited by WIP_LIMIT. */
  board: string[];
  settings: Settings;
}
