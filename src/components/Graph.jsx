import { useRef, useCallback, useState, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useStore } from '../store/useStore';
import { getRaagColor } from '../constants/raagColors';

const MOOD_RADIUS = { serene: 4, devotional: 6, contemplative: 5, joyful: 7, sorrowful: 4 };

export default function Graph({ dimmed = false }) {
  const graphRef = useRef(null);
  const nodes = useStore(s => s.nodes);
  const edges = useStore(s => s.edges);
  const selectedNode = useStore(s => s.selectedNode);
  const setSelectedNode = useStore(s => s.setSelectedNode);
  const breadcrumb = useStore(s => s.breadcrumb);
  const textMode = useStore(s => s.textMode);

  const [hoveredNode, setHoveredNode] = useState(null);

  // CRITICAL: memoize so ForceGraph2D never sees new objects on hover/zoom
  // Without this, every state update recreates graphData and resets simulation positions
  const graphData = useMemo(() => ({
    nodes: nodes.map(n => ({ ...n })),
    links: edges.map(e => ({ ...e })),
  }), [nodes, edges]);

  // IDs of the selected node + its direct neighbours
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
    setSelectedNode(node);
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 500);
      graphRef.current.zoom(6, 500);
    }
  }, [setSelectedNode]);

  const handleEngineStop = useCallback(() => {
    if (graphRef.current) graphRef.current.pauseAnimation();
  }, []);

  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    if (!isFinite(node.x) || !isFinite(node.y)) return;

    const color = getRaagColor(node.raagSlug);
    const baseR = MOOD_RADIUS[node.mood] || 5;
    const isSelected = selectedNode?.id === node.id;
    const isHovered = hoveredNode?.id === node.id;

    // Isolation: dim nodes not connected to the selection
    const isIsolated = connectedIds && !connectedIds.has(node.id);
    if (isIsolated) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, baseR * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = color + '18';
      ctx.fill();
      return;
    }

    const r = isSelected ? baseR * 1.8 : isHovered ? baseR * 1.3 : baseR;

    // Skip expensive glow at low zoom
    if (globalScale < 0.8) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      return;
    }

    // Glow
    const glowR = r * 2.5;
    const gradient = ctx.createRadialGradient(node.x, node.y, r * 0.2, node.x, node.y, glowR);
    gradient.addColorStop(0, color + '99');
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

    // Selected ring
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 2.5 / globalScale, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1.5 / globalScale;
      ctx.stroke();
    }

    // Node text at high zoom — always show Gurmukhi (or textMode override)
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
        const py = node.y + r + fs * 1.8;

        ctx.fillStyle = 'rgba(6,11,24,0.9)';
        ctx.beginPath();
        ctx.roundRect(node.x - pw / 2, py - ph / 2, pw, ph, fs * 0.4);
        ctx.fill();

        ctx.fillStyle = isGurmukhi ? '#F97316' : '#CBD5E1';
        ctx.fillText(text, node.x, py + fs * 0.35);
        ctx.globalAlpha = 1;
      }
    } else if (globalScale > 2.5 && (isSelected || isHovered)) {
      const label = (node.writer || '').replace(' Ji', '').replace('Guru ', '');
      const fs = 7 / globalScale;
      ctx.font = `${fs}px Inter, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.textAlign = 'center';
      ctx.globalAlpha = 0.7;
      ctx.fillText(label, node.x, node.y + r + 9 / globalScale);
      ctx.globalAlpha = 1;
    }
  }, [selectedNode, hoveredNode, textMode, connectedIds]);

  const linkCanvasObject = useCallback((link, ctx, globalScale) => {
    if (globalScale < 0.3) return;

    const src = typeof link.source === 'object' ? link.source : null;
    const tgt = typeof link.target === 'object' ? link.target : null;
    if (!src || !tgt) return;
    if (!isFinite(src.x) || !isFinite(src.y) || !isFinite(tgt.x) || !isFinite(tgt.y)) return;

    // Dim links from isolated nodes
    const srcIsolated = connectedIds && !connectedIds.has(src.id);
    const tgtIsolated = connectedIds && !connectedIds.has(tgt.id);
    if (srcIsolated || tgtIsolated) return;

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
      // Highlight edges between connected nodes
      const alpha = Math.min(0.4, (link.strength || 0.3) * 0.5);
      ctx.strokeStyle = `rgba(249,115,22,${alpha})`;
      ctx.lineWidth = 0.6;
    } else {
      const alpha = Math.min(0.18, (link.strength || 0.3) * 0.2) * Math.min(1, globalScale * 2);
      ctx.strokeStyle = `rgba(90,112,144,${alpha})`;
      ctx.lineWidth = 0.4;
    }
    ctx.stroke();
  }, [breadcrumb, connectedIds]);

  return (
    <div style={{ opacity: dimmed ? 0.15 : 1, transition: 'opacity 0.7s', filter: dimmed ? 'blur(2px) saturate(0.4)' : 'none' }}>
      {nodes.length > 0 ? (
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          width={window.innerWidth}
          height={window.innerHeight}
          backgroundColor="#060B18"
          nodeCanvasObject={nodeCanvasObject}
          nodeCanvasObjectMode={() => 'replace'}
          linkCanvasObject={linkCanvasObject}
          linkCanvasObjectMode={() => 'replace'}
          onNodeClick={handleNodeClick}
          onNodeHover={setHoveredNode}
          onBackgroundClick={() => setSelectedNode(null)}
          onEngineStop={handleEngineStop}
          warmupTicks={200}
          cooldownTicks={80}
          cooldownTime={3000}
          d3AlphaDecay={0.04}
          d3VelocityDecay={0.4}
          nodeRelSize={1}
          enableNodeDrag={!dimmed}
          enableZoomInteraction={!dimmed}
          minZoom={0.04}
          maxZoom={20}
        />
      ) : (
        <div style={{ width: '100vw', height: '100vh', background: '#060B18' }} />
      )}
    </div>
  );
}
