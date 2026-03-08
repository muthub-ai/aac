'use client';

import { Wrench } from 'lucide-react';
import { PlaceholderCatalog } from '@/components/dashboard/placeholder-catalog';

export function UtilitiesCatalog() {
  return (
    <PlaceholderCatalog
      icon={Wrench}
      title="Utilities"
      description="Developer tools, validators, diagram generators, and productivity helpers for architecture-as-code workflows."
    />
  );
}
