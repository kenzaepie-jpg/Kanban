export type KanbanStatus = 'not-done' | 'in-progress' | 'done';

export type Priority = 'low' | 'medium' | 'high';

export interface DocumentAttachment {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'text' | 'markdown';
  size?: number;
  url?: string; // Blob URL or base64 or sample URL
  content?: string; // Raw text or parsed HTML
  pageCount?: number;
}

export interface KeyConcept {
  id: string;
  text: string;
  completed: boolean;
}

export interface Topic {
  id: string;
  courseId: string;
  title: string;
  order: number;
  status: KanbanStatus;
  priority: Priority;
  estimatedMinutes: number;
  document?: DocumentAttachment;
  summary?: string;
  keyConcepts: KeyConcept[];
  personalNotes: string;
  confidenceScore: number; // 0-5
  lastStudiedAt?: string;
  completedAt?: string;
}

export interface Course {
  id: string;
  title: string;
  code: string; // e.g. "BIO-101", "CS-401"
  description: string;
  examDate: string; // ISO date string e.g. "2026-10-10"
  color: string;
  createdAt: string;
}
