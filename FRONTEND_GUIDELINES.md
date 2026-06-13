# Frontend Design System & Guidelines
## Support CRM System — Datastraw Technologies

**Stack**: React 18 + Vite + Tailwind CSS 3.4  
**Audience**: Internal support teams — professional, functional, no-frills  
**Style**: Clean, minimal, high-information-density  
**Last Updated**: June 2025

---

## 1. Design Principles

### 1. Clarity
Every element has a clear, singular purpose. Labels are explicit ("Customer Email", not "Email"). Status is always visible without hovering. Empty states explain what to do next — they never leave the user stranded.

### 2. Efficiency
Support agents move fast. The most common action (create ticket) is always one click from any screen. Search is visible without scrolling. Filter tabs require one click — no dropdowns to open.

### 3. Consistency
The same pattern always means the same thing. Blue = Open. Amber = In Progress. Green = Closed or success. Red = error. These mappings never reverse or vary by context.

### 4. Accessibility
All interactive elements are keyboard-navigable. All inputs have explicit `<label>` elements. Colour is never the only indicator of state — badges always include text. WCAG 2.1 Level A minimum; Level AA targets for contrast.

### 5. Restraint
This is a functional tool, not a marketing site. Animations serve communication (feedback, orientation), not decoration. No gradients, drop shadows on text, or motion for its own sake.

---

## 2. Design Tokens

All tokens are defined as CSS custom properties in `src/index.css` and referenced in `tailwind.config.js`. Never use raw hex values or pixel values in component code — always use the token.

### Color Palette

```css
/* src/index.css */
:root {
  /* Primary — brand blue, used for CTAs, links, focus rings, Open status */
  --color-primary-50:  #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;  /* Main brand colour — buttons, badges */
  --color-primary-600: #2563eb;  /* Hover state for primary buttons */
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;  /* Dark brand — navbar background */

  /* Neutral — text, backgrounds, borders, table rows */
  --color-neutral-50:  #f9fafb;  /* Page background */
  --color-neutral-100: #f3f4f6;  /* Secondary button bg, table row alt */
  --color-neutral-200: #e5e7eb;  /* Borders, dividers */
  --color-neutral-300: #d1d5db;  /* Input borders */
  --color-neutral-400: #9ca3af;  /* Placeholder text, disabled text */
  --color-neutral-500: #6b7280;  /* Secondary text, timestamps */
  --color-neutral-600: #4b5563;  /* Body text secondary */
  --color-neutral-700: #374151;  /* Body text primary */
  --color-neutral-800: #1f2937;  /* Headings */
  --color-neutral-900: #111827;  /* Maximum contrast text */

  /* Semantic — status and feedback */
  --color-success:     #10b981;  /* Closed status badge, success toast */
  --color-success-bg:  #d1fae5;  /* Closed badge background */
  --color-warning:     #d97706;  /* In Progress badge text */
  --color-warning-bg:  #fef3c7;  /* In Progress badge background */
  --color-error:       #ef4444;  /* Error text, error borders */
  --color-error-bg:    #fee2e2;  /* Error message background */
  --color-info:        #3b82f6;  /* Open badge text (same as primary) */
  --color-info-bg:     #dbeafe;  /* Open badge background */
}
```

#### Color Usage Rules

| Token | Use | Never use for |
|-------|-----|---------------|
| `primary-500` | Primary buttons, active filter tabs, links | Body text, backgrounds |
| `primary-900` | Navbar background | Interactive elements |
| `neutral-50` | Page background | Text |
| `neutral-700` | Body text | Backgrounds |
| `neutral-900` | Headings, high-emphasis text | Backgrounds |
| `success` | Closed status, success toasts | Error states |
| `warning` | In Progress status only | Success or error |
| `error` | Error messages, invalid input borders | Status badges |
| `info` / `info-bg` | Open status badge | Other semantic meanings |

#### Status Colour Mapping (never deviate)

| Status | Badge text colour | Badge background | Tailwind classes |
|--------|-----------------|-----------------|-----------------|
| Open | `primary-700` | `info-bg` (`primary-100`) | `text-blue-700 bg-blue-100` |
| In Progress | `warning` (amber-700) | `warning-bg` (amber-100) | `text-amber-700 bg-amber-100` |
| Closed | `success` (green-700) | `success-bg` (green-100) | `text-green-700 bg-green-100` |

