'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  GitBranch,
  ShieldCheck,
  Scale,
  PenTool,
  BookOpen,
  MessageSquare,
  Globe,
  ChevronDown,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Pipeline stage data                                                */
/* ------------------------------------------------------------------ */

const stages = [
  {
    name: 'Setup',
    icon: GitBranch,
    accent: 'text-ring',
    accentBg: 'bg-ring/15',
    dotBorder: 'border-ring',
    borderLeft: 'border-l-ring',
    dotFill: 'bg-ring',
    trigger: 'Every Push',
    triggerVariant: 'secondary' as const,
    description:
      'Checks out code, installs Node.js 22 and Java 17, caches dependencies for fast subsequent runs.',
    tools: ['Node.js 22', 'Java 17', 'npm'],
    impact: 'Required',
    impactClass: 'text-muted-foreground',
  },
  {
    name: 'Verify',
    icon: ShieldCheck,
    accent: 'text-chart-1',
    accentBg: 'bg-chart-1/15',
    dotBorder: 'border-chart-1',
    borderLeft: 'border-l-chart-1',
    dotFill: 'bg-chart-1',
    trigger: 'Every Push',
    triggerVariant: 'secondary' as const,
    description:
      'Validates all architecture YAML models against enterprise JSON Schema, runs 288 unit tests, and enforces code quality with ESLint.',
    tools: ['Ajv', 'Vitest', 'ESLint', 'Zod'],
    impact: 'Blocks Merge',
    impactClass: 'text-destructive',
  },
  {
    name: 'Compliance',
    icon: Scale,
    accent: 'text-warning',
    accentBg: 'bg-warning/15',
    dotBorder: 'border-warning',
    borderLeft: 'border-l-warning',
    dotFill: 'bg-warning',
    trigger: 'Every Push',
    triggerVariant: 'secondary' as const,
    description:
      'Enforces enterprise architecture policies: no frontend-to-database bypass, valid deployment references, technology standards compliance.',
    tools: ['Custom Policy Engine', '5 Rules'],
    impact: 'Blocks Merge',
    impactClass: 'text-destructive',
  },
  {
    name: 'Diagrams',
    icon: PenTool,
    accent: 'text-chart-3',
    accentBg: 'bg-chart-3/15',
    dotBorder: 'border-chart-3',
    borderLeft: 'border-l-chart-3',
    dotFill: 'bg-chart-3',
    trigger: 'Every Push',
    triggerVariant: 'secondary' as const,
    description:
      'Auto-generates PlantUML and Draw.io diagrams for all 4 systems across 20 architectural views including context, container, and deployment.',
    tools: ['PlantUML', 'Draw.io', 'C4 Model'],
    impact: 'Required',
    impactClass: 'text-muted-foreground',
  },
  {
    name: 'Documentation',
    icon: BookOpen,
    accent: 'text-chart-2',
    accentBg: 'bg-chart-2/15',
    dotBorder: 'border-chart-2',
    borderLeft: 'border-l-chart-2',
    dotFill: 'bg-chart-2',
    trigger: 'Every Push',
    triggerVariant: 'secondary' as const,
    description:
      'Builds a static HTML documentation microsite from AsciiDoc templates with embedded architecture diagrams using docToolchain.',
    tools: ['docToolchain', 'AsciiDoc', 'Gradle'],
    impact: 'Required',
    impactClass: 'text-muted-foreground',
  },
  {
    name: 'PR Review',
    icon: MessageSquare,
    accent: 'text-tab-active',
    accentBg: 'bg-tab-active/15',
    dotBorder: 'border-tab-active',
    borderLeft: 'border-l-tab-active',
    dotFill: 'bg-tab-active',
    trigger: 'PRs Only',
    triggerVariant: 'outline' as const,
    description:
      'Posts architecture diagram previews directly into pull request comments so reviewers can visually inspect changes without downloading artifacts.',
    tools: ['GitHub Script', 'PlantUML Preview'],
    impact: 'Informs Reviewers',
    impactClass: 'text-ring',
  },
  {
    name: 'Publish',
    icon: Globe,
    accent: 'text-success',
    accentBg: 'bg-success/15',
    dotBorder: 'border-success',
    borderLeft: 'border-l-success',
    dotFill: 'bg-success',
    trigger: 'Main Only',
    triggerVariant: 'outline' as const,
    description:
      'Deploys the generated architecture documentation microsite to GitHub Pages, making it available to the entire organization.',
    tools: ['GitHub Pages', 'gh-pages branch'],
    impact: 'Publishes Site',
    impactClass: 'text-success',
  },
];

/* ------------------------------------------------------------------ */
/*  Framer-motion variants                                             */
/* ------------------------------------------------------------------ */

const dotVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (i: number) => ({
    scale: 1,
    opacity: 1,
    transition: { delay: i * 0.06, duration: 0.35, ease: 'easeOut' as const },
  }),
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: 'easeOut' as const },
  }),
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PipelineVisualization() {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <div
      ref={ref}
      className="rounded-xl border border-border bg-card shadow-sm"
    >
      {/* ── Header row ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-3 pb-1">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            CI/CD Pipeline
          </h2>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Enterprise Architecture Lifecycle
          </span>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-label="Toggle pipeline details"
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md',
            'text-muted-foreground transition-colors',
            'hover:bg-muted hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
          )}
        >
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </button>
      </div>

      {/* ── Horizontal timeline ────────────────────────────────────── */}
      <div className="overflow-x-auto px-5 pb-3">
        <div className="relative grid min-w-[480px] grid-cols-7">
          {/* Connecting line spanning center-of-first to center-of-last */}
          <div className="absolute left-[7%] right-[7%] top-3 h-px bg-border sm:top-4" />

          {stages.map((stage, i) => {
            const Icon = stage.icon;
            return (
              <motion.div
                key={stage.name}
                custom={i}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                variants={dotVariants}
                className="relative z-10 flex flex-col items-center"
              >
                <div
                  className={cn(
                    'flex items-center justify-center rounded-full border-2 bg-card shadow-sm',
                    'h-6 w-6 sm:h-8 sm:w-8',
                    stage.dotBorder,
                  )}
                  aria-label={stage.name}
                >
                  <Icon
                    className={cn('h-3 w-3 sm:h-4 sm:w-4', stage.accent)}
                    strokeWidth={1.8}
                  />
                </div>
                <span className="mt-1.5 text-[10px] font-medium text-muted-foreground sm:text-xs">
                  {stage.name}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Expanded detail cards ──────────────────────────────────── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-3 border-t border-border px-5 py-4 lg:grid-cols-2">
              {stages.map((stage, i) => {
                const Icon = stage.icon;
                return (
                  <motion.div
                    key={stage.name}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    className={cn(
                      'rounded-lg border border-border border-l-4 bg-muted/30 p-4',
                      stage.borderLeft,
                    )}
                  >
                    {/* Card header: number badge + name + trigger */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                            'text-[10px] font-bold text-primary-foreground',
                            stage.dotFill,
                          )}
                        >
                          {i + 1}
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">
                          {stage.name}
                        </h3>
                      </div>
                      <Badge
                        variant={stage.triggerVariant}
                        className="shrink-0 text-[10px]"
                      >
                        {stage.trigger}
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {stage.description}
                    </p>

                    {/* Tools + impact */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {stage.tools.map((tool) => (
                        <span
                          key={tool}
                          className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                        >
                          {tool}
                        </span>
                      ))}
                      <span
                        className={cn(
                          'ml-auto shrink-0 text-[10px] font-semibold',
                          stage.impactClass,
                        )}
                      >
                        {stage.impact}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
