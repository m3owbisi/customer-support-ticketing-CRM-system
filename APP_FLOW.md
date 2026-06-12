# APP_FLOW.md
# Support CRM System — Datastraw Technologies
**Stack**: Node.js + Express + React + SQLite  
**Deployment**: Render.com (API) + Vercel (Frontend)  
**Last Updated**: June 2025

---

## 1. Entry Points

### Direct URL Access
- **`/` (Home)**: Renders the full ticket list immediately. No auth gate, no splash screen. If tickets exist, they are visible within 2 seconds. If the database is empty, an empty state with a "Create your first ticket" CTA is shown.
- **`/tickets/new`**: Opens the Create Ticket form directly. Useful for bookmarking a quick-entry shortcut.
- **`/tickets/:ticket_id`**: Opens a specific ticket's detail page. If the ID does not exist, a "Ticket not found" error state is shown.

### Deep Links
- **Shared ticket URL** (e.g. pasted into Slack or email): Navigates directly to `/tickets/TKT-014`. The ticket detail page renders the full context without requiring navigation from the list. Invalid IDs show a 404 error state.
- **Email notifications**: Out of scope for MVP. No automated emails are sent by the system.
- **Push notifications**: Out of scope for MVP.

### OAuth / Social Login
- **Not applicable.** Authentication is out of scope for MVP. The app is fully open-access — any user with the URL can create, view, and update tickets.

### Search Engines
- **Not applicable.** This is an internal team tool. No public SEO indexing is intended or required. The app should have `<meta name="robots" content="noindex">` in the HTML head to prevent accidental indexing of the deployment URL.

### Marketing Campaigns
- **Not applicable.** No consumer-facing marketing exists for this internal tool.

---

## 2. Core User Flows

---

### Flow 1: Create a New Support Ticket

**Goal**: Log a new customer issue as a retrievable, trackable record in under 60 seconds  
**Entry Point**: Home page → "New Ticket" button  
**Frequency**: Multiple times daily — the most common write action in the system  

---

#### Happy Path

| Step | Screen | UI Elements | User Action | System Response | Next State |
|------|--------|-------------|-------------|-----------------|------------|
| 1 | Ticket List `/` | Navbar with "New Ticket" button | Clicks "New Ticket" | React Router navigates | `/tickets/new` loads |
| 2 | Create Form `/tickets/new` | Name, Email, Subject, Description inputs; Submit button; Cancel link | Fills in all four fields | Client validates on blur per field | No errors if input is valid |
| 3 | Create Form | Submit button (active) | Clicks "Create Ticket" | Button disables + spinner; `POST /api/tickets` fires | API processing |
| 4 | Create Form | Loading spinner on button | Waits | API generates `TKT-XXX`, inserts row, returns `{ ticket_id, created_at }` | 201 response received |
| 5 | Ticket List `/` | Full ticket list; success toast | Redirected automatically | New ticket appears at top of list (newest-first sort) | ✅ Success |

**Validation Rules**:
- `customer_name`: required, minimum 2 characters
- `customer_email`: required, valid format (contains `@` and a TLD)
- `subject`: required, minimum 5 characters
- `description`: required, minimum 10 characters
- All validation runs client-side on blur; server re-validates on POST as the authoritative check

**Success Criteria**: Ticket is persisted in the database with a unique auto-generated ID, `status = 'Open'`, and both timestamps set. It appears at the top of the list immediately after redirect.

---

#### Error States

| Error | Trigger | UI Display | Recovery |
|-------|---------|------------|---------|
| Required field empty | Submit with blank field | Inline red error below field: "Customer name is required" | User fills field; error clears on valid input |
| Invalid email format | Submit with "user@" or "notanemail" | Inline: "Please enter a valid email address" | User corrects; error clears live |
| Subject too short | Subject under 5 characters | Inline: "Subject must be at least 5 characters" | User expands subject |
| Server error (500) | API unavailable | Red toast: "Something went wrong. Please try again." | Form re-enables; all data preserved; user retries |
| Network offline | No internet | Submit button disabled with tooltip "Waiting for connection…" | Auto re-enables when online event fires |
| Request timeout (>10s) | Slow server | Red toast: "Request timed out. Check your connection." | Form re-enables; data preserved |
| Duplicate submission | User clicks Submit twice | Button disabled on first click; only one API request fires | No duplicate ticket created |

