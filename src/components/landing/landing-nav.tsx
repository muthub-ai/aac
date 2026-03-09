'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CircleHelp, BookOpen } from 'lucide-react';
import { ThemeToggle } from '@/components/providers/theme-toggle';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Application Systems', href: '/dashboard?tab=applications' },
  { label: 'Patterns Catalog', href: '/dashboard?tab=patterns' },
  { label: 'Standards Catalog', href: '/dashboard?tab=standards' },
  { label: 'Waiver Registry', href: '/dashboard?tab=waivers' },
  { label: 'Utilities', href: '/dashboard?tab=utilities' },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        'border-b bg-background/80 backdrop-blur-lg',
        scrolled ? 'border-border shadow-sm' : 'border-transparent',
      )}
    >
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 sm:px-10"
        aria-label="Main navigation"
      >
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="Architecture as Code logo"
            width={32}
            height={32}
            className="rounded-lg"
            priority
          />
          <span className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
            Architecture as Code
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <a
            href="https://github.com/muthub-ai/aac/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Help & Issues"
          >
            <CircleHelp className="h-4 w-4" strokeWidth={1.8} />
          </a>
          <a
            href="https://deepwiki.com/muthub-ai/aac"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Documentation"
          >
            <BookOpen className="h-4 w-4" strokeWidth={1.8} />
          </a>
        </div>
      </nav>
    </header>
  );
}