---

### Typography

```css
:root {
  --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono: 'Fira Code', 'Cascadia Code', 'Courier New', monospace;

  /* Scale */
  --text-xs:   0.75rem;    /* 12px — timestamps, helper text */
  --text-sm:   0.875rem;   /* 14px — table data, labels, secondary */
  --text-base: 1rem;       /* 16px — body text, inputs (minimum on mobile) */
  --text-lg:   1.125rem;   /* 18px — card titles, section headings */
  --text-xl:   1.25rem;    /* 20px — page subheadings */
  --text-2xl:  1.5rem;     /* 24px — page headings (H2) */
  --text-3xl:  1.875rem;   /* 30px — main page title (H1) */

  /* Weights */
  --font-normal:   400;
  --font-medium:   500;
  --font-semibold: 600;
  --font-bold:     700;

  /* Line heights */
  --leading-tight:   1.25;
  --leading-normal:  1.5;
  --leading-relaxed: 1.75;
}
```

#### Typography Usage Rules

| Element | Size | Weight | Line height | Tailwind |
|---------|------|--------|-------------|---------|
| Page H1 (ticket subject) | `text-3xl` | `font-bold` | `leading-tight` | `text-3xl font-bold leading-tight text-neutral-900` |
| Page H2 (section heading) | `text-xl` | `font-semibold` | `leading-tight` | `text-xl font-semibold text-neutral-800` |
| Table column headers | `text-xs` | `font-medium` | `leading-normal` | `text-xs font-medium uppercase tracking-wide text-neutral-500` |
| Table cell body | `text-sm` | `font-normal` | `leading-normal` | `text-sm text-neutral-700` |
| Input labels | `text-sm` | `font-medium` | `leading-normal` | `text-sm font-medium text-neutral-700` |
| Input placeholder | `text-sm` | `font-normal` | — | `placeholder:text-neutral-400` |
| Helper / error text | `text-xs` | `font-normal` | — | `text-xs text-neutral-500` or `text-xs text-red-600` |
| Timestamps | `text-xs` | `font-normal` | — | `text-xs text-neutral-400` |
| Ticket ID badge | `text-xs` | `font-medium` | — | `text-xs font-medium font-mono` |

**Load Inter from Google Fonts** (add to `index.html`):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

### Spacing Scale

```css
:root {
  --spacing-1:  0.25rem;  /*  4px */
  --spacing-2:  0.5rem;   /*  8px */
  --spacing-3:  0.75rem;  /* 12px */
  --spacing-4:  1rem;     /* 16px */
  --spacing-5:  1.25rem;  /* 20px */
  --spacing-6:  1.5rem;   /* 24px */
  --spacing-8:  2rem;     /* 32px */
  --spacing-10: 2.5rem;   /* 40px */
  --spacing-12: 3rem;     /* 48px */
  --spacing-16: 4rem;     /* 64px */
}
```

#### Spacing Usage Rules

| Context | Token | Tailwind |
|---------|-------|---------|
| Inline element gap (icon + label) | `spacing-2` | `gap-2` |
| Input internal padding | `spacing-3` horizontal, `spacing-2` vertical | `px-3 py-2` |
| Button padding (default) | `spacing-4` horizontal, `spacing-2` vertical | `px-4 py-2` |
| Card / panel padding | `spacing-6` | `p-6` |
| Section vertical gap | `spacing-8` | `mb-8` |
| Page horizontal margin | `spacing-4` (mobile) → `spacing-8` (desktop) | `px-4 sm:px-8` |
| Stack of form fields | `spacing-5` | `space-y-5` |

---

### Border Radius

```css
:root {
  --radius-sm:   0.125rem;  /*  2px — subtle, almost none */
  --radius-base: 0.25rem;   /*  4px — table cells, small tags */
  --radius-md:   0.375rem;  /*  6px — inputs */
  --radius-lg:   0.5rem;    /*  8px — cards, buttons, panels */
  --radius-xl:   0.75rem;   /* 12px — modals (not used in MVP) */
  --radius-full: 9999px;    /* fully rounded — status badges, pills */
}
```

