import React from 'react';

export default function PriorityBadge({ priority }) {
  let styles = 'bg-slate-100 text-slate-700 ring-slate-600/10'; // Default Low
  
  if (priority === 'High') {
    styles = 'bg-rose-50 text-rose-700 ring-rose-600/20';
  } else if (priority === 'Medium') {
    styles = 'bg-yellow-50 text-yellow-800 ring-yellow-600/20';
  }

  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles}`}>
      {priority}
    </span>
  );
}
