'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { UTILITIES, UTILITY_COLORS } from '@/lib/data/utilities-data';

/* ------------------------------------------------------------------ */
/*  Status badge (matches utility-sidebar pattern)                     */
/* ------------------------------------------------------------------ */

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  available: { label: 'Live', cls: 'bg-success/10 text-success' },
  'coming-soon': { label: 'Soon', cls: 'bg-muted text-muted-foreground' },
  beta: { label: 'Beta', cls: 'bg-chart-5/10 text-chart-5' },
};

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: 'easeOut' as const },
  }),
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function UtilitiesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="utilities" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Developer Utilities
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            CLI tools, AI agents, and platform integrations to bring architecture
            governance into your development workflow.
          </p>
        </div>

        <div
          ref={ref}
          className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          {UTILITIES.map((utility, i) => {
            const Icon = utility.icon;
            const colors = UTILITY_COLORS[utility.color] ?? {
              bg: 'bg-muted',
              text: 'text-muted-foreground',
              border: 'border-border',
            };
            const status = STATUS_STYLES[utility.status] ?? STATUS_STYLES.available;
            const features = utility.features?.slice(0, 3) ?? [];

            return (
              <motion.div
                key={utility.id}
                custom={i}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                variants={cardVariants}
              >
                <Link
                  href={`/dashboard?tab=utilities`}
                  className="group flex h-full flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-ring/40 hover:shadow-md"
                >
                  {/* Icon + status row */}
                  <div className="mb-4 flex items-center justify-between">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.bg}`}
                    >
                      <Icon className={`h-5 w-5 ${colors.text}`} strokeWidth={1.8} />
                    </div>
                    <div className="flex items-center gap-2">
                      {utility.version && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold tabular-nums text-muted-foreground">
                          v{utility.version}
                        </span>
                      )}
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${status.cls}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Name + tagline */}
                  <h3 className="mb-1 text-sm font-semibold text-foreground">
                    {utility.name}
                  </h3>
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                    {utility.tagline}
                  </p>

                  {/* Top features */}
                  {features.length > 0 && (
                    <ul className="mt-auto space-y-1.5">
                      {features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <div
                            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${colors.bg.replace('/10', '')} opacity-60`}
                          />
                          <span className="leading-relaxed">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
