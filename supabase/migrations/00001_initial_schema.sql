-- Deebop Social Platform - Initial Schema
-- Migration: 00001_initial_schema.sql

-- =====================================================
-- EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- ENUMS
-- =====================================================

-- Account subscription tiers
CREATE TYPE account_tier AS ENUM ('free', 'standard', 'pro');

-- Content types
CREATE TYPE content_type AS ENUM ('shout', 'image', 'video', 'panorama360');

-- Provenance labels for content origin
CREATE TYPE provenance_label AS ENUM ('original', 'ai_generated', 'ai_assisted', 'composite');

-- Post visibility settings
CREATE TYPE visibility AS ENUM ('public', 'followers_only');

-- Report status for moderation
CREATE TYPE report_status AS ENUM ('pending', 'reviewing', 'resolved', 'dismissed');

-- Boost campaign status
CREATE TYPE boost_status AS ENUM ('pending', 'active', 'completed', 'rejected', 'cancelled');

-- Follow request status (for private accounts)
CREATE TYPE follow_request_status AS ENUM ('pending', 'accepted', 'rejected');

-- Notification types
CREATE TYPE notification_type AS ENUM (
    'like',
    'follow',
    'follow_request',
    'follow_accepted',
    'mention',
    'repost',
    'boost_approved',
    'boost_rejected',
    'subscription_renewed',
    'subscription_cancelled',
    'system'
);

-- =====================================================
-- CORE TABLES
-- =====================================================

-- User profiles (linked to auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    profile_link TEXT,  -- Website link (Standard/Pro only)

    -- Account tier
    tier account_tier NOT NULL DEFAULT 'free',
    tier_expires_at TIMESTAMPTZ,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,

    -- Privacy settings
    is_private BOOLEAN DEFAULT FALSE,

    -- Stats (denormalized for performance)
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,

    -- Moderation flags
    is_verified BOOLEAN DEFAULT FALSE,
    is_suspended BOOLEAN DEFAULT FALSE,
    suspended_reason TEXT,
    suspended_until TIMESTAMPTZ,
    can_report BOOLEAN DEFAULT TRUE,  -- Can be disabled for abuse

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT username_format CHECK (
        username ~* '^[a-zA-Z0-9_]{3,30}$'
    ),
    CONSTRAINT display_name_length CHECK (
        length(display_name) >= 1 AND length(display_name) <= 50
    ),
    CONSTRAINT bio_length CHECK (
        bio IS NULL OR length(bio) <= 500
    )
);

-- Posts (all content types: shouts, images, videos, 360 panoramas)
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Content type and visibility
    content_type content_type NOT NULL,
    visibility visibility NOT NULL DEFAULT 'public',

    -- Text content (caption for media, full content for shouts)
    text_content TEXT,

    -- Media fields (for image/video/panorama)
    media_url TEXT,  -- S3 path (not presigned)
    media_thumbnail_url TEXT,
    media_width INTEGER,
    media_height INTEGER,
    media_duration_seconds INTEGER,  -- For videos
    media_file_size BIGINT,

    -- Panorama-specific fields
    panorama_default_yaw DECIMAL,
    panorama_default_pitch DECIMAL,
    panorama_auto_rotate BOOLEAN DEFAULT FALSE,

    -- Provenance label
    provenance provenance_label DEFAULT 'original',

    -- Location (optional, coarse)
    location_name TEXT,
    location_country TEXT,

    -- Processing status
    is_processing BOOLEAN DEFAULT FALSE,
    processing_error TEXT,

    -- Engagement stats (denormalized)
    likes_count INTEGER DEFAULT 0,
    saves_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    reposts_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,

    -- Moderation
    is_hidden BOOLEAN DEFAULT FALSE,  -- Soft-hide by moderator
    hidden_reason TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT text_content_length CHECK (
        text_content IS NULL OR length(text_content) <= 500
    ),
    CONSTRAINT valid_media CHECK (
        (content_type = 'shout' AND media_url IS NULL) OR
        (content_type != 'shout' AND media_url IS NOT NULL)
    ),
    CONSTRAINT shout_requires_text CHECK (
        content_type != 'shout' OR text_content IS NOT NULL
    )
);

-- Hashtags
CREATE TABLE hashtags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    posts_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT hashtag_format CHECK (
        name ~* '^[a-zA-Z0-9_]{1,100}$'
    )
);

-- Post-Hashtag junction table
CREATE TABLE post_hashtags (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    hashtag_id UUID REFERENCES hashtags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, hashtag_id)
);

-- =====================================================
-- ENGAGEMENT TABLES
-- =====================================================

-- Follows
CREATE TABLE follows (
    follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Follow requests (for private accounts)
CREATE TABLE follow_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    target_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status follow_request_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    UNIQUE (requester_id, target_id)
);

-- Likes
CREATE TABLE likes (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

-- Saves (bookmarks)
CREATE TABLE saves (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

-- Shares (tracking shares, not reposts)
CREATE TABLE shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    share_type TEXT DEFAULT 'link',  -- 'link', 'web_share'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reposts (repost to own feed)
CREATE TABLE reposts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, post_id)
);

