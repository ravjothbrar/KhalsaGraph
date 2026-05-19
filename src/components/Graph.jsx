import { useRef, useEffect, useCallback, useState } from 'react';
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
  const physicsEnabled = useStore(s => s.physicsEnabled);
  const textMode = useStore(s => s.textMode);

  const [hoveredNode, setHoveredNode] = useState(null);
  const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [currentZoom, setCurrentZoom] = useState(1);

  useEffect(() => {
    const onResize = () => setDims({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 600);
      graphRef.current.zoom(5, 600);
    }
  }, [setSelectedNode]);

  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    if (!isFinite(node.x) || !isFinite(node.y)) return;

    const color = getRaagColor(node.raagSlug);
    const baseR = MOOD_RADIUS[node.mood] || 5;
    const isSelected = selectedNode?.id === node.id;
    const isHovered = hoveredNode?.id === node.id;
    const r = isSelected ? baseR * 1.8 : isHovered ? baseR * 1.3 : baseR;

    // Skip expensive glow at low zoom — just draw a solid dot
    if (globalScale < 0.8) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      return;
    }

    // Glow at normal zoom
    const glowR = r * 2.5;
    const gradient = ctx.createRadialGradient(node.x, node.y, r * 0.2, node.x, node.y, glowR);
    gradient.addColorStop(0, color + '99');
    gradient.addColorStop(1, color + '00');
    ctx.beginPath();
    ctx.arc(node.x, node.y, glowR, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Main circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Selected ring
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 2.5 / globalScale, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1.5 / globalScale;
      ctx.stroke();
    }

    // Text on zoom
    if (globalScale > 4) {
      const fade = Math.min(1, (globalScale - 4) / 2);
      const rawText = textMode === 'gurmukhi'
        ? node.gurmukhi : textMode === 'transliteration'
        ? node.transliteration || node.english : node.english;

      // Show first sentence / first ~60 chars
      const text = (rawText || '').split(/[.।॥]/)[0].trim().slice(0, 60)
        + ((rawText || '').length > 60 ? '…' : '');

      if (text) {
        const fs = 8 / globalScale;
        ctx.font = `${fs}px Inter, sans-serif`;
        ctx.globalAlpha = fade;
        ctx.textAlign = 'center';

        const tw = ctx.measureText(text).width;
        const ph = fs * 1.8, pw = tw + fs * 1.4;
        const py = node.y + r + fs * 1.6;

        ctx.fillStyle = 'rgba(6,11,24,0.88)';
        ctx.beginPath();
        ctx.roundRect(node.x - pw/2, py - ph/2, pw, ph, fs * 0.3);
        ctx.fill();

        ctx.fillStyle = '#CBD5E1';
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
  }, [selectedNode, hoveredNode, textMode]);

  const linkCanvasObject = useCallback((link, ctx, globalScale) => {
    // Skip link rendering at very low zoom (performance)
    if (globalScale < 0.3) return;

    const src = typeof link.source === 'object' ? link.source : null;
    const tgt = typeof link.target === 'object' ? link.target : null;
    if (!src || !tgt) return;
    if (!isFinite(src.x) || !isFinite(src.y) || !isFinite(tgt.x) || !isFinite(tgt.y)) return;

    const srcBc = breadcrumb.indexOf(src.id);
    const tgtBc = breadcrumb.indexOf(tgt.id);
    const isBreadcrumb = srcBc !== -1 && tgtBc !== -1 && Math.abs(srcBc - tgtBc) === 1;

    ctx.beginPath();
    ctx.moveTo(src.x, src.y);
    ctx.lineTo(tgt.x, tgt.y);
    if (isBreadcrumb) {
      ctx.strokeStyle = 'rgba(249,115,22,0.4)';
      ctx.lineWidth = 1.2;
    } else {
      const alpha = Math.min(0.18, (link.strength || 0.3) * 0.2) * Math.min(1, globalScale * 2);
      ctx.strokeStyle = `rgba(90,112,144,${alpha})`;
      ctx.lineWidth = 0.4;
    }
    ctx.stroke();
  }, [breadcrumb]);

  const graphData = {
    nodes: nodes.map(n => ({ ...n })),
    links: edges.map(e => ({ ...e })),
  };

  return (
    <div style={{ opacity: dimmed ? 0.12 : 1, transition: 'opacity 0.6s', filter: dimmed ? 'blur(3px) saturate(0.5)' : 'none' }}>
      {nodes.length > 0 ? (
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          width={dims.w}
          height={dims.h}
          backgroundColor="#060B18"
          nodeCanvasObject={nodeCanvasObject}
          nodeCanvasObjectMode={() => 'replace'}
          linkCanvasObject={linkCanvasObject}
          linkCanvasObjectMode={() => 'replace'}
          onNodeClick={handleNodeClick}
          onNodeHover={setHoveredNode}
          onBackgroundClick={() => setSelectedNode(null)}
          onZoom={({ k }) => setCurrentZoom(k)}
          // Pre-run physics, then freeze — no ongoing simulation = no CPU drain
          warmupTicks={200}
          cooldownTicks={50}
          cooldownTime={2000}
          d3AlphaDecay={0.04}
          d3VelocityDecay={0.4}
          nodeRelSize={1}
          enableNodeDrag={!dimmed}
          enableZoomInteraction={!dimmed}
          minZoom={0.05}
          maxZoom={16}
        />
      ) : (
        <div style={{ width: '100vw', height: '100vh', background: '#060B18' }} />
      )}
    </div>
  );
}
