import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { initSearch } from './services/search';
import Graph from './components/Graph';
import SearchBar from './components/SearchBar';
import SidePanel from './components/SidePanel';
import VirtueTracker from './components/VirtueTracker';
import SettingsPanel from './components/SettingsPanel';
import LandingPage from './components/LandingPage';
import TourModal from './components/TourModal';

export default function App() {
  const setGraphData = useStore(s => s.setGraphData);
  const setSettingsOpen = useStore(s => s.setSettingsOpen);
  const settingsOpen = useStore(s => s.settingsOpen);
  const nodes = useStore(s => s.nodes);

  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApp, setShowApp] = useState(false);
  const [showTour, setShowTour] = useState(false);

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

  // Show tour on first visit
  useEffect(() => {
    if (!loading && !loadError) {
      if (!localStorage.getItem('tourSeen')) {
        setShowTour(true);
        localStorage.setItem('tourSeen', 'true');
      }
    }
  }, [loading, loadError]);

  const handleEnterFromLanding = () => setShowApp(true);

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#050A16' }}>
      {/* Graph always present — passes onEnterFromClick when on landing */}
      <Graph
        dimmed={!showApp}
        onEnterFromClick={!showApp ? handleEnterFromLanding : null}
      />

      {/* Loading */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: '#050A16' }}>
          <div className="text-center">
            <img src="/KhalsaGraph/favicon.svg" className="w-10 h-10 mx-auto mb-5 animate-pulse-slow" />
            <div className="text-slate-600 text-sm tracking-wide">Loading KhalsaGraph…</div>
          </div>
        </div>
      )}

      {/* Error */}
      {loadError && !loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: '#050A16' }}>
          <div className="glass rounded-2xl p-8 max-w-sm text-center">
            <div className="text-accent text-xl mb-3">⚠</div>
            <div className="text-white font-medium mb-2 text-sm">Could not load data</div>
            <div className="text-slate-500 text-xs mb-4">{loadError}</div>
            <code className="text-xs px-2 py-1 rounded text-slate-500"
              style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)' }}>
              npm run build:data
            </code>
          </div>
        </div>
      )}

      {/* Landing */}
      {!loading && !showApp && !loadError && (
        <LandingPage onEnter={handleEnterFromLanding} />
      )}

      {/* App UI */}
      {showApp && (
        <>
          {/* Top bar */}
          <div className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 pointer-events-none">
            <button
              onClick={() => setShowApp(false)}
              className="pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-white/5"
              style={{ border: '1px solid rgba(249,115,22,0.18)', background: 'rgba(4,7,18,0.88)' }}
            >
              <img src="/KhalsaGraph/favicon.svg" alt="" className="w-5 h-5" />
              <span className="text-sm text-slate-400 font-medium hidden sm:block">KhalsaGraph</span>
            </button>

            <div className="pointer-events-auto flex items-center gap-2">
              {/* Tour button */}
              <button
                onClick={() => setShowTour(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                style={{
                  border: '1px solid rgba(139,92,246,0.22)',
                  background: 'rgba(4,7,18,0.88)',
                  color: '#A78BFA',
                }}
                title="How it works"
              >
                <span>?</span>
                <span className="hidden sm:block">Tour</span>
              </button>

              {/* Settings with label */}
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-slate-400 hover:text-white"
                style={{ border: '1px solid rgba(249,115,22,0.18)', background: 'rgba(4,7,18,0.88)' }}
                title="Settings"
              >
                <span>⚙</span>
                <span className="hidden sm:block">Settings</span>
              </button>
            </div>
          </div>

          <SearchBar />

          {/* Node count */}
          {nodes.length > 0 && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-10 text-xs pointer-events-none"
              style={{ color: 'rgba(249,115,22,0.28)' }}>
              {nodes.length.toLocaleString()} shabads · {new Set(nodes.map(n => n.raag)).size} raags
            </div>
          )}

          <SidePanel />
          <VirtueTracker />
          <SettingsPanel />
        </>
      )}

      {/* Tour modal — renders on top of everything */}
      {showTour && <TourModal onClose={() => setShowTour(false)} />}
    </div>
  );
}
