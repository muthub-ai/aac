'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Panel,
  Group,
  Separator,
} from 'react-resizable-panels';
import { Code2, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppToolbar } from '@/components/toolbar/app-toolbar';
import { EditorPane } from '@/components/editor/editor-pane';
import { CanvasPane } from '@/components/canvas/canvas-pane';
import { useGraphStore } from '@/store/use-graph-store';
import { cn } from '@/lib/utils';

type MobileTab = 'editor' | 'canvas';

export function DiagramWorkspace() {
  const initialize = useGraphStore((s) => s.initialize);
  const [mobileTab, setMobileTab] = useState<MobileTab>('canvas');

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <AppToolbar />

      {/* Desktop: resizable split pane */}
      <div className="hidden min-h-0 flex-1 md:flex">
        <Group
          orientation="horizontal"
          id="aac-panels"
          defaultLayout={{ editor: 40, canvas: 60 }}
        >
          <Panel id="editor" defaultSize={40} minSize={20}>
            <EditorPane />
          </Panel>
          <Separator
            className={cn(
              'relative w-1.5 bg-border transition-colors',
              'hover:bg-primary/20 active:bg-primary/30',
              'focus-visible:bg-primary/30 focus-visible:outline-none',
            )}
            aria-label="Resize editor and canvas panels"
          />
          <Panel id="canvas" defaultSize={60} minSize={30}>
            <CanvasPane />
          </Panel>
        </Group>
      </div>

      {/* Mobile: tabbed layout */}
      <div className="flex min-h-0 flex-1 flex-col md:hidden">
        <div
          className="flex border-b border-border bg-card"
          role="tablist"
          aria-label="View selector"
        >
          <Button
            variant="ghost"
            role="tab"
            aria-selected={mobileTab === 'editor'}
            aria-controls="panel-editor"
            onClick={() => setMobileTab('editor')}
            className={cn(
              'flex-1 gap-2 rounded-none border-b-2 cursor-pointer',
              mobileTab === 'editor'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground',
            )}
          >
            <Code2 className="h-4 w-4" aria-hidden="true" />
            YAML
          </Button>
          <Button
            variant="ghost"
            role="tab"
            aria-selected={mobileTab === 'canvas'}
            aria-controls="panel-canvas"
            onClick={() => setMobileTab('canvas')}
            className={cn(
              'flex-1 gap-2 rounded-none border-b-2 cursor-pointer',
              mobileTab === 'canvas'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground',
            )}
          >
            <Map className="h-4 w-4" aria-hidden="true" />
            Canvas
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {mobileTab === 'editor' ? (
            <motion.div
              key="editor"
              id="panel-editor"
              role="tabpanel"
              aria-label="YAML Editor"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="min-h-0 flex-1"
            >
              <EditorPane />
            </motion.div>
          ) : (
            <motion.div
              key="canvas"
              id="panel-canvas"
              role="tabpanel"
              aria-label="Architecture Diagram Canvas"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.15 }}
              className="min-h-0 flex-1"
            >
              <CanvasPane />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
