import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck,
  Sliders,
  EyeOff,
  UserPlus,
  UserCheck,
  CheckCircle,
  Check,
  X,
  Settings,
  Clock,
  History,
  Heart,
  Sparkles,
  Users,
  Monitor,
} from 'lucide-react';
import Footer from '@/components/Footer';
import InstallButton from '@/components/InstallButton';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto">
          {/* Logo/Icon */}
          <div className="w-20 h-20 mx-auto mb-6">
            <Image
              src="/icon.png"
              alt="Deebop Chat"
              width={80}
              height={80}
              className="rounded-2xl shadow-lg shadow-primary-500/20"
              priority
            />
          </div>

          <h1 className="text-3xl md:text-5xl font-bold mb-4 logo-shimmer">
            Deebop Chat
          </h1>

          <p className="text-xl md:text-2xl font-medium text-white mb-3">
            A first messaging app for kids, with parents in control.
          </p>

          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            Safe, private messaging for ages 6–12.
            <br />
            Approved friends, flexible oversight, and no strangers.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            <Link
              href="/parent/register"
              className="btn btn-primary text-lg px-8 py-4"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="btn btn-secondary text-lg px-8 py-4"
            >
              Log in
            </Link>
            <a
              href="#how-it-works"
              className="btn btn-secondary text-lg px-8 py-4"
            >
              How it works
            </a>
            <InstallButton className="text-lg px-8 py-4" />
          </div>
        </div>
      </section>

      {/* Trust Section - 4 Pillars */}
      <section className="px-4 py-12 bg-dark-800/30">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <TrustCard
              icon={<ShieldCheck className="text-primary-400" size={28} />}
              title="Approved friends only"
              description="Your child can only message people you approve. No exceptions."
            />
            <TrustCard
              icon={<Sliders className="text-primary-400" size={28} />}
              title="Oversight that fits your family"
              description="Monitor messages, approve the first message from new friends, or approve every message."
            />
            <TrustCard
              icon={<EyeOff className="text-primary-400" size={28} />}
              title="Private by design"
              description="No public profiles, no discovery, no unsolicited messages."
            />
            <TrustCard
              icon={<Monitor className="text-primary-400" size={28} />}
              title="Works where kids already are"
              description="Use it on desktop, Chromebook, or tablet. Installable as an app, no phone required."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="px-4 py-16 scroll-mt-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
            How it works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              step={1}
              icon={<UserPlus className="text-primary-400" size={24} />}
              title="Create a parent account"
              description="Set up your family and choose your rules."
            />
            <StepCard
              step={2}
              icon={<UserCheck className="text-primary-400" size={24} />}
              title="Add your child"
              description="They get their own username and password."
            />
            <StepCard
              step={3}
              icon={<CheckCircle className="text-primary-400" size={24} />}
              title="Approve friends and messages"
              description="You stay informed and in control, without hovering."
            />
          </div>
        </div>
      </section>

      {/* What Kids Can/Cannot Do Section */}
      <section className="px-4 py-16 bg-dark-800/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
            What kids can do
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {/* Kids CAN */}
            <div className="card p-6 md:p-8">
              <h3 className="text-lg font-semibold text-emerald-400 mb-6 flex items-center gap-2">
                <Check size={20} />
                Kids can
              </h3>
              <ul className="space-y-4">
                <CanItem text="Message approved friends" />
                <CanItem text="Send emojis" />
                <CanItem text="Send voice notes" />
                <CanItem text="Personalise their avatar" />
              </ul>
            </div>

            {/* Kids CANNOT */}
            <div className="card p-6 md:p-8">
              <h3 className="text-lg font-semibold text-red-400 mb-6 flex items-center gap-2">
                <X size={20} />
                Kids cannot
              </h3>
              <ul className="space-y-4">
                <CannotItem text="Message strangers" />
                <CannotItem text="Be discovered publicly" />
                <CannotItem text="Join group chats without approval" />
                <CannotItem text="Receive unsolicited messages" />
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Oversight Section */}
      <section className="px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Control without constant hovering
          </h2>

          <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
            Whether you want to approve every message or just keep an eye on things, Deebop Chat adapts to your family.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <OversightFeature
              icon={<Settings size={24} />}
              text="Change rules anytime"
            />
            <OversightFeature
              icon={<Clock size={24} />}
              text="Quiet hours for school and bedtime"
            />
            <OversightFeature
              icon={<History size={24} />}
              text="Wrap-up timers for screen time"
            />
            <OversightFeature
              icon={<Monitor size={24} />}
              text="Clear activity history"
            />
          </div>
        </div>
      </section>

      {/* Why Parents Choose Section */}
      <section className="px-4 py-16 bg-dark-800/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
            Why parents choose Deebop Chat
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <WhyCard
              icon={<Sparkles className="text-yellow-400" size={24} />}
              title="Built specifically for children"
              description="Not adapted from adult social apps."
            />
            <WhyCard
              icon={<Monitor className="text-cyan-400" size={24} />}
              title="Designed for shared family devices"
              description="Works naturally on desktops and Chromebooks, not just phones."
            />
            <WhyCard
              icon={<Heart className="text-pink-400" size={24} />}
              title="No ads. No feeds. No pressure."
              description="Just messaging with real friends."
            />
            <WhyCard
              icon={<Users className="text-primary-400" size={24} />}
              title="Built around choice, not algorithms"
              description="You decide what your child sees and who they talk to."
            />
          </div>
        </div>
      </section>

      {/* FAQ Teaser Section */}
      <section className="px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-10">
            Common questions
          </h2>

          <div className="space-y-4">
            <FAQItem
              question="Is this social media?"
              answer="No. Deebop Chat is private messaging only."
            />
            <FAQItem
              question="Does my child need a phone?"
              answer="No. Deebop Chat works on desktop and Chromebook, and can be installed as an app on supported devices."
            />
            <FAQItem
              question="Do I have to read every message?"
              answer="Only if you want to."
            />
            <FAQItem
              question="Can I change settings later?"
              answer="Yes, anytime."
            />
          </div>
        </div>
      </section>

      {/* CTA Close Section */}
      <section className="px-4 py-16 bg-dark-800/30">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Ready to set up your family?
          </h2>

          <p className="text-lg text-gray-400 mb-8">
            Get started in minutes.
          </p>

          <Link
            href="/parent/register"
            className="btn btn-primary text-lg px-10 py-4"
          >
            Create parent account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}

/* ============ Inline Components ============ */

function TrustCard({
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

function StepCard({
  step,
  icon,
  title,
  description,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="relative w-16 h-16 mx-auto mb-4">
        <div className="w-16 h-16 bg-dark-700 rounded-2xl flex items-center justify-center">
          {icon}
        </div>
        <span className="absolute -top-2 -right-2 w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
          {step}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function CanItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3">
      <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
        <Check className="text-emerald-400" size={14} />
      </div>
      <span className="text-gray-300">{text}</span>
    </li>
  );
}

function CannotItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3">
      <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
        <X className="text-red-400" size={14} />
      </div>
      <span className="text-gray-300">{text}</span>
    </li>
  );
}

function OversightFeature({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <div className="w-12 h-12 bg-dark-700 rounded-xl flex items-center justify-center text-primary-400">
        {icon}
      </div>
      <span className="text-gray-300 text-sm text-center">{text}</span>
    </div>
  );
}

function WhyCard({
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
      <div className="w-12 h-12 bg-dark-700 rounded-xl flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <div className="card p-5">
      <h3 className="text-white font-medium mb-2">{question}</h3>
      <p className="text-gray-400 text-sm">{answer}</p>
    </div>
  );
}
