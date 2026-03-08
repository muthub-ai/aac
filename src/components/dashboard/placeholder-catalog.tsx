'use client';

import type { LucideIcon } from 'lucide-react';

interface PlaceholderCatalogProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function PlaceholderCatalog({ icon: Icon, title, description }: PlaceholderCatalogProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-card">
        <Icon className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h2 className="mb-2 text-lg font-semibold text-foreground">
        {title}
      </h2>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <div className="mt-8 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-warning" />
        Coming soon
      </div>
    </div>
  );
}
