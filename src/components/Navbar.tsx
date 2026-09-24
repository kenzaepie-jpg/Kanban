import React from 'react';
import { Course, Topic } from '../types';
import { daysUntil } from '../utils/dates';
import { 
  GraduationCap, 
  Calendar, 
  Plus, 
  FileUp, 
  BookOpen, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  courses: Course[];
  activeCourse: Course;
  onSelectCourse: (courseId: string) => void;
  topics: Topic[];
  onOpenAddTopic: () => void;
  onOpenUpload: () => void;
  onOpenCourseManager: () => void;
  onResetSampleData: () => void;
  activeReadingTopic?: Topic | null;
  onOpenReader: (topic: Topic) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  courses,
  activeCourse,
  onSelectCourse,
  topics,
  onOpenAddTopic,
  onOpenUpload,
  onOpenCourseManager,
  onResetSampleData,
  activeReadingTopic,
  onOpenReader,
}) => {
  const courseTopics = topics.filter(t => t.courseId === activeCourse.id);
  const doneCount = courseTopics.filter(t => t.status === 'done').length;
  const inProgressCount = courseTopics.filter(t => t.status === 'in-progress').length;
  const totalCount = courseTopics.length;
  const percentComplete = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Calculate days to exam
  const diffDays = daysUntil(activeCourse.examDate);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Brand and Course Selector */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2.5">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-colors"
                style={{ backgroundColor: activeCourse.color || '#4f46e5' }}
              >
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Exam Kanban</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Sparkles className="w-2.5 h-2.5 mr-1" /> Active Flow
                  </span>
                </div>
                <div className="relative group">
                  <button 
                    id="course-dropdown-button"
                    onClick={onOpenCourseManager}
                    className="flex items-center space-x-1.5 text-base font-semibold text-slate-900 hover:text-indigo-600 transition-colors text-left"
                    title="Click to manage or switch courses"
                  >
                    <span className="truncate max-w-[220px] sm:max-w-xs">{activeCourse.title}</span>
                    <span className="text-xs text-slate-400 font-mono font-normal">({activeCourse.code})</span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Course Switcher Pills */}
            <div className="hidden lg:flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200/80">
              {courses.map((course) => (
                <button
                  key={course.id}
                  id={`select-course-${course.id}`}
                  onClick={() => onSelectCourse(course.id)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                    course.id === activeCourse.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {course.code}
                </button>
              ))}
            </div>
          </div>

          {/* Center/Right Progress & Actions */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Exam Countdown Badge */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-amber-50/80 border border-amber-200/70 text-amber-900 text-xs font-medium">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {diffDays > 0 ? (
                  <><strong>{diffDays} {diffDays === 1 ? 'day' : 'days'}</strong> until exam</>
                ) : diffDays === 0 ? (
                  <strong className="text-amber-700">Exam is Today!</strong>
                ) : (
                  <>Exam passed</>
                )}
              </span>
            </div>

            {/* Progress Bar & Mastered Stats */}
            <div className="hidden md:flex flex-col items-end min-w-[130px]">
              <div className="flex items-center space-x-1.5 text-xs text-slate-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-semibold text-slate-800">{doneCount}/{totalCount} Mastered</span>
                <span className="text-slate-400">({percentComplete}%)</span>
              </div>
              <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden mt-1 border border-slate-200">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${percentComplete}%` }}
                />
              </div>
            </div>

            {/* If there's an active in-progress reading topic, quick resume button */}
            {activeReadingTopic && (
              <button
                id="resume-reading-button"
                onClick={() => onOpenReader(activeReadingTopic)}
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors animate-pulse"
                title="Resume reading current topic"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="truncate max-w-[120px]">Reading: {activeReadingTopic.title}</span>
              </button>
            )}

            {/* Load Word/PDF Button */}
            <button
              id="upload-doc-button"
              onClick={onOpenUpload}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-colors"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Load Word Doc / PDF</span>
              <span className="sm:hidden">Load Doc</span>
            </button>

            {/* Quick Add Topic Button */}
            <button
              id="add-topic-button"
              onClick={onOpenAddTopic}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
              title="Add a custom topic"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Topic</span>
            </button>

            {/* Reset sample data */}
            <button
              id="reset-sample-button"
              onClick={onResetSampleData}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Reset sample courses & topics"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
