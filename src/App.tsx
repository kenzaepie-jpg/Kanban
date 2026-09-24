import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Course, Topic, TopicStatus, User, UserData } from './types';
import { api, setUnauthorizedHandler } from './lib/api';
import { fetchCurrentUser, logout } from './lib/auth';
import { WIP_LIMIT, courseState, topicsOf } from './lib/progress';
import { Theme, useTheme } from './lib/theme';
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

function FullPageMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center text-slate-500 dark:text-slate-400">
      {children}
    </div>
  );
}

export default function App() {
  const [theme, toggleTheme] = useTheme();
  // undefined = still checking the session cookie
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [bootError, setBootError] = useState('');

  useEffect(() => {
    fetchCurrentUser()
      .then(setUser)
      .catch(err => setBootError(err instanceof Error ? err.message : 'Could not reach the server.'));
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  if (bootError) {
    return (
      <FullPageMessage>
        <p className="font-semibold text-slate-800 dark:text-slate-100">{bootError}</p>
        <button onClick={() => location.reload()} className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">
          Try again
        </button>
      </FullPageMessage>
    );
  }
  if (user === undefined) {
    return (
      <FullPageMessage>
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </FullPageMessage>
    );
  }
  if (!user) {
    return <AuthPage onAuthenticated={setUser} theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
    <Workspace
      key={user.id}
      user={user}
      theme={theme}
      onToggleTheme={toggleTheme}
      onLogout={async () => {
        await logout();
        setUser(null);
      }}
    />
  );
}

interface WorkspaceProps {
  user: User;
  theme: Theme;
  onToggleTheme: () => void;
  onLogout: () => void;
}

/** Server responses for changes that affect the board carry the student's full, updated data. */
interface DataResponse {
  data: UserData;
  completedCourse?: boolean;
  nextTopicId?: string | null;
}

function Workspace(props: WorkspaceProps) {
  const [data, setData] = useState<UserData | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    api<DataResponse>('/api/data')
      .then(r => setData(r.data))
      .catch(err => setLoadError(err instanceof Error ? err.message : 'Could not load your courses.'));
  }, []);

  if (loadError) return <FullPageMessage><p>{loadError}</p></FullPageMessage>;
  if (!data) {
    return (
      <FullPageMessage>
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </FullPageMessage>
    );
  }
  return <LoadedWorkspace {...props} initialData={data} />;
}

