import { useEffect } from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { EditorPane } from './components/EditorPane';
import { CanvasPane } from './components/CanvasPane';
import { Toolbar } from './components/Toolbar';
import { useGraphStore } from './store/useGraphStore';

function App() {
  const initialize = useGraphStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#1e1e1e' }}>
      <Toolbar />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Allotment defaultSizes={[40, 60]}>
          <Allotment.Pane minSize={300}>
            <EditorPane />
          </Allotment.Pane>
          <Allotment.Pane minSize={400}>
            <CanvasPane />
          </Allotment.Pane>
        </Allotment>
      </div>
    </div>
  );
}

export default App;
