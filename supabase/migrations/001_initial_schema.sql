-- ================================================================
-- Votamin V1 - Complete Database Schema
-- ================================================================
-- Purpose: Create all tables, triggers, RLS policies for Votamin V1
-- Date: 2026-02-21
-- 
-- Architecture:
--   - Authentication: Supabase Auth (auth.users)
--   - Profiles: Separate profiles table (auto-created on signup)
--   - Visibility: public | private (no unlisted)
--   - Sharing: poll_shares table for deep-linking (/p/{share_code})
--   - Voting: Authenticated only (voter_user_id NOT NULL)
--   - Roles: user (default), admin (superuser)
--   - Owner: Implicit role via polls.owner_id
--
-- Access Rules (enforced via RLS at database level):
--   - Owner: Full CRUD on own polls, sees all individual votes
--   - Participant: Sees aggregated results + own vote only
--   - Admin: Full access to everything
--   - Anonymous: Can view polls/options via valid share_code (no voting)
--
-- Migration order: Run this file as a single transaction
-- ================================================================

-- ================================================================
-- PART 1: EXTENSIONS AND TYPES
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE poll_status AS ENUM ('draft', 'open', 'closed');
CREATE TYPE poll_visibility AS ENUM ('public', 'private');
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- ================================================================
-- PART 2: TABLES
-- ================================================================

-- ----------------------------------------------------------------
-- 2.1 USER ROLES
-- Purpose: Assign roles (user/admin) to authenticated users
-- Default role is 'user'. Admin role grants full system access.
-- ----------------------------------------------------------------
CREATE TABLE user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_user_roles_role ON user_roles(role);

COMMENT ON TABLE user_roles IS 'User role assignments for authorization. Links to auth.users.';
COMMENT ON COLUMN user_roles.user_id IS 'FK to auth.users(id). PK ensures one role per user.';
COMMENT ON COLUMN user_roles.role IS 'User role: user (default) or admin (superuser).';

-- ----------------------------------------------------------------
-- 2.2 PROFILES
-- Purpose: Store additional user data separate from auth.users.
-- Email/password remain in auth.users (managed by Supabase Auth).
-- Profile is auto-created on signup via trigger.
-- ----------------------------------------------------------------
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);

COMMENT ON TABLE profiles IS 'Additional user profile data. Separate from auth.users to avoid duplication. Auto-created on signup.';
COMMENT ON COLUMN profiles.user_id IS 'FK to auth.users(id). ONE-TO-ONE relationship.';
COMMENT ON COLUMN profiles.full_name IS 'User display name.';
COMMENT ON COLUMN profiles.avatar_url IS 'URL to user avatar image.';

-- ----------------------------------------------------------------
-- 2.3 POLLS
-- Purpose: Core poll/survey entity.
-- visibility: public (listed) or private (only via share_code or owner).
-- status: draft (hidden), open (accepting votes), closed (archived).
-- response_count: Denormalized total votes (updated via trigger).
-- ----------------------------------------------------------------
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description_html TEXT,
  visibility poll_visibility NOT NULL DEFAULT 'private',
  status poll_status NOT NULL DEFAULT 'draft',
  allow_multiple_choices BOOLEAN NOT NULL DEFAULT FALSE,
  max_choices INT CHECK (max_choices IS NULL OR max_choices > 0),
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  response_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CHECK (ends_at IS NULL OR starts_at IS NULL OR starts_at < ends_at)
);

CREATE INDEX idx_polls_owner_id ON polls(owner_id);
CREATE INDEX idx_polls_status ON polls(status);
CREATE INDEX idx_polls_visibility ON polls(visibility);
CREATE INDEX idx_polls_created_at ON polls(created_at DESC);
CREATE INDEX idx_polls_owner_status ON polls(owner_id, status);
CREATE INDEX idx_polls_visibility_status ON polls(visibility, status);

COMMENT ON TABLE polls IS 'Core poll/survey entity. Created by owner, published for voting.';
COMMENT ON COLUMN polls.owner_id IS 'Creator of the poll. FK to auth.users(id).';
COMMENT ON COLUMN polls.visibility IS 'public: listed publicly. private: accessible only via share_code or by owner/admin.';
COMMENT ON COLUMN polls.status IS 'draft: not published. open: accepting votes. closed: no more votes.';
COMMENT ON COLUMN polls.allow_multiple_choices IS 'If TRUE, participants can select multiple options.';
COMMENT ON COLUMN polls.max_choices IS 'Max number of options a participant can select. NULL = unlimited (when allow_multiple_choices is TRUE).';
COMMENT ON COLUMN polls.response_count IS 'Denormalized total vote count. Updated automatically via trigger.';

