import Link from 'next/link';

/**
 * Renders text with clickable hashtags (#) and mentions (@)
 * - #hashtag → links to /explore/hashtag/{tag}
 * - @username → links to /u/{username} (only if approved or no filter provided)
 *
 * @param text - The text content to render
 * @param approvedMentions - Optional set of lowercase usernames that are approved.
 *                           If provided, only approved @mentions become clickable links.
 *                           If not provided, all @mentions are clickable (backwards compatible).
 */
export function renderRichText(
  text: string,
  approvedMentions?: Set<string>
): React.ReactNode {
  // Match both #hashtags and @mentions
  const parts = text.split(/(#\w+|@\w+)/g);

  return parts.map((part, i) => {
    if (part.startsWith('#')) {
      const tag = part.slice(1);
      return (
        <Link
          key={i}
          href={`/explore/hashtag/${tag}`}
          className="text-emerald-400 hover:underline"
        >
          {part}
        </Link>
      );
    }

    if (part.startsWith('@')) {
      const username = part.slice(1);
      const usernameLower = username.toLowerCase();

      // If no approvedMentions set provided, all mentions are clickable (backwards compatible)
      // If approvedMentions provided, only approved ones are clickable
      const isApproved = !approvedMentions || approvedMentions.has(usernameLower);

      if (isApproved) {
        return (
          <Link
            key={i}
            href={`/u/${username}`}
            className="text-cyan-400 hover:underline"
          >
            {part}
          </Link>
        );
      } else {
        // Pending or denied mention - render as styled text (not clickable)
        return (
          <span key={i} className="text-gray-500">
            {part}
          </span>
        );
      }
    }

    return part;
  });
}