---

#### Edge Cases

- **User refreshes mid-form**: Form resets to empty. No auto-save in MVP. Known limitation documented in README.
- **User clicks Cancel**: Navigates to `/` immediately. No data persisted. No confirmation dialog.
- **User navigates away via browser back**: Same as Cancel — no data saved. Form is stateless.
- **Same customer submits multiple tickets**: Allowed and expected. No deduplication logic on email.
- **Extremely long description**: Accepted up to 5,000 characters. No truncation warning in MVP.

---

#### Exit Points
- ✅ **Success** → redirected to `/` with new ticket at top of list
- ↩ **Cancel** → back to `/`, no ticket created
- ⚠️ **Persistent error** → stays on form, data preserved, user retries

---

### Flow 2: Search and Filter the Ticket List

**Goal**: Find one or more specific tickets in under 5 seconds without scrolling  
**Entry Point**: Home page `/` — search bar and filter tabs are always visible  
**Frequency**: Every session; search is the primary navigation mechanism for finding tickets  

---

#### Happy Path

| Step | Screen | UI Elements | User Action | System Response | Next State |
|------|--------|-------------|-------------|-----------------|------------|
| 1 | Ticket List `/` | Search bar, filter tabs (All active), full ticket table | Types "Sneha" in search bar | 300ms debounce timer starts | Awaiting debounce |
| 2 | Ticket List | Spinner inside search bar | Pauses typing (300ms elapsed) | `GET /api/tickets?search=Sneha` fires | API querying |
| 3 | Ticket List | Updated table | Waits | API returns matching tickets; table updates in place | Filtered results shown |
| 4 | Ticket List | Active search; "Open" filter tab | Clicks "Open" filter tab | `GET /api/tickets?search=Sneha&status=Open` fires | Combined results shown |
| 5 | Ticket List | Narrowed results | Clicks a ticket row | React Router navigates | `/tickets/:ticket_id` |

**Search scope**: case-insensitive LIKE query across `customer_name`, `customer_email`, `ticket_id`, `subject`, `description`

**Filter + Search compounding**: Both params always sent together. Selecting a filter never clears the search term, and typing a search never resets the active filter.

**Success Criteria**: Any ticket with the search term in any of the five fields appears in results. Filter narrows by exact status match.

---

#### Error States

| Error | Trigger | UI Display | Recovery |
|-------|---------|------------|---------|
| No results (search) | Term not found in any ticket | Empty state: "No tickets match your search. Try a different search." with × clear button | User clears or modifies search |
| No results (filter) | Status filter returns empty set | Empty state: "No Open tickets found." | User changes filter tab |
| API error during search | Server returns 500 | Red toast: "Search failed. Please try again." Search bar not cleared | User retries by re-typing or clicking filter |
| Network offline | No internet | Search input disabled; grey overlay on search bar; offline banner shows | Reconnect; input re-enables automatically |

---

#### Edge Cases

- **Rapid typing** (faster than debounce): Only the last keystroke burst fires a request. Intermediate states are never shown.
- **Special characters** (`%`, `_`, `'`): Parameterised SQL queries prevent injection. `%` and `_` are escaped before LIKE comparison.
- **Single character search**: Allowed; may return many results. No minimum length enforced.
- **Search on empty database**: Shows standard "No tickets yet" empty state, not a search-specific message.
- **Page refresh with active search**: Search term and filter reset to defaults (empty search, "All" filter). URL-based state persistence is a P1 enhancement.
- **Clear button (×)**: Clears search input and re-fetches with current filter only. Focus returns to input field.

---

#### Exit Points
- ✅ **Found and clicked ticket** → navigates to `/tickets/:ticket_id`
- 🔄 **Refine** → user modifies search/filter; list updates in place
- ↩ **Clear all** → user empties search and resets filter; full list restores

---

### Flow 3: View, Update, and Close a Ticket

**Goal**: Review a ticket's full context, change its status, and add an internal note  
**Entry Point**: Click any ticket row in the list → `/tickets/:ticket_id`  
**Frequency**: Multiple times daily — every active ticket is opened at least once  

