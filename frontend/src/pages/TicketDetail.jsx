import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTicketDetails, updateTicket } from '../api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { ArrowLeft, User, Calendar, Mail, FileText, Send, MessageSquare, Clipboard, Edit2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TicketDetail() {
  const { ticket_id } = useParams();
  const navigate = useNavigate();
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Edit states
  const [isEditingAssignee, setIsEditingAssignee] = useState(false);
  const [editedAssignee, setEditedAssignee] = useState('');
  
  const [isEditingPriority, setIsEditingPriority] = useState(false);
  const [editedPriority, setEditedPriority] = useState('Medium');

  useEffect(() => {
    loadTicket();
  }, [ticket_id]);

  const loadTicket = async () => {
    setLoading(true);
    try {
      const data = await getTicketDetails(ticket_id);
      setTicket(data);
      setEditedAssignee(data.assignee || '');
      setEditedPriority(data.priority || 'Medium');
    } catch (err) {
      console.error(err);
      toast.error('Failed to load ticket details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  // Instant Status update handler
  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      await updateTicket(ticket_id, { status: newStatus });
      
      if (window.gtag) {
        window.gtag('event', 'ticket_updated', {
          ticket_id: ticket_id,
          status: newStatus
        });
      }

      setTicket(prev => ({ ...prev, status: newStatus }));
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  // Assignee save handler
  const handleSaveAssignee = async () => {
    try {
      await updateTicket(ticket_id, { assignee: editedAssignee });
      
      if (window.gtag) {
        window.gtag('event', 'ticket_updated', {
          ticket_id: ticket_id,
          assignee: editedAssignee || 'Unassigned'
        });
      }

      setTicket(prev => ({ ...prev, assignee: editedAssignee || null }));
      setIsEditingAssignee(false);
      toast.success('Assignee updated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update assignee');
    }
  };

  // Priority save handler
  const handleSavePriority = async () => {
    try {
      await updateTicket(ticket_id, { priority: editedPriority });
      
      if (window.gtag) {
        window.gtag('event', 'ticket_updated', {
          ticket_id: ticket_id,
          priority: editedPriority
        });
      }

      setTicket(prev => ({ ...prev, priority: editedPriority }));
      setIsEditingPriority(false);
      toast.success('Priority updated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update priority');
    }
  };

  // Note submission handler
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSubmittingNote(true);
    try {
      await updateTicket(ticket_id, { note_text: newNote });
      // Reload details to pull updated notes list
      const updatedData = await getTicketDetails(ticket_id);
      setTicket(updatedData);
      setNewNote('');
      toast.success('Note added successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add note');
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
        <span className="text-sm font-semibold text-slate-400">Loading ticket {ticket_id}...</span>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back Link */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to List</span>
      </button>

      {/* Header Info */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-display text-2xl font-black text-slate-900">{ticket.ticket_id}</span>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-slate-900 leading-tight">
            {ticket.subject}
          </h1>
        </div>

        {/* Status Dropdown Update */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Update Status:</span>
          <select
            value={ticket.status}
            onChange={handleStatusChange}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
          >
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Main Grid split layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* Left Side: Ticket Metadata & Description */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer / Ticket Details Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
              <Clipboard className="h-5 w-5 text-indigo-600" />
              <span>Ticket details</span>
            </h3>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Customer Name</p>
                  <p className="text-sm font-semibold text-slate-800">{ticket.customer_name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Customer Email</p>
                  <a href={`mailto:${ticket.customer_email}`} className="text-sm font-semibold text-indigo-600 hover:underline">
                    {ticket.customer_email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Created Date</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {new Date(ticket.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Last Updated</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {new Date(ticket.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Assignee Field (Inline edit) */}
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-slate-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Assignee</p>
                  {isEditingAssignee ? (
                    <div className="mt-1 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editedAssignee}
                        onChange={(e) => setEditedAssignee(e.target.value)}
                        placeholder="Agent Name"
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                      />
                      <button onClick={handleSaveAssignee} className="rounded-md bg-emerald-50 p-1.5 text-emerald-600 hover:bg-emerald-100">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => { setEditedAssignee(ticket.assignee || ''); setIsEditingAssignee(false); }} className="rounded-md bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">
                        {ticket.assignee || <span className="italic text-slate-400">Unassigned</span>}
                      </span>
                      <button
                        onClick={() => setIsEditingAssignee(true)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Priority Field (Inline edit) */}
              <div className="flex items-start gap-3">
                <Clipboard className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Priority</p>
                  {isEditingPriority ? (
                    <div className="mt-1 flex items-center gap-1.5">
                      <select
                        value={editedPriority}
                        onChange={(e) => setEditedPriority(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                      <button onClick={handleSavePriority} className="rounded-md bg-emerald-50 p-1.5 text-emerald-600 hover:bg-emerald-100">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => { setEditedPriority(ticket.priority); setIsEditingPriority(false); }} className="rounded-md bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">
                        {ticket.priority}
                      </span>
                      <button
                        onClick={() => setIsEditingPriority(true)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Description Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
              <FileText className="h-5 w-5 text-indigo-600" />
              <span>Description</span>
            </h3>
            <p className="text-sm font-medium text-slate-600 whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </p>
          </div>
        </div>

        {/* Right Side: Timeline & Notes */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col h-[500px]">
            <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4 mb-4 shrink-0">
              <MessageSquare className="h-5 w-5 text-indigo-600" />
              <span>Internal Notes</span>
            </h3>

            {/* Scrollable list of notes */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
              {ticket.notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center gap-1.5">
                  <MessageSquare className="h-8 w-8 text-slate-300" />
                  <span className="font-semibold text-sm">No notes yet</span>
                  <span className="text-xs">Add a note below to log updates</span>
                </div>
              ) : (
                ticket.notes.map((note, idx) => (
                  <div key={idx} className="rounded-lg bg-slate-50 p-3.5 border border-slate-100">
                    <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap leading-normal">
                      {note.note_text}
                    </p>
                    <div className="mt-2 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                      {new Date(note.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Note Input Form */}
            <form onSubmit={handleAddNote} className="shrink-0 border-t border-slate-100 pt-4">
              <div className="relative">
                <textarea
                  rows="2"
                  placeholder="Type a new note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-12 text-sm placeholder-slate-400 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                ></textarea>
                <button
                  type="submit"
                  disabled={submittingNote || !newNote.trim()}
                  className="absolute right-2.5 bottom-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
