import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, FileText, Loader2, Paperclip, StickyNote } from 'lucide-react';
import { Course, Topic } from '../types';
import { apiBlob } from '../lib/api';
import { ACCEPTED_FILES, RenderedDocument, renderDocument } from '../lib/fileParser';
import { courseProgress, findNextTopic, formatDuration } from '../lib/progress';
import { useStudyClock } from '../lib/useStudyClock';
import { btnPrimary, inputCls } from '../lib/ui';
import { ProgressBar } from './common';
import { PdfPosition, PdfViewer } from './PdfViewer';

/** Pages per slide group in the side panel (5 of 25 pages = 20%). */
const PAGES_PER_GROUP = 5;

interface ReaderModalProps {
  topic: Topic;
  course: Course;
  courseTopics: Topic[];
  /** Pauses the topic timer, e.g. while the break reminder is showing. */
  paused: boolean;
  onClose: () => void;
  onUpdate: (topicId: string, patch: Partial<Pick<Topic, 'progress' | 'notes'>>) => void;
  onAddStudyTime: (topicId: string, seconds: number) => void;
  onMarkDone: (topicId: string) => void;
  onAttachFile: (topicId: string, file: File) => void;
}

export function ReaderModal({ topic, course, courseTopics, paused, onClose, onUpdate, onAddStudyTime, onMarkDone, onAttachFile }: ReaderModalProps) {
  const [doc, setDoc] = useState<RenderedDocument | null | undefined>(undefined); // undefined = loading
  const [loadError, setLoadError] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfPos, setPdfPos] = useState<PdfPosition | null>(null);
  // If PDF.js can't draw a PDF, fall back to the browser's own viewer (manual progress)
  const [pdfFallback, setPdfFallback] = useState(false);
  const [notes, setNotes] = useState(topic.notes);
  const scrollRef = useRef<HTMLDivElement>(null);
  const attachRef = useRef<HTMLInputElement>(null);

  const [seconds, setSeconds] = useStudyClock(!paused);
  const progressRef = useRef(topic.progress);
  progressRef.current = topic.progress;
  // PDFs reopen on the page matching saved progress (finished topics start from page 1 for review)
  const startProgressRef = useRef(0);

  // Download the topic's file from the server
  const fileKey = topic.document ? `${topic.document.name}:${topic.document.size}` : '';
  useEffect(() => {
    setNotes(topic.notes);
    setLoadError('');
    setPdfPos(null);
    setPdfFallback(false);
    startProgressRef.current = topic.status === 'done' ? 0 : topic.progress;
    const type = topic.document?.type;
    if (!type) {
      setDoc(null);
      return;
    }
    let cancelled = false;
    setDoc(undefined);
    apiBlob(`/api/topics/${topic.id}/file`)
      .then(blob => renderDocument(blob, type))
      .then(d => !cancelled && setDoc(d))
      .catch(err => {
        if (cancelled) return;
        setDoc(null);
        setLoadError(err instanceof Error ? err.message : 'Could not load this file.');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic.id, fileKey]);

  // Fallback PDF viewer uses a temporary blob URL
  useEffect(() => {
    if (doc?.kind !== 'pdf' || !pdfFallback) {
      setPdfUrl(null);
      return;
    }
    const url = URL.createObjectURL(doc.blob);
    setPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [doc, pdfFallback]);

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
    if (!el || doc?.kind !== 'html') return;
    const scrollable = el.scrollHeight - el.clientHeight;
    const pct = scrollable <= 8 ? 100 : Math.min(100, Math.round((el.scrollTop / scrollable) * 100));
    if (pct > progressRef.current) onUpdate(topic.id, { progress: pct });
  };

  // A document short enough to fit on screen counts as fully read once shown
  useEffect(() => {
    if (doc?.kind === 'html') requestAnimationFrame(trackScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc]);

  // PDF progress = furthest page looked at / total pages
  const handlePdfPosition = (pos: PdfPosition) => {
    setPdfPos(pos);
    const pct = Math.round((pos.furthest / pos.total) * 100);
    if (pct > progressRef.current && topic.status !== 'done') onUpdate(topic.id, { progress: pct });
  };

  const next = findNextTopic(courseTopics, topic.id);
  const isDone = topic.status === 'done';
  const readToEnd = topic.progress >= 100;
  // Files the reader tracks by itself; the manual slider is only for topics it can't track
  const autoTracked = doc?.kind === 'html' || (doc?.kind === 'pdf' && !pdfFallback);
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
            <button
              onClick={() => onMarkDone(topic.id)}
              disabled={!readToEnd}
              title={readToEnd ? undefined : `Read to the end to unlock (${topic.progress}% read)`}
              className={`${btnPrimary} px-3 sm:px-4 disabled:bg-slate-100 disabled:text-slate-500 disabled:opacity-100 disabled:shadow-none disabled:ring-1 disabled:ring-slate-200 dark:disabled:bg-slate-800 dark:disabled:text-slate-400 dark:disabled:ring-slate-700`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">
                {!readToEnd ? `Read to the end · ${topic.progress}%` : next ? 'Done, next topic' : 'Finish course'}
              </span>
              <span className="sm:hidden">{readToEnd ? 'Done' : `${topic.progress}%`}</span>
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
          ) : doc?.kind === 'pdf' && !pdfFallback ? (
            <PdfViewer
              blob={doc.blob}
              scrollRoot={scrollRef}
              startProgress={startProgressRef.current}
              onPosition={handlePdfPosition}
              onError={() => setPdfFallback(true)}
            />
          ) : pdfUrl ? (
            <iframe src={pdfUrl} title={topic.document?.name} className="h-full min-h-[60vh] w-full bg-white" />
          ) : doc?.kind === 'html' ? (
            <article className="doc-content mx-auto max-w-3xl px-5 py-8 sm:px-10 sm:py-12" dangerouslySetInnerHTML={{ __html: doc.html }} />
          ) : (
            <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <FileText className="h-7 w-7" />
              </div>
              <h2 className="mt-4 font-bold text-slate-900 dark:text-white">No file for this topic</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {loadError ? `${loadError} ` : ''}
                Attach a file, or study from your own materials and set your progress with the slider.
              </p>
              <button onClick={() => attachRef.current?.click()} className={`${btnPrimary} mt-5`}>
                <Paperclip className="h-4 w-4" /> Attach a file
              </button>
              <input
                ref={attachRef}
                type="file"
                accept={ACCEPTED_FILES}
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) onAttachFile(topic.id, file);
                  e.target.value = '';
                }}
              />
            </div>
          )}
        </div>

        {/* Side panel */}
        <aside className="max-h-[38vh] shrink-0 space-y-6 overflow-y-auto border-t border-slate-200 bg-white p-5 lg:max-h-none lg:w-80 lg:border-t-0 lg:border-l dark:border-slate-800 dark:bg-slate-900">
          <section>
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Reading progress</h2>
              <span className="text-2xl font-black text-blue-700 dark:text-blue-300">{isDone ? 100 : topic.progress}%</span>
            </div>
            {!autoTracked && !isDone && doc !== undefined && (
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={isDone ? 100 : topic.progress}
              disabled={isDone}
              onChange={e => onUpdate(topic.id, { progress: Number(e.target.value) })}
              className="mt-3 w-full accent-blue-600"
              aria-label="Reading progress"
            />
            )}
            {autoTracked && !isDone && <ProgressBar value={topic.progress} color={course.color} className="mt-3 h-2.5" />}
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {isDone
                ? 'You finished this topic.'
                : autoTracked
                  ? 'Tracks automatically as you read. Reach the end (100%) to mark this topic done.'
                  : 'Set your progress with the slider as you study. Reach 100% to mark this topic done.'}
            </p>
            {pdfPos && <SlideGroups pos={pdfPos} progress={isDone ? 100 : topic.progress} color={course.color} />}
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

/** "Page 7 of 25" plus 5-page slide groups that fill in as the student reads. */
function SlideGroups({ pos, progress, color }: { pos: PdfPosition; progress: number; color: string }) {
  const pagesRead = Math.round((progress / 100) * pos.total);
  const groups: { from: number; to: number }[] = [];
  for (let from = 1; from <= pos.total; from += PAGES_PER_GROUP) {
    groups.push({ from, to: Math.min(from + PAGES_PER_GROUP - 1, pos.total) });
  }

  return (
    <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
      <p className="flex justify-between text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-200">Page {pos.page} of {pos.total}</span>
        <span className="text-slate-500 dark:text-slate-400">{pagesRead} read</span>
      </p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {groups.map(g => {
          const done = pagesRead >= g.to;
          const current = pos.page >= g.from && pos.page <= g.to;
          return (
            <span
              key={g.from}
              title={`Pages ${g.from}-${g.to}`}
              className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                done ? 'text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700'
              } ${current ? 'outline-2 outline-offset-1 outline-blue-500' : ''}`}
              style={done ? { backgroundColor: color } : undefined}
            >
              {g.from === g.to ? g.from : `${g.from}–${g.to}`}
            </span>
          );
        })}
      </div>
    </div>
  );
}
