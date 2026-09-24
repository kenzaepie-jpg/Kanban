// Shared Tailwind class strings so buttons, inputs and cards look the same everywhere.

const btn =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50';

export const btnPrimary = `${btn} bg-blue-600 text-white shadow-sm hover:bg-blue-700`;
export const btnSecondary =
  `${btn} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 ` +
  'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700';
export const btnGhost = `${btn} text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800`;
export const btnDanger =
  `${btn} bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/70`;

export const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 ' +
  'focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15 ' +
  'dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500';

export const labelCls = 'mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300';

export const cardCls =
  'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';

export const LEVELS = ['Level 100', 'Level 200', 'Level 300', 'Level 400', 'Level 500', 'Masters', 'PhD'];

export const COURSE_COLORS = ['#2563eb', '#0ea5e9', '#4f46e5', '#0891b2', '#7c3aed', '#059669', '#ea580c', '#db2777'];
