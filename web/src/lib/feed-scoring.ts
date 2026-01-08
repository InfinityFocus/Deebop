/**
 * Feed Scoring Utilities
 * Used for ranking posts in Discovery feed
 */

interface PostForScoring {
  id: string;
  likesCount: number;
  savesCount: number;
  sharesCount: number;
  viewsCount: number;
  createdAt: Date | string;
}

/**
 * Calculate trending score for a post
 * Higher score = more trending
 *
 * Uses engagement velocity with time decay:
 * - Likes count as 1 point
 * - Saves count as 2 points (higher intent)
 * - Shares count as 3 points (highest engagement)
 * - Score decays 30% per day to strongly favor recent content
 * - Base recency score ensures new posts surface even with 0 engagement
 */
export function calculateTrendingScore(post: PostForScoring): number {
  const createdAt = typeof post.createdAt === 'string'
    ? new Date(post.createdAt)
    : post.createdAt;

  const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  const ageDays = ageHours / 24;

  // Weighted engagement sum
  const engagement =
    post.likesCount +
    (post.savesCount * 2) +
    (post.sharesCount * 3);

  // Decay factor: 30% decay per day (much faster than before)
  // Day 0: 100%, Day 1: 70%, Day 2: 49%, Day 3: 34%, Day 7: 8%
  const decayFactor = Math.pow(0.7, ageDays);

  // Base recency score: gives new posts a boost even with 0 engagement
  // Starts at 10 points and decays to near 0 after a few days
  const recencyBonus = 10 * Math.pow(0.5, ageDays);

  return (engagement * decayFactor) + recencyBonus;
}

/**
 * Apply diversity pass to avoid consecutive posts from same user
 * Reorders array so same userId doesn't appear back-to-back
 */
export function applyDiversityPass<T extends { userId: string }>(
  posts: T[],
  maxConsecutive: number = 1
): T[] {
  if (posts.length <= 1) return posts;

  const result: T[] = [];
  const remaining = [...posts];

  while (remaining.length > 0) {
    // Find first post that doesn't violate diversity rule
    let foundIndex = -1;

    for (let i = 0; i < remaining.length; i++) {
      const post = remaining[i];

      // Count how many consecutive posts from same user at end of result
      let consecutiveCount = 0;
      for (let j = result.length - 1; j >= 0 && j >= result.length - maxConsecutive; j--) {
        if (result[j].userId === post.userId) {
          consecutiveCount++;
        } else {
          break;
        }
      }

      // If we haven't hit max consecutive, we can use this post
      if (consecutiveCount < maxConsecutive) {
        foundIndex = i;
        break;
      }
    }

    // If no valid post found (all remaining are from same user), just take first
    if (foundIndex === -1) {
      foundIndex = 0;
    }

    result.push(remaining[foundIndex]);
    remaining.splice(foundIndex, 1);
  }

  return result;
}

/**
 * Apply followed user penalty for Discovery feed ranking
 * Reduces score of posts from followed users so they appear less often
 */
export function applyFollowedPenalty(
  score: number,
  isFollowed: boolean,
  penaltyFactor: number = 0.3
): number {
  if (!isFollowed) return score;
  return score * (1 - penaltyFactor);
}
