import Footer from "@/components/layout/Footer";
import { ShieldCheck, BadgeCheck, Clock, Users } from "lucide-react";
import EventsSection from "@/components/home/EventsSection";
import TrustSection from "@/components/home/TrustSection";
import CreatorPageSection from "@/components/home/CreatorPageSection";
import FAQSection from "@/components/home/FAQSection";
import ExplorePreview from "@/components/home/ExplorePreview";
import FeaturedCreators from "@/components/home/FeaturedCreators";
import HomepageTracker from "@/components/home/HomepageTracker";
import { TrackedCTAs } from "@/components/home/TrackedCTAs";

const differentiators = [
  {
    icon: ShieldCheck,
    label: "No Comments",
    description: "No drama",
  },
  {
    icon: BadgeCheck,
    label: "Provenance",
    description: "AI transparency",
  },
  {
    icon: Clock,
    label: "Drops",
    description: "Schedule content",
  },
  {
    icon: Users,
    label: "Albums",
    description: "Collaborate",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-black">
      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center gap-8 text-center px-4 py-20 md:py-32 relative overflow-hidden">
        {/* Decorative gradient orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-emerald-500/20 via-yellow-500/10 to-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-8">
          {/* Logo */}
          <h1 className="text-7xl md:text-8xl font-bold tracking-tight">
            <span className="logo-shimmer">Deebop</span>
          </h1>

          {/* Tagline */}
          <div className="max-w-2xl">
            <p className="text-2xl md:text-3xl font-medium text-white mb-3">
              Share your vision. No noise.
            </p>
            <p className="text-lg text-gray-400">
              Post photos, videos, 360 panoramas, and shouts. Provenance labels, paid partnership disclosure, and shared event galleries. No comments, no drama.
            </p>
          </div>

          {/* Differentiators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {differentiators.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-800 bg-gray-900/50 min-w-[120px]"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Icon size={20} className="text-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-white">{item.label}</span>
                  <span className="text-xs text-gray-500">{item.description}</span>
                </div>
              );
            })}
          </div>

          {/* CTA Buttons */}
          <TrackedCTAs />
        </div>
      </main>

      {/* Analytics Tracker */}
      <HomepageTracker />

      {/* Explore Preview Section */}
      <ExplorePreview />

      {/* Events + Shared Galleries Section */}
      <EventsSection />

      {/* Trust & Calm Section */}
      <TrustSection />

      {/* Creator Page Section */}
      <CreatorPageSection />

      {/* Featured Creators Section */}
      <FeaturedCreators />

      {/* FAQ Section */}
      <FAQSection />

      <Footer />
    </div>
  );
}
