import { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { keywordSearch } from '../services/search';
import { getRaagColor } from '../constants/raagColors';

export default function LandingPage({ onEnter }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const nodes = useStore(s => s.nodes);
  const setSelectedNode = useStore(s => s.setSelectedNode);
  const debounceRef = useRef(null);

  const handleInput = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      const ids = await keywordSearch(q, 5);
      setResults(ids.map(id => nodes.find(n => n.id === id)).filter(Boolean));
    }, 150);
  };

  const handleSelect = (node) => { setSelectedNode(node); onEnter(); };
  const handleKey = (e) => {
    if (e.key === 'Enter') { if (results.length) handleSelect(results[0]); else onEnter(); }
    if (e.key === 'Escape') { setQuery(''); setResults([]); }
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col landing-veil" style={{ pointerEvents: 'none' }}>

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-8 sm:px-14 py-6 pointer-events-auto">
        <div className="flex items-center gap-3">
          <img src="/KhalsaGraph/favicon.svg" alt="KhalsaGraph" className="w-8 h-8" />
          <span className="text-white font-semibold tracking-tight text-base">KhalsaGraph</span>
        </div>
        <div className="flex items-center gap-3">
          {nodes.length > 0 && (
            <span className="text-slate-600 text-xs hidden sm:block">
              {nodes.length.toLocaleString()} shabads
            </span>
          )}
          <button onClick={onEnter}
            className="text-xs font-semibold px-4 py-2 rounded-lg transition-all"
            style={{ color: '#A78BFA', border: '1.5px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.07)' }}>
            Open graph →
          </button>
        </div>
      </header>

      {/* Why section — below nav, above hero */}
      <div className="relative z-10 px-8 sm:px-14 pt-16 pb-0 max-w-3xl pointer-events-auto">
        <p className="text-2xl sm:text-3xl font-light leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
          KhalsaGraph is a way for you to search through select Gurbani, see translations and reflect on how you can put that into practice with AI-led advice —
          on how the{' '}
          <span style={{ color: '#F97316', fontStyle: 'normal' }}>Gurmukhi</span>{' '}
          relates to your{' '}
          <span className="text-gradient-op">daily actions.</span>
        </p>
      </div>

      {/* Flex spacer — graph shows through here */}
      <div className="flex-1" />

      {/* Hero — bottom-left */}
      <div className="relative z-10 px-8 sm:px-14 pb-14 sm:pb-20 pointer-events-auto">
        <div className="w-full max-w-[580px]">

          {/* Ik Onkaar */}
          <p className="font-gurmukhi text-[1.6rem] mb-5 leading-none"
            style={{ color: '#F97316', textShadow: '0 0 80px rgba(249,115,22,0.6)' }}>
            ੴ ਸਤਿ ਨਾਮੁ
          </p>

          {/* Headline */}
          <h1 className="hero-title text-[3rem] sm:text-[4.5rem] text-white mb-5">
            Sri Guru<br />
            Granth Sahib Ji,<br />
            <span className="text-gradient-op">connected.</span>
          </h1>

          {/* Search — larger */}
          <div className="relative max-w-xl mb-6">
            <div className="flex items-center gap-3 px-5 py-4 rounded-xl transition-all"
              style={{
                background: 'rgba(4,6,18,0.96)',
                border: '1.5px solid rgba(249,115,22,0.32)',
                fontSize: '1rem',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#F97316', flexShrink: 0 }}>
                <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                value={query}
                onChange={handleInput}
                onKeyDown={handleKey}
                placeholder="Search a virtue, raag, or concept…"
                className="flex-1 bg-transparent text-white placeholder-slate-700 outline-none"
                style={{ fontSize: '0.95rem' }}
                autoFocus
              />
              {query && (
                <button onClick={() => { setQuery(''); setResults([]); }}
                  className="text-slate-700 hover:text-slate-400 flex-shrink-0">✕</button>
              )}
            </div>

            {results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden shadow-2xl z-20"
                style={{ background: 'rgba(4,6,18,0.99)', border: '1px solid rgba(139,92,246,0.2)' }}>
                {results.map(node => (
                  <button key={node.id} onClick={() => handleSelect(node)}
                    className="w-full text-left px-5 py-3 border-b last:border-0 transition-colors"
                    style={{ borderColor: 'rgba(139,92,246,0.07)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.07)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div className="text-sm text-slate-200 truncate">{node.english?.slice(0, 80)}…</div>
                    <div className="flex gap-2 mt-1.5">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: getRaagColor(node.raagSlug) + '20', color: getRaagColor(node.raagSlug) }}>
                        {node.raag}
                      </span>
                      <span className="text-xs text-slate-600">{node.writer}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={onEnter} className="btn-primary px-7 py-3 rounded-xl text-sm">
              Explore the graph →
            </button>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="relative z-10 px-8 sm:px-14 py-3 flex items-center justify-between pointer-events-auto"
        style={{ borderTop: '1px solid rgba(139,92,246,0.08)' }}>
        <div className="flex items-center gap-6">
          {[
            { label: '31 raags', color: '#F97316' },
            { label: '15 writers', color: '#A78BFA' },
            { label: 'Ang 1–1430', color: '#60A5FA' },
          ].map(({ label, color }) => (
            <span key={label} className="text-xs hidden sm:block" style={{ color: color + '55' }}>
              {label}
            </span>
          ))}
        </div>
        <a
          href="https://ravjothbrar.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105"
          style={{ border: '1.5px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.07)', color: '#a78bfa' }}
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor">
            <circle cx="6" cy="4" r="2.5"/>
            <path d="M1.5 10.5c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5"/>
          </svg>
          Created by Ravjoth Brar
        </a>
      </div>
    </div>
  );
}