| Element | Radius | Tailwind |
|---------|--------|---------|
| Buttons | `radius-lg` | `rounded-lg` |
| Inputs | `radius-md` | `rounded-md` |
| Cards / panels | `radius-lg` | `rounded-lg` |
| Status badges | `radius-full` | `rounded-full` |
| Ticket ID pill | `radius-base` | `rounded` |
| Toast notifications | `radius-lg` | `rounded-lg` |

---

### Shadows

```css
:root {
  --shadow-sm:  0 1px 2px 0 rgba(0,0,0,0.05);
  --shadow-base:0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06);
  --shadow-md:  0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
  --shadow-lg:  0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
}
```

| Element | Shadow | Tailwind |
|---------|--------|---------|
| Cards at rest | `shadow-sm` | `shadow-sm` |
| Cards on hover | `shadow-md` | `hover:shadow-md` |
| Navbar | `shadow-base` | `shadow` |
| Toasts | `shadow-lg` | `shadow-lg` |
| Inputs | none (border only) | — |

---

## 3. Layout System

### Container

```jsx
// src/components/Container.jsx
export function Container({ children }) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}
```

Max-width: `72rem` (1152px). Padding scales from `1rem` (mobile) to `2rem` (desktop).

### Responsive Breakpoints

| Name | Width | Use |
|------|-------|-----|
| base | 0px | Mobile — single column, full width |
| `sm` | 640px | Tablet — table layout replaces cards |
| `md` | 768px | Desktop — multi-column forms, wider padding |
| `lg` | 1024px | Wide desktop — max-width container kicks in |

### Page Layout Pattern (all screens)

```jsx
// Consistent shell used across all 4 pages
<div className="min-h-screen bg-neutral-50">
  <Navbar />
  <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {pageContent}
  </main>
</div>
```

### Two-Column Form Layout (Create Ticket — desktop)

```jsx
// Name + Email side-by-side on md+
<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
  <InputField label="Customer Name" ... />
  <InputField label="Customer Email" ... />
</div>
// Subject + Description always full width
<InputField label="Subject" ... />
<TextareaField label="Description" ... />
```

### Ticket Info Grid (Detail page)

```jsx
// 2-column on md+, stacked on mobile
<dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Customer</dt>
    <dd className="mt-1 text-sm text-neutral-900">{ticket.customer_name}</dd>
  </div>
  {/* repeat for email, created, updated */}
</dl>
```

---

## 4. Component Library

### Navbar

```jsx
// src/components/Navbar.jsx
export function Navbar() {
  return (
    <nav className="bg-blue-900 shadow">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link
            to="/"
            className="text-white font-semibold text-lg tracking-tight"
          >
            Support CRM
          </Link>
          <Link
            to="/tickets/new"
            className="
              px-4 py-2
              bg-blue-500 hover:bg-blue-400
              text-white text-sm font-medium
              rounded-lg
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-900
            "
          >
            + New Ticket
          </Link>
        </div>
      </div>
    </nav>
  );
}
```

---

### Button

```jsx
// src/components/Button.jsx
// variant: 'primary' | 'secondary' | 'danger'
// size: 'sm' | 'md' (default) | 'lg'

const variants = {
  primary: `
    bg-blue-500 hover:bg-blue-600
    text-white
    focus:ring-blue-500
  `,
  secondary: `
    bg-neutral-100 hover:bg-neutral-200
    text-neutral-800
    focus:ring-neutral-400
  `,
  danger: `
    bg-red-500 hover:bg-red-600
    text-white
    focus:ring-red-500
  `,
};

const sizes = {
  sm:  'px-3 py-1.5 text-sm',
  md:  'px-4 py-2 text-sm',
  lg:  'px-6 py-3 text-base',
};

export function Button({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false, type = 'button',
  onClick, className = ''
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        font-medium rounded-lg
        transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24" fill="none"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      )}
      {children}
    </button>
  );
}
```

**Usage rules**:
- One primary button per screen — the main action
- Secondary for cancel, back, or supporting actions
- Danger only for destructive actions (not used in MVP — no delete feature)
- Always pass `loading={true}` while an API call is in flight; button auto-disables

---

### Input Field

