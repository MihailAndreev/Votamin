# Votamin — Dashboard / User Space (MVP) — DB-aware Spec

> **Scope:** MVP dashboard experience for authenticated users.
> 
> **Notes:**
> - **No in-app Notifications** in MVP (planned for V2).
> - **Status label:** use **Open** (DB value `status = 'open'`).
> - **Poll type:** add `polls.kind` enum and use it as **Type** in the Dashboard.
> - **Shared With Me:** shows the poll owner’s `profiles.full_name` (fallback **"Unknown"**).

---

## 0) Role of Dashboard

- Dashboard is the **home page for authenticated users**.
- If a logged-in user opens `/` (public landing), redirect to `/dashboard`.
- If not logged in, show the public landing.

---

## 1) Layout

### Sidebar (collapsible)
- Left sidebar, collapsible.
- Expanded: icon + text.
- Collapsed: icons + tooltips on desktop.
- Mobile: sidebar becomes **offcanvas drawer** opened via hamburger.

### Sidebar items
- **My Polls** → `/dashboard/polls`
- **Polls Shared With Me** → `/dashboard/shared`
- **Account** → `/dashboard/account`
- **Logout** (at bottom)

### Admin links (only if `user_roles.role = 'admin'`)
- Admin → Users
- Admin → Polls

---

## 2) Routing

- `/dashboard` → redirect to `/dashboard/polls`
- `/dashboard/polls` → My Polls
- `/dashboard/shared` → Shared With Me
- `/dashboard/account` → Account

*(Notifications omitted for MVP.)*

---

## 3) Data access rules (security model)

### 3.1 Poll visibility vs access
- `polls.visibility` (**public/private**) is **listing-only**:
  - `public` can appear on Votamin Home page feed.
  - `private` does not appear on Home feed.

**Access to a poll is determined by:**
- Owner can always read their own poll.
- Non-owner can read a poll if:
  - they have voted in it (**participant access**), OR
  - they have a valid share link (`poll_shares`) to preview/participate.

### 3.2 Votes rules
- Poll owner can read all votes for their poll.
- Participant (non-owner) can read only their own vote(s).

---

## 4) Status model

**DB values:**
- `draft`
- `open` (UI label: **Open**)
- `closed`

No `disabled` / moderation state in MVP.

---

## 5) Poll kind (Type)

Add `polls.kind` enum and show it in the Dashboard.

**Allowed values:**
- `single_choice`
- `multiple_choice`
- `rating`
- `image`
- `slider`
- `numeric`

**UI mapping examples:**
- `single_choice` → “Single Choice”
- `multiple_choice` → “Multiple Choice”
- `rating` → “Rating”
- `image` → “Image Poll”
- `slider` → “Slider”
- `numeric` → “Numeric Input”

---

## 6) Page specs

### A) My Polls (`/dashboard/polls`)

#### Data rule
Return polls where:
- `polls.owner_id = auth.uid()`

Includes:
- `draft`, `open`, `closed`

#### Columns (desktop/table)
- **Title** (`polls.title`)
- **Type** (`polls.kind`)
- **Responses** (`polls.response_count`)
- **Deadline** (`polls.ends_at`, optional)
- **Status** (`polls.status` → Draft/Open/Closed)
- **My response** (boolean): whether `exists votes where poll_id = polls.id and voter_user_id = auth.uid()`
- **Actions** (⋮)

#### Actions
- View
- Edit
- Share (manage `poll_shares` for that poll)
- Delete

*(Optional)* Results page (if implemented in app): owner can view results for own polls.

#### Filters (MVP)
- Status filter: All / Draft / Open / Closed

#### Sorting (MVP)
- Default: `updated_at desc`
- Optional: sort by Responses / Deadline / Title

#### Empty state
- “You don’t have any polls yet.”
- CTA: “Create your first poll”

---

### B) Shared With Me (`/dashboard/shared`)

#### Meaning
“Polls created by someone else, where I participated (I voted).”

#### Data rule
Return polls where:
- `polls.owner_id != auth.uid()`
- `exists votes v where v.poll_id = polls.id and v.voter_user_id = auth.uid()`
- Exclude drafts: `polls.status != 'draft'`

