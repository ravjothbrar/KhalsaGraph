import { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { keywordSearch } from '../services/search';
import { getRaagColor } from '../constants/raagColors';

// A few hand-picked seed shabads to show on landing
const PREVIEW_IDS_HINTS = ['devotional', 'serene', 'contemplative'];

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
      const ids = await keywordSearch(q, 6);
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
  };

  // Pick 3 preview nodes
  const previews = nodes.length > 0
    ? PREVIEW_IDS_HINTS.map(mood => nodes.find(n => n.mood === mood && n.english.length > 80)).filter(Boolean).slice(0, 3)
    : [];

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto" style={{ background: '#060B18' }}>
      {/* Subtle radial accent */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(249,115,22,0.09) 0%, transparent 70%)'
      }} />

      {/* Nav */}
      <header className="relative flex items-center justify-between px-6 sm:px-10 py-6">
        <div className="flex items-center gap-2.5">
          <img src="/KhalsaGraph/favicon.svg" alt="KhalsaGraph" className="w-7 h-7" />
          <span className="text-white font-semibold tracking-tight">KhalsaGraph</span>
        </div>
        <nav className="flex items-center gap-1">
          {nodes.length > 0 && (
            <span className="text-slate-600 text-xs mr-3 hidden sm:block">
              {nodes.length.toLocaleString()} shabads
            </span>
          )}
          <button onClick={onEnter}
            className="text-sm text-slate-400 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-colors">
            Open graph →
          </button>
        </nav>
      </header>

      {/* Hero */}
      <main className="relative max-w-4xl mx-auto px-6 sm:px-10 pt-16 pb-8">
        {/* Gurmukhi epigraph */}
        <p className="font-gurmukhi text-accent/70 text-lg mb-10 tracking-wide">
          ੴ ਸਤਿ ਨਾਮੁ
        </p>

        {/* Headline — typographic, not salesy */}
        <h1 className="hero-title text-[2.8rem] sm:text-[4rem] md:text-[5.2rem] text-white leading-[1.02] tracking-tight mb-8">
          Sri Guru Granth<br />
          Sahib Ji,<br />
          <em className="text-accent not-italic">connected.</em>
        </h1>

        <p className="text-slate-400 text-lg leading-relaxed max-w-lg mb-12">
          5,548 shabads from the eternal Guru — mapped by raag,
          writer, and virtue. Search by meaning, discover connections
          across centuries, reflect with AI.
        </p>

        {/* Search */}
        <div className="relative max-w-xl mb-4">
          <div className="search-hero rounded-xl flex items-center gap-3 px-5 py-4">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent flex-shrink-0">
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              value={query}
              onChange={handleInput}
              onKeyDown={handleKey}
              placeholder="Search a virtue, raag, or concept…"
              className="flex-1 bg-transparent text-white placeholder-slate-600 outline-none"
              autoFocus
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults([]); }}
                className="text-slate-600 hover:text-slate-400 text-sm">✕</button>
            )}
          </div>

          {results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 glass rounded-xl overflow-hidden shadow-2xl z-10">
              {results.map(node => (
                <button key={node.id} onClick={() => handleSelect(node)}
                  className="w-full text-left px-5 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                  <div className="text-sm text-slate-200 truncate">{node.english.slice(0, 80)}…</div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: getRaagColor(node.raagSlug)+'22', color: getRaagColor(node.raagSlug) }}>
                      {node.raag}
                    </span>
                    <span className="text-xs text-slate-600">{node.writer}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={onEnter}
          className="btn-primary px-7 py-3 rounded-xl text-sm font-medium mb-24">
          Explore the knowledge graph →
        </button>

        {/* Preview shabads — editorial, not features grid */}
        {previews.length > 0 && (
          <section className="border-t border-white/6 pt-16">
            <p className="text-xs text-slate-600 uppercase tracking-widest mb-10">From the scripture</p>
            <div className="space-y-12">
              {previews.map((node, i) => (
                <button key={node.id} onClick={() => handleSelect(node)}
                  className="block text-left group w-full max-w-2xl">
                  <div className="font-gurmukhi text-accent/60 text-base mb-3 group-hover:text-accent/80 transition-colors">
                    {node.gurmukhi.split(' ').slice(0, 8).join(' ')}…
                  </div>
                  <p className="text-slate-400 text-base leading-relaxed group-hover:text-slate-300 transition-colors">
                    {node.english.split('.').slice(0, 2).join('.').trim()}.
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs px-2.5 py-1 rounded-full"
                      style={{ background: getRaagColor(node.raagSlug)+'18', color: getRaagColor(node.raagSlug) }}>
                      {node.raag}
                    </span>
                    <span className="text-xs text-slate-600">{node.writer}</span>
                    <span className="text-xs text-slate-700">Ang {node.ang}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="relative max-w-4xl mx-auto px-6 sm:px-10 py-10 mt-8 border-t border-white/5 flex items-center justify-between flex-wrap gap-4">
        <p className="text-slate-700 text-xs">
          Scripture data from <span className="text-slate-500">ShabadOS</span> ·
          Dr. Sant Singh Khalsa translation
        </p>

        {/* Creator pill */}
        <a
          href="https://ravjothbrar.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all hover:scale-105"
          style={{
            border: '1px solid rgba(139,92,246,0.4)',
            background: 'rgba(139,92,246,0.08)',
            color: '#a78bfa',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <circle cx="6" cy="4" r="2.5"/>
            <path d="M1.5 10.5c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5"/>
          </svg>
          Created by Ravjoth Brar
        </a>
      </footer>
    </div>
  );
}
