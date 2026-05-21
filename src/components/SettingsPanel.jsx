import { useState } from 'react';
import { useStore } from '../store/useStore';

export default function SettingsPanel() {
  const open = useStore(s => s.settingsOpen);
  const setOpen = useStore(s => s.setSettingsOpen);
  const physicsEnabled = useStore(s => s.physicsEnabled);
  const setPhysicsEnabled = useStore(s => s.setPhysicsEnabled);
  const textMode = useStore(s => s.textMode);
  const setTextMode = useStore(s => s.setTextMode);

  const [apiKey, setApiKey] = useState(localStorage.getItem('groqApiKey') || '');
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const saveKey = () => {
    if (apiKey.trim()) localStorage.setItem('groqApiKey', apiKey.trim());
    else localStorage.removeItem('groqApiKey');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const resetAll = () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    localStorage.clear();
    window.location.reload();
  };

  if (!open) return null;

  const TEXT_MODES = [
    { id: 'gurmukhi', label: 'Gurmukhi', desc: 'ਪੰਜਾਬੀ ਲਿਪੀ' },
    { id: 'transliteration', label: 'Transliteration', desc: 'Romanised Punjabi' },
    { id: 'english', label: 'English', desc: 'Dr. Sant Singh Khalsa' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative rounded-2xl w-full max-w-sm p-6 shadow-2xl fade-in" onClick={e => e.stopPropagation()}
        style={{ background: 'rgba(5,10,22,0.99)', border: '1px solid rgba(249,115,22,0.22)', boxShadow: '0 24px 80px rgba(0,0,0,0.8)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-semibold">Settings</h2>
          <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5">✕</button>
        </div>

        <div className="space-y-6">
          {/* Graph node labels */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Node Labels (on graph canvas)</label>
            <div className="grid grid-cols-3 gap-1.5">
              {TEXT_MODES.map(m => (
                <button key={m.id} onClick={() => setTextMode(m.id)}
                  className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-xs transition-all"
                  style={textMode === m.id
                    ? { background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', color: '#A78BFA' }
                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#4A6080' }
                  }>
                  <span className="font-medium">{m.label}</span>
                  <span className="text-[10px] opacity-70">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* API key */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Groq API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveKey()}
              placeholder="gsk_…"
              className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm outline-none focus:border-accent/50 transition-colors"
            />
            <p className="text-xs text-slate-600 mt-1.5">Sent only to api.groq.com. Never stored elsewhere.</p>
            <button onClick={saveKey}
              className={`mt-2.5 px-4 py-2 rounded-lg text-sm transition-all ${saved ? 'bg-emerald-600/80 text-white' : 'bg-accent/15 hover:bg-accent/25 text-accent border border-accent/20'}`}>
              {saved ? '✓ Saved' : 'Save Key'}
            </button>
          </div>

          {/* Physics */}
          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-sm text-slate-300">Graph Physics</div>
              <div className="text-xs text-slate-500 mt-0.5">Disable for better performance</div>
            </div>
            <button onClick={() => setPhysicsEnabled(!physicsEnabled)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${physicsEnabled ? 'bg-accent/80' : 'bg-slate-700'}`}>
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow ${physicsEnabled ? 'translate-x-4' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Reset */}
          <div className="pt-2 border-t border-white/5">
            <button onClick={resetAll} onBlur={() => setConfirmReset(false)}
              className={`w-full py-2.5 rounded-xl text-sm transition-colors ${confirmReset ? 'bg-red-600/80 text-white' : 'bg-white/3 hover:bg-red-600/10 text-slate-500 hover:text-red-400 border border-white/6'}`}>
              {confirmReset ? '⚠ Confirm — this clears everything' : 'Reset All Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
