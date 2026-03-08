'use client';

import { ShieldCheck } from 'lucide-react';
import { PlaceholderCatalog } from '@/components/dashboard/placeholder-catalog';

export function StandardsCatalog() {
  return (
    <PlaceholderCatalog
      icon={ShieldCheck}
      title="Standards Catalog"
      description="Organization-wide architecture standards, governance policies, and compliance rules. Ensure consistency across all systems."
    />
  );
}
