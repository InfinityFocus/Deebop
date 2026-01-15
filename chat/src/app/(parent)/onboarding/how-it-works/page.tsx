import Link from 'next/link';
import {
  UserPlus,
  UserCheck,
  CheckCircle,
  Check,
  X,
  Shield,
  Eye,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';

export default function OnboardingHowItWorksPage() {
  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/onboarding/welcome"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={16} />
        <span>Back</span>
      </Link>

      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
          How Deebop Chat works
        </h1>
        <p className="text-gray-400">
          A quick overview of how you&apos;ll stay in control
        </p>
      </div>

      {/* 3 Steps */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Getting started</h2>
        <div className="space-y-6">
          <StepItem
            step={1}
            icon={<UserPlus className="text-primary-400" size={20} />}
            title="Create a parent account"
            description="Set up your family and choose your rules. This takes about 2 minutes."
          />
          <StepItem
            step={2}
            icon={<UserCheck className="text-primary-400" size={20} />}
            title="Add your child"
            description="They get their own username and password. You choose their age group and oversight level."
          />
          <StepItem
            step={3}
            icon={<CheckCircle className="text-primary-400" size={20} />}
            title="Approve friends and messages"
            description="Friend requests come to you first. You decide who your child can message."
          />
        </div>
      </section>

      {/* Oversight Options */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-2">Oversight options</h2>
        <p className="text-sm text-gray-400 mb-6">Choose how much you want to see and approve</p>

        <div className="space-y-4">
          <OversightItem
            color="green"
            icon={<Shield size={18} />}
            title="Approve first message per friend"
            description="You approve the first message to each new friend. After that, messages flow normally. Best for most families."
            recommended
          />
          <OversightItem
            color="yellow"
            icon={<Eye size={18} />}
            title="Monitor messages"
            description="Messages are delivered immediately. You can read conversations anytime from your dashboard."
          />
          <OversightItem
            color="blue"
            icon={<ShieldCheck size={18} />}
            title="Approve every message"
            description="Every outgoing message is held until you approve it. Maximum oversight for younger children."
          />
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          You can change this anytime, even set different rules per child.
        </p>
      </section>

      {/* What Kids Can/Cannot Do */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-6">
          <h3 className="text-base font-semibold text-emerald-400 mb-4 flex items-center gap-2">
            <Check size={18} />
            Kids can
          </h3>
          <ul className="space-y-3">
            <CanItem text="Message approved friends" />
            <CanItem text="Send emojis" />
            <CanItem text="Send voice notes" />
            <CanItem text="Personalise their avatar" />
          </ul>
        </div>

        <div className="card p-6">
          <h3 className="text-base font-semibold text-red-400 mb-4 flex items-center gap-2">
            <X size={18} />
            Kids cannot
          </h3>
          <ul className="space-y-3">
            <CannotItem text="Message strangers" />
            <CannotItem text="Be discovered publicly" />
            <CannotItem text="Join group chats without approval" />
            <CannotItem text="Receive unsolicited messages" />
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Common questions</h2>
        <div className="space-y-4">
          <FAQItem
            question="Is this social media?"
            answer="No. Deebop Chat is private messaging only. There are no public profiles, feeds, or followers."
          />
          <FAQItem
            question="Do I have to read every message?"
            answer="Only if you want to. You choose your level of oversight, from monitoring to approving every message."
          />
          <FAQItem
            question="Can I change settings later?"
            answer="Yes, anytime. You can adjust oversight levels, add quiet hours, or change rules per child whenever you need."
          />
          <FAQItem
            question="How do friend requests work?"
            answer="When your child wants to add a friend, the request comes to you first. You approve it before any messaging can happen."
          />
        </div>
      </section>

      {/* CTA */}
      <div className="text-center pt-4">
        <Link
          href="/onboarding/add-child"
          className="btn btn-primary text-lg px-8 py-4"
        >
          Set up my family
        </Link>
      </div>
    </div>
  );
}

function StepItem({
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
    <div className="flex gap-4">
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 bg-dark-700 rounded-xl flex items-center justify-center">
          {icon}
        </div>
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
          {step}
        </span>
      </div>
      <div>
        <h3 className="font-medium text-white">{title}</h3>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </div>
  );
}

function OversightItem({
  color,
  icon,
  title,
  description,
  recommended,
}: {
  color: 'green' | 'yellow' | 'blue';
  icon: React.ReactNode;
  title: string;
  description: string;
  recommended?: boolean;
}) {
  const colorClasses = {
    green: 'border-l-emerald-500 text-emerald-400',
    yellow: 'border-l-yellow-500 text-yellow-400',
    blue: 'border-l-cyan-500 text-cyan-400',
  };

  return (
    <div className={`pl-4 border-l-2 ${colorClasses[color].split(' ')[0]}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={colorClasses[color].split(' ')[1]}>{icon}</span>
        <span className="font-medium text-white text-sm">{title}</span>
        {recommended && (
          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
            Recommended
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400">{description}</p>
    </div>
  );
}

function CanItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2">
      <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
        <Check className="text-emerald-400" size={12} />
      </div>
      <span className="text-sm text-gray-300">{text}</span>
    </li>
  );
}

function CannotItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2">
      <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
        <X className="text-red-400" size={12} />
      </div>
      <span className="text-sm text-gray-300">{text}</span>
    </li>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-b border-dark-700 pb-4 last:border-0 last:pb-0">
      <h3 className="text-sm font-medium text-white mb-1">{question}</h3>
      <p className="text-sm text-gray-400">{answer}</p>
    </div>
  );
}
