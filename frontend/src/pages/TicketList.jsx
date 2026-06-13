import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getTickets } from '../api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { Search, SlidersHorizontal, Download, ArrowRight, ClipboardList, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const parseUTCDate = (dateStr) => {
  if (!dateStr) return new Date();
  if (dateStr.includes('T') && dateStr.includes('Z')) return new Date(dateStr);
  return new Date(dateStr.replace(' ', 'T') + 'Z');
};

export default function TicketList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchInputRef = useRef(null);

  // Retrieve initial states from search parameters to preserve filter/search state
  const initialStatus = searchParams.get('status') || 'All';
  const initialPriority = searchParams.get('priority') || 'All';
  const initialSearch = searchParams.get('search') || '';
  const initialPage = parseInt(searchParams.get('page')) || 1;

  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [priorityFilter, setPriorityFilter] = useState(initialPriority);
  const [searchVal, setSearchVal] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ total: 0, open: 0, in_progress: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isFirstMount = useRef(true);

  // Sync state back to SearchParams to preserve it on navigation
  useEffect(() => {
    const params = {};
    if (statusFilter !== 'All') params.status = statusFilter;
    if (priorityFilter !== 'All') params.priority = priorityFilter;
    if (debouncedSearch) params.search = debouncedSearch;
    if (page > 1) params.page = page;
    setSearchParams(params);
  }, [statusFilter, priorityFilter, debouncedSearch, page]);

  // Handle Debounce for Search
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const handler = setTimeout(() => {
      setDebouncedSearch(searchVal);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchVal]);

  // Keyboard shortcut: '/' to focus search bar
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Offline / Online listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch Tickets from API
  useEffect(() => {
    let active = true;
    const loadTickets = async () => {
      setLoading(true);
      setError(false);
      try {
        const data = await getTickets({
          status: statusFilter,
          priority: priorityFilter,
          search: debouncedSearch,
          page,
          limit: 8
        });
        if (active) {
          setTickets(data.tickets);
          setTotal(data.total);
          setSummary(data.summary);
        }
      } catch (err) {
        console.error(err);
        if (active) setError(true);
        toast.error((t) => (
          <div className="flex items-center justify-between gap-3">
            <span>Could not load tickets. Please refresh the page.</span>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                setRefreshKey(prev => prev + 1);
              }}
              className="rounded bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-red-500 transition-colors shadow"
            >
              Retry
            </button>
          </div>
        ), { duration: 10000 });
      } finally {
        if (active) setLoading(false);
      }
    };
    if (isOnline) {
      loadTickets();
    }
    return () => { active = false; };
  }, [statusFilter, priorityFilter, debouncedSearch, page, refreshKey, isOnline]);

  // Reset page to 1 when status or priority changes
  const handleStatusChange = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handlePriorityChange = (e) => {
    setPriorityFilter(e.target.value);
    setPage(1);
  };

  // CSV Export utility
  const handleExportCSV = () => {
    if (tickets.length === 0) {
      toast.error('No tickets to export');
      return;
    }
    
    // Headers
    const headers = ['Ticket ID', 'Customer Name', 'Customer Email', 'Subject', 'Priority', 'Status', 'Assignee', 'Tags', 'Created At'];
    
    // Rows
    const rows = tickets.map(t => [
      t.ticket_id,
      `"${t.customer_name.replace(/"/g, '""')}"`,
      t.customer_email,
      `"${t.subject.replace(/"/g, '""')}"`,
      t.priority,
      t.status,
      t.assignee ? `"${t.assignee.replace(/"/g, '""')}"` : 'Unassigned',
      t.tags ? `"${t.tags.replace(/"/g, '""')}"` : '',
      t.created_at
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `support_tickets_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Tickets exported as CSV');
  };

  const getEmptyStateText = () => {
    if (summary.total === 0) {
      return {
        title: 'No tickets yet',
        desc: 'Create your first support ticket to get started.'
      };
    }
    if (debouncedSearch) {
      return {
        title: 'No tickets match your search',
        desc: 'Try checking your spelling or clearing search terms.'
      };
    }
    if (statusFilter !== 'All' || priorityFilter !== 'All') {
      const parts = [];
      if (priorityFilter !== 'All') parts.push(priorityFilter);
      if (statusFilter !== 'All') parts.push(statusFilter);
      return {
        title: `No ${parts.join(' ')} tickets found`,
        desc: 'Try adjusting your status or priority filters.'
      };
    }
    return {
      title: 'No tickets found',
      desc: 'Try adjusting your filters or search query.'
    };
  };
  const emptyState = getEmptyStateText();

  const totalPages = Math.ceil(total / 8) || 1;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Banner / Greeting */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Agent Dashboard
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Monitor, prioritize, and resolve customer issues in real-time.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white active:scale-[0.98] transition-all"
        >
          <Download className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Ticket Count Summary Bar */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Total Card */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md dark:bg-slate-900/60 dark:hover:border-slate-700 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Tickets</p>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{summary.total}</h4>
            </div>
          </div>
        </div>

        {/* Open Card */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md dark:bg-slate-900/60 dark:hover:border-slate-700 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-450">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Open</p>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{summary.open}</h4>
            </div>
          </div>
        </div>

        {/* In Progress Card */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md dark:bg-slate-900/60 dark:hover:border-slate-700 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-450">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">In Progress</p>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{summary.in_progress}</h4>
            </div>
          </div>
        </div>

        {/* Closed Card */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md dark:bg-slate-900/60 dark:hover:border-slate-700 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Closed</p>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{summary.closed}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters panel */}
      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm md:flex-row md:items-center md:justify-between transition-colors duration-300">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by ID, name, email, subject, tag... (Press '/' to focus)"
            value={searchVal}
            disabled={!isOnline}
            onChange={(e) => setSearchVal(e.target.value)}
            className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 pl-10 pr-10 text-sm placeholder-slate-400 dark:placeholder-slate-500 text-slate-800 dark:text-slate-100 transition-all focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed"
          />
          {searchVal && (
            <button
              onClick={() => { setSearchVal(''); setDebouncedSearch(''); }}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
            >
              &times;
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <SlidersHorizontal className="h-4 w-4" />
            <span>Priority:</span>
            <select
              value={priorityFilter}
              onChange={handlePriorityChange}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-slate-200 dark:border-slate-800">
        <nav className="flex gap-6" aria-label="Tabs">
          {['All', 'Open', 'In Progress', 'Closed'].map((tab) => {
            const isActive = statusFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => handleStatusChange(tab)}
                className={`border-b-2 py-4 px-1 text-sm font-semibold transition-all ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Result Count */}
      <div className="mb-4 flex items-center justify-between px-1">
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          {!loading && !error && `Showing ${total === 0 ? 0 : (page - 1) * 8 + 1}-${Math.min(page * 8, total)} of ${total} tickets`}
        </span>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 p-10 text-center text-red-800 dark:text-red-400 shadow-sm transition-all duration-300">
          <p className="font-semibold text-sm">Could not load tickets. Please refresh the page.</p>
          <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-500 active:scale-[0.98] transition-all"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile Card Layout */}
          <div className="block sm:hidden space-y-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse space-y-3 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-12 rounded bg-slate-200 dark:bg-slate-800"></div>
                    <div className="h-5 w-16 rounded bg-slate-200 dark:bg-slate-800"></div>
                  </div>
                  <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800"></div>
                  <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-800"></div>
                  <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-800"></div>
                </div>
              ))
            ) : tickets.length === 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-slate-400 dark:text-slate-500">
                <div className="flex flex-col items-center justify-center gap-1.5 py-4">
                  <ClipboardList className="h-10 w-10 text-slate-300 dark:text-slate-700" />
                  {summary.total === 0 ? (
                    <>
                      <span className="font-semibold text-slate-500 dark:text-slate-400 text-sm">
                        No tickets yet. Create your first ticket to get started.
                      </span>
                      <button
                        onClick={() => navigate('/tickets/new')}
                        className="mt-2.5 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition-all"
                      >
                        New Ticket
                      </button>
                    </>
                  ) : debouncedSearch ? (
                    <>
                      <span className="font-semibold text-slate-500 dark:text-slate-400 text-sm">
                        No tickets match '{debouncedSearch}'. Try a different search.
                      </span>
                      <button
                        onClick={() => { setSearchVal(''); setDebouncedSearch(''); }}
                        className="mt-2.5 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                      >
                        <span>Clear Search</span>
                        <span className="text-sm font-semibold">&times;</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-slate-500 dark:text-slate-400 text-sm">
                        No {statusFilter !== 'All' ? statusFilter : ''} tickets found.
                      </span>
                      <button
                        onClick={() => { setStatusFilter('All'); setPriorityFilter('All'); }}
                        className="mt-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        View all tickets
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              tickets.map((ticket) => (
                <div
                  key={ticket.ticket_id}
                  onClick={() => navigate(`/tickets/${ticket.ticket_id}`)}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer space-y-2.5 transition-colors shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{ticket.ticket_id}</span>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {ticket.customer_name}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {ticket.subject}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                      {parseUTCDate(ticket.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                </div>
              ))
            )}

            {/* Mobile Pagination */}
            {!loading && tickets.length > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Prev
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors duration-300">
            <div className="min-w-full overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Ticket ID</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Subject & Tags</th>
                    <th className="px-6 py-4 text-center">Priority</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4">Assignee</th>
                    <th className="px-6 py-4">Created Date</th>
                    <th className="relative px-6 py-4"><span className="sr-only">View</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="whitespace-nowrap px-6 py-4.5">
                          <div className="h-4 w-12 rounded bg-slate-200 dark:bg-slate-800"></div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4.5">
                          <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800 mb-1.5"></div>
                          <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-800"></div>
                        </td>
                        <td className="px-6 py-4.5">
                          <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-800"></div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4.5 text-center">
                          <div className="h-5 w-16 mx-auto rounded bg-slate-200 dark:bg-slate-800"></div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4.5 text-center">
                          <div className="h-5 w-20 mx-auto rounded bg-slate-200 dark:bg-slate-800"></div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4.5">
                          <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-800"></div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4.5">
                          <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800"></div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4.5 text-right">
                          <div className="h-4 w-8 ml-auto rounded bg-slate-200 dark:bg-slate-800"></div>
                        </td>
                      </tr>
                    ))
                  ) : tickets.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-1.5 py-4">
                          <ClipboardList className="h-10 w-10 text-slate-350 dark:text-slate-700" />
                          {summary.total === 0 ? (
                            <>
                              <span className="font-semibold text-slate-500 dark:text-slate-400 text-sm">
                                No tickets yet. Create your first ticket to get started.
                              </span>
                              <button
                                onClick={() => navigate('/tickets/new')}
                                className="mt-2.5 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition-all"
                              >
                                New Ticket
                              </button>
                            </>
                          ) : debouncedSearch ? (
                            <>
                              <span className="font-semibold text-slate-500 dark:text-slate-400 text-sm">
                                No tickets match '{debouncedSearch}'. Try a different search.
                              </span>
                              <button
                                onClick={() => { setSearchVal(''); setDebouncedSearch(''); }}
                                className="mt-2.5 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-55 dark:hover:bg-slate-800 transition-all"
                              >
                                <span>Clear Search</span>
                                <span className="text-sm font-semibold">&times;</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="font-semibold text-slate-500 dark:text-slate-400 text-sm">
                                No {statusFilter !== 'All' ? statusFilter : ''} tickets found.
                              </span>
                              <button
                                onClick={() => { setStatusFilter('All'); setPriorityFilter('All'); }}
                                className="mt-2.5 text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:underline"
                              >
                                View all tickets
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    tickets.map((ticket) => (
                      <tr
                        key={ticket.ticket_id}
                        onClick={() => navigate(`/tickets/${ticket.ticket_id}`)}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            navigate(`/tickets/${ticket.ticket_id}`);
                          }
                        }}
                        className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 focus:bg-slate-50/80 dark:focus:bg-slate-800/40 focus:outline-none cursor-pointer transition-colors"
                      >
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                          {ticket.ticket_id}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{ticket.customer_name}</div>
                          <div className="text-xs text-slate-400 dark:text-slate-500">{ticket.customer_email}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 max-w-xs font-medium">
                          <div className="truncate">{ticket.subject}</div>
                          {ticket.tags && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {ticket.tags.split(',').map((tag) => (
                                <span key={tag} className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                                  {tag.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-center">
                          <PriorityBadge priority={ticket.priority} />
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-center">
                          <StatusBadge status={ticket.status} />
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
                          {ticket.assignee || (
                            <span className="italic text-slate-400 dark:text-slate-600">Unassigned</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-400 dark:text-slate-500 font-medium">
                          {parseUTCDate(ticket.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold">
                          <span className="flex items-center justify-end gap-1 text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>Details</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination bar */}
            {!loading && tickets.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-6 py-4">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Showing page {page} of {totalPages} ({total} total)
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
