import { Suspense } from 'react';
import { DropContent } from './DropContent';

export default function DropDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-400"></div>
        </div>
      }
    >
      <DropContent />
    </Suspense>
  );
}
