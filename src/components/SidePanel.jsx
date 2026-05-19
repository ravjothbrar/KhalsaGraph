import { useState } from 'react';
import { useStore } from '../store/useStore';
import { getSocraticBreakdown } from '../services/ai';
import { getRaagColor } from '../constants/raagColors';

export default function SidePanel() {
  const selectedNode = useStore(s => s.selectedNode);
  const sidePanelOpen = useStore(s => s.sidePanelOpen);
  const setSidePanelOpen = useStore(s => s.setSidePanelOpen);
  const textMode = useStore(s => s.textMode);
  const setTextMode = useStore(s => s.setTextMode);
  const aiLoading = useStore(s => s.aiLoading);
  const aiResponse = useStore(s => s.aiResponse);
  const aiVirtues = useStore(s => s.aiVirtues);
  const setAiLoading = useStore(s => s.setAiLoading);
  const appendAiResponse = useStore(s => s.appendAiResponse);
  const setAiVirtues = useStore(s => s.setAiVirtues);
  const clearAiState = useStore(s => s.clearAiState);

  const [aiError, setAiError] = useState(null);

  if (!sidePanelOpen || !selectedNode) return null;

  const node = selectedNode;
  const color = getRaagColor(node.raagSlug);

  const scriptText = textMode === 'gurmukhi'
    ? node.gurmukhi
    : textMode === 'transliteration'
    ? node.transliteration
    : node.english;

  const handleSocratic = async () => {
    const apiKey = localStorage.getItem('groqApiKey');
    if (!apiKey) {
      setAiError('Please add your Groq API key in Settings (⚙ top right).');
      return;
    }
    clearAiState();
    setAiError(null);
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
  };

  const displayedAiText = aiResponse
    ? aiResponse.replace(/\{"virtues"[\s\S]+?\}\s*\]/, '').trim()
    : '';

  return (
    <div className="fixed right-0 top-0 h-full z-20 flex">
      <div className="panel-slide-right glass w-full md:w-[420px] h-full flex flex-col overflow-hidden shadow-2xl border-l border-white/10">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-white/10 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <span
              className="inline-block text-xs font-semibold px-2 py-1 rounded-full mb-2"
              style={{ background: color + '22', color }}
            >
              {node.raag}
            </span>
            <div className="text-slate-400 text-sm">{node.writer}</div>
            <div className="text-slate-500 text-xs mt-0.5">Ang {node.ang}</div>
          </div>
          <button
            onClick={() => setSidePanelOpen(false)}
            className="text-slate-500 hover:text-white ml-4 flex-shrink-0 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Text mode toggle */}
        <div className="flex gap-1 p-4 flex-shrink-0">
          {['gurmukhi', 'transliteration', 'english'].map(mode => (
            <button
              key={mode}
              onClick={() => setTextMode(mode)}
              className={`flex-1 text-xs py-1.5 rounded-lg transition-colors capitalize ${
                textMode === mode
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              {mode === 'transliteration' ? 'Roman' : mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        {/* Scripture text */}
        <div className="px-5 pb-4 flex-shrink-0">
          <div className={`text-xl leading-relaxed text-white ${textMode === 'gurmukhi' ? 'font-gurmukhi text-2xl' : ''}`}>
            {scriptText || <span className="text-slate-500 italic">No text available</span>}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
          {/* Socratic button */}
          {!aiResponse && !aiLoading && (
            <button
              onClick={handleSocratic}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-medium transition-all shadow-lg"
            >
              ✦ Reflect with Ode2Socrates
            </button>
          )}

          {aiError && (
            <div className="text-red-400 text-sm bg-red-400/10 rounded-lg p-3">{aiError}</div>
          )}

          {aiLoading && !displayedAiText && (
            <div className="flex items-center gap-2 text-indigo-300 text-sm">
              <span className="animate-pulse">●</span> Thinking…
            </div>
          )}

          {/* AI response */}
          {displayedAiText && (
            <div className="space-y-3">
              <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap bg-white/5 rounded-xl p-4">
                {displayedAiText}
                {aiLoading && <span className="animate-pulse text-indigo-400">▊</span>}
              </div>

              {aiVirtues.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-slate-500 uppercase tracking-wider">Daily Virtues</div>
                  {aiVirtues.map((v, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white/5 rounded-lg p-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                        style={{ background: color + '22', color }}
                      >
                        {v.theme}
                      </span>
                      <span className="text-sm text-slate-300">{v.task}</span>
                    </div>
                  ))}
                  <button
                    onClick={handleSaveVirtues}
                    className="w-full py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-sm transition-colors border border-emerald-600/30"
                  >
                    + Save to Daily Path
                  </button>
                </div>
              )}

              {!aiLoading && (
                <button
                  onClick={handleSocratic}
                  className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-xs transition-colors"
                >
                  ↺ Ask again
                </button>
              )}
            </div>
          )}

          {/* Tags */}
          {node.tags && node.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
              {node.tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-1 rounded-full bg-slate-700/60 text-slate-300">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
