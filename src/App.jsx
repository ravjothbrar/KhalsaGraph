import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { initSearch } from './services/search';
import Graph from './components/Graph';
import SearchBar from './components/SearchBar';
import SidePanel from './components/SidePanel';
import VirtueTracker from './components/VirtueTracker';
import SettingsPanel from './components/SettingsPanel';
import LandingPage from './components/LandingPage';

export default function App() {
  const setGraphData = useStore(s => s.setGraphData);
  const setSettingsOpen = useStore(s => s.setSettingsOpen);
  const settingsOpen = useStore(s => s.settingsOpen);
  const nodes = useStore(s => s.nodes);
  const textMode = useStore(s => s.textMode);
  const setTextMode = useStore(s => s.setTextMode);

  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApp, setShowApp] = useState(false);

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
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#060B18' }}>
      {/* Graph always renders (dimmed on landing) */}
      <Graph dimmed={!showApp} />

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: '#060B18' }}>
          <div className="text-center">
            <div className="text-accent text-3xl mb-4 animate-pulse-slow">✦</div>
            <div className="text-slate-500 text-sm">Loading KhalsaGraph…</div>
          </div>
        </div>
      )}

      {/* Error */}
      {loadError && !loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: '#060B18' }}>
          <div className="glass rounded-2xl p-8 max-w-sm text-center">
            <div className="text-accent text-2xl mb-3">⚠</div>
            <div className="text-white font-medium mb-2 text-sm">Could not load data</div>
            <div className="text-slate-400 text-xs mb-4">{loadError}</div>
            <code className="text-xs bg-white/5 px-2 py-1 rounded text-slate-400">npm run build:data</code>
          </div>
        </div>
      )}

      {/* Landing page */}
      {!loading && !showApp && !loadError && (
        <LandingPage onEnter={() => setShowApp(true)} />
      )}

      {/* App UI */}
      {showApp && (
        <>
          {/* Top bar */}
          <div className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 pointer-events-none">
            {/* Logo */}
            <button
              onClick={() => setShowApp(false)}
              className="pointer-events-auto flex items-center gap-2 glass rounded-xl px-3 py-2 hover:bg-white/8 transition-colors"
            >
              <img src="/KhalsaGraph/favicon.svg" alt="" className="w-5 h-5" />
              <span className="text-sm text-slate-400 font-medium hidden sm:block">KhalsaGraph</span>
            </button>

            {/* Search bar (centered, handled by SearchBar component itself) */}

            {/* Right controls */}
            <div className="pointer-events-auto flex items-center gap-2">
              {/* Text mode toggle */}
              <div className="nav-pill glass">
                {[['G', 'gurmukhi'], ['R', 'transliteration'], ['E', 'english']].map(([label, m]) => (
                  <button key={m} onClick={() => setTextMode(m)} className={textMode === m ? 'active' : ''} title={m}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Creator pill */}
              <a href="https://ravjothbrar.com/" target="_blank" rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105"
                style={{ border:'1px solid rgba(139,92,246,0.35)', background:'rgba(139,92,246,0.08)', color:'#a78bfa' }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor">
                  <circle cx="6" cy="4" r="2.5"/><path d="M1.5 10.5c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5"/>
                </svg>
                Ravjoth Brar
              </a>

              {/* Settings */}
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="glass rounded-xl w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white transition-colors text-sm"
                title="Settings"
              >
                ⚙
              </button>
            </div>
          </div>

          {/* Search bar */}
          <SearchBar />

          {/* Node count */}
          {nodes.length > 0 && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-10 text-slate-700 text-xs pointer-events-none">
              {nodes.length.toLocaleString()} shabads · {new Set(nodes.map(n => n.raag)).size} raags
            </div>
          )}

          <SidePanel />
          <VirtueTracker />
          <SettingsPanel />
        </>
      )}
    </div>
  );
}
