'use client';

import {
  CheckCircle2,
  AlertTriangle,
  Rocket,
  ExternalLink,
  Tag,
} from 'lucide-react';
import type { PatternData } from '@/types/pattern';
import { CATEGORY_COLORS, PATTERN_CATEGORIES } from '@/lib/data/mock-patterns';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface PatternDetailDrawerProps {
  pattern: PatternData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function maturityStyle(maturity: string): { bg: string; text: string } {
  switch (maturity) {
    case 'Production Ready':
      return { bg: 'bg-success/15', text: 'text-success' };
    case 'Beta':
      return { bg: 'bg-chart-5/15', text: 'text-chart-5' };
    case 'Draft':
      return { bg: 'bg-muted', text: 'text-muted-foreground' };
    case 'Deprecated':
      return { bg: 'bg-destructive/15', text: 'text-destructive' };
    default:
      return { bg: 'bg-muted', text: 'text-muted-foreground' };
  }
}

export function PatternDetailDrawer({
  pattern,
  open,
  onOpenChange,
}: PatternDetailDrawerProps) {
  if (!pattern) return null;

  const colors = CATEGORY_COLORS[pattern.category] ?? CATEGORY_COLORS.compute;
  const category = PATTERN_CATEGORIES.find((c) => c.id === pattern.category);
  const mStyle = maturityStyle(pattern.maturity);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-lg lg:max-w-xl"
        aria-label={`Details for ${pattern.name}`}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <SheetHeader className="space-y-3 border-b border-border pb-5">
          <div className="flex flex-wrap items-center gap-2">
            {category && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                  colors.bg,
                  colors.text,
                )}
              >
                {category.label}
              </span>
            )}
            <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {pattern.exposure}
            </span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
              v{pattern.version}
            </span>
          </div>
          <SheetTitle className="text-lg font-bold leading-tight">
            {pattern.name}
          </SheetTitle>
          <SheetDescription className="text-sm leading-relaxed">
            {pattern.description}
          </SheetDescription>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {pattern.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                <Tag className="h-2.5 w-2.5" strokeWidth={1.8} />
                {tag}
              </span>
            ))}
          </div>
        </SheetHeader>

        {/* ── Body (scrollable) ──────────────────────────────────── */}
        <div className="space-y-6 p-4">
          {/* Advantages & Considerations — two columns */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Advantages */}
            <div className="rounded-lg border border-success/20 bg-success/5 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-success">
                <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                Advantages
              </h4>
              <ul className="space-y-2">
                {pattern.advantages.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-xs leading-relaxed text-foreground"
                  >
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" strokeWidth={1.8} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Considerations */}
            <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warning">
                <AlertTriangle className="h-4 w-4" strokeWidth={2} />
                Considerations
              </h4>
              <ul className="space-y-2">
                {pattern.considerations.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-xs leading-relaxed text-foreground"
                  >
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" strokeWidth={1.8} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Getting Started — vertical stepper */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Getting Started
            </h4>
            <ol className="relative ml-4 border-l-2 border-border">
              {pattern.gettingStarted.map((s, idx) => (
                <li key={s.step} className={cn('relative pb-6 pl-6', idx === pattern.gettingStarted.length - 1 && 'pb-0')}>
                  {/* Step circle */}
                  <div className="absolute -left-[13px] top-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-ring bg-background text-[10px] font-bold text-ring">
                    {s.step}
                  </div>
                  <p className="pt-0.5 text-xs leading-relaxed text-foreground">
                    {s.title}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="mt-auto border-t border-border p-4">
          {/* Metadata row */}
          <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-muted-foreground">
              v{pattern.version}
            </span>
            <span
              className={cn(
                'rounded-md px-2 py-0.5 font-semibold',
                mStyle.bg,
                mStyle.text,
              )}
            >
              {pattern.maturity}
            </span>
            <span className="text-muted-foreground">
              Maintained by <strong className="font-semibold text-foreground">{pattern.maintainerTeam}</strong>
            </span>
          </div>

          {/* Action row */}
          <div className="flex items-center gap-3">
            {pattern.docsUrl && (
              <a
                href={pattern.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground',
                  'transition-colors hover:bg-muted',
                )}
              >
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.8} />
                View Docs
              </a>
            )}
            <button
              type="button"
              className={cn(
                'ml-auto inline-flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-semibold text-white',
                'bg-ring shadow-sm transition-all hover:bg-ring/90 hover:shadow-md',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2',
              )}
            >
              <Rocket className="h-3.5 w-3.5" strokeWidth={2} />
              Deploy Pattern
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