-- ----------------------------------------------------------------
-- 2.4 POLL OPTIONS
-- Purpose: Answer choices for a poll. Ordered by position.
-- Each poll has multiple options with unique positioning.
-- ----------------------------------------------------------------
CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  position INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (poll_id, position)
);

CREATE INDEX idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX idx_poll_options_position ON poll_options(poll_id, position);

COMMENT ON TABLE poll_options IS 'Answer choices for a poll. Ordered by position. Unique position per poll.';
COMMENT ON COLUMN poll_options.text IS 'Option display text (e.g., "Yes", "No", "Maybe").';
COMMENT ON COLUMN poll_options.position IS 'Display order within poll. UNIQUE per poll_id.';

-- ----------------------------------------------------------------
-- 2.5 VOTES
-- Purpose: Store authenticated user votes on poll options.
-- voter_user_id is NOT NULL: anonymous voting is NOT allowed.
-- UNIQUE(poll_id, voter_user_id): one vote per user per poll.
-- ----------------------------------------------------------------
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  voter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (poll_id, voter_user_id)
);

CREATE INDEX idx_votes_poll_id ON votes(poll_id);
CREATE INDEX idx_votes_option_id ON votes(option_id);
CREATE INDEX idx_votes_voter_user_id ON votes(voter_user_id);
CREATE INDEX idx_votes_created_at ON votes(created_at DESC);
CREATE INDEX idx_votes_poll_voter ON votes(poll_id, voter_user_id);

COMMENT ON TABLE votes IS 'User votes. Authentication required (voter_user_id NOT NULL). One vote per user per poll.';
COMMENT ON COLUMN votes.voter_user_id IS 'Authenticated voter. FK to auth.users(id). NOT NULL = no anonymous votes.';
COMMENT ON COLUMN votes.option_id IS 'Selected option. FK to poll_options(id).';

-- ----------------------------------------------------------------
-- 2.6 POLL SHARES
-- Purpose: Share links for discovering polls via /p/{share_code}.
-- Works for both authenticated and unauthenticated users.
-- share_code is alphanumeric, 6+ chars, unique.
-- expires_at is optional (NULL = never expires).
-- Sharing does NOT allow voting - only poll discovery/preview.
-- ----------------------------------------------------------------
CREATE TABLE poll_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  share_code TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CHECK (share_code ~ '^[A-Za-z0-9]{6,}$')
);

CREATE INDEX idx_poll_shares_poll_id ON poll_shares(poll_id);
CREATE INDEX idx_poll_shares_share_code ON poll_shares(share_code);
CREATE INDEX idx_poll_shares_expires_at ON poll_shares(expires_at);
CREATE INDEX idx_poll_shares_code_expires ON poll_shares(share_code, expires_at);

COMMENT ON TABLE poll_shares IS 'Share links for poll discovery. Anyone (auth or anon) can open /p/{share_code} to preview a poll.';
COMMENT ON COLUMN poll_shares.share_code IS 'Unique alphanumeric code (6+ chars). Used in URL: /p/{share_code}.';
COMMENT ON COLUMN poll_shares.expires_at IS 'Optional expiration. NULL = never expires. Expired codes are rejected by RLS.';

-- ================================================================
-- PART 3: TRIGGERS
-- ================================================================

-- ----------------------------------------------------------------
-- 3.1 Auto-create profile on user signup
-- When a new user registers via Supabase Auth, an empty profile row
-- is automatically created. User can later fill in name, avatar, etc.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, full_name, created_at, updated_at)
  VALUES (NEW.id, '', now(), now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profile_signup_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_profile_on_signup();

COMMENT ON FUNCTION create_profile_on_signup IS 'Creates empty profile row when a new user signs up via Supabase Auth.';

-- ----------------------------------------------------------------
-- 3.2 Increment response_count on vote insert
-- Keeps polls.response_count in sync with actual vote count.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_response_count_on_vote_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE polls SET response_count = response_count + 1 WHERE id = NEW.poll_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vote_insert_trigger
AFTER INSERT ON votes
FOR EACH ROW
EXECUTE FUNCTION update_response_count_on_vote_insert();

COMMENT ON FUNCTION update_response_count_on_vote_insert IS 'Increments polls.response_count when a vote is inserted.';

-- ----------------------------------------------------------------
-- 3.3 Decrement response_count on vote delete
-- Keeps polls.response_count in sync when votes are removed.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_response_count_on_vote_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE polls SET response_count = response_count - 1 WHERE id = OLD.poll_id AND response_count > 0;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vote_delete_trigger
AFTER DELETE ON votes
FOR EACH ROW
EXECUTE FUNCTION update_response_count_on_vote_delete();

COMMENT ON FUNCTION update_response_count_on_vote_delete IS 'Decrements polls.response_count when a vote is deleted (floor at 0).';

-- ================================================================
-- PART 4: ENABLE ROW-LEVEL SECURITY
-- ================================================================

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_shares ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- PART 5: RLS HELPER FUNCTIONS
-- ================================================================

-- ----------------------------------------------------------------
-- 5.1 Check if user has admin role
-- Used in RLS policies to grant admin full access.
-- SECURITY DEFINER: runs with function owner privileges to avoid
-- infinite recursion when checking user_roles table.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM user_roles WHERE user_id = check_user_id),
    FALSE
  );