function LoadedWorkspace({ user, theme, onToggleTheme, onLogout, initialData }: WorkspaceProps & { initialData: UserData }) {
  const [data, setData] = useState<UserData>(initialData);
  const [view, setView] = useState<View>(initialData.board.length > 0 ? 'board' : 'dashboard');

  const [modal, setModal] = useState<'add-course' | 'begin-study' | null>(null);
  const [managedCourseId, setManagedCourseId] = useState<string | null>(null);
  const [readerTopicId, setReaderTopicId] = useState<string | null>(null);
  const [completedCourseId, setCompletedCourseId] = useState<string | null>(null);

  const [toast, setToast] = useState<ToastData | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const notify = useCallback((text: string, tone: ToastData['tone'] = 'info') => {
    setToast({ id: Date.now(), text, tone });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);
  const notifyError = useCallback(
    (err: unknown) => notify(err instanceof Error ? err.message : 'Something went wrong.', 'error'),
    [notify],
  );

  /* ---------------- Break reminder ---------------- */

  const [breakEndsAt, setBreakEndsAt] = useState<number | null>(null);
  const [breakPrompt, setBreakPrompt] = useState(false);
  // The session clock only runs on the study board, and pauses while a break is suggested or running
  const [sessionSeconds, setSessionSeconds] = useStudyClock(view === 'board' && !breakPrompt && breakEndsAt === null);
  const showBreak = breakPrompt || breakEndsAt !== null;

  useEffect(() => {
    if (data.settings.breakReminder && sessionSeconds >= BREAK_AFTER_SECONDS) setBreakPrompt(true);
  }, [data.settings.breakReminder, sessionSeconds]);

  /* ---------------- Reading progress & notes (saved in the background) ---------------- */

  // Scrolling changes progress many times a second, so edits are batched per topic
  const pending = useRef(new Map<string, Partial<Topic>>());
  const flushTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /** Sends batched progress/notes now; resolves once the server has saved them. */
  const flushPending = useCallback((): Promise<void> => {
    clearTimeout(flushTimer.current);
    const saves = [...pending.current].map(([topicId, patch]) =>
      api(`/api/topics/${topicId}`, { method: 'PATCH', json: patch }).catch(notifyError),
    );
    pending.current.clear();
    return Promise.all(saves).then(() => undefined);
  }, [notifyError]);

  useEffect(() => {
    window.addEventListener('pagehide', flushPending);
    return () => {
      window.removeEventListener('pagehide', flushPending);
      flushPending();
    };
  }, [flushPending]);

  const updateTopic = useCallback(
    (topicId: string, patch: Partial<Pick<Topic, 'progress' | 'notes'>>) => {
      setData(d => ({ ...d, topics: d.topics.map(t => (t.id === topicId ? { ...t, ...patch } : t)) }));
      pending.current.set(topicId, { ...pending.current.get(topicId), ...patch });
      clearTimeout(flushTimer.current);
      flushTimer.current = setTimeout(flushPending, 800);
    },
    [flushPending],
  );

  const addStudyTime = useCallback(
    (topicId: string, seconds: number) => {
      setData(d => ({
        ...d,
        topics: d.topics.map(t => (t.id === topicId ? { ...t, secondsStudied: t.secondsStudied + seconds } : t)),
      }));
      api(`/api/topics/${topicId}/time`, { json: { seconds } }).catch(notifyError);
    },
    [notifyError],
  );

  /* ---------------- Changes that the server decides on ---------------- */

  /** Sends a change to the server and replaces local data with the server's result. */
  const mutate = async (path: string, options: Parameters<typeof api>[1] = { method: 'POST' }): Promise<DataResponse | null> => {
    // Save pending progress first: it must not be overwritten, and "done" needs it to be 100%
    await flushPending();
    try {
      const result = await api<DataResponse>(path, options);
      setData(result.data);
      return result;
    } catch (err) {
      notifyError(err);
      return null;
    }
  };

  const celebrate = (courseId: string) => {
    setReaderTopicId(null);
    setCompletedCourseId(courseId);
  };

  const moveTopic = async (topicId: string, status: TopicStatus) => {
    const topic = data.topics.find(t => t.id === topicId);
    if (!topic) return;
    if (status === 'done' && topic.progress < 100) {
      notify(`Read "${topic.title}" to the end first (${topic.progress}% read).`, 'error');
      return;
    }
    const result = await mutate(`/api/topics/${topicId}/move`, { json: { status } });
    if (!result) return;
    if (result.completedCourse) celebrate(topic.courseId);
    else if (status === 'done') notify(`"${topic.title}" is done!`, 'success');
  };

  /** Marks a topic done and opens the next one in the same course, if any. */
  const markDoneAndNext = async (topicId: string) => {
    const topic = data.topics.find(t => t.id === topicId);
    if (!topic || topic.progress < 100) return;
    const result = await mutate(`/api/topics/${topicId}/done-next`);
    if (!result) return;
    if (result.completedCourse) return celebrate(topic.courseId);
    const next = result.data.topics.find(t => t.id === result.nextTopicId);
    setReaderTopicId(next?.id ?? null);
    if (next) notify(`"${topic.title}" done. Next up: "${next.title}"`, 'success');
  };

  const boardTitles = () => data.board.map(id => data.courses.find(c => c.id === id)?.title).join(' and ');

  /**
   * Puts a course on the study board. If another course is being studied, the student
   * can end that session and switch (e.g. when priorities change). The server enforces the WIP limit.
   */
  const beginStudy = async (courseId: string) => {
    const course = data.courses.find(c => c.id === courseId);
    if (!course) return;
    if (courseState(data, course) === 'on-board') {
      setModal(null);
      setView('board');
      return;
    }
    const switching = data.board.length >= WIP_LIMIT;
    if (
      switching &&
      !window.confirm(`You are studying ${boardTitles()}.\n\nEnd that session and start ${course.title} instead? Your progress is kept.`)
    ) {
      return;
    }
    if (await mutate(`/api/courses/${courseId}/begin`, { json: { switch: switching } })) {
      notify(`Now studying ${course.title}. Good luck!`, 'success');
      setModal(null);
      setView('board');
    }
  };

  /** Ends a course's study session early; its progress is kept. */
  const endSession = async (courseId: string) => {
    const course = data.courses.find(c => c.id === courseId);
    if (!course) return;
    if (!window.confirm(`End your study session for ${course.title}? Your progress is kept, and you can resume it later.`)) return;
    if (await mutate(`/api/courses/${courseId}/end`)) {
      setReaderTopicId(null);
      setView('dashboard');
      notify('Session ended. Pick the next course to study.');
    }
  };

  const topicsForm = (input: NewTopicsInput, fields: Record<string, string> = {}) => {
    const form = new FormData();
    Object.entries(fields).forEach(([k, v]) => form.append(k, v));
    form.append('titles', JSON.stringify(input.titles));
    input.files.forEach(f => form.append('files', f));
    return form;
  };

  const createCourse = async (input: Pick<Course, 'title' | 'code' | 'color'>, topics: NewTopicsInput) => {
    if (!(await mutate('/api/courses', { form: topicsForm(topics, input) }))) return false;
    const count = topics.files.length + topics.titles.length;
    notify(`${input.title} added with ${count} topic${count === 1 ? '' : 's'}.`, 'success');
    return true;
  };

  const addTopics = async (courseId: string, topics: NewTopicsInput) => {
    if (!(await mutate(`/api/courses/${courseId}/topics`, { form: topicsForm(topics) }))) return false;
    const count = topics.files.length + topics.titles.length;
    notify(`Added ${count} topic${count === 1 ? '' : 's'}.`, 'success');
    return true;
  };

  const deleteTopic = async (topicId: string) => {
    const topic = data.topics.find(t => t.id === topicId);
    const result = await mutate(`/api/topics/${topicId}`, { method: 'DELETE' });
    if (result?.completedCourse && topic) celebrate(topic.courseId);
  };

  const deleteCourse = async (courseId: string) => {
    if (await mutate(`/api/courses/${courseId}`, { method: 'DELETE' })) {
      setManagedCourseId(null);
      notify('Course deleted.');
    }
  };

  const restartCourse = async (courseId: string) => {
    if (await mutate(`/api/courses/${courseId}/restart`)) notify('Progress reset. You can begin this course again.');
  };

  const loadSample = async () => {
    if (await mutate('/api/courses/sample')) notify('Sample course added. Press Begin Study to try the board.', 'success');
  };

  const attachFile = async (topicId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    if (await mutate(`/api/topics/${topicId}/file`, { form })) notify(`Attached ${file.name}.`, 'success');
  };

  const toggleBreakReminder = () => {
    const breakReminder = !data.settings.breakReminder;
    setData(d => ({ ...d, settings: { ...d.settings, breakReminder } }));
    api('/api/settings', { method: 'PATCH', json: { breakReminder } }).catch(err => {
      setData(d => ({ ...d, settings: { ...d.settings, breakReminder: !breakReminder } }));
      notifyError(err);
    });
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
        onLogout={() => {
          flushPending();
          onLogout();
        }}
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
            onToggleBreakReminder={toggleBreakReminder}
          />
        ) : (
          <StudyBoard
            data={data}
            sessionSeconds={sessionSeconds}
            onMoveTopic={moveTopic}
            onOpenReader={setReaderTopicId}
            onBeginStudy={() => setModal('begin-study')}
            onEndSession={endSession}
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
          onClose={() => {
            flushPending();
            setReaderTopicId(null);
          }}
          onUpdate={updateTopic}
          onAddStudyTime={addStudyTime}
          onMarkDone={markDoneAndNext}
          onAttachFile={attachFile}
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
