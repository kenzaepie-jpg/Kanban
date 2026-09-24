/** Kanban columns on the study board: COURSE (not started) → IN PROCESS → DONE. */
export type TopicStatus = 'course' | 'in-process' | 'done';

export type DocType = 'pdf' | 'docx' | 'text' | 'markdown';

/** Lightweight file info kept on the topic; the file itself lives in IndexedDB. */
export interface DocumentMeta {
  id: string;
  name: string;
  type: DocType;
  size: number;
}

/** What is saved in IndexedDB: PDFs keep their Blob, everything else is rendered HTML. */
export interface StoredDocument extends DocumentMeta {
  blob?: Blob;
  html?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  level: string;
  createdAt: string;
}

export interface StoredUser extends User {
  passwordHash: string;
  salt: string;
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
  /** Course ids currently on the study board, limited by WIP_LIMIT. */
  board: string[];
  settings: Settings;
}
