import Link from 'next/link';
import { MessageCircle, Shield, Users, Mic } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center max-w-2xl mx-auto">
          {/* Logo/Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-500/20">
            <MessageCircle size={40} className="text-white" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Deebop Chat
          </h1>

          <p className="text-xl text-gray-400 mb-8">
            Safe messaging for kids. Parents stay in control.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/parent/login"
              className="btn btn-primary text-lg px-8 py-4"
            >
              I&apos;m a Parent
            </Link>
            <Link
              href="/child/login"
              className="btn btn-secondary text-lg px-8 py-4"
            >
              I&apos;m a Kid
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto px-4">
          <FeatureCard
            icon={<Shield className="text-primary-400" size={28} />}
            title="Parent Approved"
            description="Every friend request needs parent approval before messaging can begin."
          />
          <FeatureCard
            icon={<Users className="text-primary-400" size={28} />}
            title="Friends Only"
            description="Kids can only message friends that parents have approved. No strangers."
          />
          <FeatureCard
            icon={<Mic className="text-primary-400" size={28} />}
            title="Voice Messages"
            description="Send fun voice notes up to 30 seconds. Perfect for quick hellos!"
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 px-4 text-center text-gray-500 text-sm">
        <p>
          &copy; {new Date().getFullYear()} Deebop Chat. Made with care for families.
        </p>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="card p-6 text-center">
      <div className="w-14 h-14 bg-dark-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
