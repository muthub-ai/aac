'use client';

import { useState } from 'react';
import { Terminal, ChevronDown, ChevronUp, Hash } from 'lucide-react';
import type { CliCommand } from '@/types/utility';
import { cn } from '@/lib/utils';
import { CodeBlock } from './code-block';

interface CommandCardProps {
  command: CliCommand;
  defaultExpanded?: boolean;
}

export function CommandCard({ command, defaultExpanded = false }: CommandCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const argCount = command.arguments?.length ?? 0;
  const flagCount = command.flags?.length ?? 0;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border bg-card transition-shadow',
        expanded ? 'border-border shadow-sm' : 'border-border/70',
      )}
    >
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex w-full items-center gap-3 px-5 py-4 text-left transition-colors',
          expanded ? 'bg-muted/30' : 'hover:bg-muted/20',
        )}
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${command.name} command details`}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Terminal className="h-3.5 w-3.5 text-foreground" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <code className="font-mono text-sm font-semibold text-foreground">
              aac {command.name}
            </code>
            {!expanded && (
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {argCount > 0 && `${argCount} arg${argCount > 1 ? 's' : ''}`}
                {argCount > 0 && flagCount > 0 && ' \u00b7 '}
                {flagCount > 0 && `${flagCount} flag${flagCount > 1 ? 's' : ''}`}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{command.purpose}</p>
        </div>
        <div
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors',
            expanded ? 'bg-muted' : 'bg-transparent',
          )}
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
          )}
        </div>
      </button>

      {/* Expandable content */}
      <div
        className={cn(
          'grid transition-all duration-200 ease-in-out',
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div className="divide-y divide-border/50 border-t border-border/50">
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
                <div className="space-y-3">
                  {command.arguments.map((arg) => (
                    <div key={arg.name} className="flex items-start gap-3">
                      <code className="mt-0.5 shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                        {arg.required ? `<${arg.name}>` : `[${arg.name}]`}
                      </code>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                              arg.required
                                ? 'bg-destructive/10 text-destructive'
                                : 'bg-muted text-muted-foreground',
                            )}
                          >
                            {arg.required ? 'Required' : 'Optional'}
                          </span>
                          {arg.default && (
                            <span className="text-[10px] text-muted-foreground/60">
                              Default: <code className="font-mono">{arg.default}</code>
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {arg.description}
                        </p>
                        {arg.values && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {arg.values.map((v) => (
                              <code
                                key={v}
                                className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground/70"
                              >
                                {v}
                              </code>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Flags */}
            {command.flags && command.flags.length > 0 && (
              <div className="px-5 py-4">
                <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Flags
                </h4>
                <div className="space-y-3">
                  {command.flags.map((flag) => (
                    <div key={flag.long} className="flex items-start gap-3">
                      <div className="mt-0.5 flex shrink-0 items-center gap-1.5">
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                          {flag.long}
                        </code>
                        {flag.short && (
                          <code className="font-mono text-[10px] text-muted-foreground">
                            {flag.short}
                          </code>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">{flag.description}</p>
                        {(flag.argument || flag.default) && (
                          <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground/60">
                            {flag.argument && (
                              <span>
                                Accepts: <code className="font-mono">{flag.argument}</code>
                              </span>
                            )}
                            {flag.default && (
                              <span>
                                Default: <code className="font-mono">{flag.default}</code>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
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
                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground/70">
                      <Hash className="h-3 w-3 text-muted-foreground/40" strokeWidth={2} />
                      {example.title}
                    </p>
                    <CodeBlock>{example.command}</CodeBlock>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {command.notes && command.notes.length > 0 && (
              <div className="bg-muted/20 px-5 py-4">
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
        </div>
      </div>
    </div>
  );
}