---

#### Happy Path

| Step | Screen | UI Elements | User Action | System Response | Next State |
|------|--------|-------------|-------------|-----------------|------------|
| 1 | Ticket List `/` | Ticket row | Clicks row | Navigate to `/tickets/TKT-015` | Detail page loads |
| 2 | Ticket Detail | Skeleton loading state | Waits | `GET /api/tickets/TKT-015` returns full ticket + notes | All fields rendered |
| 3 | Ticket Detail | Status dropdown showing "Open" | Changes to "In Progress" | "Save Status" button appears | Button active |
| 4 | Ticket Detail | Save Status button | Clicks "Save Status" | `PUT /api/tickets/TKT-015 { status: "In Progress" }` | API updating |
| 5 | Ticket Detail | Updated badge + timestamp | Waits | Status badge → amber "In Progress"; `updated_at` refreshes; toast shows | Status persisted |
| 6 | Ticket Detail | Notes textarea | Types resolution note; clicks "Add Note" | `PUT /api/tickets/TKT-015 { note_text }` | API saving note |
| 7 | Ticket Detail | Updated notes list | Waits | New note appends to list with timestamp; textarea clears; toast: "Note added" | Note persisted |
| 8 | Ticket Detail | Back button | Clicks "← Back to Tickets" | Navigate to `/` | List page loads |

**Success Criteria**: Status change is reflected in the database and visible in the list. Note is persisted and visible in chronological order on the detail page.

---

#### Error States

| Error | Trigger | UI Display | Recovery |
|-------|---------|------------|---------|
| Ticket not found (404) | Navigate to non-existent ID | Full-page: "Ticket TKT-999 not found." + back link | Click "Back to all tickets" |
| Status save failed (500) | PUT returns error | Toast: "Failed to update status."; dropdown reverts to saved value | User re-selects and retries |
| Empty note submitted | "Add Note" clicked with blank textarea | Inline error: "Note cannot be empty" | User types note content |
| Note save failed (500) | PUT returns error | Toast: "Failed to add note."; textarea content preserved | User retries |
| Network drops mid-update | Request timeout | Toast: "Connection lost. Your changes may not have saved." | User refreshes page; re-applies changes |
| Page load fails (500) | GET returns error on load | Error banner: "Could not load ticket. Please refresh." with Retry button | User refreshes |

---

#### Edge Cases

- **Re-opening a closed ticket**: Allowed. Status can move freely between all three values — no enforced one-way flow.
- **Two users update same ticket simultaneously**: Last write wins. No conflict detection in MVP. Known limitation.
- **Notes list is empty**: Section shows "No notes yet. Add the first note below." Never a blank area.
- **Very long note (>500 chars)**: Accepted. Wraps within the note block. No character limit in MVP.
- **Back after status change**: Status is already persisted — no "unsaved changes" warning on navigate away.
- **Clicking the same status**: "Save Status" button is hidden when dropdown value matches saved value — no accidental no-op saves.

---

#### Exit Points
- ✅ **Back to list** → `← Back to Tickets` or browser back
- 🔄 **Continue working** → user stays on detail page; updates more fields or adds more notes
- ⚠️ **Ticket not found** → error state shown; back link to `/`

---

### Flow 4: Error Recovery

**Goal**: User encounters an error and successfully recovers without losing data or context  
**Entry Point**: Any screen where an API call fails  

---

#### Happy Path (recovering from a failed Create)

| Step | Screen | User Action | System Response | Next State |
|------|--------|-------------|-----------------|------------|
| 1 | Create Form | Clicks Submit | Server returns 500 | Red toast: "Something went wrong. Please try again." |
| 2 | Create Form | Form data still present | Reads error toast | Button re-enables; inputs re-enable | Ready to retry |
| 3 | Create Form | Clicks Submit again | Server responds 201 | Redirect to `/`; success toast | ✅ Ticket created |

**Core principle**: No user-entered data is ever lost on a failed request. Form state lives in React component state, not in the DOM — it survives any number of failed submissions.

---

## 3. Navigation Map

