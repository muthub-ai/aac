'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Container, ShieldCheck, Wrench, GitPullRequestDraft } from 'lucide-react';
import type { LiveMetrics, TrendPoint } from '@/lib/metrics/compute-metrics';

/* ── Sparkline ──────────────────────────────────────────────────── */

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="mt-3 opacity-70" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' as const },
  }),
};

interface MetricsSectionProps {
  liveMetrics: LiveMetrics;
  trendHistory: TrendPoint[];
}

export function MetricsSection({ liveMetrics, trendHistory }: MetricsSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const metrics = [
    {
      icon: Container,
      title: 'Containers per System',
      value: `${liveMetrics.containersPerSystem}`,
      description: 'Average containers per modeled software system.',
      accent: 'text-ring',
      accentBg: 'bg-ring/10',
      topBorder: 'border-t-ring',
      sparkColor: 'var(--ring)',
      sparkData: trendHistory.map((t) =>
        t.systems > 0 ? t.totalContainers / t.systems : 0,
      ),
    },
    {
      icon: ShieldCheck,
      title: 'Standards Approved',
      value: `${liveMetrics.standardsApprovedPct}%`,
      description: 'Percentage of published standards in APPROVED status.',
      accent: 'text-success',
      accentBg: 'bg-success/10',
      topBorder: 'border-t-success',
      sparkColor: 'var(--success)',
      sparkData: trendHistory.map((t) =>
        t.standards > 0 ? Math.round((t.standardsApproved / t.standards) * 100) : 0,
      ),
    },
    {
      icon: Wrench,
      title: 'Avg Remediation Progress',
      value: `${liveMetrics.avgRemediation}%`,
      description: 'Mean remediation progress across approved waivers.',
      accent: 'text-tab-active',
      accentBg: 'bg-tab-active/10',
      topBorder: 'border-t-tab-active',
      sparkColor: 'var(--tab-active)',
      sparkData: trendHistory.map((t) => t.avgRemediationPercent),
    },
    {
      icon: GitPullRequestDraft,
      title: 'Waivers Remediated',
      value: liveMetrics.remediatedRatio,
      description: 'Waivers that have completed full remediation.',
      accent: 'text-chart-5',
      accentBg: 'bg-chart-5/10',
      topBorder: 'border-t-chart-5',
      sparkColor: 'var(--chart-5)',
      sparkData: trendHistory.map((t) => t.remediatedWaivers),
    },
  ];

  return (
    <section id="metrics" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Measuring Platform Success
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Key performance indicators computed live from your architecture artifacts.
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
                <div className="mb-1 text-2xl font-bold tabular-nums text-foreground">
                  {metric.value}
                </div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">
                  {metric.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {metric.description}
                </p>
                <Sparkline data={metric.sparkData} color={metric.sparkColor} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