```jsx
// src/components/InputField.jsx
export function InputField({
  label, id, type = 'text', value, onChange, onBlur,
  placeholder, error, disabled = false, required = false,
  helpText
}) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-neutral-700"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">*</span>
        )}
      </label>

      <input
        type={type}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
        className={`
          block w-full px-3 py-2
          text-sm text-neutral-900
          border rounded-md
          placeholder:text-neutral-400
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-offset-0
          disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed
          ${error
            ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
            : 'border-neutral-300 focus:border-blue-500 focus:ring-blue-500'
          }
        `}
      />

      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
      {helpText && !error && (
        <p id={`${id}-help`} className="text-xs text-neutral-500">
          {helpText}
        </p>
      )}
    </div>
  );
}
```

---

### Textarea Field

```jsx
// src/components/TextareaField.jsx
export function TextareaField({
  label, id, value, onChange, onBlur,
  placeholder, error, disabled = false,
  required = false, rows = 4
}) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-neutral-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>

      <textarea
        id={id}
        name={id}
        rows={rows}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`
          block w-full px-3 py-2
          text-sm text-neutral-900
          border rounded-md resize-y
          placeholder:text-neutral-400
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-offset-0
          disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed
          ${error
            ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
            : 'border-neutral-300 focus:border-blue-500 focus:ring-blue-500'
          }
        `}
      />

      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

---

### Status Badge

```jsx
// src/components/StatusBadge.jsx
const statusStyles = {
  'Open':        'bg-blue-100 text-blue-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  'Closed':      'bg-green-100 text-green-700',
};

