-- Deebop Social Platform - Row Level Security Policies
-- Migration: 00002_rls_policies.sql

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE reposts ENABLE ROW LEVEL SECURITY;
ALTER TABLE views ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND is_verified = TRUE  -- Using verified as admin flag for now
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has blocked another user
CREATE OR REPLACE FUNCTION is_blocked(target_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM blocks
        WHERE (blocker_id = auth.uid() AND blocked_id = target_id)
           OR (blocker_id = target_id AND blocked_id = auth.uid())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user follows another user
CREATE OR REPLACE FUNCTION is_following(target_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM follows
        WHERE follower_id = auth.uid() AND following_id = target_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can view a profile (not blocked, follows if private)
CREATE OR REPLACE FUNCTION can_view_profile(profile_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    target_profile profiles%ROWTYPE;
BEGIN
    -- Own profile is always viewable
    IF profile_id = auth.uid() THEN
        RETURN TRUE;
    END IF;

    SELECT * INTO target_profile FROM profiles WHERE id = profile_id;

    -- Check if blocked
    IF is_blocked(profile_id) THEN
        RETURN FALSE;
    END IF;

    -- Suspended profiles are not viewable
    IF target_profile.is_suspended THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can view a post (visibility, blocks, private account)
CREATE OR REPLACE FUNCTION can_view_post(post_row posts)
RETURNS BOOLEAN AS $$
DECLARE
    author_profile profiles%ROWTYPE;
BEGIN
    -- Hidden posts not viewable (except by owner)
    IF post_row.is_hidden AND post_row.user_id != auth.uid() THEN
        RETURN FALSE;
    END IF;

    -- Own posts always viewable
    IF post_row.user_id = auth.uid() THEN
        RETURN TRUE;
    END IF;

    -- Check if blocked by author
    IF is_blocked(post_row.user_id) THEN
        RETURN FALSE;
    END IF;

    SELECT * INTO author_profile FROM profiles WHERE id = post_row.user_id;

    -- Public visibility and public account
    IF post_row.visibility = 'public' AND NOT author_profile.is_private THEN
        RETURN TRUE;
    END IF;

    -- Followers-only or private account: must be following
    IF is_following(post_row.user_id) THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Anyone can view non-suspended profiles (detailed access checked in app)
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (NOT is_suspended OR id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- POSTS POLICIES
-- =====================================================

-- View posts based on visibility, blocks, and private accounts
CREATE POLICY "Posts viewable based on visibility"
    ON posts FOR SELECT
    USING (
        user_id = auth.uid()  -- Own posts
        OR (
            NOT is_hidden
            AND NOT is_blocked(user_id)
            AND (
                -- Public post from public account
                (visibility = 'public' AND NOT EXISTS (
                    SELECT 1 FROM profiles WHERE id = posts.user_id AND is_private
                ))
                -- Or user follows the author
                OR is_following(user_id)
            )
        )
    );

-- Users can create posts
CREATE POLICY "Users can create posts"
    ON posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update own posts"
    ON posts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts"
    ON posts FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- HASHTAGS POLICIES
-- =====================================================

-- Hashtags are public
CREATE POLICY "Hashtags are public"
    ON hashtags FOR SELECT
    USING (TRUE);

-- Anyone can insert hashtags (via trigger)
CREATE POLICY "Anyone can insert hashtags"
    ON hashtags FOR INSERT
    WITH CHECK (TRUE);

-- Post-hashtags junction
CREATE POLICY "Post hashtags are public"
    ON post_hashtags FOR SELECT
    USING (TRUE);

CREATE POLICY "Users can insert post hashtags for own posts"
    ON post_hashtags FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM posts WHERE id = post_id AND user_id = auth.uid())
    );

-- =====================================================
-- FOLLOWS POLICIES
-- =====================================================

-- Follows are public (for follower counts)
CREATE POLICY "Follows are public"
    ON follows FOR SELECT
    USING (TRUE);

-- Users can follow others
CREATE POLICY "Users can follow"
    ON follows FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow
CREATE POLICY "Users can unfollow"
    ON follows FOR DELETE
    USING (auth.uid() = follower_id);

-- =====================================================
-- FOLLOW REQUESTS POLICIES
-- =====================================================

-- Users can see their own requests (sent or received)
CREATE POLICY "Users see own follow requests"
    ON follow_requests FOR SELECT
    USING (auth.uid() = requester_id OR auth.uid() = target_id);

-- Users can create follow requests
CREATE POLICY "Users can create follow requests"
    ON follow_requests FOR INSERT
    WITH CHECK (auth.uid() = requester_id);

-- Target can update request status
CREATE POLICY "Target can respond to requests"
    ON follow_requests FOR UPDATE
    USING (auth.uid() = target_id)
    WITH CHECK (auth.uid() = target_id);

-- Requester can delete (cancel) their request
CREATE POLICY "Requester can cancel request"
    ON follow_requests FOR DELETE
    USING (auth.uid() = requester_id);

-- =====================================================
-- LIKES POLICIES
-- =====================================================

-- Likes are public
CREATE POLICY "Likes are public"
    ON likes FOR SELECT
    USING (TRUE);

-- Users can like posts
CREATE POLICY "Users can like"
    ON likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can unlike
CREATE POLICY "Users can unlike"
    ON likes FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- SAVES POLICIES
-- =====================================================

-- Users can only see their own saves
CREATE POLICY "Users see own saves"
    ON saves FOR SELECT
    USING (auth.uid() = user_id);

-- Users can save posts
CREATE POLICY "Users can save"
    ON saves FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can unsave
CREATE POLICY "Users can unsave"
    ON saves FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- SHARES POLICIES
-- =====================================================

-- Shares are tracked but anonymous
CREATE POLICY "Share counts are public"
    ON shares FOR SELECT
    USING (TRUE);

-- Users can share
CREATE POLICY "Users can share"
    ON shares FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- REPOSTS POLICIES
-- =====================================================

-- Reposts are public
CREATE POLICY "Reposts are public"
    ON reposts FOR SELECT
    USING (TRUE);

-- Users can repost
CREATE POLICY "Users can repost"
    ON reposts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can remove repost
CREATE POLICY "Users can remove repost"
    ON reposts FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- VIEWS POLICIES
-- =====================================================

-- Views are insert-only, no select needed for users
CREATE POLICY "Users can log views"
    ON views FOR INSERT
    WITH CHECK (TRUE);  -- Allow anonymous views too

-- =====================================================
-- BLOCKS POLICIES
-- =====================================================

-- Users can see their own blocks
CREATE POLICY "Users see own blocks"
    ON blocks FOR SELECT
    USING (auth.uid() = blocker_id);

-- Users can block
CREATE POLICY "Users can block"
    ON blocks FOR INSERT
    WITH CHECK (auth.uid() = blocker_id);

-- Users can unblock
CREATE POLICY "Users can unblock"
    ON blocks FOR DELETE
    USING (auth.uid() = blocker_id);

-- =====================================================
-- REPORTS POLICIES
-- =====================================================

-- Users can see their own reports
CREATE POLICY "Users see own reports"
    ON reports FOR SELECT
    USING (auth.uid() = reporter_id);

-- Users can create reports
CREATE POLICY "Users can report"
    ON reports FOR INSERT
    WITH CHECK (
        auth.uid() = reporter_id
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND can_report = TRUE
        )
    );

-- =====================================================
-- BOOSTS POLICIES
-- =====================================================

-- Users can see their own boosts
CREATE POLICY "Users see own boosts"
    ON boosts FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create boosts
CREATE POLICY "Users can create boosts"
    ON boosts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can cancel pending boosts
CREATE POLICY "Users can cancel pending boosts"
    ON boosts FOR UPDATE
    USING (auth.uid() = user_id AND status = 'pending')
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- ADS POLICIES
-- =====================================================

-- Active ads are public (for feed insertion)
CREATE POLICY "Active ads are public"
    ON ads FOR SELECT
    USING (is_active AND starts_at <= NOW() AND (ends_at IS NULL OR ends_at > NOW()));

-- =====================================================
-- NOTIFICATIONS POLICIES
-- =====================================================

-- Users can see their own notifications
CREATE POLICY "Users see own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update (mark read) their own notifications
CREATE POLICY "Users can mark notifications read"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete notifications"
    ON notifications FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- INTEREST CATEGORIES POLICIES
-- =====================================================

-- Interest categories are public
CREATE POLICY "Interest categories are public"
    ON interest_categories FOR SELECT
    USING (TRUE);

-- =====================================================
-- APP SETTINGS POLICIES
-- =====================================================

-- App settings are public (read-only for clients)
CREATE POLICY "App settings are public"
    ON app_settings FOR SELECT
    USING (TRUE);
