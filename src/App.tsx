import React, { useState, useEffect, useRef } from 'react';
import { Course, Topic, KanbanStatus } from './types';
import { SAMPLE_COURSES, SAMPLE_TOPICS } from './data/sampleCourses';
import { Navbar } from './components/Navbar';
import { KanbanBoard } from './components/KanbanBoard';
import { StudyReaderModal } from './components/StudyReaderModal';
import { UploadModal } from './components/UploadModal';
import { AddTopicModal } from './components/AddTopicModal';
import { CourseManagerModal } from './components/CourseManagerModal';
import { ExamCelebrationModal } from './components/ExamCelebrationModal';
import { daysUntil } from './utils/dates';
import { findNextTopic, nextOrderForCourse } from './utils/topics';
import { 
  BookOpen, 
  Calendar, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Play, 
  HelpCircle,
  Clock,
  Flame,
  FileUp
} from 'lucide-react';

const STORAGE_KEY_COURSES = 'examprep_courses_v1';
const STORAGE_KEY_TOPICS = 'examprep_topics_v1';
const STORAGE_KEY_ACTIVE_COURSE = 'examprep_active_course_v1';

// localStorage can throw (quota exceeded by large PDFs, private mode). An error thrown
// inside useEffect would crash the whole app, so writes report failure instead.
function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeGetItem(key: string): string | null {
  try {
    return safeGetItem(key);
  } catch {
    return null;
  }
}

