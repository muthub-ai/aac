'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import type { SystemRow, PatternMaturity, WaiverFunnel } from '@/lib/metrics/compute-metrics';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

/* ── Horizontal bar ─────────────────────────────────────────────── */

function HBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

/* ── Funnel step ────────────────────────────────────────────────── */

function FunnelStep({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-8 rounded transition-all duration-700 ease-out"
        style={{
          width: `${Math.max(pct, 8)}%`,
          backgroundColor: color,
        }}
      />
      <div className="flex items-baseline gap-2 whitespace-nowrap">
        <span className="text-lg font-bold tabular-nums text-foreground">{count}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

/* ── Disposition badge ──────────────────────────────────────────── */

const dispositionColor: Record<string, string> = {
  Invest: 'bg-success/15 text-success',
  Maintain: 'bg-ring/15 text-ring',
  Migrate: 'bg-chart-5/15 text-chart-5',
  Retire: 'bg-destructive/15 text-destructive',
};

function DispositionBadge({ disposition }: { disposition: string }) {
  const cls = dispositionColor[disposition] ?? 'bg-muted text-muted-foreground';
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cls}`}>
      {disposition}
    </span>
  );
}

/* ── Format numbers ─────────────────────────────────────────────── */

function formatLoC(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

interface PortfolioSummaryProps {
  systemRows: SystemRow[];
  patternMaturity: PatternMaturity;
  waiverFunnel: WaiverFunnel;
}

export function PortfolioSummary({ systemRows, patternMaturity, waiverFunnel }: PortfolioSummaryProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  const totalPatterns = patternMaturity.productionReady + patternMaturity.beta + patternMaturity.draft;
  const totalWaivers = waiverFunnel.pendingReview + waiverFunnel.approved + waiverFunnel.remediated + waiverFunnel.rejected + waiverFunnel.expired;

  return (
    <section id="portfolio" className="bg-muted/30 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Portfolio Summary
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Systems inventory, pattern maturity distribution, and waiver lifecycle.
          </p>
        </div>

        <div ref={ref} className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Systems table */}
          <motion.div
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            variants={fadeUp}
            className="lg:col-span-2 overflow-x-auto rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Systems Inventory
            </h3>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 pr-4">System</th>
                  <th className="pb-3 pr-4 text-right">LoC</th>
                  <th className="pb-3 pr-4 text-right">Containers</th>
                  <th className="pb-3 pr-4 text-right">Deploy Units</th>
                  <th className="pb-3">Disposition</th>
                </tr>
              </thead>
              <tbody>
                {systemRows.map((row) => (
                  <tr key={row.name} className="border-b border-border/50 last:border-0">
                    <td className="py-3 pr-4 font-medium text-foreground">{row.name}</td>
                    <td className="py-3 pr-4 text-right tabular-nums text-muted-foreground">
                      {formatLoC(row.loc)}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-muted-foreground">
                      {row.containers}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-muted-foreground">
                      {row.deployableUnits}
                    </td>
                    <td className="py-3">
                      <DispositionBadge disposition={row.disposition} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          {/* Right column: Pattern maturity + Waiver funnel */}
          <div className="flex flex-col gap-8">
            {/* Pattern maturity */}
            <motion.div
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { ...fadeUp.visible.transition, delay: 0.1 } } }}
              className="rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Pattern Maturity
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Production Ready', count: patternMaturity.productionReady, color: 'var(--success)' },
                  { label: 'Beta', count: patternMaturity.beta, color: 'var(--chart-3)' },
                  { label: 'Draft', count: patternMaturity.draft, color: 'var(--muted-foreground)' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="w-28 text-xs text-muted-foreground">{item.label}</span>
                    <HBar value={item.count} max={totalPatterns} color={item.color} />
                    <span className="w-6 text-right text-sm font-semibold tabular-nums text-foreground">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Waiver lifecycle funnel */}
            <motion.div
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { ...fadeUp.visible.transition, delay: 0.2 } } }}
              className="rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Waiver Lifecycle
              </h3>
              <div className="space-y-2">
                <FunnelStep label="Pending Review" count={waiverFunnel.pendingReview} total={totalWaivers} color="var(--chart-3)" />
                <FunnelStep label="Approved" count={waiverFunnel.approved} total={totalWaivers} color="var(--ring)" />
                <FunnelStep label="Remediated" count={waiverFunnel.remediated} total={totalWaivers} color="var(--success)" />
                <FunnelStep label="Rejected" count={waiverFunnel.rejected} total={totalWaivers} color="var(--destructive)" />
                <FunnelStep label="Expired" count={waiverFunnel.expired} total={totalWaivers} color="var(--muted-foreground)" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
