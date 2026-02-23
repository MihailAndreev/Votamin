# Votamin Database Schema - Migrations Guide

## Overview

Votamin V1 uses PostgreSQL (via Supabase) with Row-Level Security (RLS) to enforce all data access rules at the database level — not just the UI.

## Key Design Decisions

### Authentication
- **Supabase Auth** manages email, password, sessions (`auth.users`)
- **Profiles table** stores additional user data (name, avatar, phone, bio)
- Profile is auto-created on signup via database trigger
- Email is never duplicated in profiles — it lives only in `auth.users`

### Visibility Model
- **`public`**: Listed publicly, visible to all authenticated users
- **`private`**: Not listed, accessible only via share_code, by owner, or by admin
- There is no `unlisted` mode; share codes handle all deep-linking needs

### Share Links (`/p/{share_code}`)
- Share codes enable **discovery only** — they do NOT allow anonymous voting
- Both authenticated and unauthenticated users can open `/p/{share_code}`
- Unauthenticated users see a preview (poll title + options) with login/register prompt
- After login/register, user is redirected back to the poll to vote

### Voting
- **Authenticated only**: `votes.voter_user_id` is `NOT NULL`
- **One vote per user per poll**: Enforced by `UNIQUE(poll_id, voter_user_id)`
- Votes are immutable (no UPDATE policy)

### Roles
- **user** (default): Can create polls, vote, manage own profile
- **admin**: Full access to all data and operations
- **owner**: Implicit role — determined by `polls.owner_id`

## Tables

### `user_roles`
| Column | Type | Constraints |
|--------|------|-------------|
| user_id | UUID | PK, FK → auth.users ON DELETE CASCADE |
| role | user_role | NOT NULL, DEFAULT 'user' |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

### `profiles`
| Column | Type | Constraints |
|--------|------|-------------|
| user_id | UUID | PK, FK → auth.users ON DELETE CASCADE |
| full_name | TEXT | DEFAULT '' |
| phone | TEXT | NULLABLE |
| avatar_url | TEXT | NULLABLE |
| bio | TEXT | NULLABLE |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

### `polls`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() |
| owner_id | UUID | NOT NULL, FK → auth.users ON DELETE CASCADE |
| title | TEXT | NOT NULL |
| description_html | TEXT | NULLABLE |
| visibility | poll_visibility | NOT NULL, DEFAULT 'private' |
| status | poll_status | NOT NULL, DEFAULT 'draft' |
| allow_multiple_choices | BOOLEAN | NOT NULL, DEFAULT FALSE |
| max_choices | INT | NULLABLE, CHECK > 0 |
| starts_at | TIMESTAMPTZ | NULLABLE |
| ends_at | TIMESTAMPTZ | NULLABLE |
| response_count | INT | NOT NULL, DEFAULT 0 |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

**Check constraint**: `ends_at IS NULL OR starts_at IS NULL OR starts_at < ends_at`

### `poll_options`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() |
| poll_id | UUID | NOT NULL, FK → polls ON DELETE CASCADE |
| text | TEXT | NOT NULL |
| position | INT | NOT NULL, UNIQUE(poll_id, position) |
| created_at | TIMESTAMPTZ | DEFAULT now() |

### `votes`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() |
| poll_id | UUID | NOT NULL, FK → polls ON DELETE CASCADE |
| option_id | UUID | NOT NULL, FK → poll_options ON DELETE CASCADE |
| voter_user_id | UUID | NOT NULL, FK → auth.users ON DELETE CASCADE |
| created_at | TIMESTAMPTZ | DEFAULT now() |

**Unique constraint**: `UNIQUE(poll_id, voter_user_id)` — one vote per user per poll

### `poll_shares`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() |
| poll_id | UUID | NOT NULL, FK → polls ON DELETE CASCADE |
| share_code | TEXT | NOT NULL, UNIQUE |
| expires_at | TIMESTAMPTZ | NULLABLE |
| created_by | UUID | NOT NULL, FK → auth.users ON DELETE CASCADE |
| created_at | TIMESTAMPTZ | DEFAULT now() |

**Check constraint**: `share_code ~ '^[A-Za-z0-9]{6,}$'`

## Triggers

### `profile_signup_trigger`
- **Fires**: AFTER INSERT on `auth.users`
- **Action**: Creates empty row in `profiles` with the new user's ID
- **Purpose**: Every registered user automatically has a profile record

