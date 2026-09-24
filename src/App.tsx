import { useCallback, useEffect, useRef, useState } from 'react';
import { Course, Topic, TopicStatus, User, UserData } from './types';
import { currentUser, logout } from './lib/auth';
import { deleteDocuments } from './lib/fileStore';
import { WIP_LIMIT, courseState, findNextTopic, isCourseComplete, topicsOf } from './lib/progress';
import { createSampleCourse } from './lib/sampleCourse';
import { newId, readJSON, writeJSON } from './lib/storage';
import { Theme, useTheme } from './lib/theme';
import { buildTopics, nextOrder } from './lib/topics';
import { BREAK_AFTER_SECONDS, BREAK_LENGTH_SECONDS, useStudyClock } from './lib/useStudyClock';
import { AuthPage } from './components/AuthPage';
import { BreakModal } from './components/BreakModal';
import { CompletionModal } from './components/CompletionModal';
import { AddCourseModal, BeginStudyModal, ManageCourseModal, NewTopicsInput } from './components/CourseModals';
import { Dashboard } from './components/Dashboard';
import { Header, View } from './components/Header';
import { ReaderModal } from './components/ReaderModal';
import { StudyBoard } from './components/StudyBoard';
import { Toast, ToastData } from './components/common';

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const [user, setUser] = useState<User | null>(currentUser);

  if (!user) {
    return <AuthPage onAuthenticated={setUser} theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
    <Workspace
      key={user.id}
      user={user}
      theme={theme}
      onToggleTheme={toggleTheme}
      onLogout={() => {
        logout();
        setUser(null);
      }}
    />
  );
}

const EMPTY_DATA: UserData = { courses: [], topics: [], board: [], settings: { breakReminder: true } };

const dataKey = (userId: string) => `gostudy_data_${userId}`;

function loadData(userId: string): UserData {
  const saved = readJSON<Partial<UserData>>(dataKey(userId), {});
  return { ...EMPTY_DATA, ...saved, settings: { ...EMPTY_DATA.settings, ...saved.settings } };
}

interface WorkspaceProps {
  user: User;
  theme: Theme;
  onToggleTheme: () => void;
  onLogout: () => void;
}

