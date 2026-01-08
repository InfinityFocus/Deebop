import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { BoostsContent } from './BoostsContent';

export default function BoostsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      }
    >
      <BoostsContent />
    </Suspense>
  );
}
