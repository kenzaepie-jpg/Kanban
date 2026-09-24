import { Columns3, LayoutDashboard, LogOut } from 'lucide-react';
import { User } from '../types';
import { Theme } from '../lib/theme';
import { WIP_LIMIT } from '../lib/progress';
import { Logo, ThemeToggle } from './common';

export type View = 'dashboard' | 'board';

interface HeaderProps {
  user: User;
  view: View;
  onNavigate: (view: View) => void;
  boardCount: number;
  theme: Theme;
  onToggleTheme: () => void;
  onLogout: () => void;
}

export function Header({ user, view, onNavigate, boardCount, theme, onToggleTheme, onLogout }: HeaderProps) {
  const tab = (target: View) =>
    `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
      view === target
        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <button onClick={() => onNavigate('dashboard')} aria-label="GO STUDY home" className="shrink-0">
          <Logo />
        </button>

        <nav className="ml-2 flex items-center gap-1 sm:ml-6">
          <button className={tab('dashboard')} onClick={() => onNavigate('dashboard')}>
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <button className={tab('board')} onClick={() => onNavigate('board')}>
            <Columns3 className="h-4 w-4" />
            <span className="hidden sm:inline">Study Board</span>
            <span className="rounded-md bg-blue-600 px-1.5 py-0.5 text-[11px] leading-none font-bold text-white">
              {boardCount}/{WIP_LIMIT}
            </span>
          </button>
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <div className="hidden items-center gap-2.5 border-l border-slate-200 pl-3 md:flex dark:border-slate-700">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-900/60 dark:text-blue-200">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="leading-tight">
              <p className="max-w-[10rem] truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{user.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user.level}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Log out"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
