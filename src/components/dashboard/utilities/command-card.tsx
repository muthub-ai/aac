'use client';

import { useState } from 'react';
import { Terminal, ChevronDown, ChevronUp, Hash } from 'lucide-react';
import type { CliCommand } from '@/types/utility';
import { cn } from '@/lib/utils';
import { CodeBlock } from './code-block';

interface CommandCardProps {
  command: CliCommand;
}

export function CommandCard({ command }: CommandCardProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex w-full items-center gap-3 px-5 py-4 text-left',
          'bg-gradient-to-r from-ring/8 to-transparent',
          'transition-colors hover:from-ring/12',
        )}
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${command.name} command details`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ring/10">
          <Terminal className="h-4 w-4 text-ring" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <code className="rounded-md bg-ring/10 px-2 py-0.5 font-mono text-sm font-bold text-ring">
              aac {command.name}
            </code>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{command.purpose}</p>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
        )}
      </button>

      {expanded && (
        <div className="divide-y divide-border/50">
          {/* Synopsis */}
          <div className="px-5 py-4">
            <h4 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Synopsis
            </h4>
            <CodeBlock>{command.synopsis.toLowerCase()}</CodeBlock>
          </div>

          {/* Description */}
          <div className="px-5 py-4">
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Description
            </h4>
            <p className="text-sm leading-relaxed text-foreground/80">{command.description}</p>
          </div>

          {/* Arguments */}
          {command.arguments && command.arguments.length > 0 && (
            <div className="px-5 py-4">
              <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Arguments
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Argument
                      </th>
                      <th className="pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Required
                      </th>
                      <th className="pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Description
                      </th>
                      <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Default
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {command.arguments.map((arg) => (
                      <tr key={arg.name} className="border-b border-border/30 last:border-0">
                        <td className="py-2.5 pr-4">
                          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                            {arg.required ? `<${arg.name}>` : `[${arg.name}]`}
                          </code>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold',
                              arg.required
                                ? 'bg-destructive/10 text-destructive'
                                : 'bg-muted text-muted-foreground',
                            )}
                          >
                            {arg.required ? 'Required' : 'Optional'}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-xs text-muted-foreground">
                          {arg.description}
                          {arg.values && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {arg.values.map((v) => (
                                <code
                                  key={v}
                                  className="rounded bg-ring/8 px-1.5 py-0.5 font-mono text-[10px] text-ring"
                                >
                                  {v}
                                </code>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 font-mono text-xs text-muted-foreground/70">
                          {arg.default ?? '\u2014'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Flags */}
          {command.flags && command.flags.length > 0 && (
            <div className="px-5 py-4">
              <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Flags
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Flag
                      </th>
                      <th className="pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Argument
                      </th>
                      <th className="pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Default
                      </th>
                      <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {command.flags.map((flag) => (
                      <tr key={flag.long} className="border-b border-border/30 last:border-0">
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-1.5">
                            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                              {flag.long}
                            </code>
                            {flag.short && (
                              <code className="font-mono text-[10px] text-muted-foreground">
                                {flag.short}
                              </code>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground/70">
                          {flag.argument ?? '\u2014'}
                        </td>
                        <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground/70">
                          {flag.default ?? '\u2014'}
                        </td>
                        <td className="py-2.5 text-xs text-muted-foreground">
                          {flag.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Examples */}
          <div className="px-5 py-4">
            <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Examples
            </h4>
            <div className="space-y-3">
              {command.examples.map((example, i) => (
                <div key={i}>
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground/80">
                    <Hash className="h-3 w-3 text-muted-foreground/50" strokeWidth={2} />
                    {example.title}
                  </p>
                  <CodeBlock>{example.command}</CodeBlock>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {command.notes && command.notes.length > 0 && (
            <div className="px-5 py-4">
              <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Notes
              </h4>
              <ul className="space-y-1.5">
                {command.notes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
