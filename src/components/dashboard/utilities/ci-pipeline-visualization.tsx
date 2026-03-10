'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  Layers,
  LayoutGrid,
  FileCheck,
  Shield,
  Package,
  Rocket,
  ChevronDown,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SubStage = {
  name: string;
  tool: string;
};

type StageData = {
  id: string;
  name: string;
  shortName: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  accent: string;
  accentBg: string;
  dotBorder: string;
  borderLeft: string;
  dotFill: string;
  trigger: string;
  triggerVariant: 'secondary' | 'outline';
  description: string;
  subStages: SubStage[];
  impact: string;
  impactClass: string;
};

type Phase = {
  label: string;
  stages: StageData[];
};

/* ------------------------------------------------------------------ */
/*  Stage definitions (Reference pipeline for app repos)               */
/* ------------------------------------------------------------------ */

const qualityGate: StageData = {
  id: 'quality-gate',
  name: 'Quality Gate',
  shortName: 'Quality',
  icon: ShieldCheck,
  accent: 'text-chart-5',
  accentBg: 'bg-chart-5/15',
  dotBorder: 'border-chart-5',
  borderLeft: 'border-l-chart-5',
  dotFill: 'bg-chart-5',
  trigger: 'Every Push',
  triggerVariant: 'secondary',
  description:
    'App-level quality gate: enforces code standards with ESLint and validates functionality with unit tests before any architecture checks begin.',
  subStages: [
    { name: 'ESLint', tool: 'Code Quality' },
    { name: 'Unit Tests', tool: 'npm run test' },
  ],
  impact: 'Blocks Merge',
  impactClass: 'text-destructive',
};

const schemaValidation: StageData = {
  id: 'schema-validation',
  name: 'Schema Validation',
  shortName: 'Schema',
  icon: FileCheck,
  accent: 'text-ring',
  accentBg: 'bg-ring/15',
  dotBorder: 'border-ring',
  borderLeft: 'border-l-ring',
  dotFill: 'bg-ring',
  trigger: 'Every Push',
  triggerVariant: 'secondary',
  description:
    'Validates model YAML against the enterprise JSON Schema (application-schema.json) with Ajv, Zod metadata validation, and cross-reference checks.',
  subStages: [
    { name: 'JSON Schema', tool: 'Ajv + Zod' },
    { name: 'Cross-refs', tool: 'aac validate' },
  ],
  impact: 'Blocks Merge',
  impactClass: 'text-destructive',
};

const appArchitecture: StageData = {
  id: 'app-arch',
  name: 'App Architecture',
  shortName: 'App Arch',
  icon: Layers,
  accent: 'text-chart-1',
  accentBg: 'bg-chart-1/15',
  dotBorder: 'border-chart-1',
  borderLeft: 'border-l-chart-1',
  dotFill: 'bg-chart-1',
  trigger: 'Every Push',
  triggerVariant: 'secondary',
  description:
    'Enforces 5 enterprise structural compliance rules: no frontend-to-database bypass, no empty systems, no orphaned externals, valid deployment references, and container technology required.',
  subStages: [
    { name: 'Compliance', tool: '5 Policy Rules' },
    { name: 'lint-architecture', tool: 'tsx' },
  ],
  impact: 'Blocks Merge',
  impactClass: 'text-destructive',
};

const patternConformance: StageData = {
  id: 'pattern-conf',
  name: 'Pattern Conformance',
  shortName: 'Patterns',
  icon: LayoutGrid,
  accent: 'text-chart-1',
  accentBg: 'bg-chart-1/15',
  dotBorder: 'border-chart-1',
  borderLeft: 'border-l-chart-1',
  dotFill: 'bg-chart-1',
  trigger: 'Every Push',
  triggerVariant: 'secondary',
  description:
    'Validates architecture patterns against the pattern schema. Checks required components, relationship constraints, resource policies, and resiliency topology.',
  subStages: [{ name: 'Pattern Schema', tool: 'aac validate' }],
  impact: 'Blocks Merge',
  impactClass: 'text-destructive',
};

const standardsCompliance: StageData = {
  id: 'standards-comp',
  name: 'Standards Compliance',
  shortName: 'Standards',
  icon: FileCheck,
  accent: 'text-chart-1',
  accentBg: 'bg-chart-1/15',
  dotBorder: 'border-chart-1',
  borderLeft: 'border-l-chart-1',
  dotFill: 'bg-chart-1',
  trigger: 'Every Push',
  triggerVariant: 'secondary',
  description:
    'Validates enterprise architecture standards against the standards schema (draft 2020-12). Enforces requirement severity levels, publication status, and architecture principles.',
  subStages: [{ name: 'Standards Schema', tool: 'aac validate' }],
  impact: 'Blocks Merge',
  impactClass: 'text-destructive',
};

