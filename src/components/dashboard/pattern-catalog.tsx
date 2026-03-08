'use client';

import { Puzzle } from 'lucide-react';
import { PlaceholderCatalog } from '@/components/dashboard/placeholder-catalog';

export function PatternCatalog() {
  return (
    <PlaceholderCatalog
      icon={Puzzle}
      title="Pattern Catalog"
      description="Reusable architecture patterns, templates, and reference implementations for common system designs. Define once, apply everywhere."
    />
  );
}
