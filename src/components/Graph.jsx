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

export default function Graph({ dimmed = false }) {
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

  // Phantom raag-label nodes — fixed at centroid of each raag cluster
  const raagLabelNodes = useMemo(() => {
    if (!nodes.length) return [];
    const map = new Map();
    for (const n of nodes) {
      if (!map.has(n.raagSlug)) {
        map.set(n.raagSlug, { raag: n.raag, raagSlug: n.raagSlug, sumX: 0, sumY: 0, count: 0 });
      }
      const g = map.get(n.raagSlug);
      g.sumX += n.clusterX;
      g.sumY += n.clusterY;
      g.count++;
    }
    return [...map.values()].map(g => ({
      id: `__raag__${g.raagSlug}`,
      raag: g.raag,
      raagSlug: g.raagSlug,
      isRaagLabel: true,
      // fixed position — won't move in simulation
      fx: g.sumX / g.count,
      fy: g.sumY / g.count,
      clusterX: g.sumX / g.count,
      clusterY: g.sumY / g.count,
    }));
  }, [nodes]);

  // CRITICAL: memoize graphData — new objects on every render reset simulation positions
  const graphData = useMemo(() => ({
    nodes: [...nodes.map(n => ({ ...n })), ...raagLabelNodes],
    links: edges.map(e => ({ ...e })),
  }), [nodes, edges, raagLabelNodes]);

  // For isolation: selected node + its direct neighbours
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

  const handleNodeClick = useCallback((node) => {
    if (node.isRaagLabel) {
      // Zoom to this raag cluster
      setActiveRaag(node.raagSlug);
      if (graphRef.current) {
        graphRef.current.centerAt(node.fx, node.fy, 600);
        graphRef.current.zoom(3.5, 600);
      }
      return;
    }
    setSelectedNode(node);
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 500);
      graphRef.current.zoom(7, 500);
    }
  }, [setSelectedNode, setActiveRaag]);

  const handleBackgroundClick = useCallback(() => {
    if (selectedNode) { setSelectedNode(null); return; }
    if (activeRaag) { setActiveRaag(null); return; }
  }, [selectedNode, activeRaag, setSelectedNode, setActiveRaag]);

  const handleEngineStop = useCallback(() => {
    if (graphRef.current) graphRef.current.pauseAnimation();
  }, []);

  const handleZoom = useCallback(({ k }) => {
    setSliderZoom(k);
  }, []);

  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    if (!isFinite(node.x) || !isFinite(node.y)) return;

    // ── Raag cluster label ──
    if (node.isRaagLabel) {
      // Only show at overview zoom; fade out as we zoom in
      const maxLabelZoom = 1.2;
      if (globalScale > maxLabelZoom) return;
      // Also hide during selectedNode isolation
      if (connectedIds) return;

      const alpha = Math.max(0, 1 - globalScale / maxLabelZoom);
      const color = getRaagColor(node.raagSlug);
      const isActive = activeRaag === node.raagSlug;
      const fs = 13 / globalScale;

      ctx.font = `700 ${fs}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      const text = node.raag || node.raagSlug;
      const tw = ctx.measureText(text).width;
      const pw = tw + fs * 2.0, ph = fs * 1.9;

      ctx.globalAlpha = alpha * (isActive ? 1 : 0.75);

      // Background pill
      ctx.fillStyle = isActive ? color + '30' : color + '12';
      ctx.strokeStyle = isActive ? color + '80' : color + '35';
      ctx.lineWidth = (isActive ? 1.5 : 1) / globalScale;
      ctx.beginPath();
      ctx.roundRect(node.x - pw / 2, node.y - ph / 2, pw, ph, ph / 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.fillText(text, node.x, node.y + fs * 0.38);
      ctx.globalAlpha = 1;
      return;
    }

    const color = getRaagColor(node.raagSlug);
    const baseR = MOOD_RADIUS[node.mood] || 6;
    const isSelected = selectedNode?.id === node.id;
    const isHovered = hoveredNode?.id === node.id;

    // Raag cluster dimming: if activeRaag set and this node is in a different raag
    const raagDimmed = activeRaag && node.raagSlug !== activeRaag;
    // Selection isolation
    const isIsolated = connectedIds && !connectedIds.has(node.id);

    if (isIsolated || raagDimmed) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, baseR * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = color + '18';
      ctx.fill();
      return;
    }

    const r = isSelected ? baseR * 3.2 : isHovered ? baseR * 1.6 : baseR;

    // Skip expensive glow at very low zoom
    if (globalScale < 0.6) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r * 0.75, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      return;
    }

    // Outer glow
    const glowR = r * (isSelected ? 3.5 : 2.5);
    const gradient = ctx.createRadialGradient(node.x, node.y, r * 0.15, node.x, node.y, glowR);
    gradient.addColorStop(0, color + (isSelected ? 'CC' : '88'));
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

    // Selected: purple ring
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 3.5 / globalScale, 0, Math.PI * 2);
      ctx.strokeStyle = '#A78BFA';
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();
      // outer white ring
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 6 / globalScale, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1 / globalScale;
      ctx.stroke();
    } else if (isHovered) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 2 / globalScale, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(167,139,250,0.5)';
      ctx.lineWidth = 1.5 / globalScale;
      ctx.stroke();
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
        ctx.font = isGurmukhi
          ? `${fs}px "Noto Sans Gurmukhi", serif`
          : `${fs}px Inter, sans-serif`;
        ctx.globalAlpha = fade;
        ctx.textAlign = 'center';

        const tw = ctx.measureText(text).width;
        const ph = fs * 2.0, pw = tw + fs * 1.6;
        const py = node.y + r + fs * 2.0;

        ctx.fillStyle = 'rgba(5,10,22,0.92)';
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
      ctx.font = `${fs}px Inter, sans-serif`;
      ctx.fillStyle = 'rgba(167,139,250,0.7)';
      ctx.textAlign = 'center';
      ctx.fillText(label, node.x, node.y + r + 10 / globalScale);
    }
  }, [selectedNode, hoveredNode, textMode, connectedIds, activeRaag]);

  const linkCanvasObject = useCallback((link, ctx, globalScale) => {
    if (globalScale < 0.25) return;

    const src = typeof link.source === 'object' ? link.source : null;
    const tgt = typeof link.target === 'object' ? link.target : null;
    if (!src || !tgt) return;
    if (src.isRaagLabel || tgt.isRaagLabel) return;
    if (!isFinite(src.x) || !isFinite(src.y) || !isFinite(tgt.x) || !isFinite(tgt.y)) return;

    const srcIsolated = connectedIds && !connectedIds.has(src.id);
    const tgtIsolated = connectedIds && !connectedIds.has(tgt.id);
    if (srcIsolated || tgtIsolated) return;

    const raagDimSrc = activeRaag && src.raagSlug !== activeRaag;
    const raagDimTgt = activeRaag && tgt.raagSlug !== activeRaag;
    if (raagDimSrc || raagDimTgt) return;

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
      const alpha = Math.min(0.45, (link.strength || 0.3) * 0.6);
      ctx.strokeStyle = `rgba(139,92,246,${alpha})`;
      ctx.lineWidth = 0.7;
    } else if (activeRaag) {
      const alpha = Math.min(0.35, (link.strength || 0.3) * 0.45);
      ctx.strokeStyle = `rgba(249,115,22,${alpha})`;
      ctx.lineWidth = 0.5;
    } else {
      const alpha = Math.min(0.18, (link.strength || 0.3) * 0.2) * Math.min(1, globalScale * 2);
      ctx.strokeStyle = `rgba(90,112,180,${alpha})`;
      ctx.lineWidth = 0.4;
    }
    ctx.stroke();
  }, [breadcrumb, connectedIds, activeRaag]);

  return (
    <div className="relative" style={{
      opacity: dimmed ? 0.88 : 1,
      transition: 'opacity 0.8s',
      filter: dimmed ? 'saturate(0.85)' : 'none',
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

      {/* Zoom slider — only visible in app mode */}
      {!dimmed && nodes.length > 0 && (
        <div
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 rounded-full"
          style={{
            background: 'rgba(5,10,22,0.88)',
            border: '1px solid rgba(139,92,246,0.25)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          }}
        >
          <span className="text-slate-600 text-xs select-none">−</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.005}
            value={zoomToSlider(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, sliderZoom)))}
            onChange={e => {
              const z = sliderToZoom(Number(e.target.value));
              setSliderZoom(z);
              graphRef.current?.zoom(z, 80);
            }}
            className="zoom-slider"
          />
          <span className="text-slate-600 text-xs select-none">+</span>
        </div>
      )}
    </div>
  );
}