export function StatusBadge({ status }) {
  return (
    <span
      className={`
        inline-flex items-center
        px-2.5 py-0.5
        rounded-full
        text-xs font-medium
        ${statusStyles[status] ?? 'bg-neutral-100 text-neutral-600'}
      `}
    >
      {status}
    </span>
  );
}
```

**Rules**: Never use colour alone — the status text is always visible inside the badge. Badge colours are fixed and must match the table in Design Tokens §2 exactly.

---

### Search Bar

```jsx
// src/components/SearchBar.jsx
export function SearchBar({ value, onChange, onClear }) {
  return (
    <div className="relative">
      {/* Search icon */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
        aria-hidden="true">
        <svg className="h-4 w-4 text-neutral-400" fill="none"
          viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
        </svg>
      </div>

      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by name, email, ID, or keyword…"
        aria-label="Search tickets"
        className="
          block w-full
          pl-9 pr-9 py-2
          text-sm text-neutral-900
          border border-neutral-300 rounded-lg
          placeholder:text-neutral-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-colors duration-150
        "
      />

      {/* Clear button */}
      {value && (
        <button
          onClick={onClear}
          aria-label="Clear search"
          className="
            absolute inset-y-0 right-0 pr-3
            flex items-center
            text-neutral-400 hover:text-neutral-600
            transition-colors duration-150
          "
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      )}
    </div>
  );
}
```

---

### Filter Tabs

```jsx
// src/components/FilterTabs.jsx
const STATUSES = ['All', 'Open', 'In Progress', 'Closed'];

export function FilterTabs({ active, onChange }) {
  return (
    <div
      role="tablist"
      aria-label="Filter tickets by status"
      className="flex gap-1 overflow-x-auto scrollbar-none"
    >
      {STATUSES.map((status) => (
        <button
          key={status}
          role="tab"
          aria-selected={active === status}
          onClick={() => onChange(status)}
          className={`
            flex-shrink-0
            px-4 py-2
            text-sm font-medium rounded-lg
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
            ${active === status
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }
          `}
        >
          {status}
        </button>
      ))}
    </div>
  );
}
```

---

### Ticket Table (Desktop)

```jsx
// src/components/TicketTable.jsx
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';

export function TicketTable({ tickets }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50">
          <tr>
            {['Ticket ID', 'Customer', 'Subject', 'Status', 'Created'].map((h) => (
              <th
                key={h}
                className="
                  px-4 py-3
                  text-left text-xs font-medium
                  text-neutral-500 uppercase tracking-wide
                "
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-neutral-100">
          {tickets.map((ticket) => (
            <tr
              key={ticket.ticket_id}
              onClick={() => navigate(`/tickets/${ticket.ticket_id}`)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/tickets/${ticket.ticket_id}`)}
              tabIndex={0}
              role="link"
              aria-label={`Open ticket ${ticket.ticket_id}: ${ticket.subject}`}
              className="
                cursor-pointer
                hover:bg-neutral-50
                transition-colors duration-100
                focus:outline-none focus:bg-blue-50
              "
            >
              <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                {ticket.ticket_id}
              </td>
              <td className="px-4 py-3 text-sm text-neutral-900">
                {ticket.customer_name}
              </td>
              <td className="px-4 py-3 text-sm text-neutral-700 max-w-xs truncate">
                {ticket.subject}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={ticket.status} />
              </td>
              <td className="px-4 py-3 text-xs text-neutral-400">
                {new Date(ticket.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

### Ticket Card (Mobile — replaces table below `sm`)

```jsx
// src/components/TicketCard.jsx
export function TicketCard({ ticket, onClick }) {
  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      tabIndex={0}
      role="link"
      aria-label={`Open ticket ${ticket.ticket_id}: ${ticket.subject}`}
      className="
        bg-white border border-neutral-200 rounded-lg p-4
        hover:shadow-md active:bg-neutral-50
        transition-shadow duration-150
        cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-blue-500
      "
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs text-neutral-400">{ticket.ticket_id}</span>
        <StatusBadge status={ticket.status} />
      </div>
      <p className="text-sm font-medium text-neutral-900 mb-1">{ticket.customer_name}</p>
      <p className="text-sm text-neutral-600 line-clamp-2 mb-2">{ticket.subject}</p>
      <p className="text-xs text-neutral-400">
        {new Date(ticket.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}
```

---

### Empty State

```jsx
// src/components/EmptyState.jsx
export function EmptyState({ title, message, action }) {
  return (
    <div className="text-center py-16 px-4">
      <div
        aria-hidden="true"
        className="
          inline-flex items-center justify-center
          w-12 h-12 rounded-full
          bg-neutral-100 text-neutral-400
          mb-4
        "
      >
        {/* Inbox icon — inline SVG, no icon library needed */}
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24"
          stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512
               a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244
               l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859
               M5.25 9l.75-6h12l.75 6
               M5.25 9h13.5L21 21H3L5.25 9z"/>
        </svg>
      </div>

      <h3 className="text-base font-semibold text-neutral-900 mb-1">{title}</h3>
      <p className="text-sm text-neutral-500 mb-6 max-w-sm mx-auto">{message}</p>

      {action && (
        <Button onClick={action.onClick} variant="primary" size="md">
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

**Usage examples**:
```jsx
// No tickets at all
<EmptyState
  title="No tickets yet"
  message="Create your first support ticket to get started."
  action={{ label: '+ New Ticket', onClick: () => navigate('/tickets/new') }}
/>

// Search returned nothing
<EmptyState
  title="No tickets match your search"
  message={`No results for "${searchTerm}". Try a different term.`}
  action={{ label: 'Clear search', onClick: onClear }}
/>

// Filter returned nothing
<EmptyState
  title={`No ${activeFilter} tickets`}
  message="Try a different filter or create a new ticket."
/>

// No notes on a ticket
<EmptyState
  title="No notes yet"
  message="Add the first note below."
/>
```

---

### Loading Skeleton

```jsx
// src/components/Skeleton.jsx

// Single skeleton row — used in ticket table while loading
export function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3"><div className="h-3 bg-neutral-200 rounded w-16"/></td>
      <td className="px-4 py-3"><div className="h-3 bg-neutral-200 rounded w-28"/></td>
      <td className="px-4 py-3"><div className="h-3 bg-neutral-200 rounded w-48"/></td>
      <td className="px-4 py-3"><div className="h-5 bg-neutral-200 rounded-full w-16"/></td>
      <td className="px-4 py-3"><div className="h-3 bg-neutral-200 rounded w-20"/></td>
    </tr>
  );
}

// 5 rows shown while list loads
export function SkeletonTable() {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50">
          <tr>
            {['Ticket ID','Customer','Subject','Status','Created'].map(h => (
              <th key={h}
                className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-neutral-100">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
        </tbody>
      </table>
    </div>
  );
}

// Full-page skeleton for ticket detail
export function SkeletonDetail() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 bg-neutral-200 rounded w-24"/>   {/* Back link */}
      <div className="h-8 bg-neutral-200 rounded w-3/4"/>  {/* Title */}
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 bg-neutral-200 rounded w-20"/>
            <div className="h-4 bg-neutral-200 rounded w-40"/>
          </div>
        ))}
      </div>
      <div className="h-24 bg-neutral-200 rounded"/>        {/* Description */}
      <div className="h-16 bg-neutral-200 rounded"/>        {/* Notes */}
    </div>
  );
}
```

---

### Error Banner

```jsx
// src/components/ErrorBanner.jsx
export function ErrorBanner({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="
        flex items-center justify-between
        bg-red-50 border border-red-200
        text-red-700 text-sm
        px-4 py-3 rounded-lg
      "
    >
      <span>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="
            ml-4 text-sm font-medium underline
            hover:no-underline focus:outline-none
          "
        >
          Retry
        </button>
      )}
    </div>
  );
}
```

---

### Offline Banner

```jsx
// src/components/OfflineBanner.jsx
export function OfflineBanner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="
        bg-amber-50 border-b border-amber-200
        text-amber-800 text-sm font-medium
        text-center px-4 py-2
      "
    >
      You're offline. Changes won't be saved until your connection is restored.
    </div>
  );
}
```

---

## 5. Accessibility Guidelines

### WCAG 2.1 Level A — Required (enforced in every component above)

| Rule | Implementation |
|------|---------------|
| All inputs have `<label>` | `htmlFor` + matching `id` on every field |
| Colour is not the only indicator | Status badges always include text, not just colour |
| All interactive elements keyboard-focusable | `tabIndex={0}` on clickable rows; all buttons natively focusable |
| Focus indicators visible | `focus:ring-2` on every interactive element |
| Error messages associated with inputs | `aria-describedby` + `aria-invalid` on error state |
| Buttons have accessible names | All buttons have text children or `aria-label` |
| Dynamic content announced | `role="alert"` on error messages, `aria-live="polite"` on status updates |
| Semantic HTML | `<nav>`, `<main>`, `<table>`, `<thead>`, `<tbody>`, `<th>`, `<dl>`, `<dt>`, `<dd>` used correctly |

### WCAG 2.1 Level AA — Targets

| Requirement | Status |
|-------------|--------|
| Contrast ratio ≥ 4.5:1 for body text | ✓ `neutral-700` on `neutral-50` = 7.2:1 |
| Contrast ratio ≥ 3:1 for large text | ✓ all headings pass |
| Contrast ratio ≥ 3:1 for UI components | ✓ blue-500 border on white = 3.1:1 |
| Touch targets ≥ 44×44px | ✓ all buttons `py-2` minimum + `px-4` = 44px tall on mobile |
| No keyboard trap | ✓ no modals or custom focus-trap logic in MVP |
| Skip to main content link | Add `<a href="#main" className="sr-only focus:not-sr-only">` in Navbar |

### `prefers-reduced-motion`

Add once to `src/index.css` — covers all Tailwind animations globally:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 6. Animation Guidelines

### Page Transitions
Fade-in only (200ms `ease-out`) on route change. No exit animations.

```css
/* src/index.css */
.page-enter {
  animation: fadeIn 200ms ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

Apply `className="page-enter"` to the top-level `<div>` in each page component.

### Tailwind Micro-interaction Classes

| Trigger | Classes |
|---------|---------|
| Button hover (colour shift) | `transition-colors duration-150` |
| Button active (press) | `active:scale-95 transition-transform duration-100` |
| Input focus (border + ring) | `transition-colors duration-150` |
| Table row hover | `hover:bg-neutral-50 transition-colors duration-100` |
| Card hover (shadow) | `hover:shadow-md transition-shadow duration-150` |
| Skeleton pulse | `animate-pulse` (Tailwind built-in) |
| Button spinner | `animate-spin` (Tailwind built-in) |
| New note appear | `animate-fadeIn` (custom, defined above) |
| Offline banner slide | `transition-transform duration-200` |

### Rules
- Never animate `width`, `height`, or `margin` — these trigger layout reflow
- Animate only `opacity`, `transform`, `background-color`, `box-shadow`
- All animations under 300ms
- No entrance animation on initial page load — only on subsequent user-triggered events

---

## 7. Icon System

**No icon library.** This project uses inline SVG only. Reasons:
- `lucide-react` adds ~40kB for icons that could be inlined in 5 lines each
- The CRM uses fewer than 10 icons total
- Inline SVG is accessible, colourable with `currentColor`, and zero-dependency

**Icons used** (all inline SVG, `24×24` viewBox, `stroke="currentColor"`, `strokeWidth={2}`):

| Icon | Used in | SVG path |
|------|---------|---------|
| Search (magnifier) | SearchBar | `M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z` |
| X (clear/close) | SearchBar clear button | `M6 18L18 6M6 6l12 12` |
| Arrow left (back) | Ticket detail back button | `M10 19l-7-7m0 0l7-7m-7 7h18` |
| Inbox (empty state) | EmptyState | (see EmptyState component above) |
| Check (success) | Future use | `M5 13l4 4L19 7` |

**Sizing**:
- `w-4 h-4` (16px) — inside buttons, search bar, inline
- `w-5 h-5` (20px) — standalone action icons
- `w-6 h-6` (24px) — empty state illustrations

---

## 8. State Indicators — Quick Reference

| State | Component | Key classes |
|-------|-----------|-------------|
| Loading list | `SkeletonTable` | `animate-pulse bg-neutral-200` |
| Loading detail | `SkeletonDetail` | `animate-pulse bg-neutral-200` |
| Submitting button | `Button loading={true}` | `animate-spin` spinner + `disabled` |
| Empty (no data) | `EmptyState` | Centred, icon + title + message + optional CTA |
| Error (load fail) | `ErrorBanner` | `bg-red-50 border-red-200 text-red-700` + retry |
| Error (field) | `InputField error={msg}` | `border-red-400 ring-red-400` + `text-xs text-red-600` |
| Offline | `OfflineBanner` | `bg-amber-50 border-amber-200 text-amber-800` |
| Success | `react-hot-toast` | `toast.success('...')` — handled by library |

---

## 9. Responsive Design

### Mobile-First Rule
Write base styles for mobile. Override at `sm:` and `md:` only where layout genuinely changes.

### Layout Changes by Breakpoint

| Element | Mobile (base) | Tablet (sm: 640px) | Desktop (md: 768px) |
|---------|--------------|-------------------|-------------------|
| Ticket list | `TicketCard` stack | `TicketTable` | `TicketTable` |
| Create form fields | All full-width stacked | All full-width stacked | Name + Email side-by-side |
| Ticket detail info | Single column, stacked | Single column | 2-column grid |
| Status + Save button | Full-width stacked | Inline | Inline |
| Page padding | `px-4` | `px-6` | `px-8` |
| Search + filter | Stacked vertically | Stacked | Same row, justified |

### Conditional Rendering (list view)

```jsx
// TicketList.jsx
function TicketListView({ tickets }) {
  return (
    <>
      {/* Mobile: cards */}
      <div className="space-y-3 sm:hidden">
        {tickets.map(t => (
          <TicketCard key={t.ticket_id} ticket={t}
            onClick={() => navigate(`/tickets/${t.ticket_id}`)} />
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block">
        <TicketTable tickets={tickets} />
      </div>
    </>
  );
}
```

### Touch Target Rule
Every tappable element must be at minimum `44×44px` on mobile. Achieved by:
- All buttons: `py-2 px-4` = minimum 40px height + surrounding context ≥ 44px
- Filter tabs: `py-2` always
- Ticket cards: full-card tap target, not just text
- Clear (×) button: `p-1` wrapper around the 16px SVG

---

## 10. Browser Support

| Browser | Supported versions | Notes |
|---------|------------------|-------|
| Chrome | Last 2 | Primary target |
| Firefox | Last 2 | Full support |
| Safari | Last 2 | Test iOS Safari specifically for 16px input zoom behaviour |
| Edge | Last 2 | Chromium-based; same as Chrome |
| IE 11 | ✗ Not supported | Vite output targets `es2015+`; IE is not a concern |

### iOS Safari — Critical Rules
1. Input `font-size` must be ≥ `16px` (`text-base`) — otherwise iOS auto-zooms the viewport on focus
2. Use `-webkit-overflow-scrolling: touch` on any horizontally scrollable container (filter tabs on mobile)
3. `100vh` does not account for the Safari toolbar — use `min-h-screen` (Tailwind handles this) rather than fixed pixel heights

### Progressive Enhancement
The CRM requires JavaScript to function — it is a SPA and has no server-rendered fallback. This is acceptable for an internal tool where the browser environment is controlled. No polyfills are required for the target browser set.

---

*This document is the single source of truth for all frontend visual decisions.*  
*Companion documents: `PRD.md` · `APP_FLOW.md` · `TECH_STACK.md`*
