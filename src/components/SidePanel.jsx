import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStore } from '../store/useStore';
import { getSocraticBreakdown } from '../services/ai';
import { getRaagColor } from '../constants/raagColors';

export default function SidePanel() {
  const selectedNode = useStore(s => s.selectedNode);
  const sidePanelOpen = useStore(s => s.sidePanelOpen);
  const setSidePanelOpen = useStore(s => s.setSidePanelOpen);
  const textMode = useStore(s => s.textMode);
  const aiLoading = useStore(s => s.aiLoading);
  const aiResponse = useStore(s => s.aiResponse);
  const aiVirtues = useStore(s => s.aiVirtues);
  const setAiLoading = useStore(s => s.setAiLoading);
  const appendAiResponse = useStore(s => s.appendAiResponse);
  const setAiVirtues = useStore(s => s.setAiVirtues);
  const clearAiState = useStore(s => s.clearAiState);

  const [aiError, setAiError] = useState(null);
  const [virtuesSaved, setVirtuesSaved] = useState(false);

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
      setAiError('Add your Groq API key in Settings (⚙ top right) to use AI features.');
      return;
    }
    clearAiState();
    setAiError(null);
    setVirtuesSaved(false);
    setAiLoading(true);
    try {
      const { virtues } = await getSocraticBreakdown(node, apiKey, () => {
        appendAiResponse('');
      });
      setAiVirtues(virtues);
    } catch (e) {
      setAiError(e.message);
    } finally {
      setAiLoading(false);
    }
  };

  // Stream the response chunk by chunk via store
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

  // Strip the JSON virtues block from displayed text
  const displayedAiText = aiResponse
    ? aiResponse.replace(/\{"virtues"\s*:\s*\[[\s\S]*?\]\s*\}/g, '').trim()
    : '';

  return (
    <div className="fixed right-0 top-0 h-full z-20 flex pointer-events-none">
      <div className="panel-slide-right pointer-events-auto glass w-full md:w-[400px] h-full flex flex-col overflow-hidden"
        style={{ borderLeft: `1px solid ${color}22`, boxShadow: `-8px 0 40px rgba(0,0,0,0.4)` }}>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 flex-shrink-0 border-b border-white/5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ background: color + '18', color, border: `1px solid ${color}30` }}>
                {node.raag}
              </span>
              <span className="text-slate-500 text-xs">Ang {node.ang}</span>
            </div>
            <div className="text-slate-400 text-sm">{node.writer}</div>
          </div>
          <button onClick={() => setSidePanelOpen(false)}
            className="text-slate-600 hover:text-slate-300 ml-3 flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors">
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Scripture */}
          <div className="px-5 py-5">
            <div className={`leading-relaxed text-white ${
              textMode === 'gurmukhi'
                ? 'font-gurmukhi text-2xl'
                : textMode === 'transliteration'
                ? 'text-base italic text-slate-300'
                : 'text-lg font-display'
            }`}>
              {scriptText || <span className="text-slate-600 text-sm not-italic font-sans">No text available</span>}
            </div>
          </div>

          {/* Tags */}
          {node.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-5 pb-4">
              {node.tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-1 rounded-full bg-white/5 text-slate-500 border border-white/5">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="px-5 pb-5 space-y-4">
            {/* Socratic button */}
            {!aiResponse && !aiLoading && !aiError && (
              <button onClick={handleSocraticStream}
                className="w-full py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: `linear-gradient(135deg, ${color}22, ${color}11)`,
                  border: `1px solid ${color}33`,
                  color,
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
              <div className="flex items-center gap-2 text-accent/60 text-xs">
                <span className="animate-pulse-slow">●</span>
                <span className="animate-pulse-slow" style={{ animationDelay: '0.2s' }}>●</span>
                <span className="animate-pulse-slow" style={{ animationDelay: '0.4s' }}>●</span>
              </div>
            )}

            {/* AI response with markdown */}
            {displayedAiText && (
              <div className="space-y-4">
                <div className="bg-white/3 rounded-xl p-4 border border-white/5">
                  <div className="markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {displayedAiText + (aiLoading ? ' ▊' : '')}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Virtues */}
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
