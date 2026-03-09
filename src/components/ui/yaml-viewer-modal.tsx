'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Copy, Check, Download, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface YamlViewerModalProps {
  open: boolean;
  onClose: () => void;
  yamlContent: string;
  fileName: string;
  title: string;
}

export function YamlViewerModal({
  open,
  onClose,
  yamlContent,
  fileName,
  title,
}: YamlViewerModalProps) {
  const [copied, setCopied] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(yamlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [yamlContent]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([yamlContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [yamlContent, fileName]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  // Focus trap: focus the content on open
  useEffect(() => {
    if (open && contentRef.current) {
      contentRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`YAML source for ${title}`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={contentRef}
        tabIndex={-1}
        className={cn(
          'relative z-10 flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl',
          'border border-border bg-card shadow-2xl',
          'animate-in fade-in-0 zoom-in-95 duration-200',
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ring/10">
            <Code2 className="h-4 w-4 text-ring" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold text-foreground">
              {title}
            </h2>
            <p className="text-[11px] font-medium text-muted-foreground">
              {fileName}
              <span className="ml-2 text-muted-foreground/60">
                {yamlContent.split('\n').length} lines
              </span>
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopy}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-semibold',
                'transition-all',
                copied
                  ? 'border-success/30 bg-success/10 text-success'
                  : 'border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
              aria-label="Copy YAML to clipboard"
            >
              {copied ? (
                <><Check className="h-3 w-3" strokeWidth={2.5} /> Copied</>
              ) : (
                <><Copy className="h-3 w-3" strokeWidth={2} /> Copy</>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-semibold',
                'border-ring/30 bg-ring/10 text-ring',
                'transition-all hover:bg-ring/20',
              )}
              aria-label={`Download ${fileName}`}
            >
              <Download className="h-3 w-3" strokeWidth={2} />
              Download
            </button>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'ml-1 inline-flex h-7 w-7 items-center justify-center rounded-md',
                'text-muted-foreground hover:bg-muted hover:text-foreground',
                'transition-colors',
              )}
              aria-label="Close"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Code body */}
        <div className="flex-1 overflow-auto bg-[var(--code-bg,#f0f3f6)] dark:bg-[#0d1117]">
          <pre className="p-5 text-[12px] leading-relaxed">
            <code className="text-foreground/90">{yamlContent}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
