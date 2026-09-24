import { FormEvent, useState } from 'react';
import { CheckCircle2, Columns3, FileText, Lock, Play, RotateCcw, Trash2 } from 'lucide-react';
import { Course, UserData } from '../types';
import { WIP_LIMIT, courseProgress, courseState, topicsOf } from '../lib/progress';
import { parseTitleLines } from '../lib/topics';
import { COURSE_COLORS, btnDanger, btnPrimary, btnSecondary, inputCls, labelCls } from '../lib/ui';
import { FileDrop, Modal, ProgressBar } from './common';

export interface NewTopicsInput {
  files: File[];
  titles: string[];
}

/* ------------------------------------------------------------------ */
/* Add course                                                          */
/* ------------------------------------------------------------------ */

interface AddCourseModalProps {
  onClose: () => void;
  /** Resolves true once the course is saved. */
  onCreate: (course: Pick<Course, 'title' | 'code' | 'color'>, topics: NewTopicsInput) => Promise<boolean>;
}

export function AddCourseModal({ onClose, onCreate }: AddCourseModalProps) {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState(COURSE_COLORS[0]);
  const [files, setFiles] = useState<File[]>([]);
  const [titlesText, setTitlesText] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      const created = await onCreate(
        { title: title.trim(), code: code.trim().toUpperCase(), color },
        { files, titles: parseTitleLines(titlesText) },
      );
      if (created) onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Add a course"
      subtitle="Upload the course's topics. You can add more later."
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className={btnSecondary}>Cancel</button>
          <button type="submit" form="add-course-form" disabled={busy || !title.trim()} className={btnPrimary}>
            {busy ? 'Uploading…' : 'Create course'}
          </button>
        </>
      }
    >
      <form id="add-course-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <div>
            <label htmlFor="course-title" className={labelCls}>Course title</label>
            <input id="course-title" className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Software Engineering" autoFocus required />
          </div>
          <div>
            <label htmlFor="course-code" className={labelCls}>Code</label>
            <input id="course-code" className={inputCls} value={code} onChange={e => setCode(e.target.value)} placeholder="SWE-301" />
          </div>
        </div>

        <div>
          <span className={labelCls}>Colour</span>
          <div className="flex flex-wrap gap-2">
            {COURSE_COLORS.map(c => (
              <button
                key={c}
                type="button"
                aria-label={`Colour ${c}`}
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-full ring-offset-2 transition-transform hover:scale-110 dark:ring-offset-slate-900 ${color === c ? 'ring-2 ring-slate-900 dark:ring-white' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div>
          <span className={labelCls}>Topic files</span>
          <FileDrop files={files} onChange={setFiles} />
        </div>

        <div>
          <label htmlFor="course-topics" className={labelCls}>
            Topics without files <span className="font-normal text-slate-400">(optional, one per line)</span>
          </label>
          <textarea
            id="course-topics"
            rows={3}
            className={inputCls}
            value={titlesText}
            onChange={e => setTitlesText(e.target.value)}
            placeholder={'Chapter 1: Introduction\nChapter 2: Requirements'}
          />
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Manage course                                                       */
/* ------------------------------------------------------------------ */

interface ManageCourseModalProps {
  course: Course;
  data: UserData;
  onClose: () => void;
  onAddTopics: (courseId: string, topics: NewTopicsInput) => Promise<boolean>;
  onDeleteTopic: (topicId: string) => void;
  onDeleteCourse: (courseId: string) => void;
  onRestartCourse: (courseId: string) => void;
}

const STATUS_LABEL = { course: 'To study', 'in-process': 'In process', done: 'Done' } as const;

export function ManageCourseModal({ course, data, onClose, onAddTopics, onDeleteTopic, onDeleteCourse, onRestartCourse }: ManageCourseModalProps) {
  const topics = topicsOf(data, course.id);
  const state = courseState(data, course);
  const [files, setFiles] = useState<File[]>([]);
  const [titlesText, setTitlesText] = useState('');
  const [busy, setBusy] = useState(false);

  const titles = parseTitleLines(titlesText);

  const handleAdd = async () => {
    setBusy(true);
    try {
      if (await onAddTopics(course.id, { files, titles })) {
        setFiles([]);
        setTitlesText('');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={course.title} subtitle={`${course.code || 'Course'} · ${courseProgress(topics)}% complete`} onClose={onClose} size="lg">
      <div className="space-y-6">
        <section>
          <h3 className="mb-2 text-sm font-bold text-slate-900 dark:text-white">Topics ({topics.length})</h3>
          {topics.length === 0 ? (
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              No topics yet. Upload files below to add them.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
              {topics.map((t, i) => (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-5 text-xs font-bold text-slate-400">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{t.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <ProgressBar value={t.status === 'done' ? 100 : t.progress} className="h-1 max-w-[120px]" color={course.color} />
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{STATUS_LABEL[t.status]}</span>
                      {t.document && (
                        <span className="flex min-w-0 items-center gap-1 text-[11px] text-slate-400">
                          <FileText className="h-3 w-3 shrink-0" />
                          <span className="truncate">{t.document.name}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteTopic(t.id)}
                    aria-label={`Delete ${t.title}`}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add topics</h3>
          <FileDrop files={files} onChange={setFiles} />
          <textarea
            rows={2}
            className={inputCls}
            value={titlesText}
            onChange={e => setTitlesText(e.target.value)}
            placeholder="Or type topic titles, one per line"
            aria-label="Topic titles"
          />
          <button onClick={handleAdd} disabled={busy || (files.length === 0 && titles.length === 0)} className={btnPrimary}>
            {busy ? 'Uploading…' : `Add ${files.length + titles.length || ''} topic${files.length + titles.length === 1 ? '' : 's'}`}
          </button>
        </section>

        <section className="flex flex-wrap gap-2 border-t border-slate-100 pt-5 dark:border-slate-800">
          {state === 'completed' && (
            <button onClick={() => onRestartCourse(course.id)} className={btnSecondary}>
              <RotateCcw className="h-4 w-4" /> Study again (reset progress)
            </button>
          )}
          <button
            onClick={() => {
              if (window.confirm(`Delete "${course.title}" and all its topics? This cannot be undone.`)) onDeleteCourse(course.id);
            }}
            className={btnDanger}
          >
            <Trash2 className="h-4 w-4" /> Delete course
          </button>
        </section>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Begin study: pick a course for the study board                      */
/* ------------------------------------------------------------------ */

interface BeginStudyModalProps {
  data: UserData;
  onClose: () => void;
  onStudy: (courseId: string) => void;
  onAddCourse: () => void;
}

export function BeginStudyModal({ data, onClose, onStudy, onAddCourse }: BeginStudyModalProps) {
  const boardFull = data.board.length >= WIP_LIMIT;
  const boardNames = data.board.map(id => data.courses.find(c => c.id === id)?.title).filter(Boolean);

  return (
    <Modal title="Begin study" subtitle="Choose the course you want to study right now." onClose={onClose}>
      <div className={`mb-4 flex gap-3 rounded-xl px-4 py-3 text-sm ${boardFull ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200' : 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200'}`}>
        <Columns3 className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          <strong>Study board: {data.board.length}/{WIP_LIMIT} courses.</strong>{' '}
          {boardFull
            ? `Finish all topics in ${boardNames.join(' or ')} before starting a new course.`
            : 'You can study at most 2 courses at a time.'}
        </p>
      </div>

      {data.courses.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">You have no courses yet.</p>
          <button onClick={onAddCourse} className={`${btnPrimary} mt-4`}>Add a course</button>
        </div>
      ) : (
        <ul className="space-y-2">
          {data.courses.map(course => {
            const state = courseState(data, course);
            const pct = courseProgress(topicsOf(data, course.id));
            const blocked = state === 'empty' || state === 'completed' || (boardFull && state !== 'on-board');
            const reason =
              state === 'empty' ? 'Add topics first'
              : state === 'completed' ? 'Completed'
              : state === 'on-board' ? 'On your board'
              : boardFull ? 'Board full' : `${pct}% done`;

            return (
              <li key={course.id}>
                <button
                  disabled={blocked}
                  onClick={() => onStudy(course.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left transition-colors enabled:hover:border-blue-400 enabled:hover:bg-blue-50/60 disabled:opacity-55 dark:border-slate-800 dark:enabled:hover:bg-slate-800"
                >
                  <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: course.color }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{course.title}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{course.code || 'Course'} · {reason}</span>
                  </span>
                  {state === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : blocked ? (
                    <Lock className="h-4 w-4 text-slate-400" />
                  ) : (
                    <Play className="h-4 w-4 fill-blue-600 text-blue-600 dark:fill-blue-400 dark:text-blue-400" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
