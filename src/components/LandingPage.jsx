import { useState, useRef, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { keywordSearch } from '../services/search';
import { getRaagColor } from '../constants/raagColors';

const PREVIEW_IDS_HINTS = ['devotional', 'serene', 'contemplative'];

// A static constellation preview that mimics the look of the knowledge graph
function GraphPreview({ onClick }) {
  // Generate a seeded pseudo-random constellation
  const dots = useMemo(() => {
    const seed = (n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };
    const raags = ['sri', 'majh', 'gauri', 'asa', 'gujri', 'sorath', 'dhanasri', 'bilaval', 'ramkali', 'maru', 'basant', 'sarang', 'malar', 'suhi'];
    const result = [];
    for (let i = 0; i < 120; i++) {
      const raag = raags[Math.floor(seed(i * 3) * raags.length)];
      const color = getRaagColor(raag);
      const x = 5 + seed(i * 7 + 1) * 90;
      const y = 5 + seed(i * 7 + 2) * 90;
      const r = 0.6 + seed(i * 7 + 3) * 2.4;
      result.push({ x, y, r, color, id: i });
    }
    return result;
  }, []);

  const lines = useMemo(() => {
    const seed = (n) => { let x = Math.sin(n + 99) * 10000; return x - Math.floor(x); };
    const result = [];
    for (let i = 0; i < 60; i++) {
      const a = Math.floor(seed(i * 5) * dots.length);
      const b = Math.floor(seed(i * 5 + 1) * dots.length);
      if (a !== b) result.push({ x1: dots[a].x, y1: dots[a].y, x2: dots[b].x, y2: dots[b].y });
    }
    return result;
  }, [dots]);

  return (
    <div
      onClick={onClick}
      className="relative cursor-pointer rounded-2xl overflow-hidden group"
      style={{ border: '1px solid rgba(249,115,22,0.12)', background: '#060B18' }}
    >
      <svg viewBox="0 0 100 100" className="w-full" style={{ display: 'block' }}>
        {/* Lines */}
        {lines.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke="rgba(90,112,144,0.18)" strokeWidth="0.15"/>
        ))}
        {/* Dots */}
        {dots.map(d => (
          <g key={d.id}>
            <circle cx={d.x} cy={d.y} r={d.r * 2.5} fill={d.color} opacity="0.06"/>
            <circle cx={d.x} cy={d.y} r={d.r} fill={d.color} opacity="0.85"/>
          </g>
        ))}
      </svg>

      {/* Hover overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'rgba(6,11,24,0.6)', backdropFilter: 'blur(2px)' }}>
        <div className="text-center">
          <div className="text-white font-medium text-sm mb-1">Explore the graph →</div>
          <div className="text-slate-400 text-xs">5,548 shabads · 31 raags</div>
        </div>
      </div>

      {/* Bottom label */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none">
        <span className="text-xs text-slate-600">Knowledge graph preview</span>
        <span className="text-xs text-slate-700">Click to explore</span>
      </div>
    </div>
  );
}

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

  const previews = nodes.length > 0
    ? PREVIEW_IDS_HINTS.map(mood => nodes.find(n => n.mood === mood && n.english.length > 80)).filter(Boolean).slice(0, 3)
    : [];

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto" style={{ background: '#060B18' }}>
      {/* Radial accent */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(249,115,22,0.08) 0%, transparent 70%)'
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
      <main className="relative max-w-4xl mx-auto px-6 sm:px-10 pt-14 pb-8">
        {/* Gurmukhi epigraph */}
        <p className="font-gurmukhi text-accent/60 text-lg mb-10 tracking-wide">
          ੴ ਸਤਿ ਨਾਮੁ
        </p>

        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
          {/* Left: headline + search */}
          <div>
            <h1 className="hero-title text-[2.6rem] sm:text-[3.4rem] text-white leading-[1.04] tracking-tight mb-6">
              Sri Guru Granth<br />
              Sahib Ji,<br />
              <em className="text-accent not-italic">connected.</em>
            </h1>

            <p className="text-slate-400 text-base leading-relaxed mb-8">
              5,548 shabads mapped by raag, writer, and virtue.
              Search by meaning, explore connections across centuries.
            </p>

            {/* Search */}
            <div className="relative mb-5">
              <div className="rounded-xl flex items-center gap-3 px-4 py-3.5"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="text-accent flex-shrink-0">
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
                    className="text-slate-600 hover:text-slate-400 text-sm">✕</button>
                )}
              </div>

              {results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 glass rounded-xl overflow-hidden shadow-2xl z-10">
                  {results.map(node => (
                    <button key={node.id} onClick={() => handleSelect(node)}
                      className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                      <div className="text-sm text-slate-200 truncate">{node.english.slice(0, 75)}…</div>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: getRaagColor(node.raagSlug) + '22', color: getRaagColor(node.raagSlug) }}>
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
              className="btn-primary px-6 py-2.5 rounded-xl text-sm font-medium">
              Explore the knowledge graph →
            </button>
          </div>

          {/* Right: graph preview */}
          <div className="hidden md:block">
            <GraphPreview onClick={onEnter} />
            <div className="mt-4 grid grid-cols-3 gap-2">
              {['31 raags', '15 writers', '10 centuries'].map(stat => (
                <div key={stat} className="text-center py-2.5 rounded-xl text-xs text-slate-500"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {stat}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preview shabads */}
        {previews.length > 0 && (
          <section className="border-t border-white/6 pt-14 mt-14">
            <p className="text-xs text-slate-600 uppercase tracking-widest mb-8">From the scripture</p>
            <div className="space-y-10">
              {previews.map((node) => (
                <button key={node.id} onClick={() => handleSelect(node)}
                  className="block text-left group w-full max-w-2xl">
                  <div className="font-gurmukhi text-accent/50 text-base mb-3 group-hover:text-accent/75 transition-colors">
                    {node.gurmukhi.split(' ').slice(0, 8).join(' ')}…
                  </div>
                  <p className="text-slate-400 text-base leading-relaxed group-hover:text-slate-300 transition-colors">
                    {node.english.split('.').slice(0, 2).join('.').trim()}.
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs px-2.5 py-1 rounded-full"
                      style={{ background: getRaagColor(node.raagSlug) + '18', color: getRaagColor(node.raagSlug) }}>
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
        <a
          href="https://ravjothbrar.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all hover:scale-105"
          style={{ border: '1px solid rgba(139,92,246,0.4)', background: 'rgba(139,92,246,0.08)', color: '#a78bfa' }}
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