const policyEngine: StageData = {
  id: 'policy-engine',
  name: 'Policy Engine',
  shortName: 'OPA',
  icon: Shield,
  accent: 'text-chart-4',
  accentBg: 'bg-chart-4/15',
  dotBorder: 'border-chart-4',
  borderLeft: 'border-l-chart-4',
  dotFill: 'bg-chart-4',
  trigger: 'Every Push',
  triggerVariant: 'secondary',
  description:
    'Evaluates 3 OPA Rego governance policies against the architecture model covering security (KMS encryption), FinOps (autoscaling), and integration (API gateway) domains.',
  subStages: [
    { name: 'Security', tool: 'KMS Encryption' },
    { name: 'FinOps', tool: 'Autoscaling' },
    { name: 'Integration', tool: 'API Gateway' },
  ],
  impact: 'Blocks Merge',
  impactClass: 'text-destructive',
};

const buildPackage: StageData = {
  id: 'build',
  name: 'Build & Package',
  shortName: 'Build',
  icon: Package,
  accent: 'text-chart-2',
  accentBg: 'bg-chart-2/15',
  dotBorder: 'border-chart-2',
  borderLeft: 'border-l-chart-2',
  dotFill: 'bg-chart-2',
  trigger: 'Every Push',
  triggerVariant: 'secondary',
  description:
    'Application-specific build step. Compile, bundle, and package your application artifacts. Fully customizable to your tech stack (Docker, Gradle, etc.).',
  subStages: [{ name: 'Docker Build', tool: 'Customizable' }],
  impact: 'Required',
  impactClass: 'text-muted-foreground',
};

const deployStage: StageData = {
  id: 'deploy',
  name: 'Deploy',
  shortName: 'Deploy',
  icon: Rocket,
  accent: 'text-success',
  accentBg: 'bg-success/15',
  dotBorder: 'border-success',
  borderLeft: 'border-l-success',
  dotFill: 'bg-success',
  trigger: 'Main Only',
  triggerVariant: 'outline',
  description:
    'Deploy to the target environment. Only runs after all validation gates pass on the main branch. Customize for GKE, Cloud Run, ECS, etc.',
  subStages: [{ name: 'Target Env', tool: 'Customizable' }],
  impact: 'Publishes App',
  impactClass: 'text-success',
};

/* ------------------------------------------------------------------ */
/*  Phase layout (groups stages into rows)                             */
/* ------------------------------------------------------------------ */

const phases: Phase[] = [
  { label: 'Quality Gate', stages: [qualityGate] },
  { label: 'Schema Check', stages: [schemaValidation] },
  { label: 'Compliance (Parallel)', stages: [appArchitecture, patternConformance, standardsCompliance] },
  { label: 'Governance', stages: [policyEngine] },
  { label: 'Ship', stages: [buildPackage, deployStage] },
];

const allStages = phases.flatMap((p) => p.stages);

/* ------------------------------------------------------------------ */
/*  Connector components (CSS-based DAG lines)                         */
/* ------------------------------------------------------------------ */

function FanOut({ to }: { to: number }) {
  if (to === 3) {
    return (
      <div className="relative mx-auto h-7 w-full max-w-[420px] sm:max-w-[480px]">
        <div className="absolute left-1/2 top-0 h-2.5 w-px -translate-x-px bg-border" />
        <div className="absolute top-2.5 left-[16.67%] right-[16.67%] h-px bg-border" />
        <div className="absolute top-2.5 left-[16.67%] h-[18px] w-px bg-border" />
        <div className="absolute top-2.5 left-1/2 h-[18px] w-px -translate-x-px bg-border" />
        <div className="absolute top-2.5 right-[16.67%] h-[18px] w-px bg-border" />
      </div>
    );
  }
  if (to === 2) {
    return (
      <div className="relative mx-auto h-7 w-full max-w-[280px] sm:max-w-[320px]">
        <div className="absolute left-1/2 top-0 h-2.5 w-px -translate-x-px bg-border" />
        <div className="absolute top-2.5 left-1/4 right-1/4 h-px bg-border" />
        <div className="absolute top-2.5 left-1/4 h-[18px] w-px bg-border" />
        <div className="absolute top-2.5 right-1/4 h-[18px] w-px bg-border" />
      </div>
    );
  }
  return (
    <div className="flex justify-center">
      <div className="h-7 w-px bg-border" />
    </div>
  );
}

