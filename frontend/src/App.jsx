import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import TicketList from './pages/TicketList';
import CreateTicket from './pages/CreateTicket';
import TicketDetail from './pages/TicketDetail';
import { Toaster } from 'react-hot-toast';
import { LifeBuoy } from 'lucide-react';

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 mb-4 shadow-inner">
        <LifeBuoy className="h-7 w-7 text-indigo-600 animate-spin-slow" />
      </div>
      <h1 className="font-display text-4xl font-black text-slate-900 dark:text-white">404</h1>
      <p className="mt-2 text-base font-semibold text-slate-500 dark:text-slate-400">Ticket not found</p>
      <p className="mt-1 text-sm text-slate-400 dark:text-slate-500 max-w-xs">
        Ticket not found. It may have been deleted or the link is incorrect.
      </p>
      <a
        href="/"
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all"
      >
        Back to all tickets
      </a>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();

  // Dark Mode Initialization
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Global Keyboard Shortcut: 'N' to navigate to new ticket
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }
      if (e.key === 'n' || e.key === 'N') {
        navigate('/tickets/new');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-300">
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<TicketList />} />
          <Route path="/tickets/new" element={<CreateTicket />} />
          <Route path="/tickets/:ticket_id" element={<TicketDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
