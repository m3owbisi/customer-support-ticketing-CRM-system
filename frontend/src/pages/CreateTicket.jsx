import React, { useState } from 'react';
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
    assignee: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const tempErrors = {};
    if (!formData.customer_name.trim()) {
      tempErrors.customer_name = 'Customer name is required';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.customer_email.trim()) {
      tempErrors.customer_email = 'Email address is required';
    } else if (!emailRegex.test(formData.customer_email.trim())) {
      tempErrors.customer_email = 'Please enter a valid email address';
    }
    
    if (!formData.subject.trim()) {
      tempErrors.subject = 'Ticket subject is required';
    }
    
    if (!formData.description.trim()) {
      tempErrors.description = 'Issue description is required';
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
      return;
    }

    setLoading(true);
    try {
      const result = await createTicket(formData);
      toast.success(`Ticket Created: ${result.ticket_id}`, {
        duration: 5000,
        position: 'top-right'
      });
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </button>

      {/* Main Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3 border-b border-slate-100 pb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <LifeBuoy className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              Create New Support Ticket
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Log a new issue for a customer to begin tracking it.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Customer Name */}
            <div>
              <label htmlFor="customer_name" className="block text-sm font-semibold text-slate-700">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="customer_name"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                placeholder="Jane Doe"
                className={`mt-1.5 block w-full rounded-lg border bg-slate-50 px-3.5 py-2 text-sm placeholder-slate-400 outline-none transition-all focus:bg-white focus:ring-1 ${
                  errors.customer_name
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {errors.customer_name && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{errors.customer_name}</p>
              )}
            </div>

            {/* Customer Email */}
            <div>
              <label htmlFor="customer_email" className="block text-sm font-semibold text-slate-700">
                Customer Email <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="customer_email"
                name="customer_email"
                value={formData.customer_email}
                onChange={handleChange}
                placeholder="jane.doe@example.com"
                className={`mt-1.5 block w-full rounded-lg border bg-slate-50 px-3.5 py-2 text-sm placeholder-slate-400 outline-none transition-all focus:bg-white focus:ring-1 ${
                  errors.customer_email
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500'
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
              <label htmlFor="priority" className="block text-sm font-semibold text-slate-700">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            {/* Assignee Field (free text option) */}
            <div>
              <label htmlFor="assignee" className="block text-sm font-semibold text-slate-700">
                Assignee Name
              </label>
              <input
                type="text"
                id="assignee"
                name="assignee"
                value={formData.assignee}
                onChange={handleChange}
                placeholder="Agent name (optional)"
                className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm placeholder-slate-400 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-semibold text-slate-700">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="e.g. Dashboard crashes on export"
              className={`mt-1.5 block w-full rounded-lg border bg-slate-50 px-3.5 py-2 text-sm placeholder-slate-400 outline-none transition-all focus:bg-white focus:ring-1 ${
                errors.subject
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500'
              }`}
            />
            {errors.subject && (
              <p className="mt-1.5 text-xs font-medium text-red-600">{errors.subject}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-slate-700">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows="5"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide a detailed description of the customer's issue..."
              className={`mt-1.5 block w-full rounded-lg border bg-slate-50 px-3.5 py-2 text-sm placeholder-slate-400 outline-none transition-all focus:bg-white focus:ring-1 ${
                errors.description
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500'
              }`}
            ></textarea>
            {errors.description && (
              <p className="mt-1.5 text-xs font-medium text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              <Send className="h-4 w-4" />
              <span>{loading ? 'Creating...' : 'Create Ticket'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
