"use client";

import {
  Activity,
  ArrowRight,
  Calendar,
  FileText,
  Heart,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { useEntries } from "@/lib/entries-store";

const categories = [
  {
    tag: "Newly diagnosed",
    title: "Starting Your Journey",
    description:
      "Understand what endometriosis means for your body and what steps to take next.",
    cta: "Read more",
    href: "/insights",
    variant: "neutral" as const,
    icon: Heart,
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=640&q=80&auto=format&fit=crop",
  },
  {
    tag: "Pain management",
    title: "Living With Pain",
    description:
      "Evidence-based strategies for managing chronic pelvic pain and flare-ups.",
    cta: "Read more",
    href: "/insights",
    variant: "accent" as const,
    icon: Sparkles,
    image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=640&q=80&auto=format&fit=crop",
  },
  {
    tag: "Community",
    title: "You Are Not Alone",
    description:
      "Connect with support groups and hear stories from others who truly understand.",
    cta: "Read more",
    href: "/research",
    variant: "warm" as const,
    icon: Users,
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=640&q=80&auto=format&fit=crop",
  },
  {
    tag: "Track symptoms",
    title: "Know Your Patterns",
    description:
      "Log daily symptoms and discover how your cycle affects your body over time.",
    cta: "Start tracking",
    href: "/log",
    variant: "neutral" as const,
    icon: Activity,
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=640&q=80&auto=format&fit=crop",
  },
  {
    tag: "Doctor visits",
    title: "Advocate For Yourself",
    description:
      "Generate clear, evidence-backed reports to bring to your next appointment.",
    cta: "Create report",
    href: "/report",
    variant: "warm" as const,
    icon: FileText,
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=640&q=80&auto=format&fit=crop",
  },
  {
    tag: "Privacy first",
    title: "Your Data, Your Control",
    description:
      "Everything you track stays private. No selling, no sharing, no exceptions.",
    cta: "Learn more",
    href: "/privacy",
    variant: "neutral" as const,
    icon: Shield,
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=640&q=80&auto=format&fit=crop",
  },
];

const cardVariantClass = {
  neutral: "card-neutral",
  accent: "card-accent",
  warm: "card-warm",
} as const;

export default function DashboardPage() {
  const { entries } = useEntries();
  const stats = useMemo(() => {
    const last7 = entries.slice(0, 7);
    const avgVas =
      last7.length > 0
        ? Math.round((last7.reduce((s, e) => s + e.overall_vas, 0) / last7.length) * 10) / 10
        : 0;
    const redFlagCount = new Set(entries.flatMap((e) => e.red_flags_detected)).size;
    const pathwayCount = new Set(
      entries.flatMap((e) => e.research_correlations.map((r) => r.marker_category))
    ).size;
    return { totalEntries: entries.length, avgVas7d: avgVas, redFlagCount, pathwayCount };
  }, [entries]);

  return (
    <div className="space-y-0">
      {/* ── Hero section ── */}
      <section className="hero-editorial">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 lg:py-24">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
            {/* Left — text */}
            <div>
              <p className="text-sm lg:text-sm font-semibold tracking-wide uppercase text-[var(--color-brand-muted)] mb-4">
                Evidence-based support
              </p>
              <h1 className="heading-display-lg text-display-md sm:text-display-lg lg:text-display-xl text-[var(--color-brand-midnight)]">
                Understanding
                <br />
                your body
              </h1>
              <p className="mt-5 text-lg lg:text-lg text-[var(--color-brand-ink-soft)] leading-relaxed max-w-lg">
                Track symptoms, discover patterns, and feel confident talking to
                your doctor. You deserve answers.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/log"
                  className="inline-flex items-center justify-center rounded-full bg-[var(--color-brand-orange)] text-white text-base font-bold h-14 px-8 hover:bg-[#E55A2B] transition-colors"
                >
                  <Activity className="mr-2 h-4 w-4" />
                  Track Today
                </Link>
                <Link
                  href="/insights"
                  className="inline-flex items-center justify-center rounded-full bg-white text-[var(--color-brand-midnight)] text-base font-bold h-14 px-8 hover:bg-[var(--color-brand-smoke)] transition-colors border border-[#D4DCE6]"
                >
                  <Sparkles className="mr-2 h-4 w-4 text-[var(--color-brand-blue)]" />
                  View Insights
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-12 grid grid-cols-2 gap-4">
                {[
                  { label: "Days Tracked", value: String(stats.totalEntries), icon: Calendar },
                  { label: "Avg Pain (7d)", value: String(stats.avgVas7d), icon: Activity },
                  { label: "Patterns Found", value: String(stats.redFlagCount), icon: Sparkles },
                  { label: "Insights Active", value: String(stats.pathwayCount), icon: Heart },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/70 flex items-center justify-center shrink-0">
                      <stat.icon className="h-4 w-4 text-[var(--color-brand-muted)]" />
                    </div>
                    <div>
                      <div className="font-display text-2xl font-bold text-[var(--color-brand-midnight)]">
                        {stat.value}
                      </div>
                      <p className="text-sm text-[var(--color-brand-muted)] font-semibold">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — hero image (desktop only) */}
            <div className="hidden lg:block">
              <div className="relative h-[560px] rounded-[24px] overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=900&q=80&auto=format&fit=crop"
                  alt="Woman outdoors in nature"
                  fill
                  className="object-cover object-top"
                  sizes="(min-width: 1024px) 50vw, 0px"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Photo strip ── */}
      <section className="py-8 lg:py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { src: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80&auto=format&fit=crop", alt: "Yoga outdoors at sunrise", aspect: "aspect-[3/4]" },
              { src: "https://images.unsplash.com/photo-1552693673-1bf958298935?w=600&q=80&auto=format&fit=crop", alt: "Woman meditating in nature", aspect: "aspect-[3/4]" },
              { src: "https://images.unsplash.com/photo-1521566652839-697aa473761a?w=600&q=80&auto=format&fit=crop", alt: "Women friends outdoors", aspect: "aspect-[3/4]" },
              { src: "https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?w=600&q=80&auto=format&fit=crop", alt: "Woman walking in nature", aspect: "aspect-[3/4]" },
            ].map((photo) => (
              <div key={photo.src} className={`relative ${photo.aspect} rounded-[20px] overflow-hidden`}>
                <Image src={photo.src} alt={photo.alt} fill className="object-cover" sizes="(min-width: 1024px) 25vw, 50vw" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Card carousel section ── */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold tracking-wide uppercase text-[var(--color-brand-muted)] mb-2">
                Explore
              </p>
              <h2 className="heading-display text-3xl sm:text-4xl lg:text-5xl text-[var(--color-brand-midnight)]">
                Resources for you
              </h2>
            </div>
            <Link
              href="/insights"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-brand-orange)] hover:text-[#E55A2B] transition-colors"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Horizontal scroll carousel */}
          <div className="carousel-scroll -mx-6 px-6 lg:-mx-8 lg:px-8">
            {categories.map((cat) => (
              <Link
                key={cat.title}
                href={cat.href}
                className={`carousel-card group ${cardVariantClass[cat.variant]} card-soft`}
              >
                {/* Card content top */}
                <div className="flex flex-col flex-1 p-5">
                  {/* Tag pill */}
                  <div className="mb-4">
                    <span className="tag-pill">{cat.tag}</span>
                  </div>

                  {/* Category title */}
                  <h3 className="font-display text-[1.375rem] font-bold leading-tight">
                    {cat.title}
                  </h3>

                  {/* Description */}
                  <p
                    className={`text-[0.9375rem] leading-relaxed mt-2 flex-1 ${
                      cat.variant === "accent"
                        ? "text-[var(--color-brand-midnight)]/70"
                        : "text-[var(--color-brand-muted)]"
                    }`}
                  >
                    {cat.description}
                  </p>

                  {/* CTA */}
                  <div className="mt-4">
                    <span className="card-cta group-hover:gap-2.5">
                      {cat.cta} <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>

                {/* Card image bottom half */}
                <div className="relative h-40 md:h-48 overflow-hidden">
                  <Image
                    src={cat.image}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="320px"
                  />
                </div>
              </Link>
            ))}
          </div>

          {/* Mobile "View all" */}
          <div className="sm:hidden mt-6 text-center">
            <Link
              href="/insights"
              className="inline-flex items-center gap-1.5 text-base font-bold text-[var(--color-brand-orange)]"
            >
              View all resources <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Supportive info section ── */}
      <section className="pb-16 lg:pb-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="rounded-[20px] bg-white border border-[#D4DCE6]/40 p-8 lg:p-10 card-soft">
            <div className="max-w-xl">
              <p className="text-xs font-semibold tracking-wide uppercase text-[var(--color-brand-muted)] mb-2">
                Why Endo
              </p>
              <h2 className="heading-display text-2xl sm:text-3xl lg:text-4xl text-[var(--color-brand-midnight)]">
                You&apos;re not alone
              </h2>
              <p className="text-base text-[var(--color-brand-muted)] leading-relaxed mt-3">
                1 in 10 women live with endometriosis. On average, it takes 7-10
                years to get a diagnosis. Endo helps you track, understand, and
                advocate for yourself.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              {[
                {
                  icon: Users,
                  title: "Community",
                  desc: "Connect with support groups who get it",
                },
                {
                  icon: Sparkles,
                  title: "Evidence-Based",
                  desc: "Built on the latest clinical research",
                },
                {
                  icon: Shield,
                  title: "Private & Secure",
                  desc: "Your data belongs to you, always",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl bg-[var(--color-brand-smoke)] p-5"
                >
                  <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center mb-3">
                    <item.icon className="h-5 w-5 text-[var(--color-brand-blue)]" />
                  </div>
                  <h3 className="text-base font-bold text-[var(--color-brand-midnight)]">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[var(--color-brand-muted)] mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
