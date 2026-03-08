'use client';

import { useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { useGraphStore } from '@/store/use-graph-store';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { cn } from '@/lib/utils';

export function EditorPane() {
  const yamlText = useGraphStore((s) => s.yamlText);
  const syncSource = useGraphStore((s) => s.syncSource);
  const updateFromYaml = useGraphStore((s) => s.updateFromYaml);
  const parseError = useGraphStore((s) => s.parseError);
  const { resolvedTheme } = useTheme();

  const debouncedUpdate = useDebouncedCallback(
    useCallback(
      (value: string) => {
        updateFromYaml(value);
      },
      [updateFromYaml],
    ),
    300,
  );

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (syncSource === 'canvas') return;
      if (value !== undefined) {
        debouncedUpdate(value);
      }
    },
    [syncSource, debouncedUpdate],
  );

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      role="region"
      aria-label="YAML Editor"
    >
      {parseError && (
        <div
          role="alert"
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-xs font-medium',
            'bg-destructive/15 text-destructive',
          )}
        >
          <span aria-hidden="true">!</span>
          {parseError}
        </div>
      )}
      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          language="yaml"
          theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
          value={yamlText}
          onChange={handleChange}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            wordWrap: 'on',
            tabSize: 2,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            padding: { top: 12, bottom: 12 },
            fontFamily: 'var(--font-geist-mono), monospace',
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            bracketPairColorization: { enabled: true },
            accessibilitySupport: 'on',
          }}
        />
      </div>
    </div>
  );
}
