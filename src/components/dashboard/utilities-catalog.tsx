'use client';

import { useState } from 'react';
import { UTILITIES } from '@/lib/data/utilities-data';
import { UtilitySidebar, UtilityMobileStrip } from '@/components/dashboard/utilities/utility-sidebar';
import { CliDocumentation } from '@/components/dashboard/utilities/cli-documentation';
import { McpDocumentation } from '@/components/dashboard/utilities/mcp-documentation';
import { PolicyEngineDocumentation } from '@/components/dashboard/utilities/policy-engine-documentation';
import { CopilotSpacesDocumentation } from '@/components/dashboard/utilities/copilot-spaces-documentation';
import { CiPipelineDocumentation } from '@/components/dashboard/utilities/ci-pipeline-documentation';
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
          {activeUtility === 'policy-engine' && <PolicyEngineDocumentation />}
          {activeUtility === 'copilot-spaces' && <CopilotSpacesDocumentation />}
          {activeUtility === 'ci-pipeline' && <CiPipelineDocumentation />}
          {utility && !['cli', 'mcp-server', 'policy-engine', 'copilot-spaces', 'ci-pipeline'].includes(activeUtility) && <ComingSoonUtility utility={utility} />}
        </div>
      </div>
    </>
  );
}
