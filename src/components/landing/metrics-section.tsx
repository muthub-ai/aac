'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Timer, ShieldCheck, Rocket, GitPullRequestDraft } from 'lucide-react';

const metrics = [
  {
    icon: Timer,
    title: 'Architectural Efficiency',
    description:
      'Time saved via automated reviews and artifact generation.',
    accent: 'text-ring',
    accentBg: 'bg-ring/10',
    topBorder: 'border-t-ring',
  },
  {
    icon: ShieldCheck,
    title: 'Compliance & Alignment',
    description:
      'Reduction in unapproved technologies or architectural deviations.',
    accent: 'text-success',
    accentBg: 'bg-success/10',
    topBorder: 'border-t-success',
  },
  {
    icon: Rocket,
    title: 'Delivery Velocity',
    description:
      'Improvement in lead time for changes and successful deployments.',
    accent: 'text-tab-active',
    accentBg: 'bg-tab-active/10',
    topBorder: 'border-t-tab-active',
  },
  {
    icon: GitPullRequestDraft,
    title: 'Drift Reduction',
    description:
      'Decrease in discrepancies between documented models and deployed Infrastructure as Code (IaC).',
    accent: 'text-chart-5',
    accentBg: 'bg-chart-5/10',
    topBorder: 'border-t-chart-5',
  },
];

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' as const },
  }),
};

export function MetricsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="metrics" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Measuring Platform Success
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Key performance indicators that demonstrate the value of automated architectural governance.
          </p>
        </div>

        <div
          ref={ref}
          className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {metrics.map((metric, i) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.title}
                custom={i}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                variants={cardVariants}
                className={`rounded-xl border border-border border-t-2 ${metric.topBorder} bg-card p-6 shadow-sm`}
              >
                <div
                  className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${metric.accentBg}`}
                >
                  <Icon className={`h-5 w-5 ${metric.accent}`} strokeWidth={1.8} />
                </div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">
                  {metric.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {metric.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