-- Views (for analytics)
CREATE TABLE views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    view_duration_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blocks
CREATE TABLE blocks (
    blocker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    blocked_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id),
    CONSTRAINT no_self_block CHECK (blocker_id != blocked_id)
);

-- =====================================================
-- MODERATION TABLES
-- =====================================================

-- Reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

    -- What is being reported (post OR user)
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

    -- Report details
    reason TEXT NOT NULL,
    reason_category TEXT NOT NULL,  -- 'ai_mislabeled', 'misinformation', 'spam', 'harassment', etc.
    reference_urls TEXT[],  -- For fact-check reports

    -- Status
    status report_status DEFAULT 'pending',

    -- Moderation
    moderator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    moderator_notes TEXT,
    action_taken TEXT,
    resolved_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT report_has_target CHECK (
        post_id IS NOT NULL OR reported_user_id IS NOT NULL
    )
);

-- =====================================================
-- MONETIZATION TABLES
-- =====================================================

-- Boosted posts (paid promotion)
CREATE TABLE boosts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

    -- Budget
    budget_cents INTEGER NOT NULL,
    spent_cents INTEGER DEFAULT 0,
    currency TEXT DEFAULT 'GBP',

    -- Targeting
    target_countries TEXT[],  -- ISO codes or null for global
    target_interests TEXT[],  -- Interest category slugs
    target_radius_km INTEGER,  -- Radius from location
    target_location TEXT,  -- Center location name

    -- Schedule
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,

    -- Status
    status boost_status DEFAULT 'pending',
    rejection_reason TEXT,

    -- Performance
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,

    -- Stripe
    stripe_payment_intent_id TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_budget CHECK (budget_cents >= 100),  -- Min £1
    CONSTRAINT valid_dates CHECK (ends_at > starts_at)
);

-- Third-party ads
CREATE TABLE ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advertiser_name TEXT NOT NULL,

    -- Creative
    image_url TEXT NOT NULL,
    headline TEXT NOT NULL,
    description TEXT,
    destination_url TEXT NOT NULL,

    -- Targeting
    target_countries TEXT[],

    -- Schedule
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Performance
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT headline_length CHECK (length(headline) <= 100),
    CONSTRAINT description_length CHECK (description IS NULL OR length(description) <= 200)
);

-- Interest categories (for boost targeting)
CREATE TABLE interest_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES interest_categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    type notification_type NOT NULL,
    title TEXT NOT NULL,
    body TEXT,

    -- Related entities
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,

    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- APP SETTINGS
-- =====================================================

CREATE TABLE app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO app_settings (key, value, description) VALUES
    ('tier_prices', '{"standard": 599, "pro": 1499, "currency": "GBP"}', 'Subscription prices in pence'),
    ('upload_limits', '{"free": {"image_kb": 500, "video_sec": 30, "video_res": "720p"}, "standard": {"image_mb": 10, "video_sec": 60, "video_res": "1080p"}, "pro": {"image_mb": 50, "video_sec": 300, "video_res": "4k", "panorama_mb": 100}}', 'Upload limits by tier'),
    ('ad_frequency', '{"feed_interval": 5, "reels_interval": 3}', 'Ad insertion frequency'),
    ('boost_min_budget', '{"cents": 100}', 'Minimum boost budget'),
    ('report_daily_limit', '{"count": 10}', 'Max reports per user per day');

-- =====================================================
-- INDEXES
-- =====================================================

-- Profile indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_username_trgm ON profiles USING gin(username gin_trgm_ops);
CREATE INDEX idx_profiles_tier ON profiles(tier);
CREATE INDEX idx_profiles_is_private ON profiles(is_private);

-- Post indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_content_type ON posts(content_type);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_visibility ON posts(visibility);
CREATE INDEX idx_posts_feed ON posts(created_at DESC, visibility)
    WHERE is_processing = FALSE AND is_hidden = FALSE;
CREATE INDEX idx_posts_text_trgm ON posts USING gin(text_content gin_trgm_ops);

-- Hashtag indexes
CREATE INDEX idx_hashtags_name ON hashtags(name);
CREATE INDEX idx_hashtags_name_trgm ON hashtags USING gin(name gin_trgm_ops);
CREATE INDEX idx_hashtags_posts_count ON hashtags(posts_count DESC);
CREATE INDEX idx_post_hashtags_hashtag_id ON post_hashtags(hashtag_id);

-- Engagement indexes
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_saves_user_id ON saves(user_id);
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_views_post_id ON views(post_id);
CREATE INDEX idx_reposts_post_id ON reposts(post_id);
CREATE INDEX idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON blocks(blocked_id);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Report indexes
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created ON reports(created_at DESC);

-- Boost indexes
CREATE INDEX idx_boosts_status ON boosts(status);
CREATE INDEX idx_boosts_active ON boosts(starts_at, ends_at) WHERE status = 'active';
CREATE INDEX idx_boosts_user ON boosts(user_id);

-- Ad indexes
CREATE INDEX idx_ads_active ON ads(is_active, starts_at, ends_at);
