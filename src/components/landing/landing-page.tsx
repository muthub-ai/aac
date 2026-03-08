'use client';

import { LandingNav } from '@/components/landing/landing-nav';
import { HeroSection } from '@/components/landing/hero-section';
import { ValuePropsSection } from '@/components/landing/value-props-section';
import { LifecycleSection } from '@/components/landing/lifecycle-section';
import { MetricsSection } from '@/components/landing/metrics-section';
import { LandingFooter } from '@/components/landing/landing-footer';

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-background">
      <LandingNav />
      <HeroSection />
      <ValuePropsSection />
      <LifecycleSection />
      <MetricsSection />
      <LandingFooter />
    </div>
  );
}
