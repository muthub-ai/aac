'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, X, ChevronDown } from 'lucide-react';
import { SystemCard } from '@/components/dashboard/system-card';
import type { SystemData } from '@/types/system';
import { cn } from '@/lib/utils';
import { PipelineVisualization } from './pipeline-visualization';

interface ApplicationCatalogProps {
  systems: SystemData[];
}

/** Collect all unique tags across all systems. */
function collectAllTags(systems: SystemData[]): string[] {
  const tagSet = new Set<string>();
  for (const sys of systems) {
    for (const tag of sys.tags) {
      tagSet.add(tag);
    }
  }
  return [...tagSet].sort();
}

/** Collect all unique dispositions across all systems. */
function collectDispositions(systems: SystemData[]): string[] {
  const dispositions = new Set<string>();
  for (const sys of systems) {
    if (sys.disposition) dispositions.add(sys.disposition);
  }
  return [...dispositions].sort();
}

export function ApplicationCatalog({ systems }: ApplicationCatalogProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedDisposition, setSelectedDisposition] = useState<string | null>(null);
  const [showDispositionDropdown, setShowDispositionDropdown] = useState(false);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const MAX_VISIBLE_TAGS = 8;

  const allTags = useMemo(() => collectAllTags(systems), [systems]);
  const allDispositions = useMemo(() => collectDispositions(systems), [systems]);

  const filteredSystems = useMemo(() => {
    let result = systems;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    // Tag filter
    if (selectedTags.size > 0) {
      result = result.filter((s) =>
        [...selectedTags].every((tag) => s.tags.includes(tag)),
      );
    }

    // Disposition filter
    if (selectedDisposition) {
      result = result.filter((s) => s.disposition === selectedDisposition);
    }

    return result;
  }, [systems, searchQuery, selectedTags, selectedDisposition]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags(new Set());
    setSelectedDisposition(null);
  };

  const hasActiveFilters = searchQuery.trim() || selectedTags.size > 0 || selectedDisposition;

  return (
    <div>
      {/* Pipeline Visualization */}
      <div className="mb-6">
        <PipelineVisualization />
      </div>

      {/* Search + Filters Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, description, or tag..."
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

          {/* Disposition dropdown */}
          {allDispositions.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowDispositionDropdown((o) => !o)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors',
                  'hover:bg-muted',
                  selectedDisposition ? 'border-ring/40 text-foreground' : 'text-muted-foreground',
                )}
              >
                {selectedDisposition ?? 'Disposition'}
                <ChevronDown
                  className={cn('h-3.5 w-3.5 transition-transform', showDispositionDropdown && 'rotate-180')}
                />
              </button>
              {showDispositionDropdown && (
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-lg border border-border bg-card py-1 shadow-lg">
                  <button
                    onClick={() => {
                      setSelectedDisposition(null);
                      setShowDispositionDropdown(false);
                    }}
                    className={cn(
                      'block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-muted',
                      !selectedDisposition ? 'font-medium text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    All
                  </button>
                  {allDispositions.map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        setSelectedDisposition(d);
                        setShowDispositionDropdown(false);
                      }}
                      className={cn(
                        'block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-muted',
                        selectedDisposition === d ? 'font-medium text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add System button */}
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-success/20 transition-all hover:bg-success-hover hover:shadow-success/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Add System
          </button>
        </div>

        {/* Tag pills */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Tags:</span>
            {(tagsExpanded ? allTags : allTags.slice(0, MAX_VISIBLE_TAGS)).map((tag) => (
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
            {allTags.length > MAX_VISIBLE_TAGS && (
              <button
                onClick={() => setTagsExpanded(!tagsExpanded)}
                className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted-foreground/15"
              >
                {tagsExpanded ? 'show less' : `+${allTags.length - MAX_VISIBLE_TAGS} more`}
              </button>
            )}
          </div>
        )}

        {/* Active filters summary */}
        {hasActiveFilters && (
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {filteredSystems.length} of {systems.length}{' '}
              {systems.length === 1 ? 'system' : 'systems'}
            </p>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs text-ring hover:text-ring/80"
            >
              <X className="h-3 w-3" />
              Clear filters
            </button>
          </div>
        )}

        {!hasActiveFilters && (
          <p className="text-sm text-muted-foreground">
            {systems.length} {systems.length === 1 ? 'system' : 'systems'} registered
          </p>
        )}
      </div>

      {/* Cards Grid */}
      {filteredSystems.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredSystems.map((system) => (
            <SystemCard
              key={system.id}
              system={system}
              onClick={() => router.push(`/systems/${system.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center">
          <Search className="mb-3 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">No systems match your filters</p>
          <button
            onClick={clearFilters}
            className="mt-2 text-xs text-ring hover:text-ring/80"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
