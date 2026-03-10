'use client';

import { useState } from 'react';
import { ArrowRight, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { UTILITIES } from '@/lib/data/utilities-data';
import {
  QUICK_START_STEPS,
  COPILOT_SPACES,
  RAG_ARCHITECTURE,
  STRATEGIC_BENEFITS,
  IDE_MCP_CONFIG,
  EXAMPLE_PROMPT,
  ACCESS_CONTROL_ROLES,
} from '@/lib/data/copilot-spaces-data';
import type { CopilotSpace } from '@/lib/data/copilot-spaces-data';
import { UtilityHero } from './utility-hero';
import { SectionNav, type NavSection } from './section-nav';
import { CodeBlock } from './code-block';

const CDD_UTILITY = UTILITIES.find((u) => u.id === 'copilot-spaces')!;

const SECTIONS: NavSection[] = [
  { id: 'quick-start', label: 'Quick Start' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'domain-spaces', label: 'Domain Spaces' },
  { id: 'strategic-impact', label: 'Strategic Impact' },
  { id: 'ide-integration', label: 'IDE Integration' },
  { id: 'access-control', label: 'Access Control' },
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

function SpaceCard({ space }: { space: CopilotSpace }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${space.name} space details`}
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{space.name}</span>
            <a
              href={space.spaceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-ring/10 px-2 py-0.5 text-[10px] font-semibold text-ring hover:bg-ring/20 transition-colors"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Open ${space.name} on GitHub`}
            >
              Open Space <ExternalLink className="h-2.5 w-2.5" strokeWidth={2} />
            </a>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{space.purpose}</p>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/50 px-5 py-4 space-y-4">
          <div>
            <h5 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Attached Sources
            </h5>
            <div className="flex flex-wrap gap-1.5">
              {space.sources.map((src) => (
                <code
                  key={src}
                  className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                >
                  {src}
                </code>
              ))}
            </div>
          </div>
          <div>
            <h5 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              System Instruction
            </h5>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs leading-relaxed text-muted-foreground italic">
                &ldquo;{space.instruction}&rdquo;
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CopilotSpacesDocumentation() {
  return (
    <div className="space-y-10">
      <UtilityHero utility={CDD_UTILITY} />

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

      {/* How It Works */}
      <section>
        <SectionHeader id="how-it-works">How It Works</SectionHeader>
        <p className="mb-4 text-sm text-muted-foreground">
          Copilot Spaces operate on a Retrieval-Augmented Generation (RAG) architecture integrated into
          the GitHub ecosystem and the developer&apos;s IDE.
        </p>
        <div className="space-y-4">
          {RAG_ARCHITECTURE.map((ragStep) => (
            <div
              key={ragStep.step}
              className="flex gap-4 rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ring/10 font-mono text-sm font-bold text-ring">
                {ragStep.step}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-foreground">{ragStep.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {ragStep.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Domain Spaces */}
      <section>
        <SectionHeader id="domain-spaces">Domain Spaces</SectionHeader>
        <p className="mb-4 text-sm text-muted-foreground">
          Create targeted, domain-specific Spaces rather than one generic Space.
          This avoids context pollution and ensures precise, relevant code generation.
        </p>
        <div className="space-y-4">
          {COPILOT_SPACES.map((space) => (
            <SpaceCard key={space.name} space={space} />
          ))}
        </div>
      </section>

      {/* Strategic Impact */}
      <section>
        <SectionHeader id="strategic-impact">Strategic Impact</SectionHeader>
        <p className="mb-4 text-sm text-muted-foreground">
          Context Driven Development solves the fundamental challenge of enterprise architecture:
          knowledge distribution.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {STRATEGIC_BENEFITS.map((benefit) => (
            <div
              key={benefit.title}
              className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md"
            >
              <h4 className="mb-2 text-sm font-semibold text-foreground">{benefit.title}</h4>
              <p className="text-xs leading-relaxed text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* IDE Integration */}
      <section>
        <SectionHeader id="ide-integration">IDE Integration</SectionHeader>
        <p className="mb-4 text-sm text-muted-foreground">
          Access Copilot Spaces directly inside VS Code or Cursor via the GitHub MCP server.
          This exposes{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">list_copilot_spaces</code>{' '}
          and{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">get_copilot_space</code>{' '}
          tools locally.
        </p>
        <div className="space-y-4">
          <CodeBlock title="MCP Configuration" language="json" showPrompt={false}>
            {IDE_MCP_CONFIG}
          </CodeBlock>
          <div>
            <h4 className="mb-2 text-xs font-semibold text-foreground">Example Prompt</h4>
            <CodeBlock title="IDE Chat" language="text" showPrompt={false}>
              {EXAMPLE_PROMPT}
            </CodeBlock>
          </div>
        </div>
      </section>

      {/* Access Control */}
      <section>
        <SectionHeader id="access-control">Access Control</SectionHeader>
        <p className="mb-4 text-sm text-muted-foreground">
          Use GitHub&apos;s built-in permission model to share organization-owned Spaces.
          Grant appropriate access based on role.
        </p>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Role
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Audience
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Permissions
                </th>
              </tr>
            </thead>
            <tbody>
              {ACCESS_CONTROL_ROLES.map((acr) => (
                <tr key={acr.role} className="border-b border-border/30 last:border-0">
                  <td className="px-5 py-3.5">
                    <code className="rounded bg-ring/8 px-2 py-0.5 font-mono text-xs font-semibold text-ring">
                      {acr.role}
                    </code>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-foreground">{acr.audience}</td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">{acr.permissions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
