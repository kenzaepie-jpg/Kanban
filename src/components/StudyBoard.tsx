import { DragEvent, useState } from 'react';
import { BellRing, BookOpen, CheckCircle2, Clock, FileText, Info, Lock, Play, Plus, RotateCcw, Square } from 'lucide-react';
import { Course, Topic, TopicStatus, UserData } from '../types';
import { BREAK_AFTER_SECONDS } from '../lib/useStudyClock';
import { WIP_LIMIT, courseProgress, formatDuration, topicsOf } from '../lib/progress';
import { btnPrimary, cardCls } from '../lib/ui';
import { ProgressBar } from './common';

interface StudyBoardProps {
  data: UserData;
  sessionSeconds: number;
  onMoveTopic: (topicId: string, status: TopicStatus) => void;
  onOpenReader: (topicId: string) => void;
  onBeginStudy: () => void;
  onEndSession: (courseId: string) => void;
}

const COLUMNS: { status: TopicStatus; title: string; hint: string }[] = [
  { status: 'course', title: 'Course', hint: 'Topics waiting to be studied' },
  { status: 'in-process', title: 'In Process', hint: 'What you are reading now' },
  { status: 'done', title: 'Done', hint: 'Finished topics' },
];

export function StudyBoard({ data, sessionSeconds, onMoveTopic, onOpenReader, onBeginStudy, onEndSession }: StudyBoardProps) {
  const courses = data.board.map(id => data.courses.find(c => c.id === id)).filter((c): c is Course => !!c);
  const freeSlots = WIP_LIMIT - courses.length;
  const breakIn = Math.max(0, BREAK_AFTER_SECONDS - sessionSeconds);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Study Board</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            WIP limit: {WIP_LIMIT} course{WIP_LIMIT === 1 ? '' : 's'} at a time. Finish it, or end the session to switch course.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Session {formatDuration(sessionSeconds)}
          </span>
          {data.settings.breakReminder && (
            <span className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <BellRing className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Break in {Math.ceil(breakIn / 60)} min
            </span>
          )}
          <span className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 font-bold text-white">
            {courses.length}/{WIP_LIMIT} course{WIP_LIMIT === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {courses.length === 0 && (
        <div className={`${cardCls} flex flex-col items-center px-6 py-16 text-center`}>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <BookOpen className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Your study board is empty</h2>
          <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Choose a course to put on the board. Its topics start in the Course column.
          </p>
          <button onClick={onBeginStudy} className={`${btnPrimary} mt-6`}>
            <Play className="h-4 w-4 fill-current" /> Begin Study
          </button>
        </div>
      )}

      {courses.map(course => (
        <CourseLane
          key={course.id}
          course={course}
          topics={topicsOf(data, course.id)}
          onMoveTopic={onMoveTopic}
          onOpenReader={onOpenReader}
          onEndSession={onEndSession}
        />
      ))}

      {courses.length > 0 && freeSlots > 0 && (
        <button
          onClick={onBeginStudy}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 py-8 text-sm font-semibold text-slate-500 transition-colors hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-blue-300"
        >
          <Plus className="h-5 w-5" /> {freeSlots} free slot{freeSlots === 1 ? '' : 's'}: add another course
        </button>
      )}

      {courses.length >= WIP_LIMIT && (
        <p className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Lock className="h-4 w-4" /> Finish this course to unlock the next one, or end the session if your priorities change.
        </p>
      )}
    </div>
  );
}

interface CourseLaneProps {
  course: Course;
  topics: Topic[];
  onMoveTopic: (topicId: string, status: TopicStatus) => void;
  onOpenReader: (topicId: string) => void;
  onEndSession: (courseId: string) => void;
}