function Workspace({ user, theme, onToggleTheme, onLogout }: WorkspaceProps) {
  const [data, setData] = useState<UserData>(() => loadData(user.id));
  const [view, setView] = useState<View>(() => (loadData(user.id).board.length > 0 ? 'board' : 'dashboard'));

  const [modal, setModal] = useState<'add-course' | 'begin-study' | null>(null);
  const [managedCourseId, setManagedCourseId] = useState<string | null>(null);
  const [readerTopicId, setReaderTopicId] = useState<string | null>(null);
  const [completedCourseId, setCompletedCourseId] = useState<string | null>(null);

  const [toast, setToast] = useState<ToastData | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const notify = useCallback((text: string, tone: ToastData['tone'] = 'info') => {
    setToast({ id: Date.now(), text, tone });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  // Persist this student's data
  useEffect(() => {
    if (!writeJSON(dataKey(user.id), data)) {
      notify('Could not save your progress: browser storage is full or blocked.', 'error');
    }
  }, [data, user.id, notify]);

  // A course whose topics are all done leaves the board and frees its WIP slot
  useEffect(() => {
    const finished = data.board.filter(id => isCourseComplete(topicsOf(data, id)));
    if (finished.length === 0) return;
    const completedAt = new Date().toISOString();
    setData(d => ({
      ...d,
      board: d.board.filter(id => !finished.includes(id)),
      courses: d.courses.map(c => (finished.includes(c.id) ? { ...c, completedAt } : c)),
    }));
    setReaderTopicId(null);
    setCompletedCourseId(finished[0]);
  }, [data]);

  /* ---------------- Break reminder ---------------- */

  const [breakEndsAt, setBreakEndsAt] = useState<number | null>(null);
  const [breakPrompt, setBreakPrompt] = useState(false);
  // The session clock only runs on the study board, and pauses while a break is suggested or running
  const [sessionSeconds, setSessionSeconds] = useStudyClock(view === 'board' && !breakPrompt && breakEndsAt === null);
  const showBreak = breakPrompt || breakEndsAt !== null;

  useEffect(() => {
    if (data.settings.breakReminder && sessionSeconds >= BREAK_AFTER_SECONDS) setBreakPrompt(true);
  }, [data.settings.breakReminder, sessionSeconds]);

  /* ---------------- Data helpers ---------------- */

  const updateTopic = useCallback((topicId: string, patch: Partial<Topic>) => {
    setData(d => ({ ...d, topics: d.topics.map(t => (t.id === topicId ? { ...t, ...patch } : t)) }));
  }, []);

  const addStudyTime = useCallback((topicId: string, seconds: number) => {
    setData(d => ({
      ...d,
      topics: d.topics.map(t => (t.id === topicId ? { ...t, secondsStudied: t.secondsStudied + seconds } : t)),
    }));
  }, []);

  const statusPatch = (topic: Topic, status: TopicStatus): Partial<Topic> => {
    const now = new Date().toISOString();
    if (status === 'done') return { status, progress: 100, completedAt: now };
    if (status === 'in-process') {
      // Reopening a finished topic shouldn't still read as 100% complete
      return { status, startedAt: topic.startedAt ?? now, completedAt: undefined, progress: topic.status === 'done' ? 99 : topic.progress };
    }
    return { status, progress: 0, completedAt: undefined };
  };

  const moveTopic = (topicId: string, status: TopicStatus) => {
    const topic = data.topics.find(t => t.id === topicId);
    if (!topic) return;
    updateTopic(topicId, statusPatch(topic, status));
    if (status === 'done') notify(`"${topic.title}" is done!`, 'success');
  };

  /** Marks a topic done and opens the next one in the same course, if any. */
  const markDoneAndNext = (topicId: string) => {
    const topic = data.topics.find(t => t.id === topicId);
    if (!topic) return;
    const next = findNextTopic(topicsOf(data, topic.courseId), topicId);
    setData(d => ({
      ...d,
      topics: d.topics.map(t => {
        if (t.id === topicId) return { ...t, ...statusPatch(t, 'done') };
        if (next && t.id === next.id) return { ...t, ...statusPatch(t, 'in-process') };
        return t;
      }),
    }));
    if (next) {
      setReaderTopicId(next.id);
      notify(`"${topic.title}" done. Next up: "${next.title}"`, 'success');
    } else {
      setReaderTopicId(null);
    }
  };

  /** Puts a course on the study board, enforcing the WIP limit. */
  const beginStudy = (courseId: string) => {
    const course = data.courses.find(c => c.id === courseId);
    if (!course) return;
    const state = courseState(data, course);

    if (state === 'empty') return notify('Add some topics to this course before studying it.', 'error');
    if (state === 'completed') return notify('You already completed this course. Reset it from Manage to study it again.');
    if (state !== 'on-board') {
      if (data.board.length >= WIP_LIMIT) {
        const names = data.board.map(id => data.courses.find(c => c.id === id)?.title).join(' and ');
        return notify(`Your board is full (${WIP_LIMIT} courses). Finish ${names} first.`, 'error');
      }
      setData(d => ({ ...d, board: [...d.board, courseId] }));
      notify(`${course.title} is on your study board. Good luck!`, 'success');
    }
    setModal(null);
    setView('board');
  };

  const createCourse = async (input: Pick<Course, 'title' | 'code' | 'color'>, topicsInput: NewTopicsInput) => {
    const course: Course = { ...input, id: newId('course'), createdAt: new Date().toISOString() };
    const { topics, errors } = await buildTopics(course.id, 1, topicsInput.files, topicsInput.titles);
    setData(d => ({ ...d, courses: [...d.courses, course], topics: [...d.topics, ...topics] }));
    notify(
      errors.length ? `Course created, but some files were skipped: ${errors.join('; ')}` : `${course.title} added with ${topics.length} topic${topics.length === 1 ? '' : 's'}.`,
      errors.length ? 'error' : 'success',
    );
  };

  const addTopics = async (courseId: string, input: NewTopicsInput) => {
    const { topics, errors } = await buildTopics(courseId, nextOrder(data.topics, courseId), input.files, input.titles);
    setData(d => ({
      ...d,
      topics: [...d.topics, ...topics],
      // New work reopens a completed course
      courses: d.courses.map(c => (c.id === courseId && topics.length ? { ...c, completedAt: undefined } : c)),
    }));
    notify(errors.length ? `Some files were skipped: ${errors.join('; ')}` : `Added ${topics.length} topic${topics.length === 1 ? '' : 's'}.`, errors.length ? 'error' : 'success');
  };

  const deleteTopic = (topicId: string) => {
    const topic = data.topics.find(t => t.id === topicId);
    if (topic?.document) deleteDocuments([topic.document.id]).catch(() => {});
    setData(d => ({ ...d, topics: d.topics.filter(t => t.id !== topicId) }));
  };

  const deleteCourse = (courseId: string) => {
    const docIds = data.topics.filter(t => t.courseId === courseId && t.document).map(t => t.document!.id);
    deleteDocuments(docIds).catch(() => {});
    setData(d => ({
      ...d,
      courses: d.courses.filter(c => c.id !== courseId),
      topics: d.topics.filter(t => t.courseId !== courseId),
      board: d.board.filter(id => id !== courseId),
    }));
    setManagedCourseId(null);
    notify('Course deleted.');
  };

  const restartCourse = (courseId: string) => {
    setData(d => ({
      ...d,
      courses: d.courses.map(c => (c.id === courseId ? { ...c, completedAt: undefined } : c)),
      topics: d.topics.map(t =>
        t.courseId === courseId ? { ...t, status: 'course' as const, progress: 0, startedAt: undefined, completedAt: undefined } : t,
      ),
    }));
    notify('Progress reset. You can begin this course again.');
  };

  const loadSample = async () => {
    try {
      const { course, topics } = await createSampleCourse();
      setData(d => ({ ...d, courses: [...d.courses, course], topics: [...d.topics, ...topics] }));
      notify('Sample course added. Press Begin Study to try the board.', 'success');
    } catch {
      notify('Could not create the sample course in this browser.', 'error');
    }
  };

  /* ---------------- Render ---------------- */

  const readerTopic = readerTopicId ? data.topics.find(t => t.id === readerTopicId) : undefined;
  const readerCourse = readerTopic && data.courses.find(c => c.id === readerTopic.courseId);
  const managedCourse = managedCourseId ? data.courses.find(c => c.id === managedCourseId) : undefined;
  const completedCourse = completedCourseId ? data.courses.find(c => c.id === completedCourseId) : undefined;

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        user={user}
        view={view}
        onNavigate={setView}
        boardCount={data.board.length}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onLogout={onLogout}
      />

      <main className="flex-1">
        {view === 'dashboard' ? (
          <Dashboard
            user={user}
            data={data}
            onBeginStudy={() => setModal('begin-study')}
            onStudyCourse={beginStudy}
            onAddCourse={() => setModal('add-course')}
            onManageCourse={setManagedCourseId}
            onLoadSample={loadSample}
            onToggleBreakReminder={() =>
              setData(d => ({ ...d, settings: { ...d.settings, breakReminder: !d.settings.breakReminder } }))
            }
          />
        ) : (
          <StudyBoard
            data={data}
            sessionSeconds={sessionSeconds}
            onMoveTopic={moveTopic}
            onOpenReader={setReaderTopicId}
            onBeginStudy={() => setModal('begin-study')}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 py-5 text-center text-xs text-slate-400 dark:border-slate-800">
        GO STUDY · Stop starting, start finishing.
      </footer>

      {modal === 'add-course' && <AddCourseModal onClose={() => setModal(null)} onCreate={createCourse} />}
      {modal === 'begin-study' && (
        <BeginStudyModal data={data} onClose={() => setModal(null)} onStudy={beginStudy} onAddCourse={() => setModal('add-course')} />
      )}
      {managedCourse && (
        <ManageCourseModal
          course={managedCourse}
          data={data}
          onClose={() => setManagedCourseId(null)}
          onAddTopics={addTopics}
          onDeleteTopic={deleteTopic}
          onDeleteCourse={deleteCourse}
          onRestartCourse={restartCourse}
        />
      )}

      {readerTopic && readerCourse && (
        <ReaderModal
          topic={readerTopic}
          course={readerCourse}
          courseTopics={topicsOf(data, readerCourse.id)}
          paused={showBreak}
          onClose={() => setReaderTopicId(null)}
          onUpdate={updateTopic}
          onAddStudyTime={addStudyTime}
          onMarkDone={markDoneAndNext}
          onError={msg => notify(msg, 'error')}
        />
      )}

      {completedCourse && (
        <CompletionModal
          course={completedCourse}
          onClose={() => setCompletedCourseId(null)}
          onBeginNext={() => {
            setCompletedCourseId(null);
            setModal('begin-study');
          }}
        />
      )}

      {showBreak && (
        <BreakModal
          breakEndsAt={breakEndsAt}
          onStartBreak={() => {
            setBreakPrompt(false);
            setBreakEndsAt(Date.now() + BREAK_LENGTH_SECONDS * 1000);
            setSessionSeconds(0);
          }}
          onKeepStudying={() => {
            setBreakPrompt(false);
            setSessionSeconds(0);
          }}
          onEndBreak={() => {
            setBreakEndsAt(null);
            setSessionSeconds(0);
          }}
        />
      )}

      {toast && <Toast toast={toast} />}
    </div>
  );
}
