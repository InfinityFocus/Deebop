import { Suspense } from 'react';
import { ChildLoginForm } from '@/components/auth/ChildLoginForm';

export const metadata = {
  title: 'Kid Login',
};

export default function ChildLoginPage() {
  return (
    <Suspense fallback={<div className="text-center text-gray-400">Loading...</div>}>
      <ChildLoginForm />
    </Suspense>
  );
}
