import { ReactNode, useEffect, useRef, useState } from 'react';
import { BookOpenCheck, FileText, Moon, Sun, Upload, X } from 'lucide-react';
import { Theme } from '../lib/theme';
import { ACCEPTED_FILES, isSupportedFile } from '../lib/fileParser';

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${light ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
        <BookOpenCheck className="h-5 w-5" />
      </div>
      <span className={`text-lg font-black tracking-tight ${light ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
        GO <span className={light ? 'text-blue-200' : 'text-blue-600 dark:text-blue-400'}>STUDY</span>
      </span>
    </div>
  );
}

export function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const dark = theme === 'dark';
  return (
    <button
      onClick={onToggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

export function ProgressBar({ value, color, className = 'h-2' }: { value: number; color?: string; className?: string }) {
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-blue-600 transition-[width] duration-500"
        style={{ width: `${value}%`, ...(color ? { backgroundColor: color } : {}) }}
      />
    </div>
  );
}

interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
}

export function Modal({ title, subtitle, onClose, children, footer, size = 'md' }: ModalProps) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={e => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`animate-pop-in flex max-h-[90vh] w-full flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 ${size === 'lg' ? 'max-w-2xl' : 'max-w-md'}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">{footer}</div>
        )}
      </div>
    </div>
  );
}

/** Drag-and-drop or click-to-browse picker for course files. */
export function FileDrop({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (list: FileList | null) => {
    if (!list) return;
    onChange([...files, ...Array.from(list).filter(isSupportedFile)]);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setDragging(false);
          add(e.dataTransfer.files);
        }}
        className={`flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
          dragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
            : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-700 dark:hover:bg-slate-800/60'
        }`}
      >
        <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Drop files here or click to browse</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">PDF, Word (.docx), .txt or .md. Each file becomes one topic.</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_FILES}
        className="hidden"
        onChange={e => {
          add(e.target.files);
          e.target.value = '';
        }}
      />
      {files.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
            >
              <FileText className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <span className="flex-1 truncate text-slate-700 dark:text-slate-200">{file.name}</span>
              <span className="text-xs text-slate-400">{Math.max(1, Math.round(file.size / 1024))} KB</span>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() => onChange(files.filter((_, j) => j !== i))}
                className="rounded p-0.5 text-slate-400 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export interface ToastData {
  id: number;
  text: string;
  tone: 'info' | 'success' | 'error';
}

export function Toast({ toast }: { toast: ToastData }) {
  const tones = {
    info: 'bg-white text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700',
    success: 'bg-blue-600 text-white border-blue-700',
    error: 'bg-red-600 text-white border-red-700',
  };
  return (
    <div role="status" className="fixed bottom-5 left-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
      <div key={toast.id} className={`animate-pop-in rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${tones[toast.tone]}`}>
        {toast.text}
      </div>
    </div>
  );
}