function CourseLane({ course, topics, onMoveTopic, onOpenReader, onEndSession }: CourseLaneProps) {
  const [dragOver, setDragOver] = useState<TopicStatus | null>(null);
  const pct = courseProgress(topics);
  const done = topics.filter(t => t.status === 'done').length;

  const handleDrop = (e: DragEvent, status: TopicStatus) => {
    e.preventDefault();
    setDragOver(null);
    const topicId = e.dataTransfer.getData('text/topic-id');
    // Only accept topics from this course's lane
    const topic = topics.find(t => t.id === topicId);
    if (topic && topic.status !== status) onMoveTopic(topic.id, status);
  };

  return (
    <section className={`${cardCls} overflow-hidden`}>
      <div className="h-1.5" style={{ backgroundColor: course.color }} />
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div className="min-w-0">
          <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">{course.code || 'COURSE'}</span>
          <h2 className="truncate text-lg font-bold text-slate-900 dark:text-white">{course.title}</h2>
        </div>
        <div className="flex w-full items-center gap-4 sm:w-auto">
          <div className="flex-1 sm:w-72">
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">{done}/{topics.length} topics done</span>
              <span className="text-sm font-black text-blue-700 dark:text-blue-300">{pct}%</span>
            </div>
            <ProgressBar value={pct} color={course.color} className="h-2.5" />
          </div>
          <button
            onClick={() => onEndSession(course.id)}
            title="Stop studying this course for now (progress is kept)"
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-900 dark:hover:bg-red-950/40 dark:hover:text-red-400"
          >
            <Square className="h-3 w-3 fill-current" /> End session
          </button>
        </div>
      </div>

      <div className="grid gap-4 bg-slate-50/70 p-4 md:grid-cols-3 dark:bg-slate-950/40">
        {COLUMNS.map(col => {
          const items = topics.filter(t => t.status === col.status);
          return (
            <div
              key={col.status}
              onDragOver={e => {
                e.preventDefault();
                setDragOver(col.status);
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(e, col.status)}
              className={`flex min-h-[160px] flex-col rounded-xl border-2 p-3 transition-colors ${
                dragOver === col.status ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30' : 'border-transparent'
              }`}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div>
                  <h3 className="text-xs font-black tracking-widest text-slate-700 uppercase dark:text-slate-200">{col.title}</h3>
                  <p className="text-[11px] text-slate-400">{col.hint}</p>
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-300">
                  {items.length}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2.5">
                {items.map(topic => (
                  <TopicCard key={topic.id} topic={topic} color={course.color} onMove={onMoveTopic} onOpen={onOpenReader} />
                ))}
                {items.length === 0 && (
                  <p className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400 dark:border-slate-800">
                    {col.status === 'done' ? 'Finished topics land here' : 'Drop a topic here'}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

interface TopicCardProps {
  topic: Topic;
  color: string;
  onMove: (topicId: string, status: TopicStatus) => void;
  onOpen: (topicId: string) => void;
}

function TopicCard({ topic, color, onMove, onOpen }: TopicCardProps) {
  const smallBtn = 'inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors';

  return (
    <article
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('text/topic-id', topic.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      className="animate-pop-in cursor-grab rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs transition-shadow hover:shadow-md active:cursor-grabbing dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-start gap-2">
        {topic.status === 'done' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />}
        <h4 className={`text-sm font-semibold ${topic.status === 'done' ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
          {topic.title}
        </h4>
      </div>
      {topic.document && (
        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-400">
          <FileText className="h-3 w-3 shrink-0" />
          <span className="truncate">{topic.document.name}</span>
        </p>
      )}

      {topic.status === 'in-process' && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">Reading</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">{topic.progress}%</span>
          </div>
          <ProgressBar value={topic.progress} color={color} className="h-1.5" />
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {topic.status === 'course' && (
          <button onClick={() => { onMove(topic.id, 'in-process'); onOpen(topic.id); }} className={`${smallBtn} bg-blue-600 text-white hover:bg-blue-700`}>
            <Play className="h-3 w-3 fill-current" /> Start
          </button>
        )}
        {topic.status === 'in-process' && (
          <>
            <button onClick={() => onOpen(topic.id)} className={`${smallBtn} bg-blue-600 text-white hover:bg-blue-700`}>
              <BookOpen className="h-3 w-3" /> Continue
            </button>
            <button
              onClick={() => onMove(topic.id, 'done')}
              disabled={topic.progress < 100}
              title={topic.progress < 100 ? 'Read the topic to 100% to mark it done' : undefined}
              className={`${smallBtn} bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:bg-emerald-950/40 dark:text-emerald-300 dark:disabled:bg-slate-800 dark:disabled:text-slate-500`}
            >
              <CheckCircle2 className="h-3 w-3" /> Done
            </button>
          </>
        )}
        {topic.status === 'done' && (
          <>
            <button onClick={() => onOpen(topic.id)} className={`${smallBtn} bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300`}>
              <BookOpen className="h-3 w-3" /> Review
            </button>
            <button onClick={() => onMove(topic.id, 'in-process')} className={`${smallBtn} text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800`}>
              <RotateCcw className="h-3 w-3" /> Reopen
            </button>
          </>
        )}
        {topic.secondsStudied >= 60 && (
          <span className="ml-auto flex items-center gap-1 self-center text-[11px] text-slate-400">
            <Clock className="h-3 w-3" /> {Math.round(topic.secondsStudied / 60)}m
          </span>
        )}
      </div>
    </article>
  );
}
