'use client';

import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { SystemCard } from '@/components/dashboard/system-card';
import type { SystemData } from '@/types/system';

interface ApplicationCatalogProps {
  systems: SystemData[];
}

export function ApplicationCatalog({ systems }: ApplicationCatalogProps) {
  const router = useRouter();

  return (
    <div>
      {/* Section Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {systems.length} {systems.length === 1 ? 'system' : 'systems'} registered
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-success/20 transition-all hover:bg-success-hover hover:shadow-success/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Add System
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {systems.map((system) => (
          <SystemCard
            key={system.id}
            system={system}
            onClick={() => router.push(`/systems/${system.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
