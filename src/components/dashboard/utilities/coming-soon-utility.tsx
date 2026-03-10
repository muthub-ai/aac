'use client';

import { Sparkles } from 'lucide-react';
import type { UtilityInfo } from '@/types/utility';
import { UTILITY_COLORS } from '@/lib/data/utilities-data';
import { cn } from '@/lib/utils';
import { UtilityHero } from './utility-hero';

interface ComingSoonUtilityProps {
  utility: UtilityInfo;
}

export function ComingSoonUtility({ utility }: ComingSoonUtilityProps) {
  const colors = UTILITY_COLORS[utility.color] ?? UTILITY_COLORS.ring;

  return (
    <div className="space-y-8">
      <UtilityHero utility={utility} />

      {/* Feature preview */}
      {utility.features && utility.features.length > 0 && (
        <div>
          <h3 className="mb-5 flex items-center gap-2 border-l-4 border-border pl-3 text-lg font-semibold tracking-tight text-foreground">
            Planned Capabilities
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {utility.features.map((feature, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                    colors.bg,
                  )}
                >
                  <Sparkles className={cn('h-3.5 w-3.5', colors.text)} strokeWidth={2} />
                </div>
                <p className="text-sm leading-relaxed text-foreground/80">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline teaser */}
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-12 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <utility.icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-semibold text-foreground">Under Active Development</p>
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
          We are working on this tool. Stay tuned for updates on our GitHub repository.
        </p>
      </div>
    </div>
  );
}
