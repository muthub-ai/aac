'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { LayoutGrid, Puzzle, ShieldCheck, FileWarning, Wrench } from 'lucide-react';
import { NavBar } from '@/components/dashboard/nav-bar';
import { CatalogTabs, type CatalogTab } from '@/components/dashboard/catalog-tabs';
import { ApplicationCatalog } from '@/components/dashboard/application-catalog';
import { PatternCatalog } from '@/components/dashboard/pattern-catalog';
import { StandardsCatalog } from '@/components/dashboard/standards-catalog';
import { WaiverRegistry } from '@/components/dashboard/waiver-registry';
import { UtilitiesCatalog } from '@/components/dashboard/utilities-catalog';
import type { SystemData } from '@/types/system';
import type { StandardData } from '@/types/standard';
import type { WaiverData } from '@/types/waiver';

interface SystemsOverviewProps {
  systems: SystemData[];
  standards: StandardData[];
  waivers: WaiverData[];
}

const VALID_TABS = new Set(['applications', 'patterns', 'standards', 'waivers', 'utilities']);

export function SystemsOverview({ systems, standards, waivers }: SystemsOverviewProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab = tabParam && VALID_TABS.has(tabParam) ? tabParam : 'applications';
  const [activeTab, setActiveTab] = useState(initialTab);

  const tabs: CatalogTab[] = [
    { id: 'applications', label: 'Application Catalog', icon: LayoutGrid, count: systems.length },
    { id: 'patterns', label: 'Pattern Catalog', icon: Puzzle, count: 6 },
    { id: 'standards', label: 'Standards Catalog', icon: ShieldCheck, count: standards.length },
    { id: 'waivers', label: 'Waiver Registry', icon: FileWarning, count: waivers.length },
    { id: 'utilities', label: 'Utilities', icon: Wrench },
  ];

  return (
    <div className="relative min-h-dvh bg-background">
      {/* Gradient background layers (dark mode only) */}
      <div className="pointer-events-none absolute inset-0 opacity-0 dark:opacity-100 bg-gradient-to-br from-background via-card to-background" />
      <div className="pointer-events-none absolute inset-0 opacity-0 dark:opacity-100 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,var(--ring)/0.08,transparent)]" />
      <div className="pointer-events-none absolute inset-0 opacity-0 dark:opacity-100 bg-[radial-gradient(ellipse_60%_40%_at_80%_50%,var(--ring)/0.04,transparent)]" />

      <div className="relative">
        <NavBar />

        <CatalogTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <main className="mx-auto max-w-6xl px-6 pt-8 pb-16 sm:px-10">
          <div
            id={`tabpanel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            tabIndex={0}
            className="outline-none"
          >
            {activeTab === 'applications' && <ApplicationCatalog systems={systems} />}
            {activeTab === 'patterns' && <PatternCatalog />}
            {activeTab === 'standards' && <StandardsCatalog standards={standards} />}
            {activeTab === 'waivers' && <WaiverRegistry waivers={waivers} />}
            {activeTab === 'utilities' && <UtilitiesCatalog />}
          </div>
        </main>
      </div>
    </div>
  );
}
