'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LayoutGrid, Puzzle, ShieldCheck, FileWarning,
  Code2, GitFork, Box, ArrowRight,
} from 'lucide-react';
import type { HeroCounts, TrendPoint } from '@/lib/metrics/compute-metrics';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
} as const;

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

function AnimatedCount({ target, suffix }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const duration = 1800;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix && <span className="ml-0.5 text-sm font-medium text-muted-foreground">{suffix}</span>}
    </span>
  );
}

/* ── Mini sparkline — pure SVG ──────────────────────────────────── */

function MiniSparkline({ data, className }: { data: number[]; className?: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 64;
  const h = 20;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke="var(--ring)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface HeroSectionProps {
  hero: HeroCounts;
  trendHistory: TrendPoint[];
}

export function HeroSection({ hero, trendHistory }: HeroSectionProps) {
  const primaryCards = [
    {
      icon: LayoutGrid,
      title: 'Application Systems',
      description: 'Browse, model, and manage your application architecture catalog.',
      href: '/dashboard?tab=applications',
      count: hero.systems,
      trendKey: 'systems' as const,
    },
    {
      icon: Puzzle,
      title: 'Patterns Catalog',
      description: 'Reusable architecture patterns and reference implementations.',
      href: '/dashboard?tab=patterns',
      count: hero.patterns,
      trendKey: 'patterns' as const,
    },
    {
      icon: ShieldCheck,
      title: 'Standards Catalog',
      description: 'Enterprise standards, guardrails, and compliance policies.',
      href: '/dashboard?tab=standards',
      count: hero.standards,
      trendKey: 'standards' as const,
    },
    {
      icon: FileWarning,
      title: 'Waiver Registry',
      description: 'Architecture exceptions, risk waivers, and remediation tracking.',
      href: '/dashboard?tab=waivers',
      count: hero.waivers,
      trendKey: 'waivers' as const,
    },
  ];

  const secondaryStats = [
    { icon: Code2, label: 'Lines of Code', value: hero.totalLoC },
    { icon: Box, label: 'Deployable Units', value: hero.totalDeployableUnits },
    { icon: GitFork, label: 'Repositories', value: hero.totalRepos },
  ];

  return (
    <section className="relative overflow-hidden py-24 md:py-32 lg:py-36">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-100">
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,var(--ring)_0%,transparent_70%)] opacity-[0.08]" />
      </div>

      <motion.div
        className="relative mx-auto max-w-5xl px-6 text-center sm:px-10"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.h1
          variants={item}
          className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
        >
          Architecture as Code{' '}
          <span className="text-ring">(AaC)</span>{' '}
          Platform
        </motion.h1>

        <motion.p
          variants={item}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"
        >
          Expressing enterprise architecture as machine-readable,
          version-controlled artifacts to enable faster delivery, lower risk,
          and reduced cost.
        </motion.p>

        {/* CTA buttons */}
        <motion.div variants={item} className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-ring px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:brightness-110 hover:shadow-lg"
          >
            Explore Dashboard
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
          <a
            href="#scorecard"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-all duration-200 hover:bg-muted"
          >
            View Scorecard
          </a>
        </motion.div>

        {/* Secondary stats — prominent pill row */}
        <motion.div
          variants={item}
          className="mx-auto mt-10 flex flex-wrap items-center justify-center gap-8"
        >
          {secondaryStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-ring" strokeWidth={1.8} />
                  <span className="text-2xl font-bold tabular-nums text-foreground">
                    <AnimatedCount target={stat.value} />
                  </span>
                </div>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </span>
              </div>
            );
          })}
        </motion.div>

        {/* Primary cards — 4 columns */}
        <motion.div
          variants={item}
          className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {primaryCards.map((card) => {
            const Icon = card.icon;
            const trend = trendHistory.map((t) => t[card.trendKey]);
            return (
              <Link
                key={card.title}
                href={card.href}
                className="group flex flex-col items-center rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-ring/40 hover:shadow-md"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-ring/10 transition-colors group-hover:bg-ring/15">
                  <Icon className="h-5 w-5 text-ring" strokeWidth={1.8} />
                </div>
                <div className="mb-1 text-3xl font-bold tabular-nums text-foreground">
                  <AnimatedCount target={card.count} />
                </div>
                <MiniSparkline data={trend} className="mb-2 opacity-60" />
                <h3 className="mb-1 text-sm font-semibold text-foreground">
                  {card.title}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {card.description}
                </p>
              </Link>
            );
          })}
        </motion.div>
      </motion.div>
    </section>
  );
}
