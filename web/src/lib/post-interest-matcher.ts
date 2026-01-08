import prisma from '@/lib/db';
import { interestKeywords } from './interest-keywords';

/**
 * Extracts hashtags and keywords from post content and matches them
 * to interests in the database.
 *
 * @param description - The post description/text content
 * @param headline - The optional post headline
 * @returns Array of interest IDs that match the post content
 */
export async function matchPostToInterests(
  description: string | null,
  headline: string | null
): Promise<string[]> {
  // Return early if no content to analyze
  if (!description && !headline) {
    return [];
  }

  // Combine headline and description, lowercase for matching
  const text = `${headline || ''} ${description || ''}`.toLowerCase();

  // 1. Extract hashtags (without the # symbol)
  const hashtagMatches = text.match(/#[\w]+/g) || [];
  const hashtags = hashtagMatches.map((h) => h.slice(1).toLowerCase());

  // 2. Extract words for keyword matching
  // Remove special characters except spaces, split into words
  const words = text
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2); // Ignore very short words

  // 3. Find matching interest slugs
  const matchedSlugs = new Set<string>();

  for (const [slug, keywords] of Object.entries(interestKeywords)) {
    for (const keyword of keywords) {
      // Check hashtags first (exact match, highest priority)
      if (hashtags.includes(keyword)) {
        matchedSlugs.add(slug);
        break;
      }

      // Check if keyword appears in the text content
      // For multi-word keywords, check if they appear as a phrase
      if (keyword.includes(' ')) {
        // Multi-word keyword - check if phrase exists in text
        if (text.includes(keyword)) {
          matchedSlugs.add(slug);
          break;
        }
      } else {
        // Single word - check if it's in our words array
        if (words.includes(keyword)) {
          matchedSlugs.add(slug);
          break;
        }
      }
    }
  }

  // If no matches found, return empty array
  if (matchedSlugs.size === 0) {
    return [];
  }

  // 4. Get interest IDs from database
  const interests = await prisma.interest.findMany({
    where: {
      slug: { in: Array.from(matchedSlugs) },
    },
    select: { id: true },
  });

  return interests.map((i) => i.id);
}

/**
 * Extracts just the hashtags from text (for UI display or other purposes)
 */
export function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w]+/g) || [];
  return matches.map((h) => h.slice(1).toLowerCase());
}
