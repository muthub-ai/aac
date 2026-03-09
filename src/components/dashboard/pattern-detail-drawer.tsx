'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ArrowLeft,
  Box,
  ShieldAlert,
  Gauge,
  DollarSign,
  Lightbulb,
} from 'lucide-react';
import plantumlEncoder from 'plantuml-encoder';
import type { PatternData, PatternDiagram } from '@/types/pattern';
import { CATEGORY_COLORS, PATTERN_CATEGORIES } from '@/lib/data/mock-patterns';
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

// ── Animation variants ───────────────────────────────────────────────

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
} as const;

const panelVariants = {
  hidden: { x: '100%', opacity: 0.5 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      damping: 30,
      stiffness: 300,
      mass: 0.8,
      when: 'beforeChildren' as const,
      staggerChildren: 0.06,
    },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: {
      type: 'spring' as const,
      damping: 35,
      stiffness: 400,
      mass: 0.6,
    },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, damping: 25, stiffness: 250 },
  },
};

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
    <motion.div variants={sectionVariants} className="space-y-3">
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

      {/* Diagram viewport — taller for 75% panel */}
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
        <div className="overflow-auto p-4" style={{ maxHeight: '560px' }}>
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
    </motion.div>
  );
}

// ── Main detail panel ────────────────────────────────────────────────

export function PatternDetailDrawer({
  pattern,
  open,
  onOpenChange,
}: PatternDetailDrawerProps) {
  // Lock body scroll when panel is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onOpenChange]);

  return (
    <AnimatePresence mode="wait">
      {open && pattern && (
        <PatternDetailPanel
          key={pattern.id}
          pattern={pattern}
          onClose={() => onOpenChange(false)}
        />
      )}
    </AnimatePresence>
  );
}

