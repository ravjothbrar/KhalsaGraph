import { useState, useRef, useCallback, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { keywordSearch } from '../services/search';
import { semanticSearch } from '../services/semanticSearch';
import { getRaagColor } from '../constants/raagColors';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(null); // null | 'searching' | string (semantic status)
  const [isSemantic, setIsSemantic] = useState(false);

  const nodes = useStore(s => s.nodes);
  const setSelectedNode = useStore(s => s.setSelectedNode);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  const resolveNodes = useCallback((ids) =>
    ids.map(id => nodes.find(n => n.id === id)).filter(Boolean), [nodes]);

  const runSearch = useCallback(async (q, instant = false) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }

    const delay = instant ? 0 : 200;
    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setStatus('searching');

      // 1. Keyword search first (fast, client-side)
      const ids = await keywordSearch(q, 8);
      const kwResults = resolveNodes(ids);

      if (kwResults.length >= 2) {
        setResults(kwResults);
        setIsSemantic(false);
        setStatus(null);
        setOpen(true);
        return;
      }

      // 2. Keyword found < 2 results → fall back to semantic
      if (q.trim().length >= 3) {
        try {
          const semResults = await semanticSearch(q, nodes, 8, (msg) => setStatus(msg));
          const filtered = semResults.filter(Boolean);
          setResults(filtered.length > kwResults.length ? filtered : kwResults);
          setIsSemantic(filtered.length > kwResults.length);
        } catch {
          setResults(kwResults);
          setIsSemantic(false);
        }
      } else {
        setResults(kwResults);
        setIsSemantic(false);
      }

      setStatus(null);
      setOpen(true);
    }, delay);
  }, [nodes, resolveNodes]);

  const handleInput = (e) => {
    const q = e.target.value;
    setQuery(q);
    if (!q.trim()) { setResults([]); setOpen(false); setStatus(null); return; }
    runSearch(q, false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      runSearch(query, true);
    }
    if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
  };

  const handleSelect = (node) => {
    setSelectedNode(node);
    setOpen(false);
    setQuery('');
    setResults([]);
    setStatus(null);
  };

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-4">
      <div className="search-bar rounded-xl overflow-visible" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}>
        <div className="flex items-center px-4 py-3 gap-3">
          {/* Icon: spinning when searching, static otherwise */}
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
            className={status ? 'animate-spin' : ''}
            style={{ color: status ? '#A78BFA' : '#F97316', flexShrink: 0, transition: 'color 0.2s' }}>
            {status
              ? <path d="M8 1.5A6.5 6.5 0 1 1 1.5 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              : <>
                  <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </>
            }
          </svg>

          <input
            ref={inputRef}
            value={query}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length && setOpen(true)}
            placeholder="Search Gurbani, describe a feeling, or name a raag…"
            className="flex-1 bg-transparent text-white placeholder-slate-700 outline-none text-sm min-w-0"
          />

          {/* Semantic indicator */}
          {isSemantic && results.length > 0 && (
            <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(139,92,246,0.12)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)' }}>
              ✦ AI
            </span>
          )}

          {query && (
            <button onClick={() => { setQuery(''); setResults([]); setOpen(false); setStatus(null); }}
              className="flex-shrink-0 text-slate-700 hover:text-slate-400 text-xs w-4 text-center">✕
            </button>
          )}
        </div>

        {/* Status line */}
        {status && status !== 'searching' && (
          <div className="px-4 pb-2.5 text-xs flex items-center gap-2 border-t"
            style={{ color: '#A78BFA', borderColor: 'rgba(139,92,246,0.12)' }}>
            <span className="inline-block animate-spin">⟳</span> {status}
          </div>
        )}

        {/* Results */}
        {open && results.length > 0 && (
          <div className="border-t max-h-72 overflow-y-auto rounded-b-xl"
            style={{ borderColor: 'rgba(249,115,22,0.1)' }}>
            {results.map(node => (
              <button key={node.id} onClick={() => handleSelect(node)}
                className="w-full text-left px-4 py-2.5 transition-colors border-b last:border-0 group"
                style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div className="text-sm text-slate-300 truncate group-hover:text-white transition-colors">
                  {node.english?.slice(0, 80) || node.gurmukhi?.slice(0, 40)}…
                </div>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  <span className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: getRaagColor(node.raagSlug) + '20', color: getRaagColor(node.raagSlug) }}>
                    {node.raag}
                  </span>
                  {(node.tags || []).slice(0, 2).map(tag => (
                    <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full text-slate-600"
                      style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.1)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
