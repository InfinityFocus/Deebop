'use client';

interface EmbedBrandingProps {
  baseUrl: string;
}

export function EmbedBranding({ baseUrl }: EmbedBrandingProps) {
  return (
    <a
      href={baseUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block py-2 px-3 text-center border-t border-[var(--embed-border)] bg-[var(--embed-bg)] hover:opacity-80 transition"
    >
      <span className="text-xs text-[var(--embed-muted)]">
        Powered by{' '}
        <span className="font-semibold text-[var(--embed-accent)]">Deebop</span>
      </span>
    </a>
  );
}
