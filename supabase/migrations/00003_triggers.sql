-- Deebop Social Platform - Triggers and Functions
-- Migration: 00003_triggers.sql

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Apply to posts
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- HASHTAG PARSING TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION parse_hashtags()
RETURNS TRIGGER AS $$
DECLARE
    tag TEXT;
    tag_id UUID;
    tags TEXT[];
BEGIN
    -- Delete existing hashtag associations
    DELETE FROM post_hashtags WHERE post_id = NEW.id;

    -- Extract hashtags from text_content
    IF NEW.text_content IS NOT NULL THEN
        SELECT ARRAY(
            SELECT DISTINCT lower(substring(match[1] from 1))
            FROM regexp_matches(NEW.text_content, '#([a-zA-Z0-9_]+)', 'g') AS match
        ) INTO tags;

        FOREACH tag IN ARRAY COALESCE(tags, '{}')
        LOOP
            -- Insert or get hashtag
            INSERT INTO hashtags (name)
            VALUES (tag)
            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
            RETURNING id INTO tag_id;

            -- Link to post
            INSERT INTO post_hashtags (post_id, hashtag_id)
            VALUES (NEW.id, tag_id)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER parse_post_hashtags
    AFTER INSERT OR UPDATE OF text_content ON posts
    FOR EACH ROW EXECUTE FUNCTION parse_hashtags();

-- =====================================================
-- HASHTAG POST COUNT TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_hashtag_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE hashtags SET posts_count = posts_count + 1 WHERE id = NEW.hashtag_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE hashtags SET posts_count = posts_count - 1 WHERE id = OLD.hashtag_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hashtag_counts_trigger
    AFTER INSERT OR DELETE ON post_hashtags
    FOR EACH ROW EXECUTE FUNCTION update_hashtag_counts();

-- =====================================================
-- FOLLOW COUNTS TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
        UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_id;
        UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_follow_counts_trigger
    AFTER INSERT OR DELETE ON follows
    FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- =====================================================
-- POST COUNTS TRIGGER (for profile)
-- =====================================================

CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE profiles SET posts_count = posts_count + 1 WHERE id = NEW.user_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE profiles SET posts_count = GREATEST(0, posts_count - 1) WHERE id = OLD.user_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_counts_trigger
    AFTER INSERT OR DELETE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_post_counts();

-- =====================================================
-- LIKE COUNTS TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_like_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_like_counts_trigger
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW EXECUTE FUNCTION update_like_counts();

-- =====================================================
-- SAVE COUNTS TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_save_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET saves_count = saves_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET saves_count = GREATEST(0, saves_count - 1) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_save_counts_trigger
    AFTER INSERT OR DELETE ON saves
    FOR EACH ROW EXECUTE FUNCTION update_save_counts();

-- =====================================================
-- SHARE COUNTS TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_share_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET shares_count = shares_count + 1 WHERE id = NEW.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_share_counts_trigger
    AFTER INSERT ON shares
    FOR EACH ROW EXECUTE FUNCTION update_share_counts();

-- =====================================================
-- REPOST COUNTS TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_repost_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET reposts_count = reposts_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET reposts_count = GREATEST(0, reposts_count - 1) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_repost_counts_trigger
    AFTER INSERT OR DELETE ON reposts
    FOR EACH ROW EXECUTE FUNCTION update_repost_counts();

-- =====================================================
-- VIEW COUNTS TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_view_counts()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE posts SET views_count = views_count + 1 WHERE id = NEW.post_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_view_counts_trigger
    AFTER INSERT ON views
    FOR EACH ROW EXECUTE FUNCTION update_view_counts();

-- =====================================================
-- NOTIFICATION TRIGGERS
-- =====================================================

-- Create notification on follow
CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (user_id, type, title, actor_id)
    VALUES (
        NEW.following_id,
        'follow',
        'started following you',
        NEW.follower_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_on_follow_trigger
    AFTER INSERT ON follows
    FOR EACH ROW EXECUTE FUNCTION notify_on_follow();

-- Create notification on like
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
DECLARE
    post_owner_id UUID;
BEGIN
    SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;

    -- Don't notify self-likes
    IF post_owner_id != NEW.user_id THEN
        INSERT INTO notifications (user_id, type, title, actor_id, post_id)
        VALUES (
            post_owner_id,
            'like',
            'liked your post',
            NEW.user_id,
            NEW.post_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_on_like_trigger
    AFTER INSERT ON likes
    FOR EACH ROW EXECUTE FUNCTION notify_on_like();

-- Create notification on follow request
CREATE OR REPLACE FUNCTION notify_on_follow_request()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (user_id, type, title, actor_id)
    VALUES (
        NEW.target_id,
        'follow_request',
        'requested to follow you',
        NEW.requester_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_on_follow_request_trigger
    AFTER INSERT ON follow_requests
    FOR EACH ROW EXECUTE FUNCTION notify_on_follow_request();

-- Create notification on follow request acceptance
CREATE OR REPLACE FUNCTION notify_on_follow_accepted()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        INSERT INTO notifications (user_id, type, title, actor_id)
        VALUES (
            NEW.requester_id,
            'follow_accepted',
            'accepted your follow request',
            NEW.target_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_on_follow_accepted_trigger
    AFTER UPDATE ON follow_requests
    FOR EACH ROW EXECUTE FUNCTION notify_on_follow_accepted();

-- =====================================================
-- PROFILE CREATION ON AUTH.USERS INSERT
-- =====================================================

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, username, display_name)
    VALUES (
        NEW.id,
        -- Generate temporary username from email
        CONCAT('user_', SUBSTRING(NEW.id::TEXT, 1, 8)),
        'New User'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- TIER VALIDATION
-- =====================================================

-- Validate profile link only for paid tiers
CREATE OR REPLACE FUNCTION validate_profile_link()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.profile_link IS NOT NULL AND NEW.tier = 'free' THEN
        RAISE EXCEPTION 'Profile links require Standard or Pro subscription';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_profile_link_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION validate_profile_link();

-- =====================================================
-- CLEANUP OLD NOTIFICATIONS (run via cron)
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM notifications
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
