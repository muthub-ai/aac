'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  FileCode2,
  ShieldCheck,
  GitCompare,
  ArrowLeftRight,
  BookOpen,
  Users,
} from 'lucide-react';

const props = [
  {
    icon: FileCode2,
    title: 'Machine-Readable & Version-Controlled',
    description:
      'Architecture is expressed in parseable formats (like YAML, JSON, or C4/Structurizr DSL) and versioned in Git to establish clear ownership and an audit trail.',
  },
  {
    icon: ShieldCheck,
    title: 'Executable Guardrails',
    description:
      'Policies and constraints are codified as rules that execute automatically in CI/CD pipelines, providing clear pass/fail outputs.',
  },
  {
    icon: GitCompare,
    title: 'Model-to-Runtime Parity',
    description:
      'Continuously detects drift between the "as-designed" architecture and the "as-built" infrastructure by comparing model facts to runtime configurations.',
  },
  {
    icon: ArrowLeftRight,
    title: 'Shift-Left Governance',
    description:
      'Architecture checks are run early in pipelines and platform gates to block non-compliant releases before they reach production environments.',
  },
  {
    icon: BookOpen,
    title: 'Decisions as Code',
    description:
      'Significant architectural decisions are recorded as Architecture Decision Records (ADRs) right next to the code to preserve rationale.',
  },
  {
    icon: Users,
    title: 'Human Oversight + Automation',
    description:
      'Combines expert architectural review with automated validation, ensuring human judgment guides decisions while automation handles repeatability and scale.',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: 'easeOut' as const },
  }),
};

export function ValuePropsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="value-props" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Why Architecture as Code?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Replacing manual architecture reviews with automated, continuously
            enforced architectural governance.
          </p>
        </div>

        <div
          ref={ref}
          className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          {props.map((prop, i) => {
            const Icon = prop.icon;
            return (
              <motion.div
                key={prop.title}
                custom={i}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                variants={cardVariants}
                className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-ring/10">
                  <Icon className="h-5 w-5 text-ring" strokeWidth={1.8} />
                </div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">
                  {prop.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {prop.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
