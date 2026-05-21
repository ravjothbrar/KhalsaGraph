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

  const handleSelect = (node) => {
    setSelectedNode(node);
    onEnter();
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') {
      if (results.length) handleSelect(results[0]);
      else onEnter();
    }
    if (e.key === 'Escape') { setQuery(''); setResults([]); }
  };

  return (
    /* Full-screen veil — the actual graph shows through from behind */
    <div className="fixed inset-0 z-40 flex flex-col landing-veil">

      {/* Top nav */}
      <header className="relative z-10 flex items-center justify-between px-8 sm:px-12 py-6">
        <div className="flex items-center gap-3">
          <img src="/KhalsaGraph/favicon.svg" alt="KhalsaGraph" className="w-8 h-8" />
          <span className="text-white font-semibold tracking-tight text-lg">KhalsaGraph</span>
        </div>
        <div className="flex items-center gap-4">
          {nodes.length > 0 && (
            <span className="text-slate-600 text-xs hidden sm:block">
              {nodes.length.toLocaleString()} shabads · {new Set(nodes.map(n => n.raag)).size} raags
            </span>
          )}
          <button
            onClick={onEnter}
            className="text-sm font-medium px-5 py-2 rounded-lg transition-all"
            style={{ color: '#F97316', border: '1.5px solid rgba(249,115,22,0.35)', background: 'rgba(249,115,22,0.06)' }}
          >
            Open graph →
          </button>
        </div>
      </header>

      {/* Hero — bottom-left, Cosmograph style */}
      <div className="relative z-10 flex-1 flex items-end px-8 sm:px-12 pb-14 sm:pb-20">
        <div className="w-full max-w-xl">

          {/* Gurmukhi epigraph */}
          <p className="font-gurmukhi text-accent text-2xl mb-5 leading-none"
            style={{ textShadow: '0 0 60px rgba(249,115,22,0.5)' }}>
            ੴ ਸਤਿ ਨਾਮੁ
          </p>

          {/* Main headline */}
          <h1 className="hero-title text-[3.2rem] sm:text-[4.8rem] text-white mb-5"
            style={{ textShadow: '0 2px 40px rgba(0,0,0,0.8)' }}>
            Sri Guru<br />
            Granth Sahib Ji,<br />
            <em className="not-italic" style={{ color: '#F97316' }}>connected.</em>
          </h1>

          <p className="text-slate-400 text-base leading-relaxed mb-8 max-w-md">
            5,548 shabads from the eternal Guru — mapped by raag, writer, and virtue.
            Search by meaning. Discover connections across centuries.
          </p>

          {/* Search */}
          <div className="relative mb-5">
            <div
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all"
              style={{
                background: 'rgba(5,10,22,0.95)',
                border: '1.5px solid rgba(249,115,22,0.3)',
                boxShadow: '0 0 0 0px rgba(249,115,22,0)',
                transition: 'border-color 0.15s, box-shadow 0.15s'
              }}
              onFocus={() => {}}
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ color: '#F97316', flexShrink: 0 }}>
                <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                value={query}
                onChange={handleInput}
                onKeyDown={handleKey}
                placeholder="Search a virtue, raag, or concept…"
                className="flex-1 bg-transparent text-white placeholder-slate-600 outline-none text-sm"
                autoFocus
              />
              {query && (
                <button onClick={() => { setQuery(''); setResults([]); }}
                  className="text-slate-600 hover:text-slate-400 flex-shrink-0">✕</button>
              )}
            </div>

            {/* Search results */}
            {results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden shadow-2xl z-20"
                style={{ background: 'rgba(5,10,22,0.98)', border: '1px solid rgba(249,115,22,0.2)' }}>
                {results.map(node => (
                  <button key={node.id} onClick={() => handleSelect(node)}
                    className="w-full text-left px-4 py-3 transition-colors border-b last:border-0"
                    style={{ borderColor: 'rgba(249,115,22,0.08)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div className="text-sm text-slate-200 truncate">{node.english.slice(0, 80)}…</div>
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
            <a
              href="https://ravjothbrar.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-medium transition-all"
              style={{ border: '1.5px solid rgba(139,92,246,0.35)', background: 'rgba(139,92,246,0.08)', color: '#a78bfa' }}
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
                <circle cx="6" cy="4" r="2.5"/>
                <path d="M1.5 10.5c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5"/>
              </svg>
              by Ravjoth Brar
            </a>
          </div>
        </div>
      </div>

      {/* Bottom info strip */}
      <div className="relative z-10 px-8 sm:px-12 py-4 flex items-center gap-6 border-t"
        style={{ borderColor: 'rgba(249,115,22,0.08)' }}>
        {['31 raags', '15 writers', 'Ang 1–1430', 'Dr. Sant Singh Khalsa translation'].map(s => (
          <span key={s} className="text-xs text-slate-700 hidden sm:block">{s}</span>
        ))}
        <span className="text-xs text-slate-700 sm:hidden">ShabadOS · DSSK translation</span>
      </div>
    </div>
  );
}
