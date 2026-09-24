import { FormEvent, useState } from 'react';
import { ArrowRight, CheckCircle2, Columns3, Gauge, Timer } from 'lucide-react';
import { User } from '../types';
import { login, register } from '../lib/auth';
import { Theme } from '../lib/theme';
import { LEVELS, btnPrimary, inputCls, labelCls } from '../lib/ui';
import { Logo, ThemeToggle } from './common';

interface AuthPageProps {
  onAuthenticated: (user: User) => void;
  theme: Theme;
  onToggleTheme: () => void;
}

const FEATURES = [
  { icon: Columns3, text: 'A Kanban study board: Course → In Process → Done' },
  { icon: Gauge, text: 'Live reading progress for every topic and course' },
  { icon: CheckCircle2, text: 'Max 2 courses at a time, so you finish what you start' },
  { icon: Timer, text: 'Optional break reminders every 30 minutes' },
];

export function AuthPage({ onAuthenticated, theme, onToggleTheme }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [level, setLevel] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';

  const switchMode = () => {
    setMode(isRegister ? 'login' : 'register');
    setError('');
    setPassword('');
    setConfirm('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
      if (!name.trim()) return setError('Please enter your full name.');
      if (!level) return setError('Please select your level.');
      if (password.length < 6) return setError('Password must be at least 6 characters.');
      if (password !== confirm) return setError('Passwords do not match.');
    }

    setBusy(true);
    try {
      const user = isRegister ? await register({ name, email, level, password }) : await login(email, password);
      onAuthenticated(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <aside className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 p-12 text-white lg:flex">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/5" />
        <Logo light />
        <div className="relative">
          <h1 className="text-4xl leading-tight font-black">
            Study one course at a time.
            <br />
            <span className="text-blue-200">Finish every topic.</span>
          </h1>
          <ul className="mt-8 space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-blue-50">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="h-5 w-5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-blue-200">Built on the Kanban principle: stop starting, start finishing.</p>
      </aside>

      {/* Form */}
      <main className="flex flex-1 flex-col bg-white dark:bg-slate-950">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <div className="lg:invisible">
            <Logo />
          </div>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>

        <div className="flex flex-1 items-center justify-center px-4 pb-12 sm:px-6">
          <div className="w-full max-w-sm">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {isRegister ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {isRegister ? 'Set up your profile and start studying.' : 'Sign in to continue to your dashboard.'}
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              {isRegister && (
                <div>
                  <label htmlFor="name" className={labelCls}>Full name</label>
                  <input id="name" className={inputCls} value={name} onChange={e => setName(e.target.value)} autoComplete="name" placeholder="e.g. Takow Brilliant" required />
                </div>
              )}
              <div>
                <label htmlFor="email" className={labelCls}>Email</label>
                <input id="email" type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" placeholder="you@university.edu" required />
              </div>
              {isRegister && (
                <div>
                  <label htmlFor="level" className={labelCls}>Level</label>
                  <select id="level" className={inputCls} value={level} onChange={e => setLevel(e.target.value)} required>
                    <option value="" disabled>Select your level</option>
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label htmlFor="password" className={labelCls}>Password</label>
                <input id="password" type="password" className={inputCls} value={password} onChange={e => setPassword(e.target.value)} autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder={isRegister ? 'At least 6 characters' : '••••••••'} required />
              </div>
              {isRegister && (
                <div>
                  <label htmlFor="confirm" className={labelCls}>Confirm password</label>
                  <input id="confirm" type="password" className={inputCls} value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" required />
                </div>
              )}

              {error && (
                <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  {error}
                </p>
              )}

              <button type="submit" disabled={busy} className={`${btnPrimary} w-full py-3`}>
                {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
                {!busy && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              {isRegister ? 'Already have an account?' : 'New to GO STUDY?'}{' '}
              <button onClick={switchMode} className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
                {isRegister ? 'Sign in' : 'Create an account'}
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
