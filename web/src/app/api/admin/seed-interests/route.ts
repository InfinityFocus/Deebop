import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').filter(Boolean);

async function isAdmin(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return ADMIN_EMAILS.includes(user?.email || '');
  } catch {
    return false;
  }
}

const interestCategories: Record<string, Array<{ name: string; slug: string; iconEmoji?: string }>> = {
  'Photography': [
    { name: 'Portrait Photography', slug: 'portrait-photography', iconEmoji: '📸' },
    { name: 'Landscape Photography', slug: 'landscape-photography', iconEmoji: '🏞️' },
    { name: 'Street Photography', slug: 'street-photography', iconEmoji: '🚶' },
    { name: 'Wildlife Photography', slug: 'wildlife-photography', iconEmoji: '🦁' },
    { name: 'Macro Photography', slug: 'macro-photography', iconEmoji: '🔬' },
    { name: 'Astrophotography', slug: 'astrophotography', iconEmoji: '🌌' },
    { name: 'Fashion Photography', slug: 'fashion-photography', iconEmoji: '👗' },
    { name: 'Sports Photography', slug: 'sports-photography', iconEmoji: '⚽' },
    { name: 'Event Photography', slug: 'event-photography', iconEmoji: '🎉' },
    { name: 'Food Photography', slug: 'food-photography', iconEmoji: '🍕' },
    { name: 'Travel Photography', slug: 'travel-photography', iconEmoji: '✈️' },
    { name: 'Architecture Photography', slug: 'architecture-photography', iconEmoji: '🏛️' },
  ],
  'Video': [
    { name: 'Short Films', slug: 'short-films', iconEmoji: '🎬' },
    { name: 'Documentaries', slug: 'documentaries', iconEmoji: '📹' },
    { name: 'Music Videos', slug: 'music-videos', iconEmoji: '🎵' },
    { name: 'Vlogs', slug: 'vlogs', iconEmoji: '📱' },
    { name: 'Tutorials', slug: 'video-tutorials', iconEmoji: '📚' },
    { name: 'Animation', slug: 'animation', iconEmoji: '🎨' },
    { name: 'Drone Footage', slug: 'drone-footage', iconEmoji: '🚁' },
    { name: 'Time-lapse', slug: 'time-lapse', iconEmoji: '⏱️' },
    { name: 'Slow Motion', slug: 'slow-motion', iconEmoji: '🐢' },
    { name: 'Live Streaming', slug: 'live-streaming', iconEmoji: '📡' },
  ],
  'Music': [
    { name: 'Electronic', slug: 'electronic-music', iconEmoji: '🎹' },
    { name: 'Hip Hop', slug: 'hip-hop', iconEmoji: '🎤' },
    { name: 'Rock', slug: 'rock-music', iconEmoji: '🎸' },
    { name: 'Jazz', slug: 'jazz', iconEmoji: '🎷' },
    { name: 'Classical', slug: 'classical-music', iconEmoji: '🎻' },
    { name: 'R&B / Soul', slug: 'rnb-soul', iconEmoji: '🎶' },
    { name: 'Pop', slug: 'pop-music', iconEmoji: '🎙️' },
    { name: 'Indie', slug: 'indie-music', iconEmoji: '🎧' },
    { name: 'World Music', slug: 'world-music', iconEmoji: '🌍' },
    { name: 'Ambient', slug: 'ambient-music', iconEmoji: '🌊' },
  ],
  'Art': [
    { name: 'Digital Art', slug: 'digital-art', iconEmoji: '💻' },
    { name: 'Traditional Art', slug: 'traditional-art', iconEmoji: '🖼️' },
    { name: 'Illustration', slug: 'illustration', iconEmoji: '✏️' },
    { name: 'Graphic Design', slug: 'graphic-design', iconEmoji: '🎨' },
    { name: '3D Art', slug: '3d-art', iconEmoji: '🧊' },
    { name: 'Typography', slug: 'typography', iconEmoji: '🔤' },
    { name: 'Concept Art', slug: 'concept-art', iconEmoji: '💭' },
    { name: 'Pixel Art', slug: 'pixel-art', iconEmoji: '👾' },
    { name: 'Comic Art', slug: 'comic-art', iconEmoji: '💥' },
    { name: 'Fan Art', slug: 'fan-art', iconEmoji: '❤️' },
  ],
  'Writing': [
    { name: 'Poetry', slug: 'poetry', iconEmoji: '📝' },
    { name: 'Fiction', slug: 'fiction', iconEmoji: '📖' },
    { name: 'Non-Fiction', slug: 'non-fiction', iconEmoji: '📰' },
    { name: 'Journalism', slug: 'journalism', iconEmoji: '🗞️' },
    { name: 'Screenwriting', slug: 'screenwriting', iconEmoji: '🎭' },
    { name: 'Blogging', slug: 'blogging', iconEmoji: '✍️' },
    { name: 'Lyrics', slug: 'lyrics', iconEmoji: '🎵' },
    { name: 'Reviews', slug: 'reviews', iconEmoji: '⭐' },
  ],
  'Gaming': [
    { name: 'Game Development', slug: 'game-development', iconEmoji: '🎮' },
    { name: 'Esports', slug: 'esports', iconEmoji: '🏆' },
    { name: 'Streaming', slug: 'game-streaming', iconEmoji: '📺' },
    { name: 'Retro Gaming', slug: 'retro-gaming', iconEmoji: '👾' },
    { name: 'Mobile Gaming', slug: 'mobile-gaming', iconEmoji: '📱' },
    { name: 'VR Gaming', slug: 'vr-gaming', iconEmoji: '🥽' },
    { name: 'Speedrunning', slug: 'speedrunning', iconEmoji: '⏱️' },
    { name: 'Game Art', slug: 'game-art', iconEmoji: '🖼️' },
  ],
  'Tech': [
    { name: 'Web Development', slug: 'web-development', iconEmoji: '🌐' },
    { name: 'Mobile Apps', slug: 'mobile-apps', iconEmoji: '📲' },
    { name: 'AI / Machine Learning', slug: 'ai-ml', iconEmoji: '🤖' },
    { name: 'Cybersecurity', slug: 'cybersecurity', iconEmoji: '🔐' },
    { name: 'Hardware', slug: 'hardware', iconEmoji: '🔧' },
    { name: 'Open Source', slug: 'open-source', iconEmoji: '💻' },
    { name: 'Gadgets', slug: 'gadgets', iconEmoji: '📡' },
    { name: 'Tech Reviews', slug: 'tech-reviews', iconEmoji: '📝' },
  ],
  'Fashion': [
    { name: 'Streetwear', slug: 'streetwear', iconEmoji: '👟' },
    { name: 'High Fashion', slug: 'high-fashion', iconEmoji: '👠' },
    { name: 'Vintage', slug: 'vintage-fashion', iconEmoji: '👗' },
    { name: 'Sustainable Fashion', slug: 'sustainable-fashion', iconEmoji: '♻️' },
    { name: 'Accessories', slug: 'accessories', iconEmoji: '👜' },
    { name: 'Sneakers', slug: 'sneakers', iconEmoji: '👟' },
    { name: 'DIY Fashion', slug: 'diy-fashion', iconEmoji: '✂️' },
    { name: 'Fashion Design', slug: 'fashion-design', iconEmoji: '🎨' },
  ],
  'Film': [
    { name: 'Indie Film', slug: 'indie-film', iconEmoji: '🎥' },
    { name: 'Horror', slug: 'horror-film', iconEmoji: '👻' },
    { name: 'Sci-Fi', slug: 'sci-fi-film', iconEmoji: '🚀' },
    { name: 'Documentary', slug: 'documentary-film', iconEmoji: '📽️' },
    { name: 'Foreign Films', slug: 'foreign-films', iconEmoji: '🌍' },
    { name: 'Film Reviews', slug: 'film-reviews', iconEmoji: '⭐' },
    { name: 'Filmmaking', slug: 'filmmaking', iconEmoji: '🎬' },
    { name: 'Cinematography', slug: 'cinematography', iconEmoji: '📹' },
  ],
  'Food & Drink': [
    { name: 'Recipes', slug: 'recipes', iconEmoji: '👨‍🍳' },
    { name: 'Restaurant Reviews', slug: 'restaurant-reviews', iconEmoji: '🍽️' },
    { name: 'Baking', slug: 'baking', iconEmoji: '🧁' },
    { name: 'Cocktails', slug: 'cocktails', iconEmoji: '🍸' },
    { name: 'Coffee', slug: 'coffee', iconEmoji: '☕' },
    { name: 'Wine', slug: 'wine', iconEmoji: '🍷' },
    { name: 'Street Food', slug: 'street-food', iconEmoji: '🌮' },
    { name: 'Vegan', slug: 'vegan-food', iconEmoji: '🥗' },
  ],
  'Sports': [
    { name: 'Football', slug: 'football', iconEmoji: '⚽' },
    { name: 'Basketball', slug: 'basketball', iconEmoji: '🏀' },
    { name: 'Tennis', slug: 'tennis', iconEmoji: '🎾' },
    { name: 'Martial Arts', slug: 'martial-arts', iconEmoji: '🥋' },
    { name: 'Extreme Sports', slug: 'extreme-sports', iconEmoji: '🏄' },
    { name: 'Fitness', slug: 'fitness', iconEmoji: '💪' },
    { name: 'Yoga', slug: 'yoga', iconEmoji: '🧘' },
    { name: 'Running', slug: 'running', iconEmoji: '🏃' },
    { name: 'Formula 1', slug: 'formula-1', iconEmoji: '🏎️' },
    { name: 'Motorsports', slug: 'motorsports', iconEmoji: '🏁' },
    { name: 'MotoGP', slug: 'motogp', iconEmoji: '🏍️' },
    { name: 'Golf', slug: 'golf', iconEmoji: '⛳' },
    { name: 'Cricket', slug: 'cricket', iconEmoji: '🏏' },
    { name: 'Swimming', slug: 'swimming', iconEmoji: '🏊' },
    { name: 'Boxing', slug: 'boxing', iconEmoji: '🥊' },
    { name: 'Cycling', slug: 'cycling', iconEmoji: '🚴' },
    { name: 'American Football', slug: 'american-football', iconEmoji: '🏈' },
    { name: 'Ice Hockey', slug: 'ice-hockey', iconEmoji: '🏒' },
    { name: 'Baseball', slug: 'baseball', iconEmoji: '⚾' },
    { name: 'Rugby', slug: 'rugby', iconEmoji: '🏉' },
  ],
  'Nature': [
    { name: 'Wildlife', slug: 'wildlife', iconEmoji: '🦊' },
    { name: 'Plants', slug: 'plants', iconEmoji: '🌿' },
    { name: 'Oceans', slug: 'oceans', iconEmoji: '🌊' },
    { name: 'Mountains', slug: 'mountains', iconEmoji: '🏔️' },
    { name: 'Weather', slug: 'weather', iconEmoji: '🌦️' },
    { name: 'Conservation', slug: 'conservation', iconEmoji: '🌱' },
    { name: 'Hiking', slug: 'hiking', iconEmoji: '🥾' },
    { name: 'Camping', slug: 'camping', iconEmoji: '⛺' },
  ],
  'Lifestyle': [
    { name: 'Travel', slug: 'travel', iconEmoji: '✈️' },
    { name: 'Interior Design', slug: 'interior-design', iconEmoji: '🏠' },
    { name: 'DIY & Crafts', slug: 'diy-crafts', iconEmoji: '🔨' },
    { name: 'Parenting', slug: 'parenting', iconEmoji: '👶' },
    { name: 'Pets', slug: 'pets', iconEmoji: '🐕' },
    { name: 'Minimalism', slug: 'minimalism', iconEmoji: '✨' },
    { name: 'Productivity', slug: 'productivity', iconEmoji: '📈' },
    { name: 'Self-Improvement', slug: 'self-improvement', iconEmoji: '🎯' },
  ],
  'Business': [
    { name: 'Entrepreneurship', slug: 'entrepreneurship', iconEmoji: '💡' },
    { name: 'Marketing', slug: 'marketing', iconEmoji: '📣' },
    { name: 'Freelancing', slug: 'freelancing', iconEmoji: '💼' },
    { name: 'Investing', slug: 'investing', iconEmoji: '📊' },
    { name: 'Startups', slug: 'startups', iconEmoji: '🚀' },
    { name: 'Career', slug: 'career', iconEmoji: '🎯' },
    { name: 'Side Hustles', slug: 'side-hustles', iconEmoji: '💰' },
    { name: 'Creator Economy', slug: 'creator-economy', iconEmoji: '🎨' },
  ],
  'Science': [
    { name: 'Space', slug: 'space', iconEmoji: '🚀' },
    { name: 'Physics', slug: 'physics', iconEmoji: '⚛️' },
    { name: 'Biology', slug: 'biology', iconEmoji: '🧬' },
    { name: 'Chemistry', slug: 'chemistry', iconEmoji: '🧪' },
    { name: 'Psychology', slug: 'psychology', iconEmoji: '🧠' },
    { name: 'Environment', slug: 'environment', iconEmoji: '🌍' },
    { name: 'History', slug: 'history', iconEmoji: '📜' },
    { name: 'Archaeology', slug: 'archaeology', iconEmoji: '🏺' },
  ],
  'News & Politics': [
    { name: 'Breaking News', slug: 'breaking-news', iconEmoji: '📰' },
    { name: 'World News', slug: 'world-news', iconEmoji: '🌍' },
    { name: 'Politics', slug: 'politics', iconEmoji: '🏛️' },
    { name: 'Social Issues', slug: 'social-issues', iconEmoji: '📢' },
    { name: 'Climate', slug: 'climate', iconEmoji: '🌡️' },
    { name: 'Economics', slug: 'economics', iconEmoji: '📈' },
  ],
  'Comedy': [
    { name: 'Memes', slug: 'memes', iconEmoji: '😂' },
    { name: 'Stand-Up', slug: 'standup', iconEmoji: '🎤' },
    { name: 'Sketches', slug: 'sketches', iconEmoji: '🎭' },
    { name: 'Satire', slug: 'satire', iconEmoji: '🃏' },
    { name: 'Parody', slug: 'parody', iconEmoji: '🎪' },
    { name: 'Pranks', slug: 'pranks', iconEmoji: '🤡' },
  ],
  'Education': [
    { name: 'Tutorials', slug: 'tutorials', iconEmoji: '📚' },
    { name: 'How-To', slug: 'how-to', iconEmoji: '🔧' },
    { name: 'Language Learning', slug: 'language-learning', iconEmoji: '🗣️' },
    { name: 'Skill Building', slug: 'skill-building', iconEmoji: '🎓' },
    { name: 'Academic', slug: 'academic', iconEmoji: '🏫' },
    { name: 'Explainers', slug: 'explainers', iconEmoji: '💡' },
  ],
};

