import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import TicketList from './pages/TicketList';
import CreateTicket from './pages/CreateTicket';
import TicketDetail from './pages/TicketDetail';
import { Toaster } from 'react-hot-toast';
import { LifeBuoy } from 'lucide-react';

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4 shadow-inner">
        <LifeBuoy className="h-7 w-7 text-indigo-600 animate-spin-slow" />
      </div>
      <h1 className="font-display text-4xl font-black text-slate-900">404</h1>
      <p className="mt-2 text-base font-semibold text-slate-500">Page not found</p>
      <p className="mt-1 text-sm text-slate-400 max-w-xs">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <a
        href="/"
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all"
      >
        Go back home
      </a>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
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