export default function App() {
  // Initialize state with localStorage or defaults
  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = safeGetItem(STORAGE_KEY_COURSES);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return SAMPLE_COURSES;
  });

  const [activeCourseId, setActiveCourseId] = useState<string>(() => {
    const saved = safeGetItem(STORAGE_KEY_ACTIVE_COURSE);
    if (saved) return saved;
    return courses[0]?.id || 'course-bio-101';
  });

  const [topics, setTopics] = useState<Topic[]>(() => {
    const saved = safeGetItem(STORAGE_KEY_TOPICS);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return SAMPLE_TOPICS;
  });

  // Modal states
  const [activeReadingTopic, setActiveReadingTopic] = useState<Topic | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAddTopicModalOpen, setIsAddTopicModalOpen] = useState(false);
  const [isCourseManagerOpen, setIsCourseManagerOpen] = useState(false);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type?: 'info' | 'success' } | null>(null);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (text: string, type: 'info' | 'success' = 'info') => {
    setToastMessage({ text, type });
    // Clear the previous timer, otherwise it would hide this newer toast early
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Persist to localStorage
  useEffect(() => {
    safeSetItem(STORAGE_KEY_COURSES, JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    if (!safeSetItem(STORAGE_KEY_TOPICS, JSON.stringify(topics))) {
      showToast('Storage full: recent changes will not survive a reload. Remove some large PDFs.');
    }
  }, [topics]);

  useEffect(() => {
    safeSetItem(STORAGE_KEY_ACTIVE_COURSE, activeCourseId);
  }, [activeCourseId]);

  // Current active course
  const activeCourse = courses.find(c => c.id === activeCourseId) || courses[0] || {
    id: 'default',
    title: 'General Exam Prep',
    code: 'GEN-100',
    description: '',
    examDate: new Date().toISOString(),
    color: '#4f46e5',
    createdAt: new Date().toISOString(),
  };

  // Current course topics
  const currentCourseTopics = topics
    .filter(t => t.courseId === activeCourse.id)
    .sort((a, b) => a.order - b.order);

  const notDoneCount = currentCourseTopics.filter(t => t.status === 'not-done').length;
  const inProgressCount = currentCourseTopics.filter(t => t.status === 'in-progress').length;
  const doneCount = currentCourseTopics.filter(t => t.status === 'done').length;
  const totalCount = currentCourseTopics.length;

  // Handler: Move topic to a new status
  const handleMoveStatus = (topicId: string, newStatus: KanbanStatus) => {
    // Check if this move completes the course (done outside the state updater,
    // because updaters must be pure and React may run them twice)
    const courseTopics = topics.filter(t => t.courseId === activeCourse.id);
    const completesCourse = newStatus === 'done' &&
      courseTopics.length > 0 &&
      courseTopics.every(t => t.id === topicId || t.status === 'done');

    setTopics(prev =>
      prev.map(t => {
        if (t.id === topicId) {
          return {
            ...t,
            status: newStatus,
            completedAt: newStatus === 'done' ? new Date().toISOString() : t.completedAt,
            lastStudiedAt: newStatus === 'in-progress' ? new Date().toISOString() : t.lastStudiedAt,
          };
        }
        return t;
      })
    );

    if (completesCourse) {
      setTimeout(() => setIsCelebrationOpen(true), 300);
    }

    const statusLabel = newStatus === 'in-progress' ? 'Reading Stage (Active)' : newStatus === 'done' ? 'Done & Mastered' : 'Not Done';
    showToast(`Topic moved to ${statusLabel}`, newStatus === 'done' ? 'success' : 'info');
  };

  // Handler: Open Reader for a topic
  const handleOpenReader = (topic: Topic) => {
    // If opening from Not Done, move it to in-progress first
    if (topic.status === 'not-done') {
      handleMoveStatus(topic.id, 'in-progress');
      setActiveReadingTopic({ ...topic, status: 'in-progress' });
    } else {
      setActiveReadingTopic(topic);
    }
  };

  // Handler: Update Topic data (notes, concepts, confidence)
  const handleUpdateTopic = (updatedTopic: Topic) => {
    setTopics(prev => prev.map(t => t.id === updatedTopic.id ? updatedTopic : t));
    if (activeReadingTopic && activeReadingTopic.id === updatedTopic.id) {
      setActiveReadingTopic(updatedTopic);
    }
  };

  // Handler: The core user request!
  // "when you find it goes to the next topic in the same course loading the pdfs one by one it moves gradually till you are done perfectly capturing kanban"
  const handleMarkDoneAndNext = (currentTopicId: string) => {
    const currentTopic = topics.find(t => t.id === currentTopicId);
    
    // 1. Mark current topic as 'done'
    const updatedTopics = topics.map(t => {
      if (t.id === currentTopicId) {
        return {
          ...t,
          status: 'done' as KanbanStatus,
          completedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    // 2. Find the NEXT topic in the same course to study:
    // Priority: Next topic in 'in-progress' OR next in 'not-done'
    const nextTopic = findNextTopic(
      updatedTopics.filter(t => t.courseId === activeCourse.id),
      currentTopicId
    );

    if (nextTopic) {

      // Auto-move next topic to 'in-progress' (the middle stage)
      const finalTopics = updatedTopics.map(t => {
        if (t.id === nextTopic.id) {
          return {
            ...t,
            status: 'in-progress' as KanbanStatus,
            lastStudiedAt: new Date().toISOString(),
          };
        }
        return t;
      });

      setTopics(finalTopics);
      const activatedNext = finalTopics.find(t => t.id === nextTopic.id)!;
      setActiveReadingTopic(activatedNext);

      showToast(`Mastered "${currentTopic?.title}"! Auto-loaded next topic: "${nextTopic.title}" (Moved to Reading Stage)`, 'success');
    } else {
      // All topics in the course are now done!
      setTopics(updatedTopics);
      setActiveReadingTopic(null);
      setIsCelebrationOpen(true);
      showToast(`Congratulations! All topics in ${activeCourse.title} are completed!`, 'success');
    }
  };

  // Handler: Delete topic
  const handleDeleteTopic = (topicId: string) => {
    setTopics(prev => prev.filter(t => t.id !== topicId));
    if (activeReadingTopic?.id === topicId) {
      setActiveReadingTopic(null);
    }
    showToast('Topic deleted');
  };

  // Handler: Add multiple topics (from upload or syllabus)
  const handleAddMultipleTopics = (newTopicsList: Omit<Topic, 'id'>[]) => {
    // Topics may target a course other than the active one (Upload modal has a course picker),
    // so the order is computed per target course.
    const nextOrders: Record<string, number> = {};
    const created: Topic[] = newTopicsList.map((t, idx) => {
      const order = nextOrders[t.courseId] ?? nextOrderForCourse(topics, t.courseId);
      nextOrders[t.courseId] = order + 1;
      return {
        ...t,
        id: 'topic-' + Date.now() + '-' + idx,
        order,
      };
    });

    setTopics(prev => [...prev, ...created]);
    showToast(`Added ${created.length} new topics in "Not Done" ready for study!`, 'success');
  };

  // Handler: Add single topic
  const handleAddSingleTopic = (newTopic: Omit<Topic, 'id'>) => {
    const created: Topic = {
      ...newTopic,
      id: 'topic-' + Date.now(),
      order: nextOrderForCourse(topics, newTopic.courseId),
    };
    setTopics(prev => [...prev, created]);
    showToast(`Created topic "${created.title}" in Not Done`, 'success');
  };

  // Handler: Add Course
  const handleAddCourse = (newCourseData: Omit<Course, 'id' | 'createdAt'>) => {
    const newCourse: Course = {
      ...newCourseData,
      id: 'course-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setCourses(prev => [...prev, newCourse]);
    setActiveCourseId(newCourse.id);
    showToast(`Created course ${newCourse.code}: ${newCourse.title}`, 'success');
  };

  // Handler: Delete Course
  const handleDeleteCourse = (courseId: string) => {
    setCourses(prev => prev.filter(c => c.id !== courseId));
    setTopics(prev => prev.filter(t => t.courseId !== courseId));
    const remaining = courses.filter(c => c.id !== courseId);
    if (remaining.length > 0) {
      setActiveCourseId(remaining[0].id);
    }
    showToast('Course removed');
  };

  // Handler: Reset to sample data
  const handleResetSampleData = () => {
    if (window.confirm('Reset courses and topics to default sample curriculum?')) {
      setCourses(SAMPLE_COURSES);
      setTopics(SAMPLE_TOPICS);
      setActiveCourseId(SAMPLE_COURSES[0].id);
      setActiveReadingTopic(null);
      localStorage.removeItem(STORAGE_KEY_COURSES);
      localStorage.removeItem(STORAGE_KEY_TOPICS);
      localStorage.removeItem(STORAGE_KEY_ACTIVE_COURSE);
      showToast('Reset to default sample curriculum', 'info');
    }
  };

  // Handler: Reset progress for active course
  const handleResetCourseProgress = () => {
    setTopics(prev => prev.map(t => {
      if (t.courseId === activeCourse.id) {
        return {
          ...t,
          status: 'not-done' as KanbanStatus,
          completedAt: undefined,
          keyConcepts: t.keyConcepts.map(c => ({ ...c, completed: false })),
        };
      }
      return t;
    }));
    showToast(`Reset all topics in ${activeCourse.title} to Not Done`);
  };

  // Quick action: Start or resume next topic
  const handleStartNextSession = () => {
    // 1. If there's an in-progress topic, resume it
    const inProgress = currentCourseTopics.find(t => t.status === 'in-progress');
    if (inProgress) {
      handleOpenReader(inProgress);
      return;
    }

    // 2. Otherwise start the first 'not-done' topic
    const firstNotDone = currentCourseTopics.find(t => t.status === 'not-done');
    if (firstNotDone) {
      handleOpenReader(firstNotDone);
      return;
    }

    // 3. Otherwise open the first topic for review
    if (currentCourseTopics.length > 0) {
      handleOpenReader(currentCourseTopics[0]);
    } else {
      setIsUploadModalOpen(true);
    }
  };

  // Calculate exam countdown days
  const diffDays = daysUntil(activeCourse.examDate);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Top Navigation */}
      <Navbar
        courses={courses}
        activeCourse={activeCourse}
        onSelectCourse={setActiveCourseId}
        topics={topics}
        onOpenAddTopic={() => setIsAddTopicModalOpen(true)}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onOpenCourseManager={() => setIsCourseManagerOpen(true)}
        onResetSampleData={handleResetSampleData}
        activeReadingTopic={activeReadingTopic || currentCourseTopics.find(t => t.status === 'in-progress')}
        onOpenReader={handleOpenReader}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Course Banner & Study Workflow Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs relative overflow-hidden">
          <div 
            className="absolute top-0 left-0 right-0 h-1.5" 
            style={{ backgroundColor: activeCourse.color || '#4f46e5' }}
          />
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-1">
                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono">
                  {activeCourse.code}
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Target Exam: {activeCourse.examDate}</span>
                  <span className="font-bold text-amber-600">
                    ({diffDays > 1 ? `${diffDays} days left` : diffDays === 1 ? '1 day left' : diffDays === 0 ? 'Exam is today!' : 'Exam passed'})
                  </span>
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {activeCourse.title}
              </h1>

              {activeCourse.description && (
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  {activeCourse.description}
                </p>
              )}
            </div>

            {/* Stage Quick Metrics & Primary CTA */}
            <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 shrink-0">
              {/* Kanban Stage Pills */}
              <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
                <div className="px-3 py-1.5 flex flex-col items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Not Done</span>
                  <span className="font-extrabold text-slate-700">{notDoneCount}</span>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div className="px-3 py-1.5 flex flex-col items-center bg-indigo-50/80 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-indigo-700">Reading</span>
                  <span className="font-extrabold text-indigo-700">{inProgressCount}</span>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div className="px-3 py-1.5 flex flex-col items-center bg-emerald-50/80 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-emerald-700">Done</span>
                  <span className="font-extrabold text-emerald-700">{doneCount}</span>
                </div>
              </div>

              {/* Primary Action Button: Continue Reading / Start Next Topic */}
              <button
                id="start-study-session-btn"
                onClick={handleStartNextSession}
                className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all hover:scale-[1.02]"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>
                  {inProgressCount > 0 
                    ? 'Continue Reading Topic' 
                    : notDoneCount > 0 
                    ? 'Start Reading Next Topic' 
                    : 'Review Mastered Topics'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Workflow hint banner */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>
                <strong>Study Rule:</strong> Click "Start Reading" to move a topic into the middle <em>Reading</em> column. When you finish, click <em>Mark Done & Next Topic</em> to auto-advance through your course PDFs!
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center space-x-1"
              >
                <FileUp className="w-3 h-3" />
                <span>Load Word Doc / PDFs</span>
              </button>
            </div>
          </div>
        </div>

        {/* The 3-Column Kanban Board */}
        <KanbanBoard
          topics={currentCourseTopics}
          onOpenReader={handleOpenReader}
          onMoveStatus={handleMoveStatus}
          onDeleteTopic={handleDeleteTopic}
          onOpenAddTopic={() => setIsAddTopicModalOpen(true)}
        />

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        <p>Exam Prep Kanban • Step-by-step document & PDF study pipeline with auto-advancing Kanban stages</p>
      </footer>

      {/* Active Study Reader Modal (Document / PDF Viewer with Next Topic Flow) */}
      {activeReadingTopic && (
        <StudyReaderModal
          topic={activeReadingTopic}
          allCourseTopics={currentCourseTopics}
          onClose={() => setActiveReadingTopic(null)}
          onUpdateTopic={handleUpdateTopic}
          onMarkDoneAndNext={handleMarkDoneAndNext}
        />
      )}

      {/* Load Word Doc & PDF Modal */}
      {isUploadModalOpen && (
        <UploadModal
          courses={courses}
          activeCourseId={activeCourse.id}
          onClose={() => setIsUploadModalOpen(false)}
          onAddTopics={handleAddMultipleTopics}
        />
      )}

      {/* Add Topic Modal */}
      {isAddTopicModalOpen && (
        <AddTopicModal
          course={activeCourse}
          onClose={() => setIsAddTopicModalOpen(false)}
          onAddTopic={handleAddSingleTopic}
        />
      )}

      {/* Course Manager Modal */}
      {isCourseManagerOpen && (
        <CourseManagerModal
          courses={courses}
          activeCourseId={activeCourse.id}
          onSelectCourse={setActiveCourseId}
          onClose={() => setIsCourseManagerOpen(false)}
          onAddCourse={handleAddCourse}
          onDeleteCourse={handleDeleteCourse}
        />
      )}

      {/* Exam Ready Celebration Modal */}
      {isCelebrationOpen && (
        <ExamCelebrationModal
          course={activeCourse}
          topics={currentCourseTopics}
          onClose={() => setIsCelebrationOpen(false)}
          onResetCourseProgress={handleResetCourseProgress}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce-in">
          <div className={`px-4 py-2.5 rounded-xl shadow-lg border text-xs sm:text-sm font-medium flex items-center space-x-2 ${
            toastMessage.type === 'success'
              ? 'bg-slate-900 text-white border-slate-800'
              : 'bg-white text-slate-800 border-slate-200 shadow-md'
          }`}>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

    </div>
  );
}
