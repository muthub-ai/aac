'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CircleUserRound } from 'lucide-react';
import { ThemeToggle } from '@/components/providers/theme-toggle';

export function NavBar() {
  return (
    <nav
      className="flex items-center justify-between px-6 py-5 sm:px-10"
      role="navigation"
      aria-label="Main navigation"
    >
      <Link href="/" className="flex items-center gap-3">
        <Image
          src="/logo.svg"
          alt="Architecture as Code logo"
          width={36}
          height={36}
          className="rounded-lg"
          priority
        />
        <span className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
          Architecture as Code
        </span>
      </Link>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="User profile"
        >
          <CircleUserRound className="h-5 w-5" strokeWidth={1.5} />
        </button>
      </div>
    </nav>
  );
}
