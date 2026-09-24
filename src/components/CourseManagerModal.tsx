import React, { useState } from 'react';
import { Course } from '../types';
import { daysUntil, toLocalISODate } from '../utils/dates';
import { X, Plus, Calendar, GraduationCap, Trash2, Check } from 'lucide-react';

interface CourseManagerModalProps {
  courses: Course[];
  activeCourseId: string;
  onSelectCourse: (courseId: string) => void;
  onClose: () => void;
  onAddCourse: (course: Omit<Course, 'id' | 'createdAt'>) => void;
  onDeleteCourse: (courseId: string) => void;
}

const PRESET_COLORS = [
  '#059669', // Emerald
  '#4f46e5', // Indigo
  '#d97706', // Amber
  '#dc2626', // Red
  '#0284c7', // Sky
  '#7c3aed', // Violet
  '#db2777', // Pink
];

export const CourseManagerModal: React.FC<CourseManagerModalProps> = ({
  courses,
  activeCourseId,
  onSelectCourse,
  onClose,
  onAddCourse,
  onDeleteCourse,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [examDate, setExamDate] = useState(
    toLocalISODate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
  );
  const [color, setColor] = useState(PRESET_COLORS[1]);

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) return;

    onAddCourse({
      title: title.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim(),
      examDate,
      color,
    });

    setIsCreating(false);
    setTitle('');
    setCode('');
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Manage Exam Courses</h3>
              <p className="text-xs text-slate-500">Switch or organize your subjects and exam target dates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          
          {/* Courses List */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Your Enrolled Courses:
            </label>
            {courses.map((c) => {
              const isSelected = c.id === activeCourseId;
              const daysLeft = daysUntil(c.examDate);

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectCourse(c.id);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-300'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div
                      className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: c.color }}
                    >
                      {c.code.slice(0, 3)}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">{c.code}</span>
                        <span className="text-xs text-slate-600 truncate">{c.title}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Exam: {c.examDate}</span>
                        <span>•</span>
                        <span className="font-medium text-slate-600">
                          {daysLeft > 0 ? `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} away` : daysLeft === 0 ? 'Exam is today!' : 'Exam passed'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {isSelected && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                        <Check className="w-3 h-3 mr-1" /> Active
                      </span>
                    )}

                    {courses.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete course "${c.title}" and its topics?`)) {
                            onDeleteCourse(c.id);
                          }
                        }}
                        className="p-1.5 text-slate-300 hover:text-rose-600 rounded hover:bg-white transition-colors"
                        title="Delete Course"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* New Course Form Toggle */}
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-indigo-400 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-slate-50/50 flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Course</span>
            </button>
          ) : (
            <form onSubmit={handleCreateCourse} className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 space-y-3">
              <h4 className="text-xs font-bold text-slate-900">Create New Course</h4>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Code:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CHEM-201"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 uppercase bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Course Title:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Organic Chemistry II Final"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Exam Date:</label>
                <input
                  type="date"
                  required
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Accent Color:</label>
                <div className="flex items-center space-x-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-offset-2 ring-indigo-500' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  Save Course
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
