'use client';

import { ExternalLink, Package } from 'lucide-react';
import type { UtilityInfo } from '@/types/utility';
import { UTILITY_COLORS } from '@/lib/data/utilities-data';
import { cn } from '@/lib/utils';
import { CodeBlock } from './code-block';

interface UtilityHeroProps {
  utility: UtilityInfo;
}

export function UtilityHero({ utility }: UtilityHeroProps) {
  const colors = UTILITY_COLORS[utility.color] ?? UTILITY_COLORS.ring;
  const Icon = utility.icon;
  const isAvailable = utility.status === 'available';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border',
        colors.border,
        'bg-gradient-to-br from-card via-card to-background',
      )}
    >
      {/* Decorative gradient overlay */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 opacity-30',
          `bg-[radial-gradient(ellipse_80%_50%_at_20%_-10%,var(--${utility.color})/0.15,transparent)]`,
        )}
      />

      <div className="relative px-6 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
          {/* Icon */}
          <div
            className={cn(
              'flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl',
              colors.bg,
            )}
          >
            <Icon className={cn('h-8 w-8', colors.text)} strokeWidth={1.6} />
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1 space-y-4">
            {/* Title row */}
            <div className="flex flex-wrap items-center gap-3">
              {utility.packageName && (
                <span className="font-mono text-xs font-medium text-muted-foreground">
                  {utility.packageName}
                </span>
              )}
              {isAvailable && utility.version && (
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                    'bg-success/10 text-success',
                  )}
                >
                  v{utility.version}
                </span>
              )}
              {utility.status === 'coming-soon' && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                    'bg-warning/10 text-warning',
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                  Coming Soon
                </span>
              )}
              {utility.status === 'beta' && (
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                    'bg-chart-5/10 text-chart-5',
                  )}
                >
                  Beta
                </span>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {utility.name}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {utility.tagline}
              </p>
            </div>

            {/* Install command */}
            {isAvailable && utility.installCommand && (
              <div className="max-w-lg">
                <CodeBlock>{utility.installCommand}</CodeBlock>
              </div>
            )}

            {/* Links */}
            {utility.links && utility.links.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {utility.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[11px] font-semibold',
                      'text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {link.label === 'npm' ? (
                      <Package className="h-3 w-3" strokeWidth={2} />
                    ) : (
                      <ExternalLink className="h-3 w-3" strokeWidth={2} />
                    )}
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
