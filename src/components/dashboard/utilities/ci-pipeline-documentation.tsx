'use client';

import { useState } from 'react';
import { ArrowRight, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { UTILITIES } from '@/lib/data/utilities-data';
import {
  QUICK_START_STEPS,
  PIPELINE_STAGES,
  COMPLIANCE_RULES,
  OPA_POLICIES,
  WORKFLOW_YAML,
  AACRC_CONFIG,
  MODEL_STRUCTURE,
  CLI_EXIT_CODES,
} from '@/lib/data/ci-pipeline-data';
import type { PipelineStage } from '@/lib/data/ci-pipeline-data';
import { UtilityHero } from './utility-hero';
import { SectionNav, type NavSection } from './section-nav';
import { CodeBlock } from './code-block';

const CI_UTILITY = UTILITIES.find((u) => u.id === 'ci-pipeline')!;

const SECTIONS: NavSection[] = [
  { id: 'quick-start', label: 'Quick Start' },
  { id: 'pipeline-overview', label: 'Pipeline Overview' },
  { id: 'stages', label: 'Validation Stages' },
  { id: 'compliance-rules', label: 'Compliance Rules' },
  { id: 'opa-policies', label: 'OPA Policies' },
  { id: 'configuration', label: 'Configuration' },
];

function SectionHeader({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3
      id={id}
      className="mb-6 flex items-center gap-2 border-l-4 border-ring pl-3 text-lg font-semibold tracking-tight text-foreground scroll-mt-16"
    >
      {children}
    </h3>
  );
}

const PIPELINE_DIAGRAM = `                         ┌───────────────────────┐
                         │    ① QUALITY GATE      │
                         │    Lint + Unit Tests    │
                         └───────────┬───────────┘
                                     │
                         ┌───────────▼───────────┐
                         │  ② SCHEMA VALIDATION   │
                         │  aac validate model/   │
                         └───────────┬───────────┘
                                     │
            ┌────────────────────────┼────────────────────────┐
            │                        │                        │
  ┌─────────▼──────────┐  ┌─────────▼──────────┐  ┌─────────▼──────────┐
  │ ③a APP ARCHITECTURE│  │ ③b PATTERN         │  │ ③c STANDARDS       │
  │ 5 Compliance Rules │  │    CONFORMANCE      │  │    COMPLIANCE      │
  └─────────┬──────────┘  └─────────┬──────────┘  └─────────┬──────────┘
            │                        │                        │
            └────────────────────────┼────────────────────────┘
                                     │
                         ┌───────────▼───────────┐
                         │  ④ POLICY ENGINE       │
                         │  OPA Rego (3 policies) │
                         └───────────┬───────────┘
                                     │
                         ┌───────────▼───────────┐
                         │  ⑤ BUILD & PACKAGE     │
                         └───────────┬───────────┘
                                     │
                         ┌───────────▼───────────┐
                         │  ⑥ DEPLOY              │
                         └───────────────────────┘`;

function StageCard({ stage }: { stage: PipelineStage }) {
  const [expanded, setExpanded] = useState(false);

  const stageColors: Record<string, string> = {
    '1': 'bg-chart-5/10 text-chart-5',
    '2': 'bg-ring/10 text-ring',
    '3a': 'bg-chart-1/10 text-chart-1',
    '3b': 'bg-chart-1/10 text-chart-1',
    '3c': 'bg-chart-1/10 text-chart-1',
    '4': 'bg-chart-4/10 text-chart-4',
    '5': 'bg-success/10 text-success',
    '6': 'bg-chart-2/10 text-chart-2',
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${stage.name} stage details`}
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 font-mono text-[10px] font-bold ${stageColors[stage.stage] ?? 'bg-muted text-muted-foreground'}`}>
              {stage.stage}
            </span>
            <span className="text-sm font-semibold text-foreground">{stage.name}</span>
            {stage.parallel && (
              <span className="rounded-full bg-chart-1/10 px-2 py-0.5 text-[10px] font-semibold text-chart-1">
                parallel
              </span>
            )}
            {stage.blocksDeply && (
              <AlertTriangle className="h-3 w-3 text-destructive" strokeWidth={2} />
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{stage.description}</p>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/50 px-5 py-4 space-y-4">
          <p className="text-xs leading-relaxed text-muted-foreground">{stage.description}</p>
          <div>
            <h5 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Commands
            </h5>
            <div className="space-y-2">
              {stage.commands.map((cmd) => (
                <CodeBlock key={cmd}>{cmd}</CodeBlock>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              {stage.blocksDeply ? (
                <AlertTriangle className="h-3 w-3 text-destructive" strokeWidth={2} />
              ) : (
                <CheckCircle2 className="h-3 w-3 text-success" strokeWidth={2} />
              )}
              {stage.exitBehavior}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

const SEVERITY_STYLES: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive',
  medium: 'bg-chart-4/10 text-chart-4',
};

export function CiPipelineDocumentation() {
  return (
    <div className="space-y-10">
      <UtilityHero utility={CI_UTILITY} />

      <SectionNav sections={SECTIONS} />

      {/* Quick Start */}
      <section>
        <SectionHeader id="quick-start">Quick Start</SectionHeader>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {QUICK_START_STEPS.map((step) => (
            <div
              key={step.step}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ring font-mono text-sm font-bold text-white">
                  {step.step}
                </div>
                <h4 className="text-sm font-semibold text-foreground">{step.title}</h4>
              </div>
              <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
                {step.description}
              </p>
              <CodeBlock>{step.command}</CodeBlock>
              {step.step < QUICK_START_STEPS.length && (
                <ArrowRight className="absolute right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-border md:block" strokeWidth={1.5} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline Overview */}
      <section>
        <SectionHeader id="pipeline-overview">Pipeline Overview</SectionHeader>
        <p className="mb-4 text-sm text-muted-foreground">
          A 6-stage fan-out/fan-in pipeline with 3 parallel architecture compliance sub-stages.
          Triggers only when architecture artifacts change (<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">model/**</code>,{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">patterns/**</code>,{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">standards/**</code>).
        </p>
        <CodeBlock title="Pipeline Architecture" language="text" showPrompt={false}>
          {PIPELINE_DIAGRAM}
        </CodeBlock>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <div className="text-2xl font-bold text-ring">8</div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Jobs Total</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <div className="text-2xl font-bold text-chart-1">3</div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Parallel Stages</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <div className="text-2xl font-bold text-chart-4">3</div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">OPA Policies</div>
          </div>
        </div>
      </section>

      {/* Validation Stages */}
      <section>
        <SectionHeader id="stages">Validation Stages</SectionHeader>
        <p className="mb-4 text-sm text-muted-foreground">
          Each stage acts as a gate. Stages ③a, ③b, and ③c run in parallel after schema validation
          passes. All three must succeed before the OPA Policy Engine evaluates governance rules.
        </p>
        <div className="space-y-3">
          {PIPELINE_STAGES.map((stage) => (
            <StageCard key={stage.stage} stage={stage} />
          ))}
        </div>
      </section>

      {/* Compliance Rules */}
      <section>
        <SectionHeader id="compliance-rules">Compliance Rules</SectionHeader>
        <p className="mb-4 text-sm text-muted-foreground">
          Stage ③a enforces 5 enterprise architecture rules from{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">lint-architecture.ts</code>.
          All rules block deployment on violation.
        </p>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Rule
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  ID
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPLIANCE_RULES.map((rule) => (
                <tr key={rule.rule} className="border-b border-border/30 last:border-0">
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-semibold text-foreground">{rule.name}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <code className="rounded bg-ring/8 px-2 py-0.5 font-mono text-[10px] font-semibold text-ring">
                      {rule.rule}
                    </code>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">{rule.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* OPA Policies */}
      <section>
        <SectionHeader id="opa-policies">OPA Policies</SectionHeader>
        <p className="mb-4 text-sm text-muted-foreground">
          Stage ④ evaluates 3 Open Policy Agent governance policies against your architecture model.
          Each policy produces a <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">deny</code> set —
          any non-empty result blocks deployment.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {OPA_POLICIES.map((policy) => (
            <div
              key={policy.packageName}
              className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-chart-4" strokeWidth={1.5} />
                  <span className="text-sm font-semibold text-foreground">{policy.domain}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${SEVERITY_STYLES[policy.severity]}`}>
                  {policy.severity}
                </span>
              </div>
              <code className="mb-3 block rounded bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground">
                {policy.packageName}
              </code>
              <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{policy.description}</p>
              <div className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Enforces: </span>
                <span className="text-[10px] text-foreground">{policy.enforcement}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Configuration */}
      <section>
        <SectionHeader id="configuration">Configuration</SectionHeader>
        <p className="mb-4 text-sm text-muted-foreground">
          Set up your application repository with the AAC directory structure, CLI config, and the
          reference workflow file.
        </p>

        <div className="space-y-6">
          <div>
            <h4 className="mb-2 text-xs font-semibold text-foreground">Repository Structure</h4>
            <CodeBlock title="Directory Layout" language="text" showPrompt={false}>
              {MODEL_STRUCTURE}
            </CodeBlock>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-semibold text-foreground">CLI Configuration</h4>
            <CodeBlock title=".aacrc" language="json" showPrompt={false}>
              {AACRC_CONFIG}
            </CodeBlock>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-semibold text-foreground">Exit Codes</h4>
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Code
                    </th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Label
                    </th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Meaning
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {CLI_EXIT_CODES.map((ec) => (
                    <tr key={ec.code} className="border-b border-border/30 last:border-0">
                      <td className="px-5 py-3.5">
                        <code className="rounded bg-ring/8 px-2 py-0.5 font-mono text-xs font-bold text-ring">
                          {ec.code}
                        </code>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-semibold text-foreground">{ec.label}</td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground">{ec.meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-semibold text-foreground">Reference Workflow</h4>
            <p className="mb-2 text-xs text-muted-foreground">
              Copy this file to <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground">.github/workflows/aac-validate.yml</code> in
              your application repository.
            </p>
            <CodeBlock title="aac-validate.yml" language="yaml" showPrompt={false}>
              {WORKFLOW_YAML}
            </CodeBlock>
          </div>
        </div>
      </section>
    </div>
  );
}
