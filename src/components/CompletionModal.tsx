import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy } from 'lucide-react';
import { Course } from '../types';
import { btnPrimary, btnSecondary } from '../lib/ui';

interface CompletionModalProps {
  course: Course;
  onClose: () => void;
  onBeginNext: () => void;
}

export function CompletionModal({ course, onClose, onBeginNext }: CompletionModalProps) {
  useEffect(() => {
    confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 }, colors: ['#2563eb', '#60a5fa', '#ffffff', course.color] });
  }, [course.color]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div role="alertdialog" aria-modal="true" aria-label="Course completed" className="animate-pop-in w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl dark:bg-slate-900">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white">
          <Trophy className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">Course completed!</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          You finished every topic in <strong className="text-slate-800 dark:text-slate-200">{course.title}</strong>.
          It has left your study board, so you can take up your next course.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button onClick={onBeginNext} className={btnPrimary}>Begin next course</button>
          <button onClick={onClose} className={btnSecondary}>Back to board</button>
        </div>
      </div>
    </div>
  );
}
