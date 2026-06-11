import React from 'react';

export default function StatusBadge({ status }) {
  let styles = 'bg-blue-50 text-blue-700 ring-blue-600/20'; // Default Open
  
  if (status === 'In Progress') {
    styles = 'bg-amber-50 text-amber-800 ring-amber-600/20';
  } else if (status === 'Closed') {
    styles = 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
  }

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${styles}`}>
      {status}
    </span>
  );
}
