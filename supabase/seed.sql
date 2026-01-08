-- Deebop Seed Data
-- Run after migrations to populate initial data

-- Interest categories for boost targeting
INSERT INTO interest_categories (slug, name, description) VALUES
    ('photography', 'Photography', 'Photography and visual arts'),
    ('travel', 'Travel', 'Travel and adventure'),
    ('food', 'Food & Drink', 'Food, cooking, and beverages'),
    ('fitness', 'Fitness', 'Health and fitness'),
    ('music', 'Music', 'Music and audio'),
    ('art', 'Art & Design', 'Art, design, and creativity'),
    ('tech', 'Technology', 'Technology and gadgets'),
    ('fashion', 'Fashion', 'Fashion and style'),
    ('sports', 'Sports', 'Sports and athletics'),
    ('gaming', 'Gaming', 'Video games and esports'),
    ('nature', 'Nature', 'Nature and outdoors'),
    ('business', 'Business', 'Business and entrepreneurship'),
    ('education', 'Education', 'Learning and education'),
    ('entertainment', 'Entertainment', 'Movies, TV, and entertainment');

-- Notify
DO $$
BEGIN
    RAISE NOTICE 'Deebop seed data inserted successfully';
END $$;
