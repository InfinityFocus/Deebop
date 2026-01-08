import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore - Deebop',
  description: 'Discover trending posts, rising creators, and popular hashtags on Deebop. Browse public content from photographers, artists, and creators.',
};

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
