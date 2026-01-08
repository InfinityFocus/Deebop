import Link from 'next/link';

/**
 * Renders text with clickable hashtags (#) and mentions (@)
 * - #hashtag → links to /explore/hashtag/{tag}
 * - @username → links to /u/{username}
 */
export function renderRichText(text: string): React.ReactNode {
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
      return (
        <Link
          key={i}
          href={`/u/${username}`}
          className="text-cyan-400 hover:underline"
        >
          {part}
        </Link>
      );
    }

    return part;
  });
}
