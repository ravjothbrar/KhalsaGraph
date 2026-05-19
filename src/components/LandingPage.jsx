import { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { keywordSearch } from '../services/search';
import { getRaagColor } from '../constants/raagColors';

const FEATURES = [
  {
    icon: '✦',
    title: 'Knowledge Graph',
    desc: '5,000 shabads mapped by raag, writer, and virtue — explore connections invisible in linear text.',
  },
  {
    icon: '◈',
    title: 'Semantic Search',
    desc: 'Describe a feeling or concept in plain English. Find verses by meaning, not just keywords.',
  },
  {
    icon: '⊕',
    title: 'AI Interpretation',
    desc: 'Socratic dialogue with each shabad — philosophical breakdown, modern relevance, daily virtues.',
  },
  {
    icon: '◎',
    title: 'Daily Path',
    desc: 'Save virtue practices from any shabad. Build a personal spiritual practice, day by day.',
  },
];

export default function LandingPage({ onEnter }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const nodes = useStore(s => s.nodes);
  const setSelectedNode = useStore(s => s.setSelectedNode);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

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

  const handleEnterKey = (e) => {
    if (e.key === 'Enter') {
      if (results.length > 0) handleSelect(results[0]);
      else onEnter();
    }
  };

  return (
    <div className="fixed inset-0 z-40 landing-gradient flex flex-col overflow-y-auto">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <img src="/KhalsaGraph/favicon.svg" alt="" className="w-7 h-7" />
          <span className="font-semibold text-white tracking-tight">KhalsaGraph</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-space-700 hidden sm:block">
            {nodes.length > 0 ? `${nodes.length.toLocaleString()} shabads loaded` : 'Loading…'}
          </span>
          <button
            onClick={onEnter}
            className="text-sm text-muted hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
          >
            Open Graph →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-8 pb-16 text-center">
        {/* Gurmukhi epigraph */}
        <div className="font-gurmukhi text-accent/80 text-lg mb-8 tracking-wide">
          ੴ ਸਤਿ ਨਾਮੁ
        </div>

        {/* Headline */}
        <h1 className="hero-title text-5xl sm:text-6xl md:text-7xl text-white max-w-3xl mx-auto mb-6">
          Every verse,{' '}
          <span className="text-accent italic orange-glow">connected.</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
          Explore Sri Guru Granth Sahib Ji through an interactive knowledge graph.
          Search by meaning, discover connections across raags, and reflect with AI.
        </p>

        {/* Hero search bar */}
        <div className="w-full max-w-2xl mx-auto mb-4 relative">
          <div className="search-hero rounded-2xl flex items-center gap-4 px-6 py-4">
            <span className="text-accent text-lg flex-shrink-0">⌕</span>
            <input
              ref={inputRef}
              value={query}
              onChange={handleInput}
              onKeyDown={handleEnterKey}
              placeholder="Search a virtue, raag, or feeling…"
              className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-base"
              autoFocus
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults([]); }}
                className="text-slate-600 hover:text-slate-400 text-sm">✕</button>
            )}
          </div>

          {/* Search dropdown */}
          {results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 glass rounded-xl overflow-hidden shadow-2xl z-10">
              {results.map(node => (
                <button
                  key={node.id}
                  onClick={() => handleSelect(node)}
                  className="w-full text-left px-5 py-3.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                >
                  <div className="text-sm text-white truncate mb-1">{node.english}</div>
                  <div className="flex gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: getRaagColor(node.raagSlug)+'22', color: getRaagColor(node.raagSlug) }}>
                      {node.raag}
                    </span>
                    <span className="text-xs text-slate-500">{node.writer}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={onEnter}
          className="btn-primary px-8 py-3.5 rounded-xl text-sm font-medium mb-16"
        >
          Explore the Knowledge Graph →
        </button>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl w-full mx-auto">
          {FEATURES.map(f => (
            <div key={f.title} className="feature-card rounded-xl p-5 text-left">
              <div className="text-accent text-xl mb-3">{f.icon}</div>
              <div className="font-medium text-white text-sm mb-2">{f.title}</div>
              <div className="text-xs text-slate-500 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-8 mt-12 text-center">
          {[
            ['5,000+', 'Shabads'],
            ['31', 'Raags'],
            ['18', 'Contributors'],
            ['BYOK', 'No data stored'],
          ].map(([val, label]) => (
            <div key={label}>
              <div className="text-white font-semibold text-lg">{val}</div>
              <div className="text-slate-500 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
