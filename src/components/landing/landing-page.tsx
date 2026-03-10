import { LandingNav } from '@/components/landing/landing-nav';
import { HeroSection } from '@/components/landing/hero-section';
import { ExecutiveScorecard } from '@/components/landing/executive-scorecard';
import { RiskCompliance } from '@/components/landing/risk-compliance';
import { PortfolioSummary } from '@/components/landing/portfolio-summary';
import { ValuePropsSection } from '@/components/landing/value-props-section';
import { LifecycleSection } from '@/components/landing/lifecycle-section';
import { MetricsSection } from '@/components/landing/metrics-section';
import { PipelineSection } from '@/components/landing/pipeline-section';
import { UtilitiesSection } from '@/components/landing/utilities-section';
import { LandingFooter } from '@/components/landing/landing-footer';
import type { ExecutiveMetrics } from '@/lib/metrics/compute-metrics';

interface LandingPageProps {
  metrics: ExecutiveMetrics;
}

export function LandingPage({ metrics }: LandingPageProps) {
  return (
    <div className="min-h-dvh bg-background">
      <LandingNav />
      <HeroSection hero={metrics.hero} trendHistory={metrics.trendHistory} />
      <ExecutiveScorecard scorecard={metrics.scorecard} trendHistory={metrics.trendHistory} />
      <RiskCompliance riskByDomain={metrics.riskByDomain} standardsByDomain={metrics.standardsByDomain} />
      <PortfolioSummary
        systemRows={metrics.systemRows}
        patternMaturity={metrics.patternMaturity}
        waiverFunnel={metrics.waiverFunnel}
      />
      <ValuePropsSection />
      <LifecycleSection />
      <MetricsSection liveMetrics={metrics.liveMetrics} trendHistory={metrics.trendHistory} />
      <PipelineSection />
      <UtilitiesSection />
      <LandingFooter />
    </div>
  );
}
