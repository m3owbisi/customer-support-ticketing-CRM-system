import React, { useEffect, useState } from 'react';
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
      <p className="mt-2 text-base font-semibold text-slate-500 dark:text-slate-400">Page not found</p>
      <p className="mt-1 text-sm text-slate-400 dark:text-slate-500 max-w-xs">
        The page you're looking for doesn't exist.
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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOnlineStatus, setShowOnlineStatus] = useState(false);

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

  // Online / Offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineStatus(true);
      const timer = setTimeout(() => {
        setShowOnlineStatus(false);
      }, 3000);
      return () => clearTimeout(timer);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineStatus(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-300">
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Navbar />
      
      {/* Offline/Online Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-center py-2 text-sm font-semibold transition-all duration-200 sticky top-0 z-50 shadow-md">
          You're offline. Changes won't be saved until your connection is restored.
        </div>
      )}
      {isOnline && showOnlineStatus && (
        <div className="bg-emerald-500 text-white text-center py-2 text-sm font-semibold transition-all duration-200 sticky top-0 z-50 shadow-md">
          Back online
        </div>
      )}

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
