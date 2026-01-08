import { Metadata } from 'next';
import { RegisterForm } from './RegisterForm';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create your Deebop account',
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Create your account</h1>
        <p className="text-gray-400 mt-2">Join Deebop and start sharing</p>
      </div>

      <RegisterForm />
    </div>
  );
}
