import Editor from '@monaco-editor/react';
import { useGraphStore } from '../store/useGraphStore';
import { useDebouncedCallback } from '../utils/debounce';

export function EditorPane() {
  const yamlText = useGraphStore((s) => s.yamlText);
  const updateFromYaml = useGraphStore((s) => s.updateFromYaml);
  const syncSource = useGraphStore((s) => s.syncSource);
  const parseError = useGraphStore((s) => s.parseError);

  const debouncedUpdate = useDebouncedCallback((value: string) => {
    updateFromYaml(value);
  }, 300);

  const handleChange = (value: string | undefined) => {
    if (syncSource === 'canvas') return;
    if (value !== undefined) {
      useGraphStore.getState().setYamlText(value);
      debouncedUpdate(value);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {parseError && (
        <div
          style={{
            padding: '6px 12px',
            background: '#5c1d1d',
            color: '#ff9494',
            fontSize: 12,
            fontFamily: 'monospace',
          }}
        >
          {parseError}
        </div>
      )}
      <Editor
        height="100%"
        language="yaml"
        theme="vs-dark"
        value={yamlText}
        onChange={handleChange}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          tabSize: 2,
          automaticLayout: true,
          padding: { top: 12 },
        }}
      />
    </div>
  );
}
