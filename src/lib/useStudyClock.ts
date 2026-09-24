import { Dispatch, SetStateAction, useEffect, useState } from 'react';

export const BREAK_AFTER_SECONDS = 30 * 60;
export const BREAK_LENGTH_SECONDS = 5 * 60;

/** Counts seconds while `active` and the tab is visible (time spent in another tab doesn't count). */
export function useStudyClock(active: boolean): [number, Dispatch<SetStateAction<number>>] {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') setSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [active]);

  return [seconds, setSeconds];
}
