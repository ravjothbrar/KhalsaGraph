import { useState, useRef, useCallback, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { keywordSearch } from '../services/search';
import { semanticSearch } from '../services/semanticSearch';
import { getRaagColor } from '../constants/raagColors';

export default function SearchBar() {
  const [tab, setTab] = useState('keyword');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [semanticStatus, setSemanticStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const nodes = useStore(s => s.nodes);
  const setSelectedNode = useStore(s => s.setSelectedNode);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  const resolveNodes = useCallback((ids) => {
    return ids.map(id => nodes.find(n => n.id === id)).filter(Boolean);
  }, [nodes]);

  const handleKeyword = useCallback((q) => {
    if (!q.trim()) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const ids = await keywordSearch(q, 10);
      setResults(resolveNodes(ids));
    }, 150);
  }, [resolveNodes]);

  const handleSemantic = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await semanticSearch(q, nodes, 10, (msg) => setSemanticStatus(msg));
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
    setOpen(true);
    if (tab === 'keyword') handleKeyword(q);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (tab === 'semantic') handleSemantic(query);
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
      }
      if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4">
      <div className="glass rounded-2xl overflow-hidden shadow-2xl">
        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {['keyword', 'semantic'].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setResults([]); setQuery(''); }}
              className={`flex-1 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                tab === t ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t === 'keyword' ? '⚡ Keyword' : '✦ Semantic'}
            </button>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSearch} className="flex items-center px-4 py-3 gap-3">
          <span className="text-slate-500">🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={handleInput}
            onFocus={() => results.length && setOpen(true)}
            placeholder={tab === 'keyword'
              ? 'Search Gurbani, raag, virtue… (⌘K)'
              : 'Describe a feeling or concept…'}
            className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm"
          />
          {tab === 'semantic' && (
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="text-xs px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors"
            >
              {loading ? '…' : 'Search'}
            </button>
          )}
          {query && (
            <button type="button" onClick={() => { setQuery(''); setResults([]); setOpen(false); }}
              className="text-slate-500 hover:text-white text-xs">✕</button>
          )}
        </form>

        {/* Semantic status */}
        {semanticStatus && (
          <div className="px-4 pb-2 text-xs text-indigo-300 flex items-center gap-2">
            <span className="animate-spin">⟳</span> {semanticStatus}
          </div>
        )}

        {/* Results dropdown */}
        {open && results.length > 0 && (
          <div className="border-t border-white/10 max-h-72 overflow-y-auto">
            {results.map(node => (
              <button
                key={node.id}
                onClick={() => handleSelect(node)}
                className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
              >
                <div className="text-sm text-white truncate">{node.english || node.transliteration}</div>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: getRaagColor(node.raagSlug) + '33', color: getRaagColor(node.raagSlug) }}
                  >
                    {node.raag}
                  </span>
                  {(node.tags || []).slice(0, 2).map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
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
