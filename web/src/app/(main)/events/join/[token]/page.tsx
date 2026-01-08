'use client';

import { use } from 'react';
import { JoinEventView } from '@/components/events';

interface JoinEventPageProps {
  params: Promise<{ token: string }>;
}

export default function JoinEventPage({ params }: JoinEventPageProps) {
  const { token } = use(params);

  return <JoinEventView token={token} />;
}
