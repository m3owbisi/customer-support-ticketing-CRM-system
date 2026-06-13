import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTicket } from '../api';
import { ArrowLeft, LifeBuoy, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateTicket() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    subject: '',
    description: '',
    priority: 'Medium',
    assignee: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  const validate = () => {
    const tempErrors = {};
    if (!formData.customer_name.trim()) {
      tempErrors.customer_name = 'Customer name is required';
    } else if (formData.customer_name.trim().length < 2) {
      tempErrors.customer_name = 'Customer name must be at least 2 characters';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.customer_email.trim()) {
      tempErrors.customer_email = 'Email address is required';
    } else if (!emailRegex.test(formData.customer_email.trim())) {
      tempErrors.customer_email = 'Please enter a valid email address';
    }
    
    if (!formData.subject.trim()) {
      tempErrors.subject = 'Subject is required';
    } else if (formData.subject.trim().length < 5) {
      tempErrors.subject = 'Subject must be at least 5 characters';
    }
    
    if (!formData.description.trim()) {
      tempErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      tempErrors.description = 'Description must be at least 10 characters';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error inline when typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors in the form');
      setTimeout(() => {
        const firstErrorField = document.querySelector('.border-red-350, .border-red-500, .border-red-300, .border-red-800');
        if (firstErrorField) {
          firstErrorField.focus();
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return;
    }

    setLoading(true);
    try {
      const result = await createTicket(formData);
      
      if (window.gtag) {
        window.gtag('event', 'ticket_created', {
          ticket_id: result.ticket_id,
          priority: formData.priority,
          assignee: formData.assignee || 'Unassigned'
        });
      }

      toast.success(`Ticket ${result.ticket_id} created successfully`, {
        duration: 4000,
        position: 'top-right'
      });
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </button>

      {/* Main Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8 transition-colors duration-300">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <LifeBuoy className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Create New Support Ticket
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Log a new issue for a customer to begin tracking it.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Customer Name */}
            <div>
              <label htmlFor="customer_name" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="customer_name"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                placeholder="Jane Doe"
                className={`mt-1.5 block w-full rounded-lg border bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none transition-all focus:bg-white dark:focus:bg-slate-900 focus:ring-1 ${
                  errors.customer_name
                    ? 'border-red-300 dark:border-red-800 focus:border-red-500 focus:ring-red-500'
                    : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {errors.customer_name && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{errors.customer_name}</p>
              )}
            </div>

            {/* Customer Email */}
            <div>
              <label htmlFor="customer_email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Customer Email <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="customer_email"
                name="customer_email"
                value={formData.customer_email}
                onChange={handleChange}
                placeholder="jane.doe@example.com"
                className={`mt-1.5 block w-full rounded-lg border bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none transition-all focus:bg-white dark:focus:bg-slate-900 focus:ring-1 ${
                  errors.customer_email
                    ? 'border-red-300 dark:border-red-800 focus:border-red-500 focus:ring-red-500'
                    : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {errors.customer_email && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{errors.customer_email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Priority Select */}
            <div>
              <label htmlFor="priority" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="mt-1.5 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 outline-none transition-all focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            {/* Assignee Field (free text option) */}
            <div>
              <label htmlFor="assignee" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Assignee Name
              </label>
              <input
                type="text"
                id="assignee"
                name="assignee"
                value={formData.assignee}
                onChange={handleChange}
                placeholder="Agent name (optional)"
                className="mt-1.5 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none transition-all focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Tags
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g. billing, bug, feature-request (comma separated)"
              className="mt-1.5 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none transition-all focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="e.g. Dashboard crashes on export"
              className={`mt-1.5 block w-full rounded-lg border bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none transition-all focus:bg-white dark:focus:bg-slate-900 focus:ring-1 ${
                errors.subject
                  ? 'border-red-300 dark:border-red-800 focus:border-red-500 focus:ring-red-500'
                  : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500'
              }`}
            />
            {errors.subject && (
              <p className="mt-1.5 text-xs font-medium text-red-600">{errors.subject}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows="5"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide a detailed description of the customer's issue..."
              className={`mt-1.5 block w-full rounded-lg border bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none transition-all focus:bg-white dark:focus:bg-slate-900 focus:ring-1 ${
                errors.description
                  ? 'border-red-300 dark:border-red-800 focus:border-red-500 focus:ring-red-500'
                  : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500'
              }`}
            ></textarea>
            {errors.description && (
              <p className="mt-1.5 text-xs font-medium text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-6">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-750 hover:text-slate-900 dark:hover:text-white active:scale-[0.98] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isOnline}
              title={!isOnline ? "Waiting for connection…" : ""}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              <Send className="h-4 w-4" />
              <span>{!isOnline ? 'Waiting for connection…' : loading ? 'Creating...' : 'Create Ticket'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
