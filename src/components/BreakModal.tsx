import { useEffect, useState } from 'react';
import { Coffee, Play } from 'lucide-react';
import { BREAK_LENGTH_SECONDS } from '../lib/useStudyClock';
import { formatDuration } from '../lib/progress';
import { btnPrimary, btnSecondary } from '../lib/ui';

interface BreakModalProps {
  /** When the running break ends (ms timestamp), or null while only suggesting a break. */
  breakEndsAt: number | null;
  onStartBreak: () => void;
  onKeepStudying: () => void;
  onEndBreak: () => void;
}

export function BreakModal({ breakEndsAt, onStartBreak, onKeepStudying, onEndBreak }: BreakModalProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!breakEndsAt) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [breakEndsAt]);

  const remaining = breakEndsAt ? Math.max(0, Math.ceil((breakEndsAt - now) / 1000)) : 0;
  const breakOver = breakEndsAt !== null && remaining === 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-blue-950/60 p-4 backdrop-blur-sm">
      <div role="alertdialog" aria-modal="true" aria-label="Break reminder" className="animate-pop-in w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl dark:bg-slate-900">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
          <Coffee className="h-8 w-8" />
        </div>

        {breakEndsAt === null ? (
          <>
            <h2 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">Time for a break</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              You've been studying for 30 minutes. A short break helps you remember more.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button onClick={onStartBreak} className={btnPrimary}>Start a 5-minute break</button>
              <button onClick={onKeepStudying} className={btnSecondary}>Keep studying</button>
            </div>
          </>
        ) : (
          <>
            <h2 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">{breakOver ? 'Break is over' : 'On a break'}</h2>
            <p className="mt-4 font-mono text-5xl font-black text-blue-600 dark:text-blue-400">
              {formatDuration(breakOver ? 0 : remaining || BREAK_LENGTH_SECONDS)}
            </p>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              {breakOver ? 'Ready to get back to it?' : 'Stretch, drink some water, rest your eyes.'}
            </p>
            <button onClick={onEndBreak} className={`${breakOver ? btnPrimary : btnSecondary} mt-6 w-full`}>
              <Play className="h-4 w-4 fill-current" /> {breakOver ? 'Back to studying' : 'End break early'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
