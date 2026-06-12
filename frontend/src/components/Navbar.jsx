import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LifeBuoy, Plus, Sun, Moon } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains('dark')
  );

  const toggleDarkMode = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand/Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white transition-all group-hover:scale-105 shadow-sm shadow-indigo-200 dark:shadow-none">
            <LifeBuoy className="h-6 w-6 animate-pulse-slow" />
          </div>
          <span className="font-display text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white transition-colors">
            Data<span className="text-blue-600 dark:text-blue-500">straw</span>
          </span>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleDarkMode}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all"
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-indigo-600" />}
          </button>

          {/* CTA Button */}
          {location.pathname !== '/tickets/new' && (
            <Link
              to="/tickets/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>New Ticket</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
