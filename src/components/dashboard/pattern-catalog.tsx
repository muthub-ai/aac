'use client';

import { useState, useMemo } from 'react';
import { Search, X, Puzzle } from 'lucide-react';
import { PatternSidebar, PatternCategoryStrip } from '@/components/dashboard/pattern-sidebar';
import { PatternCard } from '@/components/dashboard/pattern-card';
import { PatternDetailDrawer } from '@/components/dashboard/pattern-detail-drawer';
import { MOCK_PATTERNS } from '@/lib/data/mock-patterns';
import { cn } from '@/lib/utils';

const INITIAL_CARD_COUNT = 6;

/** Collect all unique tags across patterns. */
function collectAllTags(): string[] {
  const tagSet = new Set<string>();
  for (const p of MOCK_PATTERNS) {
    for (const t of p.tags) tagSet.add(t);
  }
  return [...tagSet].sort();
}

export function PatternCatalog() {
  const [categorySearch, setCategorySearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [activePatternId, setActivePatternId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const allTags = useMemo(() => collectAllTags(), []);

  const filteredPatterns = useMemo(() => {
    let result = MOCK_PATTERNS;

    // Category filter
    if (activeCategory) {
      result = result.filter((p) => p.category === activeCategory);
    }

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    // Tag filter
    if (selectedTags.size > 0) {
      result = result.filter((p) =>
        [...selectedTags].every((tag) => p.tags.includes(tag)),
      );
    }

    return result;
  }, [activeCategory, searchQuery, selectedTags]);

  const visiblePatterns = showAll
    ? filteredPatterns
    : filteredPatterns.slice(0, INITIAL_CARD_COUNT);
  const remaining = filteredPatterns.length - INITIAL_CARD_COUNT;

  const activePattern = MOCK_PATTERNS.find((p) => p.id === activePatternId) ?? null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const hasActiveFilters = searchQuery.trim() || selectedTags.size > 0 || activeCategory;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags(new Set());
    setActiveCategory(null);
    setShowAll(false);
  };

  return (
    <>
      {/* Mobile category strip */}
      <PatternCategoryStrip
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      <div className="mt-4 flex gap-8 lg:mt-0">
        {/* Sidebar (lg+) */}
        <PatternSidebar
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          searchQuery={categorySearch}
          onSearchChange={setCategorySearch}
        />

        {/* Main content */}
        <div className="min-w-0 flex-1">
          {/* Search + filter bar */}
          <div className="mb-5 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search patterns by name, description, or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  'w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-10 text-sm text-foreground',
                  'placeholder:text-muted-foreground/60',
                  'focus:border-ring/50 focus:outline-none focus:ring-2 focus:ring-ring/20',
                  'transition-colors',
                )}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Tag pills */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Tags:</span>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                      selectedTags.has(tag)
                        ? 'bg-ring text-white'
                        : 'bg-ring/10 text-ring hover:bg-ring/20',
                    )}
                  >
                    {tag}
                  </button>
                ))}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="ml-1 rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-medium text-destructive transition-colors hover:bg-destructive/20"
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Cards grid */}
          {visiblePatterns.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {visiblePatterns.map((pattern) => (
                  <PatternCard
                    key={pattern.id}
                    pattern={pattern}
                    isSelected={activePatternId === pattern.id}
                    onClick={() => setActivePatternId(pattern.id)}
                  />
                ))}
              </div>

              {/* Show more / less */}
              {remaining > 0 && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className={cn(
                      'rounded-lg border border-border bg-card px-5 py-2 text-xs font-medium text-muted-foreground',
                      'transition-colors hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {showAll ? 'Show less' : `Show ${remaining} more pattern${remaining > 1 ? 's' : ''}`}
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
              <Puzzle className="mb-3 h-10 w-10 text-muted-foreground/40" strokeWidth={1.4} />
              <p className="text-sm font-medium text-muted-foreground">No patterns found</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Try adjusting your search or filters.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-3 rounded-lg bg-muted px-4 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted-foreground/15"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Detail drawer */}
      <PatternDetailDrawer
        pattern={activePattern}
        open={activePatternId !== null}
        onOpenChange={(open) => {
          if (!open) setActivePatternId(null);
        }}
      />
    </>
  );
}
