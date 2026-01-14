import { CreateChildForm } from '@/components/parent/CreateChildForm';

export const metadata = {
  title: 'Add Child Account',
};

export default function NewChildPage() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Add Child Account</h1>
        <p className="text-gray-400">
          Create a safe account for your child to chat with friends
        </p>
      </div>

      <CreateChildForm />
    </div>
  );
}
