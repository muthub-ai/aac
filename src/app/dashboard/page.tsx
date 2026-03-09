import { Suspense } from 'react';
import { SystemsOverview } from '@/components/dashboard/systems-overview';
import { loadSystems } from '@/lib/model/load-systems';
import { loadStandards } from '@/lib/model/load-standards';
import { loadWaivers } from '@/lib/model/load-waivers';

function DashboardFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const systems = loadSystems();
  const standards = loadStandards();
  const waivers = loadWaivers();
  return (
    <Suspense fallback={<DashboardFallback />}>
      <SystemsOverview systems={systems} standards={standards} waivers={waivers} />
    </Suspense>
  );
}
