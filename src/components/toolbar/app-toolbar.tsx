'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, LayoutGrid, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/providers/theme-toggle';
import { useGraphStore } from '@/store/use-graph-store';
import { downloadDrawioXml } from '@/lib/export/drawio-export';

export function AppToolbar() {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const runAutoLayout = useGraphStore((s) => s.runAutoLayout);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex items-center justify-between border-b border-border bg-card px-4 py-2.5 sm:px-6"
      role="banner"
    >
      <div className="flex items-center gap-2.5">
        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                href="/dashboard"
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Back to Application Systems"
              />
            }
          >
            <ArrowLeft className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>Back to Application Systems</TooltipContent>
        </Tooltip>
        <Image
          src="/logo.svg"
          alt="Architecture as Code logo"
          width={26}
          height={26}
          className="rounded-md"
        />
        <h1 className="text-sm font-semibold tracking-tight sm:text-base">
          Architecture as Code
        </h1>
      </div>

      <nav className="flex items-center gap-2" aria-label="Toolbar actions">
        <span
          className="hidden text-xs text-muted-foreground sm:inline"
          aria-live="polite"
        >
          {nodes.length} nodes, {edges.length} edges
        </span>

        <Separator orientation="vertical" className="hidden h-5 sm:block" />

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="default"
                size="sm"
                onClick={runAutoLayout}
                className="gap-1.5 cursor-pointer"
                aria-label="Auto layout diagram"
              />
            }
          >
            <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Auto Layout</span>
          </TooltipTrigger>
          <TooltipContent>Rearrange nodes automatically</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadDrawioXml(nodes, edges)}
                className="gap-1.5 cursor-pointer"
                aria-label="Export as Draw.io file"
              />
            }
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Export Draw.io</span>
          </TooltipTrigger>
          <TooltipContent>Download as Draw.io XML file</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-5" />

        <ThemeToggle />
      </nav>
    </motion.header>
  );
}
