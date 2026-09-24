import { ReactNode } from 'react';
import { BellRing, BookOpen, CheckCircle2, Clock, GraduationCap, Mail, Play, Plus, Settings2, Sparkles, Trophy } from 'lucide-react';
import { Course, User, UserData } from '../types';
import { CourseState, WIP_LIMIT, courseProgress, courseState, formatDuration, topicsOf } from '../lib/progress';
import { btnPrimary, btnSecondary, cardCls } from '../lib/ui';
import { ProgressBar } from './common';

interface DashboardProps {
  user: User;
  data: UserData;
  onBeginStudy: () => void;
  onStudyCourse: (courseId: string) => void;
  onAddCourse: () => void;
  onManageCourse: (courseId: string) => void;
  onLoadSample: () => void;
  onToggleBreakReminder: () => void;
}

const STATE_BADGE: Record<CourseState, { label: string; cls: string }> = {
  empty: { label: 'No topics yet', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  'not-started': { label: 'Not started', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  'on-board': { label: 'On study board', cls: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' },
  paused: { label: 'Paused', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
  completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
};

export function Dashboard(props: DashboardProps) {
  const { user, data, onBeginStudy, onAddCourse, onLoadSample } = props;
  const firstName = user.name.split(' ')[0];

  const completedCourses = data.courses.filter(c => courseState(data, c) === 'completed').length;
  const topicsDone = data.topics.filter(t => t.status === 'done').length;
  const totalSeconds = data.topics.reduce((sum, t) => sum + t.secondsStudied, 0);
  const studying = data.board.map(id => data.courses.find(c => c.id === id)?.title).filter(Boolean).join(' and ');

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-white shadow-lg shadow-blue-600/20 sm:p-8">
        <div className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-white/10" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-100">Welcome back,</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">{firstName} 👋</h1>
            <p className="mt-2 max-w-lg text-sm text-blue-100">
              {data.board.length === 0
                ? 'Pick a course and begin a focused study session.'
                : data.board.length < WIP_LIMIT
                  ? `You are studying ${studying}. You can add another course.`
                  : `You are studying ${studying}. Finish it, or end the session to switch course.`}
            </p>
          </div>
          <button
            onClick={onBeginStudy}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-blue-700 shadow-sm transition-transform hover:scale-[1.03] md:self-auto"
          >
            <Play className="h-4 w-4 fill-current" />
            Begin Study
          </button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Profile */}
        <aside className="space-y-6">
          <section className={`${cardCls} p-6`}>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-black text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-slate-900 dark:text-white">{user.name}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Student</p>
              </div>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <dt className="sr-only">Email</dt>
                <dd className="truncate">{user.email}</dd>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <dt className="sr-only">Level</dt>
                <dd>{user.level}</dd>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <dt className="sr-only">Member since</dt>
                <dd>Member since {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</dd>
              </div>
            </dl>

            <div className="mt-6 grid grid-cols-3 gap-2 border-t border-slate-100 pt-5 text-center dark:border-slate-800">
              <Stat icon={<BookOpen className="h-4 w-4" />} value={data.courses.length} label="Courses" />
              <Stat icon={<CheckCircle2 className="h-4 w-4" />} value={topicsDone} label="Topics done" />
              <Stat icon={<Trophy className="h-4 w-4" />} value={completedCourses} label="Completed" />
            </div>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Clock className="h-3.5 w-3.5" /> {formatDuration(totalSeconds)} total study time
            </p>
          </section>

          <section className={`${cardCls} p-6`}>
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Settings2 className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Preferences
            </h3>
            <label className="mt-4 flex cursor-pointer items-start justify-between gap-4">
              <span>
                <span className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <BellRing className="h-4 w-4" /> Break reminder
                </span>
                <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                  Remind me to take a 5-minute break after 30 minutes of study.
                </span>
              </span>
              <Switch checked={data.settings.breakReminder} onChange={props.onToggleBreakReminder} />
            </label>
          </section>
        </aside>

        {/* COURSES */}
        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-black tracking-widest text-blue-700 uppercase dark:text-blue-400">Courses</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Upload your courses and their topics here.</p>
            </div>
            <button onClick={onAddCourse} className={btnPrimary}>
              <Plus className="h-4 w-4" /> Add course
            </button>
          </div>

          {data.courses.length === 0 ? (
            <div className={`${cardCls} flex flex-col items-center px-6 py-14 text-center`}>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <BookOpen className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">No courses yet</h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                Add a course and upload its topics (PDFs, Word documents or notes). Then press Begin Study.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button onClick={onAddCourse} className={btnPrimary}>
                  <Plus className="h-4 w-4" /> Add your first course
                </button>
                <button onClick={onLoadSample} className={btnSecondary}>
                  Try a sample course
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.courses.map(course => (
                <CourseCard key={course.id} course={course} data={data} onStudy={props.onStudyCourse} onManage={props.onManageCourse} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <div>
      <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400">
        {icon}
        <span className="text-xl font-black text-slate-900 dark:text-white">{value}</span>
      </div>
      <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
    >
      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );
}

interface CourseCardProps {
  course: Course;
  data: UserData;
  onStudy: (id: string) => void;
  onManage: (id: string) => void;
}

function CourseCard({ course, data, onStudy, onManage }: CourseCardProps) {
  const topics = topicsOf(data, course.id);
  const state = courseState(data, course);
  const pct = courseProgress(topics);
  const done = topics.filter(t => t.status === 'done').length;
  const badge = STATE_BADGE[state];

  return (
    <article className={`${cardCls} group flex flex-col overflow-hidden transition-shadow hover:shadow-md`}>
      <div className="h-1.5" style={{ backgroundColor: course.color }} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {course.code || 'COURSE'}
          </span>
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge.cls}`}>{badge.label}</span>
        </div>
        <h3 className="mt-3 line-clamp-2 font-bold text-slate-900 dark:text-white">{course.title}</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {done} of {topics.length} topic{topics.length === 1 ? '' : 's'} done
        </p>

        <div className="mt-auto pt-5">
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="font-medium text-slate-500 dark:text-slate-400">Progress</span>
            <span className="font-bold text-slate-900 dark:text-white">{pct}%</span>
          </div>
          <ProgressBar value={pct} color={course.color} />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => onManage(course.id)} className={`${btnSecondary} px-3 py-2`}>
              Manage
            </button>
            <button
              onClick={() => onStudy(course.id)}
              disabled={state === 'empty' || state === 'completed'}
              title={state === 'empty' ? 'Add topics before studying' : state === 'completed' ? 'Course completed' : undefined}
              className={`${btnPrimary} px-3 py-2`}
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              {state === 'on-board' ? 'Continue' : state === 'paused' ? 'Resume' : 'Study'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
