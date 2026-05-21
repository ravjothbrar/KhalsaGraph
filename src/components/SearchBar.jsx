import { useState, useRef, useCallback, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { keywordSearch } from '../services/search';
import { semanticSearch } from '../services/semanticSearch';
import { getRaagColor } from '../constants/raagColors';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [semanticStatus, setSemanticStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('keyword');

  const nodes = useStore(s => s.nodes);
  const setSelectedNode = useStore(s => s.setSelectedNode);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  const resolveNodes = useCallback((ids) =>
    ids.map(id => nodes.find(n => n.id === id)).filter(Boolean), [nodes]);

  const runKeyword = useCallback((q) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const ids = await keywordSearch(q, 8);
      setResults(resolveNodes(ids));
      setOpen(true);
    }, 150);
  }, [resolveNodes]);

  const runSemantic = useCallback(async (q) => {
    setLoading(true);
    setOpen(true);
    try {
      const res = await semanticSearch(q, nodes, 8, (msg) => setSemanticStatus(msg));
      setResults(res.filter(Boolean));
    } catch (e) {
      setSemanticStatus('Error: ' + e.message);
    } finally {
      setLoading(false);
      setSemanticStatus(null);
    }
  }, [nodes]);

  const handleInput = (e) => {
    const q = e.target.value;
    setQuery(q);
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    if (mode === 'keyword') runKeyword(q);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      if (mode === 'semantic') runSemantic(query);
      else if (results.length > 0) handleSelect(results[0]);
    }
    if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
  };

  const handleSelect = (node) => {
    setSelectedNode(node);
    setOpen(false);
    setQuery('');
    setResults([]);
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
      <div className="search-bar rounded-xl shadow-2xl overflow-visible">
        <div className="flex items-center px-3 py-2.5 gap-2.5">
          {/* Mode toggle */}
          <div className="nav-pill flex-shrink-0">
            <button
              className={mode === 'keyword' ? 'active' : ''}
              onClick={() => { setMode('keyword'); setResults([]); }}
              title="Keyword search">⚡
            </button>
            <button
              className={mode === 'semantic' ? 'active' : ''}
              onClick={() => { setMode('semantic'); setResults([]); }}
              title="Semantic search">✦
            </button>
          </div>

          <input
            ref={inputRef}
            value={query}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length && setOpen(true)}
            placeholder={mode === 'keyword' ? 'Search Gurbani, raag, virtue…' : 'Describe a feeling or concept…'}
            className="flex-1 bg-transparent text-white placeholder-slate-700 outline-none text-sm min-w-0"
          />

          {mode === 'semantic' && query.trim() && (
            <button
              onClick={() => runSemantic(query)}
              disabled={loading}
              className="flex-shrink-0 text-xs px-2.5 py-1 rounded-lg font-medium transition-colors disabled:opacity-40"
              style={{ background: 'rgba(249,115,22,0.15)', color: '#F97316', border: '1px solid rgba(249,115,22,0.25)' }}
            >
              {loading ? '…' : 'Go'}
            </button>
          )}

          {query && (
            <button onClick={() => { setQuery(''); setResults([]); setOpen(false); }}
              className="flex-shrink-0 text-slate-700 hover:text-slate-400 text-xs w-4 text-center">✕
            </button>
          )}
        </div>

        {/* Semantic status */}
        {semanticStatus && (
          <div className="px-3 pb-2.5 text-xs flex items-center gap-2 border-t"
            style={{ color: '#F97316', borderColor: 'rgba(249,115,22,0.12)' }}>
            <span className="inline-block animate-spin">⟳</span> {semanticStatus}
          </div>
        )}

        {/* Results */}
        {open && results.length > 0 && (
          <div className="border-t max-h-64 overflow-y-auto rounded-b-xl"
            style={{ borderColor: 'rgba(249,115,22,0.12)' }}>
            {results.map(node => (
              <button key={node.id} onClick={() => handleSelect(node)}
                className="w-full text-left px-3 py-2.5 transition-colors border-b last:border-0"
                style={{ borderColor: 'rgba(249,115,22,0.06)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div className="text-sm text-slate-300 truncate">{node.english}</div>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  <span className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: getRaagColor(node.raagSlug) + '20', color: getRaagColor(node.raagSlug) }}>
                    {node.raag}
                  </span>
                  {(node.tags || []).slice(0, 2).map(tag => (
                    <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full text-slate-500"
                      style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.1)' }}>
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
