'use client';

import { ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { UTILITIES } from '@/lib/data/utilities-data';
import {
  QUICK_START_STEPS,
  POLICY_RULES,
  CI_COMMANDS,
  SAMPLE_TEST,
  DIRECTORY_STRUCTURE,
} from '@/lib/data/policy-engine-data';
import type { PolicyRule } from '@/lib/data/policy-engine-data';
import { cn } from '@/lib/utils';
import { UtilityHero } from './utility-hero';
import { SectionNav, type NavSection } from './section-nav';
import { CodeBlock } from './code-block';

const POLICY_UTILITY = UTILITIES.find((u) => u.id === 'policy-engine')!;

const SECTIONS: NavSection[] = [
  { id: 'quick-start', label: 'Quick Start' },
  { id: 'policy-rules', label: 'Policy Rules' },
  { id: 'testing', label: 'Testing Framework' },
  { id: 'ci-integration', label: 'CI/CD Integration' },
  { id: 'bundle', label: 'Bundle Build' },
  { id: 'directory', label: 'Directory Structure' },
];

const DOMAIN_COLORS: Record<string, { bg: string; text: string }> = {
  FinOps: { bg: 'bg-chart-1/10', text: 'text-chart-1' },
  Security: { bg: 'bg-destructive/10', text: 'text-destructive' },
  Integration: { bg: 'bg-ring/10', text: 'text-ring' },
};

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

function PolicyRuleCard({ rule }: { rule: PolicyRule }) {
  const [expanded, setExpanded] = useState(false);
  const colors = DOMAIN_COLORS[rule.domain] ?? { bg: 'bg-muted', text: 'text-muted-foreground' };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${rule.name} policy details`}
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{rule.name}</span>
            <span
              className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold',
                colors.bg,
                colors.text,
              )}
            >
              {rule.domain}
            </span>
            <span
              className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold',
                rule.severity === 'high'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-warning/10 text-warning',
              )}
            >
              {rule.severity}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{rule.description}</p>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/50 px-5 py-4 space-y-3">
          <div>
            <h5 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Rego Package
            </h5>
            <code className="rounded bg-ring/8 px-2 py-0.5 font-mono text-xs font-medium text-ring">
              {rule.package_name}
            </code>
          </div>
          <div>
            <h5 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Enforces
            </h5>
            <p className="text-xs text-muted-foreground">{rule.enforces}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function PolicyEngineDocumentation() {
  return (
    <div className="space-y-10">
      <UtilityHero utility={POLICY_UTILITY} />

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

      {/* Policy Rules */}
      <section>
        <SectionHeader id="policy-rules">Policy Rules</SectionHeader>
        <p className="mb-4 text-sm text-muted-foreground">
          Three enterprise governance policies enforced via Open Policy Agent. Each policy evaluates architecture
          models and produces violation messages for non-compliant configurations.
        </p>
        <div className="space-y-4">
          {POLICY_RULES.map((rule) => (
            <PolicyRuleCard key={rule.name} rule={rule} />
          ))}
        </div>
      </section>

      {/* Testing Framework */}
      <section>
        <SectionHeader id="testing">Testing Framework</SectionHeader>
        <p className="mb-4 text-sm text-muted-foreground">
          OPA includes a built-in testing framework. Every policy has a corresponding{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">_test.rego</code>{' '}
          file that verifies both compliant and non-compliant inputs.
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4">
              <h4 className="mb-2 text-xs font-semibold text-foreground">Test Convention</h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Test functions are prefixed with{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">test_</code>{' '}
                and use mock input to exercise{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">deny</code>{' '}
                rules via{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">with input as</code>.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <h4 className="mb-2 text-xs font-semibold text-foreground">Coverage Target</h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                All governance rules enforce a strict{' '}
                <span className="font-semibold text-foreground">100% coverage</span>{' '}
                requirement. Tests must cover every branch of every deny rule.
              </p>
            </div>
          </div>

          <CodeBlock title="rightsizing_test.rego" language="rego" showPrompt={false}>
            {SAMPLE_TEST}
          </CodeBlock>
        </div>
      </section>

      {/* CI/CD Integration */}
      <section>
        <SectionHeader id="ci-integration">CI/CD Integration</SectionHeader>
        <p className="mb-4 text-sm text-muted-foreground">
          The CI pipeline enforces policy stability before any Rego code is merged. These commands run
          automatically on every pull request.
        </p>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Step
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Command
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Description
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Blocks PR
                </th>
              </tr>
            </thead>
            <tbody>
              {CI_COMMANDS.map((cmd, idx) => (
                <tr key={cmd.name} className="border-b border-border/30 last:border-0">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-[10px] font-bold text-muted-foreground bg-muted">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-medium text-foreground">{cmd.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <code className="rounded bg-ring/8 px-1.5 py-0.5 font-mono text-xs font-medium text-ring">
                      {cmd.command}
                    </code>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">{cmd.description}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        cmd.failsBuild
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {cmd.failsBuild ? 'yes' : 'no'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bundle Build */}
      <section>
        <SectionHeader id="bundle">Bundle Build</SectionHeader>
        <p className="mb-4 text-sm text-muted-foreground">
          Compile all policies into a deployable OPA bundle for production use with OPA server or sidecar.
        </p>
        <div className="space-y-4">
          <CodeBlock>cd packages/policies && npm run bundle</CodeBlock>
          <div className="rounded-xl border border-border bg-card p-5">
            <h4 className="mb-3 text-xs font-semibold text-foreground">Bundle Pipeline</h4>
            <div className="space-y-2">
              {[
                { step: 'Format check', desc: 'opa fmt --fail — ensures consistent formatting', dotClass: 'bg-ring' },
                { step: 'Syntax check', desc: 'opa check — compiles and validates all rules', dotClass: 'bg-ring' },
                { step: 'Unit tests', desc: 'opa test -v — runs all _test.rego files', dotClass: 'bg-ring' },
                { step: 'Build bundle', desc: 'opa build — creates dist/policies.tar.gz', dotClass: 'bg-success' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', item.dotClass)} />
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-foreground">{item.step}</span>
                    <span className="mx-1.5 text-xs text-muted-foreground/50">&mdash;</span>
                    <span className="text-xs text-muted-foreground">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Directory Structure */}
      <section>
        <SectionHeader id="directory">Directory Structure</SectionHeader>
        <p className="mb-4 text-sm text-muted-foreground">
          The policy workspace is isolated in{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">packages/policies/</code>{' '}
          with dedicated directories for each governance domain.
        </p>
        <CodeBlock title="packages/policies/" language="text" showPrompt={false}>
          {DIRECTORY_STRUCTURE}
        </CodeBlock>
      </section>
    </div>
  );
}
