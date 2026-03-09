'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Rocket,
  ExternalLink,
  Tag,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
} from 'lucide-react';
import plantumlEncoder from 'plantuml-encoder';
import type { PatternData, PatternDiagram } from '@/types/pattern';
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

function plantumlSvgUrl(source: string): string {
  const encoded = plantumlEncoder.encode(source);
  return `https://www.plantuml.com/plantuml/svg/${encoded}`;
}

// ── Diagram viewer with zoom + download ──────────────────────────────

interface DiagramViewerProps {
  diagrams: PatternDiagram[];
  patternName: string;
}

const ZOOM_STEP = 25;
const ZOOM_MIN = 25;
const ZOOM_MAX = 300;
const ZOOM_DEFAULT = 100;

function DiagramViewer({ diagrams, patternName }: DiagramViewerProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);

  const activeDiagram = diagrams[activeIdx];

  const svgUrl = useMemo(
    () => (activeDiagram ? plantumlSvgUrl(activeDiagram.plantumlSource) : ''),
    [activeDiagram],
  );

  const handleZoomIn = useCallback(
    () => setZoom((z) => Math.min(z + ZOOM_STEP, ZOOM_MAX)),
    [],
  );
  const handleZoomOut = useCallback(
    () => setZoom((z) => Math.max(z - ZOOM_STEP, ZOOM_MIN)),
    [],
  );
  const handleZoomReset = useCallback(() => setZoom(ZOOM_DEFAULT), []);

  const handleDownload = useCallback(() => {
    if (!svgUrl) return;
    const a = document.createElement('a');
    a.href = svgUrl;
    a.download = `${patternName.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}-${activeDiagram?.label.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}.svg`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [svgUrl, patternName, activeDiagram]);

  if (diagrams.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Architecture Diagrams
      </h4>

      {/* Tab selector */}
      <div className="flex gap-1 rounded-lg bg-muted/60 p-1">
        {diagrams.map((d, idx) => (
          <button
            key={d.label}
            type="button"
            onClick={() => {
              setActiveIdx(idx);
              setZoom(ZOOM_DEFAULT);
            }}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-[11px] font-medium transition-all',
              idx === activeIdx
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            aria-label={`View ${d.label} diagram`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Diagram viewport */}
      <div className="relative overflow-hidden rounded-lg border border-border bg-white dark:bg-zinc-950">
        {/* Zoom toolbar */}
        <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-lg border border-border/60 bg-background/90 px-1.5 py-1 shadow-sm backdrop-blur-sm">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= ZOOM_MIN}
            className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
          <span className="min-w-[3ch] text-center text-[10px] font-medium tabular-nums text-muted-foreground">
            {zoom}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= ZOOM_MAX}
            className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
          <div className="mx-0.5 h-4 w-px bg-border" />
          <button
            type="button"
            onClick={handleZoomReset}
            className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Fit to view"
          >
            <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Download diagram as SVG"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
        </div>

        {/* Scrollable diagram container */}
        <div className="overflow-auto p-4" style={{ maxHeight: '420px' }}>
          <div
            className="mx-auto transition-transform duration-150 ease-out"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={svgUrl}
              alt={`${activeDiagram?.label} diagram for ${patternName}`}
              className="mx-auto max-w-none"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </div>
  );
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
          {/* Architecture diagrams */}
          {pattern.diagrams.length > 0 && (
            <DiagramViewer
              diagrams={pattern.diagrams}
              patternName={pattern.name}
            />
          )}

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
