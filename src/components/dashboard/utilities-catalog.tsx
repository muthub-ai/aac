'use client';

import { useState } from 'react';
import { UTILITIES } from '@/lib/data/utilities-data';
import { UtilitySidebar, UtilityMobileStrip } from '@/components/dashboard/utilities/utility-sidebar';
import { CliDocumentation } from '@/components/dashboard/utilities/cli-documentation';
import { McpDocumentation } from '@/components/dashboard/utilities/mcp-documentation';
import { ComingSoonUtility } from '@/components/dashboard/utilities/coming-soon-utility';

export function UtilitiesCatalog() {
  const [activeUtility, setActiveUtility] = useState('cli');

  const utility = UTILITIES.find((u) => u.id === activeUtility);

  return (
    <>
      <UtilityMobileStrip active={activeUtility} onChange={setActiveUtility} />

      <div className="mt-4 flex gap-8 lg:mt-0">
        <UtilitySidebar active={activeUtility} onChange={setActiveUtility} />

        <div className="min-w-0 flex-1">
          {activeUtility === 'cli' && <CliDocumentation />}
          {activeUtility === 'mcp-server' && <McpDocumentation />}
          {activeUtility !== 'cli' && activeUtility !== 'mcp-server' && utility && <ComingSoonUtility utility={utility} />}
        </div>
      </div>
    </>
  );
}
