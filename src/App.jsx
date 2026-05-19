import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { initSearch } from './services/search';
import Graph from './components/Graph';
import SearchBar from './components/SearchBar';
import SidePanel from './components/SidePanel';
import VirtueTracker from './components/VirtueTracker';
import SettingsPanel from './components/SettingsPanel';

export default function App() {
  const setGraphData = useStore(s => s.setGraphData);
  const setSettingsOpen = useStore(s => s.setSettingsOpen);
  const settingsOpen = useStore(s => s.settingsOpen);
  const nodes = useStore(s => s.nodes);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = import.meta.env.BASE_URL || '/';

    async function loadData() {
      try {
        const res = await fetch(`${base}bani_index.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const graphNodes = data.nodes || data;
        const edges = data.edges || [];
        setGraphData(graphNodes, edges);
        await initSearch(graphNodes);
      } catch (e) {
        setLoadError(e.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [setGraphData]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-space-950">
      {/* Full-screen graph */}
      <Graph />

      {/* Top search bar */}
      <SearchBar />

      {/* Top-right controls */}
      <div className="fixed top-4 right-4 z-30 flex gap-2">
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="glass rounded-xl px-3 py-2.5 text-slate-400 hover:text-white transition-colors text-sm"
          title="Settings"
        >
          ⚙
        </button>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-space-950">
          <div className="text-center">
            <div className="text-4xl mb-4 animate-pulse">✦</div>
            <div className="text-slate-400">Loading KhalsaGraph…</div>
          </div>
        </div>
      )}

      {/* Error state */}
      {loadError && !loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-space-950">
          <div className="glass rounded-2xl p-8 max-w-sm text-center">
            <div className="text-4xl mb-4">⚠</div>
            <div className="text-white font-semibold mb-2">Could not load data</div>
            <div className="text-slate-400 text-sm mb-4">{loadError}</div>
            <div className="text-slate-500 text-xs">
              Run <code className="bg-white/10 px-1 py-0.5 rounded">npm run build:data</code> to generate the data files, then rebuild.
            </div>
          </div>
        </div>
      )}

      {/* Node count indicator */}
      {nodes.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-10 text-slate-600 text-xs">
          {nodes.length} shabads across {new Set(nodes.map(n => n.raag)).size} raags
        </div>
      )}

      {/* Side panels */}
      <SidePanel />
      <VirtueTracker />
      <SettingsPanel />
    </div>
  );
}
