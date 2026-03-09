'use client';

import { Search, Layers } from 'lucide-react';
import { PATTERN_CATEGORIES, MOCK_PATTERNS } from '@/lib/data/mock-patterns';
import { cn } from '@/lib/utils';

interface PatternSidebarProps {
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

function countByCategory(category: string): number {
  return MOCK_PATTERNS.filter((p) => p.category === category).length;
}

export function PatternSidebar({
  activeCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
}: PatternSidebarProps) {
  const filteredCategories = PATTERN_CATEGORIES.filter((cat) =>
    cat.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <aside
      className="hidden w-[220px] shrink-0 lg:block"
      aria-label="Pattern categories"
    >
      <div className="sticky top-24 space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Find a category"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              'w-full rounded-lg border border-border bg-card py-2 pl-8 pr-3 text-xs text-foreground',
              'placeholder:text-muted-foreground/50',
              'focus:border-ring/50 focus:outline-none focus:ring-2 focus:ring-ring/20',
              'transition-colors',
            )}
          />
        </div>

        {/* Category list */}
        <nav className="space-y-0.5">
          {/* All Patterns */}
          <button
            type="button"
            onClick={() => onCategoryChange(null)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-colors',
              activeCategory === null
                ? 'border-l-2 border-ring bg-ring/8 font-semibold text-foreground'
                : 'border-l-2 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Layers className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            <span className="flex-1">All Patterns</span>
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {MOCK_PATTERNS.length}
            </span>
          </button>

          {filteredCategories.map((cat) => {
            const Icon = cat.icon;
            const count = countByCategory(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategoryChange(cat.id)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-colors',
                  activeCategory === cat.id
                    ? 'border-l-2 border-ring bg-ring/8 font-semibold text-foreground'
                    : 'border-l-2 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                <span className="flex-1">{cat.label}</span>
                {count > 0 && (
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

/* ── Mobile / Tablet horizontal strip (shown below lg) ─────────────── */

export function PatternCategoryStrip({
  activeCategory,
  onCategoryChange,
}: Pick<PatternSidebarProps, 'activeCategory' | 'onCategoryChange'>) {
  return (
    <div
      className="flex gap-1.5 overflow-x-auto pb-1 lg:hidden"
      role="tablist"
      aria-label="Pattern categories"
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeCategory === null}
        onClick={() => onCategoryChange(null)}
        className={cn(
          'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
          activeCategory === null
            ? 'bg-ring text-white'
            : 'bg-muted text-muted-foreground hover:bg-muted-foreground/15',
        )}
      >
        <Layers className="h-3 w-3" strokeWidth={1.8} />
        All
      </button>
      {PATTERN_CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        return (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={activeCategory === cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              activeCategory === cat.id
                ? 'bg-ring text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted-foreground/15',
            )}
          >
            <Icon className="h-3 w-3" strokeWidth={1.8} />
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
