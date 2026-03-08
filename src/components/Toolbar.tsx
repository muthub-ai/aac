import { useGraphStore } from '../store/useGraphStore';
import { downloadDrawioXml } from '../export/drawioExport';

const btnStyle: React.CSSProperties = {
  background: '#2d5a8e',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  padding: '6px 14px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};

export function Toolbar() {
  const runAutoLayout = useGraphStore((s) => s.runAutoLayout);
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);

  const handleExportDrawio = () => {
    if (nodes.length === 0) return;
    downloadDrawioXml(nodes, edges);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        background: '#1a1a1a',
        borderBottom: '1px solid #333',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#e0e0e0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>
          Architecture as Code
        </span>
        <span style={{ fontSize: 11, opacity: 0.5 }}>aac</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 11, opacity: 0.6 }}>
          {nodes.length} nodes, {edges.length} edges
        </span>
        <button
          onClick={runAutoLayout}
          style={btnStyle}
          onMouseOver={(e) => (e.currentTarget.style.background = '#3a6da6')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#2d5a8e')}
        >
          Auto Layout
        </button>
        <button
          onClick={handleExportDrawio}
          style={{ ...btnStyle, background: '#2e7d32' }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#388e3c')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#2e7d32')}
          title="Export as Draw.io XML file"
        >
          Export Draw.io
        </button>
      </div>
    </div>
  );
}