$$ LANGUAGE SQL SECURITY DEFINER;

COMMENT ON FUNCTION is_admin IS 'Returns TRUE if user has admin role. SECURITY DEFINER to bypass RLS on user_roles.';

-- ----------------------------------------------------------------
-- 5.2 Check if poll is currently open for voting
-- Validates: status = open AND within time window (if set).
-- SECURITY DEFINER: runs with function owner privileges to read
-- polls table regardless of caller RLS permissions.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION poll_is_open_for_voting(check_poll_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT
      status = 'open'
      AND (starts_at IS NULL OR now() >= starts_at)
      AND (ends_at IS NULL OR now() < ends_at)
    FROM polls WHERE id = check_poll_id),
    FALSE
  );
$$ LANGUAGE SQL SECURITY DEFINER;

COMMENT ON FUNCTION poll_is_open_for_voting IS 'Returns TRUE if poll is open and within starts_at/ends_at window.';

-- ================================================================
-- PART 6: RLS POLICIES
-- ================================================================

-- ----------------------------------------------------------------
-- 6.1 USER ROLES
-- - Users can see their own role
-- - Admins can see and manage all roles
-- ----------------------------------------------------------------

CREATE POLICY "user_select_own_role"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "admin_select_all_roles"
  ON user_roles FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "admin_insert_roles"
  ON user_roles FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_update_roles"
  ON user_roles FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- ----------------------------------------------------------------
-- 6.2 PROFILES
-- - Users can read and update their own profile
-- - Admins can read and update all profiles
-- ----------------------------------------------------------------

CREATE POLICY "user_select_own_profile"
  ON profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "admin_select_all_profiles"
  ON profiles FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "user_update_own_profile"
  ON profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_update_any_profile"
  ON profiles FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- ----------------------------------------------------------------
-- 6.3 POLLS
-- Three SELECT paths:
--   1. Owner sees own polls (any status/visibility)
--   2. Authenticated users see public polls
--   3. Anyone (auth or anon) sees polls with valid share code
-- CUD restricted to owner + admin
-- ----------------------------------------------------------------

CREATE POLICY "owner_select_own_polls"
  ON polls FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "authenticated_select_public_polls"
  ON polls FOR SELECT
  USING (
    visibility = 'public'
    AND auth.role() = 'authenticated'
  );

-- This policy enables /p/{share_code} for both logged-in and anonymous users.
-- The share code acts as a discovery mechanism only - voting still requires auth.
CREATE POLICY "anyone_select_polls_via_share_code"
  ON polls FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM poll_shares
      WHERE poll_shares.poll_id = polls.id
      AND (poll_shares.expires_at IS NULL OR poll_shares.expires_at > now())
    )
  );

CREATE POLICY "admin_select_all_polls"
  ON polls FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "owner_create_polls"
  ON polls FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "owner_update_own_polls"
  ON polls FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "owner_delete_own_polls"
  ON polls FOR DELETE
  USING (owner_id = auth.uid());

CREATE POLICY "admin_update_any_polls"
  ON polls FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_delete_any_polls"
  ON polls FOR DELETE
  USING (is_admin(auth.uid()));

-- ----------------------------------------------------------------
-- 6.4 POLL OPTIONS
-- SELECT follows poll visibility:
--   1. Owner sees options for own polls
--   2. Anyone sees options for public polls
--   3. Anyone sees options for polls with valid share code
-- CUD restricted to owner + admin
-- ----------------------------------------------------------------

CREATE POLICY "owner_select_own_poll_options"
  ON poll_options FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM polls
      WHERE polls.id = poll_options.poll_id
      AND polls.owner_id = auth.uid()
    )
  );

CREATE POLICY "anyone_select_public_poll_options"
  ON poll_options FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM polls
      WHERE polls.id = poll_options.poll_id
      AND polls.visibility = 'public'
    )
  );

CREATE POLICY "anyone_select_poll_options_via_share_code"
  ON poll_options FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM poll_shares
      WHERE poll_shares.poll_id = poll_options.poll_id
      AND (poll_shares.expires_at IS NULL OR poll_shares.expires_at > now())
    )
  );