### `vote_insert_trigger`
- **Fires**: AFTER INSERT on `votes`
- **Action**: Increments `polls.response_count` by 1
- **Purpose**: Keep denormalized count in sync without querying votes

### `vote_delete_trigger`
- **Fires**: AFTER DELETE on `votes`
- **Action**: Decrements `polls.response_count` by 1 (floor at 0)
- **Purpose**: Keep denormalized count in sync when votes are removed

## RLS Helper Functions

### `is_admin(check_user_id UUID) → BOOLEAN`
Returns TRUE if user has `admin` role. `SECURITY DEFINER` to bypass RLS on `user_roles`.

### `poll_is_open_for_voting(check_poll_id UUID) → BOOLEAN`
Returns TRUE if poll status is `open` and current time is within `starts_at`/`ends_at` window. `SECURITY DEFINER` to bypass RLS on `polls`.

## RLS Access Matrix

### Polls

| Action | Owner | Authenticated User | Anonymous (via share_code) | Admin |
|--------|-------|--------------------|----------------------------|-------|
| SELECT own | ✅ | — | — | ✅ all |
| SELECT public | ✅ | ✅ | ❌ | ✅ all |
| SELECT via share_code | ✅ | ✅ | ✅ | ✅ all |
| INSERT | ✅ own | ✅ own | ❌ | ✅ |
| UPDATE | ✅ own | ❌ | ❌ | ✅ |
| DELETE | ✅ own | ❌ | ❌ | ✅ |

### Poll Options

| Action | Owner | Authenticated User | Anonymous (via share_code) | Admin |
|--------|-------|--------------------|----------------------------|-------|
| SELECT (own poll) | ✅ | — | — | ✅ all |
| SELECT (public poll) | ✅ | ✅ | ✅ | ✅ all |
| SELECT (via share_code) | ✅ | ✅ | ✅ | ✅ all |
| INSERT | ✅ own poll | ❌ | ❌ | ✅ |
| UPDATE | ✅ own poll | ❌ | ❌ | ✅ |
| DELETE | ✅ own poll | ❌ | ❌ | ✅ |

### Votes (Privacy Critical)

| Action | Owner | Participant | Anonymous | Admin |
|--------|-------|-------------|-----------|-------|
| SELECT | ✅ all votes on own polls | ✅ own vote only | ❌ | ✅ all |
| INSERT | ✅ if poll open | ✅ if poll open | ❌ | ✅ |
| UPDATE | ❌ | ❌ | ❌ | ❌ |
| DELETE | ✅ own polls (moderation) | ❌ | ❌ | ✅ |

### Poll Shares

| Action | Owner | Authenticated User | Anonymous | Admin |
|--------|-------|--------------------|-----------|-------|
| SELECT valid | ✅ | ✅ | ✅ | ✅ |
| SELECT expired | ✅ own polls | ❌ | ❌ | ✅ |
| INSERT | ✅ own polls | ❌ | ❌ | ✅ |
| DELETE | ✅ own polls | ❌ | ❌ | ✅ |

### Profiles

| Action | Owner | Other Users | Admin |
|--------|-------|-------------|-------|
| SELECT | ✅ own | ❌ | ✅ all |
| UPDATE | ✅ own | ❌ | ✅ all |

### User Roles

| Action | User | Admin |
|--------|------|-------|
| SELECT | ✅ own | ✅ all |
| INSERT | ❌ | ✅ |
| UPDATE | ❌ | ✅ |

## Cascade Deletion Chain

```
DELETE auth.users(id)
  ├── CASCADE → profiles(user_id)
  ├── CASCADE → user_roles(user_id)
  ├── CASCADE → polls(owner_id)
  │     ├── CASCADE → poll_options(poll_id)
  │     ├── CASCADE → votes(poll_id)
  │     └── CASCADE → poll_shares(poll_id)
  ├── CASCADE → votes(voter_user_id)
  └── CASCADE → poll_shares(created_by)
```