function PatternDetailPanel({
  pattern,
  onClose,
}: {
  pattern: PatternData;
  onClose: () => void;
}) {
  const colors = CATEGORY_COLORS[pattern.category] ?? CATEGORY_COLORS.compute;
  const category = PATTERN_CATEGORIES.find((c) => c.id === pattern.category);
  const mStyle = maturityStyle(pattern.maturity);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.2 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <motion.aside
        role="dialog"
        aria-label={`Details for ${pattern.name}`}
        aria-modal="true"
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-[75vw] max-w-[1200px] flex-col',
          'border-l border-border bg-background shadow-2xl',
          'overflow-hidden',
        )}
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* ── Sticky top bar with back button ──────────────────── */}
        <motion.div
          className="flex shrink-0 items-center gap-3 border-b border-border bg-background/95 px-6 py-3 backdrop-blur-sm"
          variants={sectionVariants}
        >
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'group/back inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium',
              'text-muted-foreground transition-all',
              'hover:bg-muted hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            )}
            aria-label="Back to pattern catalog"
          >
            <motion.span
              className="inline-flex"
              whileHover={{ x: -3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            </motion.span>
            Back to Catalog
          </button>

          <div className="ml-auto flex items-center gap-2">
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
            <span
              className={cn(
                'rounded-md px-2 py-0.5 text-[10px] font-semibold',
                mStyle.bg,
                mStyle.text,
              )}
            >
              {pattern.maturity}
            </span>
          </div>
        </motion.div>

        {/* ── Scrollable content ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl space-y-8 px-8 py-8">

            {/* ── Header section ─────────────────────────────── */}
            <motion.div variants={sectionVariants} className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {pattern.exposure}
                </span>
                <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                  v{pattern.version}
                </span>
              </div>
              <h2 className="text-2xl font-bold leading-tight text-foreground">
                {pattern.name}
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {pattern.description}
              </p>

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
            </motion.div>

            {/* ── Architecture Overview ───────────────────────── */}
            {pattern.architectureOverview && (
              <motion.div variants={sectionVariants}>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Architecture Overview
                </h3>
                <div className="space-y-3 rounded-lg border border-border bg-card p-5">
                  {pattern.architectureOverview.split('\n\n').map((para, i) => (
                    <p key={i} className="text-sm leading-relaxed text-foreground">
                      {para}
                    </p>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Architecture diagrams ──────────────────────── */}
            {pattern.diagrams.length > 0 && (
              <DiagramViewer
                diagrams={pattern.diagrams}
                patternName={pattern.name}
              />
            )}

            {/* ── Design Considerations ──────────────────────── */}
            {pattern.designConsiderations.length > 0 && (
              <motion.div variants={sectionVariants}>
                <h3 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Lightbulb className="h-4 w-4" strokeWidth={1.8} />
                  Design Considerations
                </h3>
                <div className="space-y-3">
                  {pattern.designConsiderations.map((dc) => (
                    <div key={dc.title} className="rounded-lg border border-border bg-card p-4">
                      <h4 className="mb-1.5 text-sm font-semibold text-foreground">
                        {dc.title}
                      </h4>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {dc.description}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Products Used ───────────────────────────────── */}
            {pattern.productsUsed.length > 0 && (
              <motion.div variants={sectionVariants}>
                <h3 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Box className="h-4 w-4" strokeWidth={1.8} />
                  Products Used
                </h3>
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pattern.productsUsed.map((p, i) => (
                        <tr key={p.name} className={cn('border-b border-border/50 last:border-0', i % 2 === 0 ? 'bg-card' : 'bg-muted/20')}>
                          <td className="px-4 py-2.5 font-medium text-foreground">{p.name}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{p.role}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ── Non-Functional Requirements ─────────────────── */}
            {pattern.nonFunctionalRequirements.length > 0 && (
              <motion.div variants={sectionVariants}>
                <h3 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Gauge className="h-4 w-4" strokeWidth={1.8} />
                  Non-Functional Requirements
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {pattern.nonFunctionalRequirements.map((nfr) => (
                    <div key={nfr.metric} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{nfr.metric}</p>
                        <p className="mt-0.5 text-sm font-semibold text-foreground">{nfr.target}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Advantages & Considerations ────────────────── */}
            <motion.div
              variants={sectionVariants}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              {/* Advantages */}
              <div className="rounded-lg border border-success/20 bg-success/5 p-5">
                <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-success">
                  <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                  Advantages
                </h4>
                <ul className="space-y-2.5">
                  {pattern.advantages.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2 text-sm leading-relaxed text-foreground"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" strokeWidth={1.8} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Considerations */}
              <div className="rounded-lg border border-warning/20 bg-warning/5 p-5">
                <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warning">
                  <AlertTriangle className="h-4 w-4" strokeWidth={2} />
                  Considerations
                </h4>
                <ul className="space-y-2.5">
                  {pattern.considerations.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2 text-sm leading-relaxed text-foreground"
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" strokeWidth={1.8} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* ── Constraints ─────────────────────────────────── */}
            {pattern.constraints.length > 0 && (
              <motion.div variants={sectionVariants}>
                <h3 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <ShieldAlert className="h-4 w-4" strokeWidth={1.8} />
                  Constraints & Limitations
                </h3>
                <ul className="space-y-2 rounded-lg border border-border bg-card p-5">
                  {pattern.constraints.map((c) => (
                    <li key={c} className="flex gap-2 text-sm leading-relaxed text-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                      {c}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* ── Cost Profile ────────────────────────────────── */}
            {pattern.costProfile && (
              <motion.div variants={sectionVariants}>
                <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <DollarSign className="h-4 w-4" strokeWidth={1.8} />
                  Cost Profile
                </h3>
                <div className="rounded-lg border border-border bg-card p-5">
                  <p className="text-sm leading-relaxed text-foreground">
                    {pattern.costProfile}
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── Getting Started — vertical stepper ──────────── */}
            <motion.div variants={sectionVariants}>
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
                    <p className="pt-0.5 text-sm leading-relaxed text-foreground">
                      {s.title}
                    </p>
                  </li>
                ))}
              </ol>
            </motion.div>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        <motion.div
          variants={sectionVariants}
          className="shrink-0 border-t border-border bg-background/95 px-8 py-4 backdrop-blur-sm"
        >
          {/* Metadata row */}
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px]">
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
        </motion.div>
      </motion.aside>
    </>
  );
}
