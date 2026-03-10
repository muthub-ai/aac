'use client';

import { Terminal, ArrowRight } from 'lucide-react';
import { UTILITIES } from '@/lib/data/utilities-data';
import {
  QUICK_START_STEPS,
  CLI_COMMANDS,
  EXIT_CODES,
  CONFIG_FIELDS,
  DEFAULT_AACRC,
  SCHEMA_TYPES,
} from '@/lib/data/cli-data';
import { cn } from '@/lib/utils';
import { UtilityHero } from './utility-hero';
import { SectionNav, type NavSection } from './section-nav';
import { CodeBlock } from './code-block';
import { CommandCard } from './command-card';

const CLI_UTILITY = UTILITIES.find((u) => u.id === 'cli')!;

const SECTIONS: NavSection[] = [
  { id: 'quick-start', label: 'Quick Start' },
  { id: 'commands', label: 'Commands' },
  { id: 'exit-codes', label: 'Exit Codes' },
  { id: 'configuration', label: 'Configuration' },
  { id: 'caching', label: 'Schema Caching' },
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

export function CliDocumentation() {
  return (
    <div className="space-y-10">
      <UtilityHero utility={CLI_UTILITY} />

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

      {/* ── Commands ── */}
      <section>
        <SectionHeader id="commands">Command Reference</SectionHeader>
        <div className="space-y-5">
          {CLI_COMMANDS.map((cmd) => (
            <CommandCard key={cmd.name} command={cmd} />
          ))}
        </div>
      </section>

      {/* ── Exit Codes ── */}
      <section>
        <SectionHeader id="exit-codes">Exit Codes</SectionHeader>
        <p className="mb-4 text-sm text-muted-foreground">
          POSIX-compliant exit codes for CI/CD pipeline integration. Use these to handle failures programmatically.
        </p>
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
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {EXIT_CODES.map((ec) => (
                <tr key={ec.code} className="border-b border-border/30 last:border-0">
                  <td className="px-5 py-3.5">
                    <code
                      className={cn(
                        'inline-flex h-7 w-7 items-center justify-center rounded-md font-mono text-xs font-bold',
                        ec.code === 0
                          ? 'bg-success/10 text-success'
                          : ec.code === 1
                            ? 'bg-warning/10 text-warning'
                            : 'bg-destructive/10 text-destructive',
                      )}
                    >
                      {ec.code}
                    </code>
                  </td>
                  <td className="px-5 py-3.5">
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-foreground">
                      {ec.label}
                    </code>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">{ec.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Configuration ── */}
      <section>
        <SectionHeader id="configuration">Configuration</SectionHeader>
        <p className="mb-4 text-sm text-muted-foreground">
          The <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">.aacrc</code> file
          in your project root configures the CLI. Created automatically by{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">aac init</code>.
        </p>

        {/* Config fields table */}
        <div className="mb-5 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Field
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Type
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Default
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {CONFIG_FIELDS.map((cf) => (
                <tr key={cf.field} className="border-b border-border/30 last:border-0">
                  <td className="px-5 py-3.5">
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                      {cf.field}
                    </code>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{cf.type}</td>
                  <td className="max-w-[200px] px-5 py-3.5">
                    <code className="break-all font-mono text-[10px] text-muted-foreground/70">
                      {cf.default}
                    </code>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">{cf.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Default .aacrc */}
        <CodeBlock title=".aacrc" language="json" showPrompt={false}>
          {DEFAULT_AACRC}
        </CodeBlock>
      </section>

      {/* ── Schema Caching ── */}
      <section>
        <SectionHeader id="caching">Schema Caching</SectionHeader>
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            The CLI uses <span className="font-semibold text-foreground">ETag-based HTTP caching</span> to
            minimize network requests. Schemas are cached locally and only re-downloaded when the remote version
            changes.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4">
              <h4 className="mb-2 text-xs font-semibold text-foreground">Cache Location</h4>
              <code className="block rounded-lg bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground">
                ~/.aac/cache/schemas/
              </code>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <h4 className="mb-2 text-xs font-semibold text-foreground">Authenticated Access</h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Set <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">GITHUB_TOKEN</code> env
                variable for private schema repositories.
              </p>
            </div>
          </div>

          {/* Schema type mapping */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/50 px-5 py-2.5">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Schema Type Mapping
              </h4>
            </div>
            <div className="divide-y divide-border/30">
              {SCHEMA_TYPES.map((st) => (
                <div key={st.type} className="flex items-center gap-4 px-5 py-2.5">
                  <code className="w-20 shrink-0 rounded bg-ring/8 px-1.5 py-0.5 text-center font-mono text-xs font-medium text-ring">
                    {st.type}
                  </code>
                  <Terminal className="h-3 w-3 shrink-0 text-muted-foreground/40" strokeWidth={1.5} />
                  <code className="font-mono text-xs text-muted-foreground">{st.file}</code>
                  {st.note && (
                    <span className="ml-auto text-[10px] text-muted-foreground/60">{st.note}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cache behavior */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h4 className="mb-3 text-xs font-semibold text-foreground">Cache Behavior</h4>
            <div className="space-y-2">
              {[
                { scenario: 'Cached + ETag matches', behavior: 'Returns cached schema instantly (no download)', color: 'success' },
                { scenario: 'Cached + ETag differs', behavior: 'Downloads new schema, updates cache', color: 'ring' },
                { scenario: 'Cached + offline', behavior: 'Falls back to cached schema with a warning', color: 'warning' },
                { scenario: 'No cache + offline', behavior: 'Exits with error (code 1)', color: 'destructive' },
              ].map((item) => (
                <div key={item.scenario} className="flex items-start gap-3">
                  <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', `bg-${item.color}`)} />
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-foreground">{item.scenario}</span>
                    <span className="mx-1.5 text-xs text-muted-foreground/50">&mdash;</span>
                    <span className="text-xs text-muted-foreground">{item.behavior}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
