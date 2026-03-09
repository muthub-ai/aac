import fs from 'node:fs';
import path from 'node:path';

import { LandingPage } from '@/components/landing/landing-page';
import { loadSystems } from '@/lib/model/load-systems';
import { loadStandards } from '@/lib/model/load-standards';
import { loadWaivers } from '@/lib/model/load-waivers';
import { MOCK_PATTERNS } from '@/lib/data/mock-patterns';
import { computeExecutiveMetrics, type TrendPoint } from '@/lib/metrics/compute-metrics';

function loadTrendHistory(): TrendPoint[] {
  const filePath = path.join(process.cwd(), 'data', 'trend-history.json');
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as TrendPoint[];
}

export default function Home() {
  const systems = loadSystems();
  const standards = loadStandards();
  const waivers = loadWaivers();
  const trendHistory = loadTrendHistory();
  const patternCount = MOCK_PATTERNS.length;

  const metrics = computeExecutiveMetrics(systems, standards, waivers, patternCount, trendHistory);

  return <LandingPage metrics={metrics} />;
}
