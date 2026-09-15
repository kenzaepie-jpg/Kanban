import React, { useEffect } from 'react';
import { Course, Topic } from '../types';
import { Trophy, CheckCircle2, Sparkles, X, RotateCcw, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExamCelebrationModalProps {
  course: Course;
  topics: Topic[];
  onClose: () => void;
  onResetCourseProgress: () => void;
}

export const ExamCelebrationModal: React.FC<ExamCelebrationModalProps> = ({
  course,
  topics,
  onClose,
  onResetCourseProgress,
}) => {
  useEffect(() => {
    // Multi-stage confetti celebration
    const count = 200;
    const defaults = {
      origin: { y: 0.7 }
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  }, []);

  const totalMinutes = topics.reduce((acc, t) => acc + (t.estimatedMinutes || 20), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-emerald-100 overflow-hidden text-center p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Trophy Icon */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-100/70 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-5 shadow-inner">
          <Trophy className="w-10 h-10" />
        </div>

        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
          <Sparkles className="w-3 h-3 mr-1.5" /> 100% Kanban Mastery
        </span>

        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
          You are Ready for the Exam!
        </h3>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Every single topic, Word doc, and PDF in <span className="font-bold text-slate-900">{course.title}</span> has been progressed through the Kanban board to <span className="font-semibold text-emerald-600">Done & Mastered</span>!
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <span className="text-2xl font-extrabold text-slate-900">{topics.length}</span>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">Topics Mastered</p>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <span className="text-2xl font-extrabold text-indigo-600">~{totalMinutes}m</span>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">Study Time Invested</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 transition-all flex items-center justify-center space-x-2"
          >
            <span>Review Kanban Board</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (window.confirm('Reset all topics in this course back to "Not Done" to practice again?')) {
                onResetCourseProgress();
                onClose();
              }
            }}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center justify-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-run Course Study Cycle</span>
          </button>
        </div>
      </div>
    </div>
  );
};
