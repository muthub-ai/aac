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
    <div className="group relative overflow-hidden rounded-lg border border-border">
      {title && (
        <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2">
          <span className="text-[11px] font-semibold text-muted-foreground">{title}</span>
          {language && (
            <span className="ml-auto text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
              {language}
            </span>
          )}
        </div>
      )}
      <div className="relative bg-[#161b22] dark:bg-muted/30">
        <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[13px] leading-relaxed text-[#e6edf3] dark:text-foreground">
          <code>
            {showPrompt && <span className="select-none text-muted-foreground/50">$ </span>}
            {children}
          </code>
        </pre>
        <button
          onClick={handleCopy}
          className={cn(
            'absolute right-2 top-2 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold',
            'transition-all duration-150',
            'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
            copied
              ? 'border border-success/30 bg-success/15 text-success'
              : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:text-foreground',
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
