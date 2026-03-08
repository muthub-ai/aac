'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LayoutGrid, Puzzle, ShieldCheck } from 'lucide-react';

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

const cards = [
  {
    icon: LayoutGrid,
    title: 'Application Systems',
    description: 'Browse, model, and manage your application architecture catalog.',
    href: '/dashboard?tab=applications',
    count: 280,
  },
  {
    icon: Puzzle,
    title: 'Patterns Catalog',
    description: 'Reusable architecture patterns and reference implementations.',
    href: '/dashboard?tab=patterns',
    count: 45,
  },
  {
    icon: ShieldCheck,
    title: 'Standards Catalog',
    description: 'Enterprise standards, guardrails, and compliance policies.',
    href: '/dashboard?tab=standards',
    count: 74,
  },
];

function AnimatedCount({ target }: { target: number }) {
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

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32 lg:py-36">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-100">
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,var(--ring)_0%,transparent_70%)] opacity-[0.08]" />
      </div>

      <motion.div
        className="relative mx-auto max-w-4xl px-6 text-center sm:px-10"
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

        <motion.div
          variants={item}
          className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={card.href}
                className="group flex flex-col items-center rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-ring/40 hover:shadow-md"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-ring/10 transition-colors group-hover:bg-ring/15">
                  <Icon className="h-5 w-5 text-ring" strokeWidth={1.8} />
                </div>
                <div className="mb-2 text-3xl font-bold tabular-nums text-foreground">
                  <AnimatedCount target={card.count} />
                </div>
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
