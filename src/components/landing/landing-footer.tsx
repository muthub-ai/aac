import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-muted/50 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row sm:px-10">
        <p>&copy; {new Date().getFullYear()} muthub.org. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-6">
          <Link
            href="/dashboard"
            className="transition-colors hover:text-foreground"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard?tab=waivers"
            className="transition-colors hover:text-foreground"
          >
            Waivers
          </Link>
          <a
            href="#value-props"
            className="transition-colors hover:text-foreground"
          >
            Why AaC
          </a>
          <a
            href="#lifecycle"
            className="transition-colors hover:text-foreground"
          >
            Lifecycle
          </a>
        </div>
      </div>
    </footer>
  );
}
