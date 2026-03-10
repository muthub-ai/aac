'use client';

import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  children: string;
  language?: string;
  title?: string;
  showPrompt?: boolean;
}

export function CodeBlock({ children, language, title, showPrompt = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [children]);

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-[#161b22] dark:bg-muted/30">
      {title && (
        <div className="flex items-center gap-2 border-b border-white/5 bg-white/[0.03] px-4 py-2 dark:border-border dark:bg-muted/50">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/10 dark:bg-muted-foreground/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10 dark:bg-muted-foreground/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10 dark:bg-muted-foreground/20" />
          </div>
          <span className="ml-2 text-[11px] font-medium text-white/50 dark:text-muted-foreground">{title}</span>
          {language && (
            <span className="ml-auto text-[10px] font-medium uppercase tracking-wider text-white/30 dark:text-muted-foreground/60">
              {language}
            </span>
          )}
        </div>
      )}
      <div className="relative">
        <pre className="overflow-x-auto px-4 py-3 pr-20 font-mono text-[13px] leading-relaxed text-[#e6edf3] dark:text-foreground">
          <code>
            {showPrompt && <span className="select-none text-[#8b949e]">$ </span>}
            {children}
          </code>
        </pre>
        <button
          onClick={handleCopy}
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium',
            'transition-all duration-150',
            copied
              ? 'border border-success/40 bg-success/15 text-success'
              : 'border border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:text-foreground',
          )}
          aria-label={copied ? 'Copied' : 'Copy to clipboard'}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" strokeWidth={2.5} />
              <span className="hidden sm:inline">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" strokeWidth={2} />
              <span className="hidden sm:inline">Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