// POST /api/admin/seed-interests - Seed interests into database
export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if interests already exist
    const existingCount = await prisma.interest.count();
    if (existingCount > 0) {
      return NextResponse.json({
        message: 'Interests already seeded',
        count: existingCount,
        skipped: true,
      });
    }

    let sortOrder = 0;
    let totalCreated = 0;

    for (const [category, interests] of Object.entries(interestCategories)) {
      // Create parent category
      const parentInterest = await prisma.interest.upsert({
        where: { slug: category.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-') },
        update: {},
        create: {
          name: category,
          slug: category.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-'),
          category,
          iconEmoji: interests[0]?.iconEmoji || '📌',
          sortOrder: sortOrder++,
        },
      });
      totalCreated++;

      // Create child interests
      for (const interest of interests) {
        await prisma.interest.upsert({
          where: { slug: interest.slug },
          update: {},
          create: {
            name: interest.name,
            slug: interest.slug,
            category,
            parentId: parentInterest.id,
            iconEmoji: interest.iconEmoji,
            sortOrder: sortOrder++,
          },
        });
        totalCreated++;
      }
    }

    const finalCount = await prisma.interest.count();

    return NextResponse.json({
      message: 'Interests seeded successfully',
      count: finalCount,
      created: totalCreated,
      categories: Object.keys(interestCategories).length,
    });
  } catch (error) {
    console.error('Error seeding interests:', error);
    return NextResponse.json(
      { error: 'Failed to seed interests' },
      { status: 500 }
    );
  }
}

// GET /api/admin/seed-interests - Check current interest count
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await prisma.interest.count();
    const categories = await prisma.interest.groupBy({
      by: ['category'],
      _count: true,
    });

    return NextResponse.json({
      count,
      categories: categories.map((c) => ({ name: c.category, count: c._count })),
    });
  } catch (error) {
    console.error('Error checking interests:', error);
    return NextResponse.json(
      { error: 'Failed to check interests' },
      { status: 500 }
    );
  }
}
