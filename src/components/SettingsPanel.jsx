import { useState } from 'react';
import { useStore } from '../store/useStore';

export default function SettingsPanel() {
  const open = useStore(s => s.settingsOpen);
  const setOpen = useStore(s => s.setSettingsOpen);
  const textMode = useStore(s => s.textMode);
  const setTextMode = useStore(s => s.setTextMode);
  const physicsEnabled = useStore(s => s.physicsEnabled);
  const setPhysicsEnabled = useStore(s => s.setPhysicsEnabled);

  const [apiKey, setApiKey] = useState(localStorage.getItem('groqApiKey') || '');
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const saveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('groqApiKey', apiKey.trim());
    } else {
      localStorage.removeItem('groqApiKey');
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const resetAll = () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    localStorage.clear();
    window.location.reload();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative glass rounded-2xl w-full max-w-md p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-semibold text-lg">⚙ Settings</h2>
          <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white">✕</button>
        </div>

        <div className="space-y-6">
          {/* Groq API key */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">Groq API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="gsk_…"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 text-sm outline-none focus:border-indigo-500 transition-colors"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Your key stays in your browser. It is sent only to api.groq.com.
            </p>
            <button
              onClick={saveKey}
              className={`mt-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                saved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {saved ? '✓ Saved' : 'Save Key'}
            </button>
          </div>

          {/* Text mode */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">Default Text Mode</label>
            <div className="flex gap-2">
              {['gurmukhi', 'transliteration', 'english'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setTextMode(mode)}
                  className={`flex-1 py-2 rounded-lg text-xs transition-colors capitalize ${
                    textMode === mode
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {mode === 'transliteration' ? 'Roman' : mode}
                </button>
              ))}
            </div>
          </div>

          {/* Physics toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-300">Graph Physics</div>
              <div className="text-xs text-slate-500">Disable for better performance</div>
            </div>
            <button
              onClick={() => setPhysicsEnabled(!physicsEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                physicsEnabled ? 'bg-indigo-600' : 'bg-slate-700'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                physicsEnabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Reset */}
          <div className="pt-4 border-t border-white/10">
            <button
              onClick={resetAll}
              onBlur={() => setConfirmReset(false)}
              className={`w-full py-2.5 rounded-lg text-sm transition-colors ${
                confirmReset
                  ? 'bg-red-600 text-white'
                  : 'bg-white/5 hover:bg-red-600/20 text-slate-400 hover:text-red-400 border border-white/10'
              }`}
            >
              {confirmReset ? '⚠ Click again to confirm — this clears all data' : 'Reset All Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
