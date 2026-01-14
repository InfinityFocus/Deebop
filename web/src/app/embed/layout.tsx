import type { Metadata } from 'next';
import { EMBED_THEME_DEFAULTS } from '@/types/embed';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'Deebop Embed',
  robots: 'noindex, nofollow',
};

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className="bg-transparent"
        suppressHydrationWarning
      >
        <style>{`
          :root {
            --embed-bg: ${EMBED_THEME_DEFAULTS.dark.background};
            --embed-fg: ${EMBED_THEME_DEFAULTS.dark.foreground};
            --embed-accent: ${EMBED_THEME_DEFAULTS.dark.accent};
            --embed-muted: ${EMBED_THEME_DEFAULTS.dark.muted};
            --embed-border: ${EMBED_THEME_DEFAULTS.dark.border};
          }

          body {
            margin: 0;
            padding: 0;
            min-height: 100vh;
            background: var(--embed-bg);
            color: var(--embed-fg);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }

          /* Scrollbar styling for embed */
          ::-webkit-scrollbar {
            width: 6px;
          }

          ::-webkit-scrollbar-track {
            background: var(--embed-bg);
          }

          ::-webkit-scrollbar-thumb {
            background: var(--embed-border);
            border-radius: 3px;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: var(--embed-muted);
          }
        `}</style>
        {children}
      </body>
    </html>
  );
}
