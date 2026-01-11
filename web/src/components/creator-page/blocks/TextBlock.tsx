'use client';

import { clsx } from 'clsx';
import type { TextBlockData } from '@/types/creator-page';

interface TextBlockProps {
  data: TextBlockData | Record<string, unknown>;
}

// Simple markdown-like rendering for basic formatting
function renderMarkdown(text: string): React.ReactNode {
  // Split into lines first to handle paragraphs
  const lines = text.split('\n');

  return lines.map((line, lineIndex) => {
    if (!line.trim()) {
      return <br key={lineIndex} />;
    }

    // Process inline formatting
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let partIndex = 0;

    // Process bold (**text**) and links [text](url)
    const processLine = (str: string): React.ReactNode[] => {
      const result: React.ReactNode[] = [];
      let current = str;
      let i = 0;

      while (current.length > 0) {
        // Check for link [text](url)
        const linkMatch = current.match(/^\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          result.push(
            <a
              key={`link-${i}`}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline"
            >
              {linkMatch[1]}
            </a>
          );
          current = current.slice(linkMatch[0].length);
          i++;
          continue;
        }

        // Check for bold **text**
        const boldMatch = current.match(/^\*\*([^*]+)\*\*/);
        if (boldMatch) {
          result.push(
            <strong key={`bold-${i}`} className="font-semibold">
              {boldMatch[1]}
            </strong>
          );
          current = current.slice(boldMatch[0].length);
          i++;
          continue;
        }

        // Check for italic *text*
        const italicMatch = current.match(/^\*([^*]+)\*/);
        if (italicMatch) {
          result.push(
            <em key={`italic-${i}`}>
              {italicMatch[1]}
            </em>
          );
          current = current.slice(italicMatch[0].length);
          i++;
          continue;
        }

        // No match, take next character
        result.push(current[0]);
        current = current.slice(1);
      }

      return result;
    };

    return (
      <p key={lineIndex} className="mb-2 last:mb-0">
        {processLine(line)}
      </p>
    );
  });
}

export function TextBlock({ data }: TextBlockProps) {
  const blockData = data as TextBlockData;
  const content = blockData.content || '';
  const alignment = blockData.alignment || 'left';

  if (!content.trim()) {
    return null;
  }

  return (
    <div
      className={clsx(
        'space-y-2',
        alignment === 'center' && 'text-center'
      )}
    >
      {blockData.heading && (
        <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-gray-700">
          {blockData.heading}
        </h3>
      )}

      <div className="text-gray-300 leading-relaxed">
        {renderMarkdown(content)}
      </div>
    </div>
  );
}
