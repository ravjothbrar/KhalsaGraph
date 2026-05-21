import { useRef, useCallback, useState, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useStore } from '../store/useStore';
import { getRaagColor } from '../constants/raagColors';

const MOOD_RADIUS = { serene: 6, devotional: 9, contemplative: 7, joyful: 10, sorrowful: 6 };
const MIN_ZOOM = 0.04;
const MAX_ZOOM = 20;

const zoomToSlider = (z) =>
  (Math.log(z) - Math.log(MIN_ZOOM)) / (Math.log(MAX_ZOOM) - Math.log(MIN_ZOOM));
const sliderToZoom = (s) =>
  Math.exp(s * (Math.log(MAX_ZOOM) - Math.log(MIN_ZOOM)) + Math.log(MIN_ZOOM));

// onEnterFromClick: called when user clicks a node while on landing page
export default function Graph({ dimmed = false, onEnterFromClick = null }) {
  const graphRef = useRef(null);
  const nodes = useStore(s => s.nodes);
  const edges = useStore(s => s.edges);
  const selectedNode = useStore(s => s.selectedNode);
  const setSelectedNode = useStore(s => s.setSelectedNode);
  const activeRaag = useStore(s => s.activeRaag);
  const setActiveRaag = useStore(s => s.setActiveRaag);
  const breadcrumb = useStore(s => s.breadcrumb);
  const textMode = useStore(s => s.textMode);

  const [hoveredNode, setHoveredNode] = useState(null);
  const [sliderZoom, setSliderZoom] = useState(1);

  // Raag label overlay — positions computed from actual node positions after simulation
  const raagCentroidsRef = useRef([]);
  const [labelPositions, setLabelPositions] = useState([]);

  // CRITICAL: memoize — prevents simulation reset on every hover/zoom re-render
  const graphData = useMemo(() => ({
    nodes: nodes.map(n => ({ ...n })),
    links: edges.map(e => ({ ...e })),
  }), [nodes, edges]);

  // Selection isolation: selected node + direct neighbours
  const connectedIds = useMemo(() => {
    if (!selectedNode) return null;
    const ids = new Set([selectedNode.id]);
    for (const e of edges) {
      const src = typeof e.source === 'object' ? e.source.id : e.source;
      const tgt = typeof e.target === 'object' ? e.target.id : e.target;
      if (src === selectedNode.id) ids.add(tgt);
      if (tgt === selectedNode.id) ids.add(src);
    }
    return ids;
  }, [selectedNode, edges]);

  // Edge strength map: neighbourId → strength (for similarity % badges)
  const edgeStrengths = useMemo(() => {
    if (!selectedNode) return new Map();
    const map = new Map();
    for (const e of edges) {
      const src = typeof e.source === 'object' ? e.source.id : e.source;
      const tgt = typeof e.target === 'object' ? e.target.id : e.target;
      const s = e.strength || 0;
      if (src === selectedNode.id) map.set(tgt, s);
      if (tgt === selectedNode.id) map.set(src, s);
    }
    return map;
  }, [selectedNode, edges]);

  const updateLabelPositions = useCallback(() => {
    if (!graphRef.current || !raagCentroidsRef.current.length) return;
    setLabelPositions(
      raagCentroidsRef.current.map(c => ({
        ...c,
        ...graphRef.current.graph2ScreenCoords(c.x, c.y),
      }))
    );
  }, []);

  const handleNodeClick = useCallback((node) => {
    if (onEnterFromClick) {
      // Landing page click → enter app with this node selected
      setSelectedNode(node);
      onEnterFromClick();
      return;
    }
    setSelectedNode(node);
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 500);
      graphRef.current.zoom(7, 500);
    }
  }, [setSelectedNode, onEnterFromClick]);

  const handleBackgroundClick = useCallback(() => {
    if (onEnterFromClick) { onEnterFromClick(); return; }
    if (selectedNode) { setSelectedNode(null); return; }
    if (activeRaag) { setActiveRaag(null); return; }
  }, [selectedNode, activeRaag, setSelectedNode, setActiveRaag, onEnterFromClick]);

  const handleEngineStop = useCallback(() => {
    graphRef.current?.pauseAnimation();
    // Compute actual raag centroids from real post-simulation node positions
    const map = new Map();
    for (const n of graphData.nodes) {
      if (!isFinite(n.x) || !isFinite(n.y) || !n.raagSlug) continue;
      if (!map.has(n.raagSlug)) {
        map.set(n.raagSlug, { raag: n.raag, raagSlug: n.raagSlug, sumX: 0, sumY: 0, count: 0 });
      }
      const g = map.get(n.raagSlug);
      g.sumX += n.x; g.sumY += n.y; g.count++;
    }
    raagCentroidsRef.current = [...map.values()].map(g => ({
      ...g, x: g.sumX / g.count, y: g.sumY / g.count,
    }));
    updateLabelPositions();
  }, [graphData.nodes, updateLabelPositions]);

  const handleZoom = useCallback(({ k }) => {
    setSliderZoom(k);
    updateLabelPositions();
  }, [updateLabelPositions]);

  const handleRaagLabelClick = useCallback((c) => {
    setActiveRaag(c.raagSlug);
    if (graphRef.current) {
      graphRef.current.centerAt(c.x, c.y, 600);
      graphRef.current.zoom(3.5, 600);
    }
  }, [setActiveRaag]);

  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    if (!isFinite(node.x) || !isFinite(node.y)) return;

    const color = getRaagColor(node.raagSlug);
    const baseR = MOOD_RADIUS[node.mood] || 6;
    const isSelected = selectedNode?.id === node.id;
    const isHovered = hoveredNode?.id === node.id;

    // Raag isolation + selection isolation
    const raagDimmed = activeRaag && node.raagSlug !== activeRaag;
    const isIsolated = connectedIds && !connectedIds.has(node.id);

    if (isIsolated || raagDimmed) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, baseR * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = color + '15';
      ctx.fill();
      return;
    }

    const r = isSelected ? baseR * 3.2 : isHovered ? baseR * 1.6 : baseR;

    if (globalScale < 0.6) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r * 0.75, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      return;
    }

    // Glow
    const glowR = r * (isSelected ? 4.0 : 2.8);
    const gradient = ctx.createRadialGradient(node.x, node.y, r * 0.1, node.x, node.y, glowR);
    gradient.addColorStop(0, color + (isSelected ? 'DD' : '99'));
    gradient.addColorStop(1, color + '00');
    ctx.beginPath();
    ctx.arc(node.x, node.y, glowR, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Main dot
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Selection ring — purple
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 4 / globalScale, 0, Math.PI * 2);
      ctx.strokeStyle = '#A78BFA';
      ctx.lineWidth = 2.5 / globalScale;
      ctx.stroke();
    } else if (isHovered) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 2 / globalScale, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(167,139,250,0.55)';
      ctx.lineWidth = 1.5 / globalScale;
      ctx.stroke();
    }

    // Similarity % badge on connected neighbour nodes
    if (!isSelected && connectedIds && connectedIds.has(node.id) && globalScale > 1.0) {
      const strength = edgeStrengths.get(node.id);
      if (strength !== undefined && strength > 0) {
        const pct = Math.round(strength * 100);
        const label = `${pct}%`;
        const fs = 6 / globalScale;
        ctx.font = `700 ${fs}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        const tw = ctx.measureText(label).width;
        const pw = tw + fs * 1.6, ph = fs * 1.8;
        const py = node.y - r - ph * 0.6;

        ctx.fillStyle = 'rgba(139,92,246,0.88)';
        ctx.beginPath();
        ctx.roundRect(node.x - pw / 2, py - ph / 2, pw, ph, ph / 2);
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.fillText(label, node.x, py + fs * 0.38);
      }
    }

    // Node text at high zoom
    if (globalScale > 4) {
      const fade = Math.min(1, (globalScale - 4) / 2);
      const rawText = textMode === 'english'
        ? node.english
        : textMode === 'transliteration'
        ? node.transliteration || node.english
        : node.gurmukhi;
      const text = (rawText || '').split(/[.।॥\n]/)[0].trim().slice(0, 55)
        + ((rawText || '').length > 55 ? '…' : '');
      if (text) {
        const isGurmukhi = textMode === 'gurmukhi';
        const fs = (isGurmukhi ? 9 : 7.5) / globalScale;
        ctx.font = isGurmukhi ? `${fs}px "Noto Sans Gurmukhi",serif` : `${fs}px Inter,sans-serif`;
        ctx.globalAlpha = fade;
        ctx.textAlign = 'center';
        const tw = ctx.measureText(text).width;
        const ph = fs * 2.0, pw = tw + fs * 1.6;
        const py = node.y + r + fs * 2.2;
        ctx.fillStyle = 'rgba(4,7,18,0.92)';
        ctx.beginPath();
        ctx.roundRect(node.x - pw / 2, py - ph / 2, pw, ph, fs * 0.5);
        ctx.fill();
        ctx.fillStyle = isGurmukhi ? '#F97316' : '#CBD5E1';
        ctx.fillText(text, node.x, py + fs * 0.35);
        ctx.globalAlpha = 1;
      }
    } else if (globalScale > 2 && (isSelected || isHovered)) {
      const label = (node.writer || '').replace(' Ji', '').replace('Guru ', '');
      const fs = 7 / globalScale;
      ctx.font = `${fs}px Inter,sans-serif`;
      ctx.fillStyle = 'rgba(167,139,250,0.75)';
      ctx.textAlign = 'center';
      ctx.fillText(label, node.x, node.y + r + 10 / globalScale);
    }
  }, [selectedNode, hoveredNode, textMode, connectedIds, activeRaag, edgeStrengths]);

  const linkCanvasObject = useCallback((link, ctx, globalScale) => {
    if (globalScale < 0.25) return;
    const src = typeof link.source === 'object' ? link.source : null;
    const tgt = typeof link.target === 'object' ? link.target : null;
    if (!src || !tgt) return;
    if (!isFinite(src.x) || !isFinite(src.y) || !isFinite(tgt.x) || !isFinite(tgt.y)) return;

    const srcIsolated = connectedIds && !connectedIds.has(src.id);
    const tgtIsolated = connectedIds && !connectedIds.has(tgt.id);
    if (srcIsolated || tgtIsolated) return;
    if (activeRaag && (src.raagSlug !== activeRaag || tgt.raagSlug !== activeRaag)) return;

    const srcBc = breadcrumb.indexOf(src.id);
    const tgtBc = breadcrumb.indexOf(tgt.id);
    const isBreadcrumb = srcBc !== -1 && tgtBc !== -1 && Math.abs(srcBc - tgtBc) === 1;

    ctx.beginPath();
    ctx.moveTo(src.x, src.y);
    ctx.lineTo(tgt.x, tgt.y);
    if (isBreadcrumb) {
      ctx.strokeStyle = 'rgba(249,115,22,0.5)';
      ctx.lineWidth = 1.4;
    } else if (connectedIds) {
      const alpha = Math.min(0.5, (link.strength || 0.3) * 0.65);
      ctx.strokeStyle = `rgba(139,92,246,${alpha})`;
      ctx.lineWidth = 0.8;
    } else if (activeRaag) {
      ctx.strokeStyle = `rgba(249,115,22,${Math.min(0.35, (link.strength||0.3)*0.5)})`;
      ctx.lineWidth = 0.5;
    } else {
      const alpha = Math.min(0.18, (link.strength || 0.3) * 0.22) * Math.min(1, globalScale * 2);
      ctx.strokeStyle = `rgba(80,110,180,${alpha})`;
      ctx.lineWidth = 0.4;
    }
    ctx.stroke();
  }, [breadcrumb, connectedIds, activeRaag]);

  // Raag label overlay visibility
  const labelAlpha = selectedNode ? 0 : activeRaag ? 0 : Math.max(0, 1 - sliderZoom * 0.75);

  return (
    <div className="relative" style={{
      opacity: dimmed ? 0.95 : 1,
      transition: 'opacity 0.8s',
    }}>
      {nodes.length > 0 ? (
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          width={window.innerWidth}
          height={window.innerHeight}
          backgroundColor="#050A16"
          nodeCanvasObject={nodeCanvasObject}
          nodeCanvasObjectMode={() => 'replace'}
          linkCanvasObject={linkCanvasObject}
          linkCanvasObjectMode={() => 'replace'}
          onNodeClick={handleNodeClick}
          onNodeHover={setHoveredNode}
          onBackgroundClick={handleBackgroundClick}
          onEngineStop={handleEngineStop}
          onZoom={handleZoom}
          warmupTicks={200}
          cooldownTicks={80}
          cooldownTime={3000}
          d3AlphaDecay={0.04}
          d3VelocityDecay={0.4}
          nodeRelSize={1}
          enableNodeDrag={!dimmed}
          enableZoomInteraction={!dimmed}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
        />
      ) : (
        <div style={{ width: '100vw', height: '100vh', background: '#050A16' }} />
      )}

      {/* HTML Raag cluster labels — positioned at actual centroid screen coordinates */}
      {labelPositions.length > 0 && labelAlpha > 0.05 && (
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: labelAlpha }}>
          {labelPositions.map(c => {
            const color = getRaagColor(c.raagSlug);
            const isActive = activeRaag === c.raagSlug;
            return (
              <button
                key={c.raagSlug}
                onClick={() => handleRaagLabelClick(c)}
                className="absolute pointer-events-auto transition-all hover:scale-110"
                style={{
                  left: c.x,
                  top: c.y,
                  transform: 'translate(-50%, -50%)',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'Inter, sans-serif',
                  color,
                  background: isActive ? color + '28' : color + '10',
                  border: `1px solid ${color}${isActive ? '60' : '30'}`,
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                  boxShadow: isActive ? `0 0 16px ${color}30` : 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.raag}
              </button>
            );
          })}
        </div>
      )}

      {/* Zoom slider — only in app mode */}
      {!dimmed && nodes.length > 0 && (
        <div
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 rounded-full"
          style={{
            background: 'rgba(4,7,18,0.9)',
            border: '1px solid rgba(139,92,246,0.22)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          }}
        >
          <span className="text-slate-600 text-xs select-none font-medium">−</span>
          <input
            type="range" min={0} max={1} step={0.005}
            value={zoomToSlider(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, sliderZoom)))}
            onChange={e => {
              const z = sliderToZoom(Number(e.target.value));
              setSliderZoom(z);
              graphRef.current?.zoom(z, 80);
            }}
            className="zoom-slider"
          />
          <span className="text-slate-600 text-xs select-none font-medium">+</span>
        </div>
      )}
    </div>
  );
}
