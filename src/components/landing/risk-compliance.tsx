'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import type { RiskDomainRow, StandardsDomainRow } from '@/lib/metrics/compute-metrics';

/* ── Heat-map cell ──────────────────────────────────────────────── */

const severityColors: Record<string, string> = {
  critical: 'bg-destructive/90',
  high: 'bg-chart-5/80',
  medium: 'bg-chart-3/60',
  low: 'bg-ring/40',
};

function HeatCell({ count, severity }: { count: number; severity: string }) {
  if (count === 0) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded text-xs text-muted-foreground/40">
        --
      </div>
    );
  }
  return (
    <div
      className={`flex h-9 w-9 items-center justify-center rounded text-xs font-semibold text-white ${severityColors[severity]}`}
    >
      {count}
    </div>
  );
}

/* ── Stacked bar for standards ──────────────────────────────────── */

function StackedBar({ approved, draft, retired, total }: StandardsDomainRow) {
  if (total === 0) return null;
  const pctA = (approved / total) * 100;
  const pctD = (draft / total) * 100;
  const pctR = (retired / total) * 100;
  return (
    <div className="flex items-center gap-3">
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="flex h-full">
          {pctA > 0 && (
            <div className="bg-success" style={{ width: `${pctA}%` }} />
          )}
          {pctD > 0 && (
            <div className="bg-chart-3" style={{ width: `${pctD}%` }} />
          )}
          {pctR > 0 && (
            <div className="bg-muted-foreground/40" style={{ width: `${pctR}%` }} />
          )}
        </div>
      </div>
      <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{total}</span>
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

interface RiskComplianceProps {
  riskByDomain: RiskDomainRow[];
  standardsByDomain: StandardsDomainRow[];
}

export function RiskCompliance({ riskByDomain, standardsByDomain }: RiskComplianceProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section id="risk" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Risk &amp; Compliance Dashboard
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Cross-domain risk exposure and standards adoption at a glance.
          </p>
        </div>

        <div ref={ref} className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Risk heat map */}
          <motion.div
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            variants={fadeUp}
            className="rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Risk Heat Map by Domain
            </h3>

            {riskByDomain.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No active risk data.</p>
            ) : (
              <div className="space-y-1">
                {/* Header */}
                <div className="mb-2 grid grid-cols-[1fr_repeat(4,2.5rem)] items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  <span>Domain</span>
                  <span className="text-center">Crit</span>
                  <span className="text-center">High</span>
                  <span className="text-center">Med</span>
                  <span className="text-center">Low</span>
                </div>

                {riskByDomain.map((row) => (
                  <div
                    key={row.domain}
                    className="grid grid-cols-[1fr_repeat(4,2.5rem)] items-center gap-2 rounded-lg px-1 py-1.5 transition-colors hover:bg-muted/50"
                  >
                    <span className="truncate text-sm font-medium text-foreground">{row.domain}</span>
                    <HeatCell count={row.critical} severity="critical" />
                    <HeatCell count={row.high} severity="high" />
                    <HeatCell count={row.medium} severity="medium" />
                    <HeatCell count={row.low} severity="low" />
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Standards coverage */}
          <motion.div
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { ...fadeUp.visible.transition, delay: 0.12 } } }}
            className="rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Standards Coverage by Domain
            </h3>

            {standardsByDomain.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No standards data.</p>
            ) : (
              <div className="space-y-4">
                {/* Legend */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-success" /> Approved
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-chart-3" /> Draft
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-muted-foreground/40" /> Retired
                  </span>
                </div>

                {standardsByDomain.map((row) => (
                  <div key={row.domain} className="space-y-1.5">
                    <span className="text-sm font-medium text-foreground">{row.domain}</span>
                    <StackedBar {...row} />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