```
App Root
│
├── [Navbar — renders on all screens]
│   ├── App Logo / Name ──────────────────────────────── → /
│   └── "New Ticket" Button ──────────────────────────── → /tickets/new
│
├── / ── Ticket List (Home)
│   ├── Search Bar (in-place filter, no navigation)
│   ├── Status Filter Tabs (in-place filter, no navigation)
│   └── Ticket Table
│       └── [Each row] ───────────────────────────────── → /tickets/:ticket_id
│
├── /tickets/new ── Create Ticket Form
│   ├── Submit ──── POST /api/tickets ─────────────────── → / (on success)
│   └── Cancel ──────────────────────────────────────── → /
│
├── /tickets/:ticket_id ── Ticket Detail
│   ├── Save Status ── PUT /api/tickets/:id (in-place, no navigation)
│   ├── Add Note ───── PUT /api/tickets/:id (in-place, no navigation)
│   └── ← Back ──────────────────────────────────────── → /
│
└── * ── 404 Not Found
    └── "Back to all tickets" ────────────────────────── → /

API Routes (base: /api)
│
├── GET    /health                  → { status: "ok" }
├── POST   /tickets                 → Create ticket; returns { ticket_id, created_at }
├── GET    /tickets?search=&status= → List tickets with optional filtering
├── GET    /tickets/:ticket_id      → Single ticket with all notes
└── PUT    /tickets/:ticket_id      → Update status and/or add note
```

---

## 4. Screen Inventory

---

### Screen 1: Ticket List

| Property | Value |
|----------|-------|
| **Route** | `/` |
| **Access** | Public |
| **Purpose** | Central hub — view, search, and navigate the full ticket backlog |

**Key UI Elements**:
- Navbar (logo left, "New Ticket" button right)
- Search bar (full width on mobile; ~60% left-aligned on desktop) with debounced live search and × clear button
- Status filter tabs: All | Open | In Progress | Closed (horizontal, active tab highlighted)
- Results count (e.g. "Showing 12 tickets")
- Ticket table (desktop) / Ticket card list (mobile):
  - Columns/fields: Ticket ID · Customer Name · Subject · Status badge · Created Date
  - Colour-coded status badges: Open = blue, In Progress = amber, Closed = green
  - Rows/cards fully clickable

**Actions Available**:

| Action | Leads To |
|--------|----------|
| Click "New Ticket" | `/tickets/new` |
| Type in search bar | In-place list filter (no navigation) |
| Click filter tab | In-place list filter (no navigation) |
| Click ticket row/card | `/tickets/:ticket_id` |

**State Variants**:

| State | Trigger | UI |
|-------|---------|-----|
| Loading | Initial page load; API in flight | 5 animated skeleton rows (Tailwind `animate-pulse`) |
| Populated | API returns ≥ 1 ticket | Full table/card list |
| Empty (no tickets) | Database has zero rows | "No tickets yet. Create your first ticket." + New Ticket button |
| Empty (search) | Search/filter returns 0 | "No tickets match your search." + clear button |
| Error | API returns non-200 | Red banner: "Could not load tickets. Please refresh." + Retry button |

---

### Screen 2: Create Ticket Form

| Property | Value |
|----------|-------|
| **Route** | `/tickets/new` |
| **Access** | Public |
| **Purpose** | Log a new customer support issue in under 60 seconds |

**Key UI Elements**:
- Page heading: "New Support Ticket" (H1)
- Customer Name — text input, required
- Customer Email — email input, required
- Subject — text input, required
- Description — textarea (4 rows min), required
- Inline error messages (appear per field on blur or submit attempt)
- "Create Ticket" button (primary, full-width on mobile)
- "Cancel" text link

**Actions Available**:

| Action | Leads To |
|--------|----------|
| Submit with valid data | `POST /api/tickets` → redirect to `/` |
| Submit with invalid data | Stay on form; inline errors per field |
| Click Cancel | `/` |
| Blur invalid field | Inline error for that field only |

**State Variants**:

