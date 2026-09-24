import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, FileText, Loader2, Paperclip, StickyNote } from 'lucide-react';
import { Course, StoredDocument, Topic } from '../types';
import { getDocument, saveDocument } from '../lib/fileStore';
import { ACCEPTED_FILES, parseFile } from '../lib/fileParser';
import { courseProgress, findNextTopic, formatDuration } from '../lib/progress';
import { useStudyClock } from '../lib/useStudyClock';
import { btnPrimary, inputCls } from '../lib/ui';
import { ProgressBar } from './common';

interface ReaderModalProps {
  topic: Topic;
  course: Course;
  courseTopics: Topic[];
  /** Pauses the topic timer, e.g. while the break reminder is showing. */
  paused: boolean;
  onClose: () => void;
  onUpdate: (topicId: string, patch: Partial<Topic>) => void;
  onAddStudyTime: (topicId: string, seconds: number) => void;
  onMarkDone: (topicId: string) => void;
  onError: (message: string) => void;
}

export function ReaderModal({ topic, course, courseTopics, paused, onClose, onUpdate, onAddStudyTime, onMarkDone, onError }: ReaderModalProps) {
  const [doc, setDoc] = useState<StoredDocument | null | undefined>(undefined); // undefined = loading
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState(topic.notes);
  const scrollRef = useRef<HTMLDivElement>(null);
  const attachRef = useRef<HTMLInputElement>(null);

  const [seconds, setSeconds] = useStudyClock(!paused);
  const progressRef = useRef(topic.progress);
  progressRef.current = topic.progress;

  // Load the topic's file from IndexedDB
  useEffect(() => {
    setNotes(topic.notes);
    const docId = topic.document?.id;
    if (!docId) {
      setDoc(null);
      return;
    }
    let cancelled = false;
    setDoc(undefined);
    getDocument(docId)
      .then(d => !cancelled && setDoc(d ?? null))
      .catch(() => !cancelled && setDoc(null));
    return () => {
      cancelled = true;
    };
  }, [topic.id, topic.document?.id]);

  // PDFs are shown from a temporary blob URL
  useEffect(() => {
    if (!doc?.blob) {
      setPdfUrl(null);
      return;
    }
    const url = URL.createObjectURL(doc.blob);
    setPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [doc]);

  // Save time spent on this topic when switching topics or closing the reader
  const secondsRef = useRef(0);
  secondsRef.current = seconds;
  useEffect(() => {
    setSeconds(0);
    const topicId = topic.id;
    return () => {
      if (secondsRef.current > 0) onAddStudyTime(topicId, secondsRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic.id]);

  // Reading progress follows how far down the document the student has scrolled.
  // It only ever moves forward from scrolling; the slider can set it freely.
  const trackScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollable = el.scrollHeight - el.clientHeight;
    const pct = scrollable <= 8 ? 100 : Math.min(100, Math.round((el.scrollTop / scrollable) * 100));
    if (pct > progressRef.current) onUpdate(topic.id, { progress: pct });
  };

  // A document short enough to fit on screen counts as fully read once shown
  useEffect(() => {
    if (doc?.html) requestAnimationFrame(trackScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc]);

  const handleAttach = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = await parseFile(file);
      await saveDocument(parsed);
      onUpdate(topic.id, { document: { id: parsed.id, name: parsed.name, type: parsed.type, size: parsed.size } });
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not read that file.');
    }
  };

  const next = findNextTopic(courseTopics, topic.id);
  const isDone = topic.status === 'done';
  const coursePct = courseProgress(courseTopics);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-slate-950" role="dialog" aria-modal="true" aria-label={`Reading ${topic.title}`}>
      {/* Top bar */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
          <button onClick={onClose} className="flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Board</span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="font-mono">{course.code}</span> · {course.title} · course {coursePct}% complete
            </p>
            <h1 className="truncate text-base font-bold text-slate-900 dark:text-white">{topic.title}</h1>
          </div>
          <span className="hidden items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-sm font-semibold text-slate-700 sm:flex dark:bg-slate-800 dark:text-slate-200">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            {formatDuration(seconds)}
          </span>
          {!isDone && (
            <button onClick={() => onMarkDone(topic.id)} className={`${btnPrimary} px-3 sm:px-4`}>
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">{next ? 'Done, next topic' : 'Finish course'}</span>
              <span className="sm:hidden">Done</span>
            </button>
          )}
        </div>
        <ProgressBar value={isDone ? 100 : topic.progress} color={course.color} className="h-1 rounded-none" />
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Document */}
        <div ref={scrollRef} onScroll={trackScroll} className="min-h-0 flex-1 overflow-y-auto">
          {doc === undefined ? (
            <div className="flex h-full items-center justify-center text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : pdfUrl ? (
            <iframe src={pdfUrl} title={doc?.name} className="h-full min-h-[60vh] w-full bg-white" />
          ) : doc?.html ? (
            <article className="doc-content mx-auto max-w-3xl px-5 py-8 sm:px-10 sm:py-12" dangerouslySetInnerHTML={{ __html: doc.html }} />
          ) : (
            <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <FileText className="h-7 w-7" />
              </div>
              <h2 className="mt-4 font-bold text-slate-900 dark:text-white">No file for this topic</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {topic.document ? 'The file could not be found in this browser. ' : ''}
                Attach a file, or study from your own materials and set your progress with the slider.
              </p>
              <button onClick={() => attachRef.current?.click()} className={`${btnPrimary} mt-5`}>
                <Paperclip className="h-4 w-4" /> Attach a file
              </button>
              <input ref={attachRef} type="file" accept={ACCEPTED_FILES} className="hidden" onChange={e => handleAttach(e.target.files?.[0])} />
            </div>
          )}
        </div>

        {/* Side panel */}
        <aside className="shrink-0 space-y-6 overflow-y-auto border-t border-slate-200 bg-white p-5 lg:w-80 lg:border-t-0 lg:border-l dark:border-slate-800 dark:bg-slate-900">
          <section>
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Reading progress</h2>
              <span className="text-2xl font-black text-blue-700 dark:text-blue-300">{isDone ? 100 : topic.progress}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={isDone ? 100 : topic.progress}
              disabled={isDone}
              onChange={e => onUpdate(topic.id, { progress: Number(e.target.value) })}
              className="mt-3 w-full accent-blue-600"
              aria-label="Reading progress"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {pdfUrl ? 'Drag the slider as you read through the PDF.' : 'Updates automatically as you scroll. You can also set it here.'}
            </p>
          </section>

          <section>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <StickyNote className="h-4 w-4 text-blue-600 dark:text-blue-400" /> My notes
            </h2>
            <textarea
              rows={6}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={() => notes !== topic.notes && onUpdate(topic.id, { notes })}
              placeholder="Key points, questions for your lecturer…"
              className={inputCls}
            />
          </section>

          <section>
            <h2 className="mb-2 text-sm font-bold text-slate-900 dark:text-white">Topics in this course</h2>
            <ol className="space-y-1">
              {courseTopics.map(t => (
                <li
                  key={t.id}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm ${
                    t.id === topic.id ? 'bg-blue-50 font-semibold text-blue-800 dark:bg-blue-950/50 dark:text-blue-200' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t.status === 'done' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <span className={`h-2 w-2 shrink-0 rounded-full ${t.status === 'in-process' ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  )}
                  <span className="truncate">{t.title}</span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
