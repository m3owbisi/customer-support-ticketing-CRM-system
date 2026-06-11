import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LifeBuoy, Plus } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand/Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white transition-all group-hover:scale-105 shadow-sm shadow-indigo-200">
            <LifeBuoy className="h-5 w-5 animate-pulse-slow" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
            Support<span className="text-indigo-600">Flow</span>
          </span>
        </Link>

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
    </header>
  );
}