| State | Trigger | UI |
|-------|---------|-----|
| Default | Page loads | All inputs empty; no errors shown |
| Validating | Blur field or click Submit | Per-field inline errors for failing fields |
| Submitting | Valid submit clicked | Button disabled + spinner; inputs read-only |
| Server Error | API 4xx / 5xx | Toast error; form re-enables; data preserved |
| Network Offline | No connection | Submit disabled; tooltip "Waiting for connection…" |

---

### Screen 3: Ticket Detail

| Property | Value |
|----------|-------|
| **Route** | `/tickets/:ticket_id` |
| **Access** | Public |
| **Purpose** | Full context view for a single ticket; update status; add internal notes |

**Key UI Elements**:
- "← Back to Tickets" navigation link (top-left)
- Ticket ID badge + Subject (H1)
- Info grid: Customer Name · Customer Email (mailto link) · Created · Last Updated
- Status control: segmented control or dropdown (Open / In Progress / Closed)
- "Save Status" button (visible only when selected status ≠ saved status)
- Description: read-only styled block
- Notes section: label "Notes (N)"; chronological list; empty state if no notes
- Add Note form: textarea + "Add Note" button

**Actions Available**:

| Action | Leads To |
|--------|----------|
| Click "← Back to Tickets" | `/` |
| Change status + click "Save Status" | In-place status update; toast confirmation |
| Add note + click "Add Note" | Note appended to list; textarea clears; toast confirmation |

**State Variants**:

| State | Trigger | UI |
|-------|---------|-----|
| Loading | Page load; API in flight | Full-page skeleton: grey blocks for header, info grid, notes |
| Populated | API returns ticket data | All fields rendered; notes list or empty state |
| Not Found | API returns 404 | "Ticket TKT-XXX not found." + back link |
| Saving status | Save Status clicked | Button disabled + spinner; dropdown disabled |
| Adding note | Add Note clicked | Button disabled + spinner; textarea disabled |
| Server Error | Page load API 500 | Error banner + Retry button |

---

### Screen 4: 404 Not Found

| Property | Value |
|----------|-------|
| **Route** | `*` (all undefined routes) |
| **Access** | Public |
| **Purpose** | Inform user the page doesn't exist; provide a clear path back |

**Key UI Elements**:
- Error graphic (SVG icon or large "404" text)
- Heading: "Page not found" (unknown route) or "Ticket not found" (bad ticket ID)
- Sub-copy: "The page you're looking for doesn't exist."
- CTA: "Back to all tickets" button → `/`

**Actions Available**:

| Action | Leads To |
|--------|----------|
| Click "Back to all tickets" | `/` |
| Browser back | Previous page in history |

**State Variants**: Single static state only.

---

## 5. Decision Points (IF-THEN Logic)

---

### Decision 1: Does the Ticket Exist?

```
IF  GET /api/tickets/:ticket_id returns 200
THEN render Ticket Detail with all fields populated

ELSE IF returns 404
THEN render "Ticket not found" error state with back link

ELSE IF returns 500
THEN render error banner with Retry button
```

---

### Decision 2: Should the Save Status Button Be Shown?

```
IF  user selects a status value from the dropdown
AND selected value !== current saved status value
THEN show "Save Status" button (active, clickable)

ELSE IF selected value === current saved status value
THEN hide "Save Status" button (or render as visually disabled / invisible)
```

---

### Decision 3: Is the Create Ticket Form Valid for Submission?

```
IF  user clicks "Create Ticket"
THEN run client-side validation on ALL fields simultaneously:

  IF customer_name length < 2 OR empty
  THEN show inline error: "Customer name is required" → block submission

  IF customer_email does not match email regex
  THEN show inline error: "Please enter a valid email address" → block submission

  IF subject length < 5 OR empty
  THEN show inline error: "Subject must be at least 5 characters" → block submission

  IF description length < 10 OR empty
  THEN show inline error: "Description must be at least 10 characters" → block submission

  IF all validations pass
  THEN disable Submit button, show spinner, fire POST /api/tickets

    IF API returns 201
    THEN show success toast, redirect to /

    ELSE IF API returns 400
    THEN map server error to field-level inline message; re-enable form

    ELSE IF API returns 500
    THEN show generic toast error; re-enable form; preserve all data
```

---

### Decision 4: What Does the Search Request Look Like?

