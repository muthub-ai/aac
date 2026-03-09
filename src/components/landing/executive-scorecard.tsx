'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Wrench,
  Layers,
} from 'lucide-react';
import type { ScorecardMetrics, TrendPoint } from '@/lib/metrics/compute-metrics';

/* ── SVG ring gauge ─────────────────────────────────────────────── */

function RingGauge({
  value,
  max = 100,
  size = 80,
  strokeWidth = 7,
  color,
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color: string;
}) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const offset = circumference * (1 - pct);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--border)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
}

/* ── Mini sparkline ─────────────────────────────────────────────── */

function Sparkline({ data, color, className }: { data: number[]; color: string; className?: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 72;
  const h = 24;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: 'easeOut' as const },
  }),
};

interface KpiCard {
  icon: typeof ShieldCheck;
  title: string;
  value: string;
  subtext: string;
  gaugeValue: number;
  gaugeMax: number;
  color: string;
  trendData: number[];
}

interface ExecutiveScorecardProps {
  scorecard: ScorecardMetrics;
  trendHistory: TrendPoint[];
}

export function ExecutiveScorecard({ scorecard, trendHistory }: ExecutiveScorecardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  const kpis: KpiCard[] = [
    {
      icon: ShieldCheck,
      title: 'Standards Conformance',
      value: `${scorecard.complianceScore}%`,
      subtext: `${scorecard.activeWaivers} active waivers`,
      gaugeValue: scorecard.complianceScore,
      gaugeMax: 100,
      color: 'var(--success)',
      trendData: trendHistory.map((t) => t.complianceScore),
    },
    {
      icon: AlertTriangle,
      title: 'Enterprise Risk Posture',
      value: `${scorecard.criticalHighWaivers}`,
      subtext: 'critical + high risks',
      gaugeValue: Math.max(0, 100 - scorecard.criticalHighWaivers * 15),
      gaugeMax: 100,
      color: scorecard.criticalHighWaivers > 3 ? 'var(--destructive)' : 'var(--chart-5)',
      trendData: trendHistory.map((t) => t.criticalHighWaivers),
    },
    {
      icon: DollarSign,
      title: 'Technical Debt Exposure',
      value: scorecard.totalRiskExposure,
      subtext: 'total risk exposure',
      gaugeValue: Math.min(100, (parseFloat(scorecard.totalRiskExposure.replace(/[^0-9.]/g, '')) / 10) * 100),
      gaugeMax: 100,
      color: 'var(--chart-5)',
      trendData: trendHistory.map((t) => t.totalRiskExposure),
    },
    {
      icon: Wrench,
      title: 'Remediation Velocity',
      value: `${scorecard.avgRemediationPercent}%`,
      subtext: `${scorecard.remediatedWaivers} fully remediated`,
      gaugeValue: scorecard.avgRemediationPercent,
      gaugeMax: 100,
      color: 'var(--chart-1)',
      trendData: trendHistory.map((t) => t.avgRemediationPercent),
    },
    {
      icon: Layers,
      title: 'Pattern Reuse Rate',
      value: `${scorecard.patternReuse}%`,
      subtext: 'systems using approved patterns',
      gaugeValue: scorecard.patternReuse,
      gaugeMax: 100,
      color: 'var(--ring)',
      trendData: trendHistory.map((t) => t.patternsProductionReady),
    },
    {
      icon: TrendingUp,
      title: 'Cloud Spend at Risk',
      value: scorecard.cloudSpendAtRisk,
      subtext: 'FinOps / infra waivers',
      gaugeValue: scorecard.cloudSpendAtRisk === '$0' ? 100 : 40,
      gaugeMax: 100,
      color: 'var(--chart-3)',
      trendData: trendHistory.map((t) => t.totalRiskExposure),
    },
  ];

  return (
    <section id="scorecard" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Executive Scorecard
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Real-time governance KPIs computed from your architecture artifacts.
          </p>
        </div>

        <div
          ref={ref}
          className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={kpi.title}
                custom={i}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                variants={cardVariants}
                className="relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.6} />
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {kpi.title}
                      </span>
                    </div>
                    <div className="mt-3 text-3xl font-bold tabular-nums text-foreground">
                      {kpi.value}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{kpi.subtext}</p>
                    <Sparkline data={kpi.trendData} color={kpi.color} className="mt-3 opacity-70" />
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <RingGauge value={kpi.gaugeValue} color={kpi.color} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
