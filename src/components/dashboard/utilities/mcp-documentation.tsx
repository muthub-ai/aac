'use client';

import { useState } from 'react';
import { ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';
import { UTILITIES } from '@/lib/data/utilities-data';
import {
  QUICK_START_STEPS,
  MCP_RESOURCES,
  MCP_TOOLS,
  MCP_PROMPTS,
  IDE_CONFIG,
  LINT_RULES,
} from '@/lib/data/mcp-data';
import type { McpTool } from '@/lib/data/mcp-data';
import { cn } from '@/lib/utils';
import { UtilityHero } from './utility-hero';
import { SectionNav, type NavSection } from './section-nav';
import { CodeBlock } from './code-block';

const MCP_UTILITY = UTILITIES.find((u) => u.id === 'mcp-server')!;

const SECTIONS: NavSection[] = [
  { id: 'quick-start', label: 'Quick Start' },
  { id: 'resources', label: 'Resources' },
  { id: 'tools', label: 'Tools' },
  { id: 'prompts', label: 'Prompts' },
  { id: 'lint-rules', label: 'Lint Rules' },
  { id: 'ide-config', label: 'IDE Configuration' },
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

function ToolCard({ tool }: { tool: McpTool }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${tool.name} tool details`}
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
        )}
        <div className="min-w-0 flex-1">
          <code className="rounded bg-ring/8 px-2 py-0.5 font-mono text-sm font-semibold text-ring">
            {tool.name}
          </code>
          <p className="mt-1 text-xs text-muted-foreground">{tool.description}</p>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/50 px-5 py-4 space-y-4">
          {/* Inputs */}
          <div>
            <h5 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Inputs
            </h5>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Parameter
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Type
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Required
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tool.inputs.map((input) => (
                    <tr key={input.name} className="border-b border-border/30 last:border-0">
                      <td className="px-4 py-2.5">
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                          {input.name}
                        </code>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{input.type}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold',
                            input.required
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {input.required ? 'required' : 'optional'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{input.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Outputs */}
          <div>
            <h5 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Output Fields
            </h5>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Field
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Type
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tool.outputFields.map((field) => (
                    <tr key={field.name} className="border-b border-border/30 last:border-0">
                      <td className="px-4 py-2.5">
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                          {field.name}
                        </code>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{field.type}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{field.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function McpDocumentation() {
  return (
    <div className="space-y-10">
      <UtilityHero utility={MCP_UTILITY} />

      <SectionNav sections={SECTIONS} />

      {/* ── Quick Start ── */}
      <section>
        <SectionHeader id="quick-start">Quick Start</SectionHeader>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {QUICK_START_STEPS.map((step) => (
            <div
              key={step.step}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md"
            >
              {/* Step number */}
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

      {/* ── Resources ── */}
      <section>
        <SectionHeader id="resources">Resources</SectionHeader>
        <p className="mb-4 text-sm text-muted-foreground">
          MCP resources provide read access to your architecture repository. Use these URIs to query systems, standards, waivers, and patterns.
        </p>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  URI
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Description
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Type
                </th>
              </tr>
            </thead>
            <tbody>
              {MCP_RESOURCES.map((resource) => (
                <tr key={resource.uri} className="border-b border-border/30 last:border-0">
                  <td className="px-5 py-3.5">
                    <code className="rounded bg-ring/8 px-1.5 py-0.5 font-mono text-xs font-medium text-ring">
                      {resource.uri}
                    </code>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">{resource.description}</td>
                  <td className="px-5 py-3.5">
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {resource.mimeType}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Tools ── */}
      <section>
        <SectionHeader id="tools">Tools</SectionHeader>
        <p className="mb-4 text-sm text-muted-foreground">
          MCP tools allow AI agents to validate architecture, check compliance, and scaffold artifacts.
        </p>
        <div className="space-y-4">
          {MCP_TOOLS.map((tool) => (
            <ToolCard key={tool.name} tool={tool} />
          ))}
        </div>
      </section>

      {/* ── Prompts ── */}
      <section>
        <SectionHeader id="prompts">Prompts</SectionHeader>
        <p className="mb-4 text-sm text-muted-foreground">
          MCP prompts provide guided, multi-step workflows that AI agents can follow to accomplish complex architecture tasks.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {MCP_PROMPTS.map((prompt) => (
            <div
              key={prompt.name}
              className="overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md"
            >
              <div className="mb-3">
                <code className="rounded bg-ring/8 px-2 py-0.5 font-mono text-xs font-semibold text-ring">
                  {prompt.name}
                </code>
              </div>
              <h4 className="mb-1 text-sm font-semibold text-foreground">{prompt.title}</h4>
              <p className="mb-4 text-xs leading-relaxed text-muted-foreground">{prompt.description}</p>

              {/* Args */}
              <div>
                <h5 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Arguments
                </h5>
                <div className="space-y-1.5">
                  {prompt.args.map((arg) => (
                    <div key={arg.name} className="flex items-start gap-2">
                      <code className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground">
                        {arg.name}
                      </code>
                      <span className="font-mono text-[10px] text-muted-foreground/60">{arg.type}</span>
                      <span className="text-[10px] text-muted-foreground">&mdash; {arg.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Lint Rules ── */}
      <section>
        <SectionHeader id="lint-rules">Lint Rules</SectionHeader>
        <p className="mb-4 text-sm text-muted-foreground">
          The <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">lint_compliance</code> tool
          enforces these 5 enterprise architecture policy rules against system models.
        </p>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Rule
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {LINT_RULES.map((lr, idx) => (
                <tr key={lr.rule} className="border-b border-border/30 last:border-0">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-[10px] font-bold text-muted-foreground bg-muted">
                        {idx + 1}
                      </span>
                      <code className="rounded bg-ring/8 px-1.5 py-0.5 font-mono text-xs font-medium text-ring">
                        {lr.rule}
                      </code>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">{lr.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── IDE Configuration ── */}
      <section>
        <SectionHeader id="ide-config">IDE Configuration</SectionHeader>
        <p className="mb-4 text-sm text-muted-foreground">
          Add the following configuration to your IDE&apos;s MCP settings file. Works with{' '}
          <span className="font-semibold text-foreground">Cursor</span>,{' '}
          <span className="font-semibold text-foreground">Claude Desktop</span>, and any MCP-compatible IDE.
        </p>
        <div className="max-w-lg">
          <CodeBlock title="mcp.json" language="json" showPrompt={false}>
            {IDE_CONFIG}
          </CodeBlock>
        </div>
      </section>
    </div>
  );
}