```
WHEN user types in search bar OR clicks a filter tab:

  IF searchTerm is non-empty AND activeFilter is not "All"
  THEN fire GET /api/tickets?search={term}&status={filter}

  ELSE IF searchTerm is non-empty AND activeFilter is "All"
  THEN fire GET /api/tickets?search={term}

  ELSE IF searchTerm is empty AND activeFilter is not "All"
  THEN fire GET /api/tickets?status={filter}

  ELSE IF searchTerm is empty AND activeFilter is "All"
  THEN fire GET /api/tickets (return all tickets, no filtering)

  IF API returns 200 with results
  THEN update ticket list in place with returned data

  ELSE IF API returns 200 with empty array
  THEN show appropriate empty state (search vs. filter vs. combined)

  ELSE IF API returns error
  THEN show red toast: "Search failed. Please try again."
```

---

### Decision 5: Is the User Online?

```
IF navigator.onLine === false OR 'offline' event fires
THEN:
  - Show amber offline banner: "You're offline. Changes won't be saved."
  - Disable Submit (Create form), Add Note button, Save Status button
  - Add tooltip to disabled buttons: "Waiting for connection…"
  - Keep already-loaded data readable (read-only access unaffected)
  - Do NOT queue write actions for replay

WHEN 'online' event fires
THEN:
  - Dismiss offline banner (or briefly show green "Back online" before dismissing)
  - Re-enable all write buttons
  - Auto-refetch ticket list: GET /api/tickets to refresh stale data
```

---

### Decision 6: Which Empty State Should Be Shown?

```
IF  ticket list is empty AND no search term AND filter is "All"
THEN show: "No tickets yet. Create your first ticket." + New Ticket CTA

ELSE IF ticket list is empty AND search term is non-empty
THEN show: "No tickets match your search. Try a different search." + clear (×) button

ELSE IF ticket list is empty AND filter is not "All" AND no search term
THEN show: "No {status} tickets found." + "View all tickets" link

ELSE IF ticket list is empty AND both search and filter are active
THEN show: "No {status} tickets matching '{searchTerm}'." + clear button

IF notes list for a ticket is empty
THEN show: "No notes yet. Add the first note below."
```

---

### Decision 7: How Should API Errors Be Handled Globally?

```
Axios interceptor evaluates every response:

IF status is 2xx
THEN resolve promise; individual handler processes success data

ELSE IF status is 400
THEN parse error body { error, message }
     IF error maps to a known form field → show field-level inline error
     ELSE → show red toast with message from API

ELSE IF status is 404
THEN IF on /tickets/:id route → render "Ticket not found" component
     ELSE → show red toast: "Resource not found."

ELSE IF status is 500 or network error or timeout
THEN show red toast: "Something went wrong. Please try again."
     IF error was on a GET (data load) → show Retry button in toast or page banner
     IF error was on a POST/PUT (write) → re-enable form/buttons; preserve input data

NEVER show an HTML error page to the user.
ALWAYS return a JSON error body from the API: { error: "ERROR_CODE", message: "..." }
```

---

## 6. Responsive Behaviour

### Breakpoints (Tailwind defaults)

| Breakpoint | Width | Layout Mode |
|------------|-------|-------------|
| Mobile | < 640px (`sm`) | Single-column; ticket cards; full-width inputs |
| Tablet | 640px – 768px | Table layout; single-column forms with padding |
| Desktop | ≥ 768px (`md`) | Full table; multi-column form fields; max-width container |

### Key Layout Differences

| Element | Mobile | Desktop |
|---------|--------|---------|
| Ticket list | Card layout (ID + Status badge, Name, Subject, Date) | 5-column table |
| Create form | All fields full-width, stacked | Name + Email side-by-side; Subject + Description full-width |
| Ticket detail info | Labels stacked above values | 2-column grid (label right-aligned, value left) |
| Status + Save button | Full-width stacked | Inline on same row |
| Input font size | 16px minimum (prevents iOS Safari auto-zoom) | 14px+ |
| Touch targets | 44×44px minimum | 32px+ |
| Page margin | 16px | 24–32px |
| Max content width | 100% | 1200px centred |