Includes:
- `open`, `closed`

Does NOT include:
- polls only viewed (no vote)
- drafts
- own polls (even if owner voted)

#### Columns (desktop/table)
- **Title**
- **Owner**: `profiles.full_name` of `polls.owner_id` (fallback “Unknown”)
- **Deadline** (`polls.ends_at`)
- **Status** (Open/Closed)

#### Actions
- **View poll** (read-only if closed)
- **View results** (only if/when your product rules allow showing results to participants)

*(Note: Vote action is typically not needed here, because inclusion implies the user already voted.)*

#### Filters (MVP)
- Status filter: All / Open / Closed

#### Sorting (MVP)
- Default: `updated_at desc`
- Optional: Deadline / Title

#### Empty state
- “You haven’t participated in any polls yet.”
- Secondary: “When you vote in a poll created by someone else, it will appear here.”

---

### C) Account (`/dashboard/account`)

MVP fields:
- Email (read-only) from Supabase Auth user.
- Change password (optional).
- Logout.

---

## 7) Responsive behavior

### Sidebar
- Mobile: offcanvas drawer.

### Tables → cards on mobile
- Replace tables with stacked cards.
- Card fields (My Polls): Title, Type badge, Status badge, Responses, Deadline (if any), Actions.
- Card fields (Shared): Title, Owner, Status, Deadline.

---

## 8) i18n (translation-ready; EN-only for MVP)

All UI strings should come from `src/i18n/en.js`, e.g.
- `dashboard.sidebar.myPolls`
- `dashboard.sidebar.sharedWithMe`
- `dashboard.empty.myPolls.title`
- `dashboard.table.columns.title`
- `actions.edit`, `actions.share`, etc.

---

## 9) Database notes (current schema + required changes)

### 9.1 Current tables used
- `polls` (core)
- `votes` (participation)
- `profiles` (owner display name)
- `user_roles` (admin links)
- `poll_shares` (share links / invitations)

### 9.2 Required migrations for MVP

#### Migration 1 — Add `poll_kind` enum + `polls.kind`
- Create new enum type `poll_kind`.
- Add column `polls.kind poll_kind not null default 'single_choice'` (choose a sensible default).
- Backfill existing polls if needed.

#### Migration 2 — RLS: participant can read polls they voted in
- Add a `SELECT` policy on `public.polls` allowing authenticated users to read polls where they have a vote.

#### Migration 3 — RLS: participant can read poll owner profile name
- Add a `SELECT` policy on `public.profiles` allowing authenticated users to read the owner’s profile *only for polls where the user has voted*.

### 9.3 Suggested SQL (for migrations)

> **Note:** keep your existing owner/admin/share-code policies; these add missing capabilities.

**(A) poll_kind + polls.kind**
```sql
-- 1) create enum
create type public.poll_kind as enum (
  'single_choice',
  'multiple_choice',
  'rating',
  'image',
  'slider',
  'numeric'
);

-- 2) add column
alter table public.polls
  add column kind public.poll_kind not null default 'single_choice';

-- 3) optional: backfill existing rows (if you want to infer from allow_multiple_choices)
-- update public.polls
-- set kind = case when allow_multiple_choices then 'multiple_choice' else 'single_choice' end
-- where kind is null;
```

**(B) polls: allow participant read by vote**
```sql
create policy "participant_select_voted_polls"
on public.polls
for select
to authenticated
using (
  exists (
    select 1
    from public.votes v
    where v.poll_id = polls.id
      and v.voter_user_id = auth.uid()
  )
);
```

**(C) profiles: allow participant read of owner display name**
```sql
create policy "participant_select_poll_owner_profile"
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.polls p
    join public.votes v on v.poll_id = p.id
    where p.owner_id = profiles.user_id
      and v.voter_user_id = auth.uid()
  )
);
```

---

## 10) What we explicitly do NOT do in MVP

- No summary cards / analytics.
- No in-app Notifications (V2).
- No keyword search.
- No “share to specific users” access control (beyond share link + voted participation).

