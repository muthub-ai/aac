import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-muted/50 py-10">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} muthub.org. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link href="/dashboard" className="transition-colors hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/dashboard?tab=waivers" className="transition-colors hover:text-foreground">
              Waivers
            </Link>
            <a href="#scorecard" className="transition-colors hover:text-foreground">
              Scorecard
            </a>
            <a href="#risk" className="transition-colors hover:text-foreground">
              Risk
            </a>
            <a href="#portfolio" className="transition-colors hover:text-foreground">
              Portfolio
            </a>
            <a href="#value-props" className="transition-colors hover:text-foreground">
              Why AaC
            </a>
            <a href="#lifecycle" className="transition-colors hover:text-foreground">
              Lifecycle
            </a>
            <a href="#metrics" className="transition-colors hover:text-foreground">
              Metrics
            </a>
            <a href="#pipeline" className="transition-colors hover:text-foreground">
              Pipeline
            </a>
            <a href="#utilities" className="transition-colors hover:text-foreground">
              Utilities
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