### Navigation
No hamburger menu. Only two navigation destinations exist (list → form). A hamburger adds complexity with no benefit. Both the logo (→ home) and "New Ticket" button are always visible in the navbar at all screen sizes.

---

## 7. Error Handling Flows

### 404 Not Found

**Route does not exist** (`/settings`, `/admin`, etc.):
- React Router `<Route path="*">` renders the 404 page component
- Heading: "Page not found" · Sub-copy: "The page you're looking for doesn't exist."
- CTA: "Back to all tickets" → `/`

**Ticket ID does not exist** (`/tickets/TKT-999`):
- API returns `404 { error: "TICKET_NOT_FOUND" }`
- Ticket Detail renders inline error state (navbar still visible)
- Heading: "Ticket not found" · Sub-copy: "TKT-999 doesn't exist or may have been deleted."
- CTA: "← Back to all tickets" → `/`

### 500 Server Error

- **On GET (data load)**: Red banner on the screen with "Could not load. Please refresh." + Retry button. The retry fires the same request without user re-input.
- **On POST/PUT (write action)**: Red toast notification. Form/inputs stay enabled. All data preserved. User retries manually.
- **Never**: an HTML error page. All API errors return `{ error: "CODE", message: "..." }` JSON.

### Network Offline

- Detected via `window.addEventListener('offline', ...)` and `window.addEventListener('online', ...)`
- **Offline**: Amber sticky banner below navbar. Write buttons disabled with "Waiting for connection…" tooltip. Read-only views remain fully usable.
- **Recovery**: Online event fires → banner dismisses → buttons re-enable → ticket list auto-refetches.
- **No action queuing**: Write actions are not replayed on reconnect. User resubmits manually. Documented known limitation.
- **Request timeout** (>10,000ms): Treated as network error. Red toast. Form data preserved.

---

## 8. Animation & Transitions

### Page Transitions

All transitions are fade-in (200ms `ease-out`) triggered by React Router route changes. No slide transitions — slides imply a forward/back hierarchy this flat app does not have.

### Loading States

| Element | Animation |
|---------|-----------|
| Ticket list loading | 5 skeleton rows with Tailwind `animate-pulse` |
| Ticket detail loading | Full-page skeleton blocks matching content dimensions |
| Submit / Save button | Spinner replaces text (`animate-spin` SVG); button disabled |
| Search bar | Small inline spinner on right edge during debounce request |

### Micro-interactions

| Trigger | Animation | Duration |
|---------|-----------|----------|
| Button hover | Background darkens one shade | 150ms `transition-colors` |
| Button click | `active:scale-95` | 100ms `transition-transform` |
| Input focus | Border → brand blue | 150ms `transition-colors` |
| Table row hover | Background → `gray-50` | 100ms `transition-colors` |
| Toast appear | Slide in from bottom-right + fade | 250ms (react-hot-toast default) |
| Toast dismiss | Fade out + slide down | 200ms (react-hot-toast default) |
| New note appear | Fade in from opacity 0 | 300ms CSS transition on mount |
| Offline banner in | Slide down from `-translate-y-full` | 200ms |
| Offline banner out | Slide back up | 200ms |
| Form field valid (after error) | Red border + error message fade out | 150ms |

### `prefers-reduced-motion`

Add once to global CSS. Covers all animations site-wide with no per-component changes:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. Explicitly Out of Scope (Flow-Level)

The following flows do not exist in this application and should not be built:

| Flow | Reason |
|------|--------|
| User registration / login | Auth is out of scope for MVP |
| Password reset | No auth system exists |
| Customer self-service ticket submission | Internal tool only |
| Email notification flow | No outbound email in MVP |
| File upload flow | Text-only tickets in MVP |
| Admin panel / user management | No roles or multi-tenancy |
| Ticket assignment flow | No agent accounts in MVP |
| SLA timer / escalation flow | No automated workflows |
| Bulk action flow (close multiple tickets) | Single-ticket operations only |
| Export / download flow | P2 feature, post-MVP |

---

*This document is the single source of truth for all user-facing flows in the Support CRM MVP.*  
*Companion documents: `PRD.md` (feature requirements & personas) · `TECH_ARCH.md` (database schema & API spec)*