function FanIn({ from }: { from: number }) {
  if (from === 3) {
    return (
      <div className="relative mx-auto h-7 w-full max-w-[420px] sm:max-w-[480px]">
        <div className="absolute top-0 left-[16.67%] h-[18px] w-px bg-border" />
        <div className="absolute top-0 left-1/2 h-[18px] w-px -translate-x-px bg-border" />
        <div className="absolute top-0 right-[16.67%] h-[18px] w-px bg-border" />
        <div className="absolute top-[18px] left-[16.67%] right-[16.67%] h-px bg-border" />
        <div className="absolute left-1/2 top-[18px] h-2.5 w-px -translate-x-px bg-border" />
      </div>
    );
  }
  return (
    <div className="flex justify-center">
      <div className="h-7 w-px bg-border" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Framer-motion variants                                             */
/* ------------------------------------------------------------------ */

const nodeVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (i: number) => ({
    scale: 1,
    opacity: 1,
    transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' as const },
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
/*  Stage node (compact DAG circle + label)                            */
/* ------------------------------------------------------------------ */

function StageNode({
  stage,
  index,
  inView,
}: {
  stage: StageData;
  index: number;
  inView: boolean;
}) {
  const Icon = stage.icon;
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={nodeVariants}
      className="flex flex-col items-center"
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-full border-2 bg-card shadow-sm',
          'h-7 w-7 sm:h-9 sm:w-9',
          stage.dotBorder,
        )}
        aria-label={stage.name}
      >
        <Icon
          className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', stage.accent)}
          strokeWidth={1.8}
        />
      </div>
      <span className="mt-1 text-[9px] font-medium text-muted-foreground sm:text-[11px]">
        {stage.shortName}
      </span>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CiPipelineVisualization() {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <div
      ref={ref}
      className="rounded-xl border border-border bg-card shadow-sm"
    >
      {/* Header row */}
      <div className="flex items-center justify-between px-5 pt-3 pb-1">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            Reference CI/CD Pipeline
          </h2>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Quality gate &rarr; schema &rarr; parallel compliance &rarr; OPA &rarr; ship
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

      {/* DAG visualization */}
      <div className="px-5 pb-4 pt-2">
        {/* Phase 1: Quality Gate */}
        <div className="flex justify-center">
          <StageNode stage={qualityGate} index={0} inView={inView} />
        </div>

        {/* Connector: 1 -> 1 */}
        <FanOut to={1} />

        {/* Phase 2: Schema Validation */}
        <div className="flex justify-center">
          <StageNode stage={schemaValidation} index={1} inView={inView} />
        </div>

        {/* Connector: 1 -> 3 fan-out */}
        <FanOut to={3} />

        {/* Phase 3: Compliance — three parallel nodes */}
        <div className="mx-auto grid max-w-[420px] grid-cols-3 sm:max-w-[480px]">
          <StageNode stage={appArchitecture} index={2} inView={inView} />
          <StageNode stage={patternConformance} index={3} inView={inView} />
          <StageNode stage={standardsCompliance} index={4} inView={inView} />
        </div>

        {/* Connector: 3 -> 1 fan-in */}
        <FanIn from={3} />

        {/* Phase 4: Policy Engine */}
        <div className="flex justify-center">
          <StageNode stage={policyEngine} index={5} inView={inView} />
        </div>

        {/* Connector: 1 -> 2 fan-out */}
        <FanOut to={2} />

        {/* Phase 5: Ship — two nodes */}
        <div className="mx-auto grid max-w-[280px] grid-cols-2 sm:max-w-[320px]">
          <StageNode stage={buildPackage} index={6} inView={inView} />
          <StageNode stage={deployStage} index={7} inView={inView} />
        </div>
      </div>

      {/* Expanded detail cards */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-5 border-t border-border px-5 py-4">
              {phases.map((phase) => (
                <div key={phase.label}>
                  <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {phase.label}
                  </h3>
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {phase.stages.map((stage) => {
                      const globalIdx = allStages.indexOf(stage);
                      const Icon = stage.icon;
                      return (
                        <motion.div
                          key={stage.id}
                          custom={globalIdx}
                          initial="hidden"
                          animate="visible"
                          variants={cardVariants}
                          className={cn(
                            'rounded-lg border border-border border-l-4 bg-muted/30 p-4',
                            stage.borderLeft,
                          )}
                        >
                          {/* Card header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={cn(
                                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                                  'text-[10px] font-bold text-primary-foreground',
                                  stage.dotFill,
                                )}
                              >
                                <Icon className="h-3 w-3" strokeWidth={2} />
                              </div>
                              <h4 className="text-sm font-semibold text-foreground">
                                {stage.name}
                              </h4>
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

                          {/* Sub-stages */}
                          <div className="mt-3 space-y-1.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Sub-stages
                            </span>
                            {stage.subStages.map((sub) => (
                              <div
                                key={sub.name}
                                className="flex items-center gap-2"
                              >
                                <div
                                  className={cn(
                                    'h-1.5 w-1.5 shrink-0 rounded-full',
                                    stage.dotFill,
                                  )}
                                />
                                <span className="text-xs font-medium text-foreground">
                                  {sub.name}
                                </span>
                                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                                  {sub.tool}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Impact */}
                          <div className="mt-3 flex justify-end">
                            <span
                              className={cn(
                                'text-[10px] font-semibold',
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
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