CREATE POLICY "admin_select_all_poll_options"
  ON poll_options FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "owner_insert_own_poll_options"
  ON poll_options FOR INSERT
  WITH CHECK (
    EXISTS(
      SELECT 1 FROM polls
      WHERE polls.id = poll_options.poll_id
      AND polls.owner_id = auth.uid()
    )
  );

CREATE POLICY "owner_update_own_poll_options"
  ON poll_options FOR UPDATE
  USING (
    EXISTS(
      SELECT 1 FROM polls
      WHERE polls.id = poll_options.poll_id
      AND polls.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS(
      SELECT 1 FROM polls
      WHERE polls.id = poll_options.poll_id
      AND polls.owner_id = auth.uid()
    )
  );

CREATE POLICY "owner_delete_own_poll_options"
  ON poll_options FOR DELETE
  USING (
    EXISTS(
      SELECT 1 FROM polls
      WHERE polls.id = poll_options.poll_id
      AND polls.owner_id = auth.uid()
    )
  );

CREATE POLICY "admin_insert_any_poll_options"
  ON poll_options FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_update_any_poll_options"
  ON poll_options FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_delete_any_poll_options"
  ON poll_options FOR DELETE
  USING (is_admin(auth.uid()));

-- ----------------------------------------------------------------
-- 6.5 VOTES (CRITICAL - Privacy enforcement)
--
-- SELECT:
--   - Owner sees ALL individual votes on their polls (who voted for what)
--   - Participant sees ONLY their own vote (never other peoples votes)
--   - Admin sees all votes
--
-- INSERT:
--   - Authenticated users only (auth.uid() = voter_user_id)
--   - Poll must be open and within time window
--   - UNIQUE(poll_id, voter_user_id) prevents double voting
--
-- DELETE:
--   - Owner can moderate (delete votes from own polls)
--   - Admin can delete any vote
--
-- UPDATE:
--   - Not allowed for anyone (vote is immutable once cast)
-- ----------------------------------------------------------------

CREATE POLICY "owner_select_votes_on_own_polls"
  ON votes FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM polls
      WHERE polls.id = votes.poll_id
      AND polls.owner_id = auth.uid()
    )
  );

CREATE POLICY "participant_select_own_votes_only"
  ON votes FOR SELECT
  USING (voter_user_id = auth.uid());

CREATE POLICY "admin_select_all_votes"
  ON votes FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "authenticated_insert_vote_on_open_polls"
  ON votes FOR INSERT
  WITH CHECK (
    auth.uid() = voter_user_id
    AND poll_is_open_for_voting(poll_id)
  );

CREATE POLICY "owner_delete_votes_from_own_polls"
  ON votes FOR DELETE
  USING (
    EXISTS(
      SELECT 1 FROM polls
      WHERE polls.id = votes.poll_id
      AND polls.owner_id = auth.uid()
    )
  );

CREATE POLICY "admin_delete_any_vote"
  ON votes FOR DELETE
  USING (is_admin(auth.uid()));

-- ----------------------------------------------------------------
-- 6.6 POLL SHARES
--
-- SELECT:
--   - Anyone (auth or anon) can read valid non-expired share codes
--     This enables /p/{share_code} discovery without authentication
--   - Owner can see all shares for their polls (including expired)
--   - Admin can see all shares
--
-- INSERT:
--   - Owner can create shares for their polls
--   - Admin can create shares for any poll
--
-- DELETE:
--   - Owner can revoke shares for their polls
--   - Admin can delete any share
-- ----------------------------------------------------------------

CREATE POLICY "anyone_select_valid_share_codes"
  ON poll_shares FOR SELECT
  USING (
    expires_at IS NULL
    OR expires_at > now()
  );

CREATE POLICY "owner_select_own_poll_shares"
  ON poll_shares FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM polls
      WHERE polls.id = poll_shares.poll_id
      AND polls.owner_id = auth.uid()
    )
  );

CREATE POLICY "admin_select_all_poll_shares"
  ON poll_shares FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "owner_insert_poll_shares"
  ON poll_shares FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS(
      SELECT 1 FROM polls
      WHERE polls.id = poll_shares.poll_id
      AND polls.owner_id = auth.uid()
    )
  );

CREATE POLICY "owner_delete_poll_shares"
  ON poll_shares FOR DELETE
  USING (
    EXISTS(
      SELECT 1 FROM polls
      WHERE polls.id = poll_shares.poll_id
      AND polls.owner_id = auth.uid()
    )
  );

CREATE POLICY "admin_insert_any_poll_shares"
  ON poll_shares FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_delete_any_poll_shares"
  ON poll_shares FOR DELETE
  USING (is_admin(auth.uid()));

-- ================================================================
-- END OF MIGRATION
-- ================================================================
