import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ProfileContent } from './ProfileContent';

export default function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        </div>
      }
    >
      <ProfileContent params={params} />
    </Suspense>
  );
}
