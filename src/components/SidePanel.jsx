import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStore } from '../store/useStore';
import { getSocraticBreakdown } from '../services/ai';
import { getRaagColor } from '../constants/raagColors';

export default function SidePanel() {
  const selectedNode = useStore(s => s.selectedNode);
  const sidePanelOpen = useStore(s => s.sidePanelOpen);
  const setSidePanelOpen = useStore(s => s.setSidePanelOpen);
  const setSelectedNode = useStore(s => s.setSelectedNode);
  const nodes = useStore(s => s.nodes);
  const edges = useStore(s => s.edges);
  const favourites = useStore(s => s.favourites);
  const toggleFavourite = useStore(s => s.toggleFavourite);
  const aiLoading = useStore(s => s.aiLoading);
  const aiResponse = useStore(s => s.aiResponse);
  const aiVirtues = useStore(s => s.aiVirtues);
  const setAiLoading = useStore(s => s.setAiLoading);
  const appendAiResponse = useStore(s => s.appendAiResponse);
  const setAiVirtues = useStore(s => s.setAiVirtues);
  const clearAiState = useStore(s => s.clearAiState);

  const [aiError, setAiError] = useState(null);
  const [virtuesSaved, setVirtuesSaved] = useState(false);

  // Nearby connected nodes sorted by edge strength
  const nearbyNodes = useMemo(() => {
    if (!selectedNode || !edges.length) return [];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const connected = [];
    for (const e of edges) {
      const src = typeof e.source === 'object' ? e.source.id : e.source;
      const tgt = typeof e.target === 'object' ? e.target.id : e.target;
      if (src === selectedNode.id && nodeMap.has(tgt)) {
        connected.push({ node: nodeMap.get(tgt), strength: e.strength || 0 });
      } else if (tgt === selectedNode.id && nodeMap.has(src)) {
        connected.push({ node: nodeMap.get(src), strength: e.strength || 0 });
      }
    }
    return connected.sort((a, b) => b.strength - a.strength).slice(0, 6);
  }, [selectedNode, edges, nodes]);

  if (!sidePanelOpen || !selectedNode) return null;

  const node = selectedNode;
  const color = getRaagColor(node.raagSlug);
  const isFav = favourites.has(node.id);

  const handleSocraticStream = async () => {
    const apiKey = localStorage.getItem('groqApiKey');
    if (!apiKey) {
      setAiError('Add your Groq API key in Settings (⚙ top right) to use AI features.');
      return;
    }
    clearAiState();
    setAiError(null);
    setVirtuesSaved(false);
    setAiLoading(true);
    try {
      const { virtues } = await getSocraticBreakdown(node, apiKey, (delta) => {
        appendAiResponse(delta);
      });
      setAiVirtues(virtues);
    } catch (e) {
      setAiError(e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveVirtues = () => {
    const existing = JSON.parse(localStorage.getItem('dailyPath') || '[]');
    const today = new Date().toISOString().split('T')[0];
    const newTasks = aiVirtues.map(v => ({
      id: Date.now() + Math.random(),
      task: v.task,
      theme: v.theme,
      source: `Ang ${node.ang} · ${node.raag}`,
      date: today,
      done: false,
    }));
    localStorage.setItem('dailyPath', JSON.stringify([...newTasks, ...existing]));
    window.dispatchEvent(new Event('dailyPathUpdated'));
    setVirtuesSaved(true);
  };

  const displayedAiText = aiResponse
    ? aiResponse.replace(/\{"virtues"\s*:\s*\[[\s\S]*?\]\s*\}/g, '').trim()
    : '';

  return (
    <div className="fixed right-0 top-0 h-full z-20 flex pointer-events-none">
      <div
        className="panel-slide-right pointer-events-auto w-full md:w-[420px] h-full flex flex-col overflow-hidden"
        style={{
          background: 'rgba(5,10,22,0.97)',
          borderLeft: `1px solid ${color}35`,
          boxShadow: `-4px 0 60px rgba(0,0,0,0.7)`
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 flex-shrink-0 border-b border-white/5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ background: color + '18', color, border: `1px solid ${color}30` }}>
                {node.raag}
              </span>
              <span className="text-slate-500 text-xs">Ang {node.ang}</span>
              <span className="text-slate-600 text-xs">·</span>
              <span className="text-slate-500 text-xs">{node.mood}</span>
            </div>
            <div className="text-slate-400 text-sm font-medium">{node.writer}</div>
          </div>
          <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
            {/* Favourite button */}
            <button
              onClick={() => toggleFavourite(node.id)}
              title={isFav ? 'Remove from favourites' : 'Add to favourites'}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
              style={{ color: isFav ? '#A78BFA' : 'rgba(139,92,246,0.3)',
                background: isFav ? 'rgba(139,92,246,0.1)' : 'transparent',
                border: isFav ? '1px solid rgba(139,92,246,0.25)' : '1px solid transparent' }}
            >
              {isFav ? '★' : '☆'}
            </button>
            <button onClick={() => setSidePanelOpen(false)}
              className="text-slate-600 hover:text-slate-300 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors">
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* Scripture — all three texts always shown */}
          <div className="px-5 py-5 space-y-5 border-b border-white/5">
            {/* Gurmukhi */}
            {node.gurmukhi && (
              <div>
                <div className="text-xs text-slate-600 uppercase tracking-widest mb-2">Gurmukhi</div>
                <div className="font-gurmukhi text-2xl text-white leading-relaxed" style={{ color }}>
                  {node.gurmukhi}
                </div>
              </div>
            )}

            {/* Transliteration */}
            {node.transliteration && (
              <div>
                <div className="text-xs text-slate-600 uppercase tracking-widest mb-2">Transliteration</div>
                <div className="text-base italic text-slate-300 leading-relaxed">
                  {node.transliteration}
                </div>
              </div>
            )}

            {/* English */}
            {node.english && (
              <div>
                <div className="text-xs text-slate-600 uppercase tracking-widest mb-2">Translation</div>
                <div className="text-base text-slate-200 leading-relaxed font-display">
                  {node.english}
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          {node.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-5 py-4 border-b border-white/5">
              {node.tags.map(tag => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-white/4 text-slate-500 border border-white/6">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Nearby nodes */}
          {nearbyNodes.length > 0 && (
            <div className="px-5 py-4 border-b border-white/5">
              <div className="text-xs text-slate-600 uppercase tracking-widest mb-3">Connected Shabads</div>
              <div className="space-y-2">
                {nearbyNodes.map(({ node: n, strength }) => {
                  const nColor = getRaagColor(n.raagSlug);
                  return (
                    <button key={n.id} onClick={() => setSelectedNode(n)}
                      className="w-full text-left rounded-xl p-3 transition-colors hover:bg-white/5 group"
                      style={{ border: `1px solid ${nColor}18` }}>
                      <div className="text-sm text-slate-300 truncate group-hover:text-white transition-colors">
                        {(n.english || n.gurmukhi || '').slice(0, 70)}…
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: nColor + '15', color: nColor }}>
                          {n.raag}
                        </span>
                        <span className="text-xs text-slate-600">Ang {n.ang}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI section */}
          <div className="px-5 py-5 space-y-4">
            {!aiResponse && !aiLoading && !aiError && (
              <button onClick={handleSocraticStream}
                className="w-full py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.05))',
                  border: '1px solid rgba(139,92,246,0.22)',
                  color: '#A78BFA',
                }}>
                ✦ Reflect with Ode2Socrates
              </button>
            )}

            {aiError && (
              <div className="text-red-400 text-xs bg-red-400/8 rounded-xl p-3 border border-red-400/15">
                {aiError}
              </div>
            )}

            {aiLoading && !displayedAiText && (
              <div className="flex items-center gap-2 text-accent/60 text-xs py-2">
                <span className="animate-pulse-slow">●</span>
                <span className="animate-pulse-slow" style={{ animationDelay: '0.2s' }}>●</span>
                <span className="animate-pulse-slow" style={{ animationDelay: '0.4s' }}>●</span>
              </div>
            )}

            {displayedAiText && (
              <div className="space-y-4">
                <div className="bg-white/3 rounded-xl p-4 border border-white/5">
                  <div className="markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {displayedAiText + (aiLoading ? ' ▊' : '')}
                    </ReactMarkdown>
                  </div>
                </div>

                {aiVirtues.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium tracking-widest uppercase text-slate-500">Daily Virtues</div>
                    {aiVirtues.map((v, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-xl p-3"
                        style={{ background: color + '0d', border: `1px solid ${color}18` }}>
                        <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 font-medium"
                          style={{ background: color + '20', color }}>
                          {v.theme}
                        </span>
                        <span className="text-sm text-slate-300 leading-relaxed">{v.task}</span>
                      </div>
                    ))}

                    {!virtuesSaved ? (
                      <button onClick={handleSaveVirtues}
                        className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
                        style={{ background: 'rgba(16,185,129,0.1)', color: '#34D399', border: '1px solid rgba(16,185,129,0.2)' }}>
                        + Save to Daily Path
                      </button>
                    ) : (
                      <div className="text-center text-xs text-emerald-500 py-1">✓ Saved to Daily Path</div>
                    )}
                  </div>
                )}

                {!aiLoading && (
                  <button onClick={handleSocraticStream}
                    className="w-full py-2 rounded-xl text-xs text-slate-500 hover:text-slate-300 transition-colors hover:bg-white/5">
                    ↺ Ask again
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