## Indexes

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| user_roles | idx_user_roles_role | role | Fast role lookups |
| profiles | idx_profiles_created_at | created_at DESC | Recent profiles |
| polls | idx_polls_owner_id | owner_id | Owner's polls |
| polls | idx_polls_status | status | Filter by status |
| polls | idx_polls_visibility | visibility | Filter by visibility |
| polls | idx_polls_created_at | created_at DESC | Recent polls |
| polls | idx_polls_owner_status | owner_id, status | Owner + status filter |
| polls | idx_polls_visibility_status | visibility, status | Public + open filter |
| poll_options | idx_poll_options_poll_id | poll_id | Options per poll |
| poll_options | idx_poll_options_position | poll_id, position | Ordered options |
| votes | idx_votes_poll_id | poll_id | Votes per poll |
| votes | idx_votes_option_id | option_id | Votes per option |
| votes | idx_votes_voter_user_id | voter_user_id | User's votes |
| votes | idx_votes_created_at | created_at DESC | Recent votes |
| votes | idx_votes_poll_voter | poll_id, voter_user_id | Duplicate vote check |
| poll_shares | idx_poll_shares_poll_id | poll_id | Shares per poll |
| poll_shares | idx_poll_shares_share_code | share_code | Share code lookup |
| poll_shares | idx_poll_shares_expires_at | expires_at | Expiration check |
| poll_shares | idx_poll_shares_code_expires | share_code, expires_at | Combined lookup |

## Migration Files

| File | Purpose |
|------|---------|
| `001_initial_schema.sql` | Complete schema: types, tables, triggers, RLS policies |
| `009_fix_rls_recursion_plpgsql.sql` | Break `polls` ↔ `votes` recursion via hardened helper functions |
| `010_fix_remaining_rls_functions.sql` | Harden remaining helper functions (`is_admin`, `poll_is_open_for_voting`) |
| `011_fix_rls_recursion_polls_poll_shares.sql` | Break `polls` ↔ `poll_shares` recursion via helper function + policy updates |

## RLS Recursion Safety

See `../docs/RLS_RECURSION_GUARDRAILS.md` for architecture notes, fixed cycles, and guardrails for writing future policies safely.

## How to Apply

### Option 1: Supabase MCP (Already Applied)
The migration was applied via Supabase MCP `apply_migration` on 2026-02-21.

### Option 2: Supabase SQL Editor
1. Open Supabase Console → SQL Editor
2. Paste entire content of `001_initial_schema.sql`
3. Click **Run**
4. Verify in Database → Tables that all 6 tables exist
5. Verify in Authentication → Policies that RLS is enabled

### Option 3: Supabase CLI
```bash
supabase db push
```

## How to Verify

### Tables Created
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```
Expected: `poll_options`, `poll_shares`, `polls`, `profiles`, `user_roles`, `votes`

### RLS Enabled
```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;
```
Expected: All 6 tables with `rowsecurity = true`

### Policies Count
```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```
Expected:
- poll_options: 8
- poll_shares: 6
- polls: 8
- profiles: 4
- user_roles: 4
- votes: 6

### Triggers
```sql
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public' OR event_object_schema = 'auth'
ORDER BY event_object_table;
```
Expected: `profile_signup_trigger`, `vote_insert_trigger`, `vote_delete_trigger`

## Share Code Flow (Unauthenticated User)

```
1. User receives link: /p/abc123
2. Frontend calls: supabase.from('poll_shares').select('poll_id').eq('share_code', 'abc123')
   → RLS allows: anyone_select_valid_share_codes (non-expired)
3. Frontend calls: supabase.from('polls').select('*').eq('id', poll_id)
   → RLS allows: anyone_select_polls_via_share_code
4. Frontend calls: supabase.from('poll_options').select('*').eq('poll_id', poll_id)
   → RLS allows: anyone_select_poll_options_via_share_code
5. User sees poll preview + two buttons:
   - "I have an account" → /login?redirect=/p/abc123
   - "Create an account" → /register?redirect=/p/abc123
6. After auth → redirect back to /p/abc123
7. Frontend calls: supabase.from('votes').insert({...})
   → RLS allows: authenticated_insert_vote_on_open_polls
```

## Important Notes

- **No anonymous voting**: `votes.voter_user_id` is `NOT NULL` and RLS enforces `auth.uid() = voter_user_id`
- **Votes are immutable**: No UPDATE policies exist on votes table
- **Share codes are for discovery only**: Opening `/p/{share_code}` shows content but voting requires authentication
- **Private polls are invisible** in public listings but accessible via valid share codes
- **Cascade deletes** ensure data integrity when users or polls are deleted
- **Denormalized `response_count`** avoids expensive COUNT queries on the votes table
