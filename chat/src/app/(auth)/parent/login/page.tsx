import { Suspense } from 'react';
import { ParentLoginForm } from '@/components/auth/ParentLoginForm';

export const metadata = {
  title: 'Parent Login',
};

export default function ParentLoginPage() {
  return (
    <Suspense fallback={<div className="text-center text-gray-400">Loading...</div>}>
      <ParentLoginForm />
    </Suspense>
  );
}
