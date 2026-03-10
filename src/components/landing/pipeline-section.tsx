import { PipelineVisualization } from '@/components/dashboard/pipeline-visualization';

export function PipelineSection() {
  return (
    <section id="pipeline" className="border-t border-border bg-muted/30 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            CI/CD Pipeline
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Automated quality gates, parallel architecture validation, and deployment
            powered by GitHub Actions.
          </p>
        </div>

        <div className="mt-14">
          <PipelineVisualization />
        </div>
      </div>
    </section>
  );
}
