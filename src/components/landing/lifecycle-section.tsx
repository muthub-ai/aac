'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Compass,
  Hammer,
  FlaskConical,
  BadgeCheck,
  Rocket,
} from 'lucide-react';

const steps = [
  {
    icon: Compass,
    phase: 'Plan',
    title: 'Define',
    description:
      'Understanding requirements, reading specifications, and designing the architecture.',
  },
  {
    icon: Hammer,
    phase: 'Create',
    title: 'Build',
    description:
      'Authoring the AaC for standards, archetypes, and application components using IDEs or visual tools, followed by local validation.',
  },
  {
    icon: FlaskConical,
    phase: 'Verify',
    title: 'Test',
    description:
      'Running automated schema validations and unit tests within CI pipelines to ensure components align with enterprise standards.',
  },
  {
    icon: BadgeCheck,
    phase: 'Release',
    title: 'Accept',
    description:
      'Executing architecture compliance validation, automatically generating artifacts (Markdowns, Diagrams), and gating approvals via PRs.',
  },
  {
    icon: Rocket,
    phase: 'Release',
    title: 'Deploy',
    description:
      'Publishing the approved architecture to Policy-as-Code pipelines, updating the enterprise catalog, and notifying stakeholders.',
  },
];

const stepVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.12, duration: 0.45, ease: 'easeOut' as const },
  }),
};

export function LifecycleSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="lifecycle" className="border-t border-border bg-muted/50 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            The Operational Lifecycle
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            A repeatable, automated workflow from architecture design to production deployment.
          </p>
        </div>

        <div ref={ref} className="mt-14">
          {/* Desktop: horizontal timeline */}
          <div className="hidden lg:block">
            <div className="relative flex items-start justify-between">
              {/* Connecting line */}
              <div className="absolute left-[10%] right-[10%] top-6 h-px bg-border" />

              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={`${step.phase}-${step.title}`}
                    custom={i}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    variants={stepVariants}
                    className="relative flex w-1/5 flex-col items-center text-center"
                  >
                    <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-ring bg-card shadow-sm">
                      <Icon className="h-5 w-5 text-ring" strokeWidth={1.8} />
                    </div>
                    <div className="mt-4">
                      <span className="text-xs font-semibold uppercase tracking-wider text-ring">
                        {step.phase}
                      </span>
                      <h3 className="mt-1 text-sm font-semibold text-foreground">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Mobile/Tablet: vertical timeline */}
          <div className="lg:hidden">
            <div className="relative space-y-8 pl-8">
              {/* Vertical line */}
              <div className="absolute bottom-0 left-[15px] top-0 w-px bg-border" />

              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={`${step.phase}-${step.title}-mobile`}
                    custom={i}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    variants={stepVariants}
                    className="relative"
                  >
                    <div className="absolute -left-8 flex h-8 w-8 items-center justify-center rounded-full border-2 border-ring bg-card shadow-sm">
                      <Icon className="h-4 w-4 text-ring" strokeWidth={1.8} />
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                      <span className="text-xs font-semibold uppercase tracking-wider text-ring">
                        {step.phase}
                      </span>
                      <h3 className="mt-1 text-sm font-semibold text-foreground">
                        {step.title}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
