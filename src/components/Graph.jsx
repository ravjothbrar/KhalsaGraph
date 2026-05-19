import { useRef, useEffect, useCallback, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useStore } from '../store/useStore';
import { getRaagColor } from '../constants/raagColors';

const MOOD_RADIUS = { serene: 5, devotional: 7, contemplative: 6, joyful: 8, sorrowful: 5 };

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
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const onResize = () => setDims({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!graphRef.current || !physicsEnabled) return;
    const timer = setTimeout(() => {
      try { graphRef.current?.d3Force('charge')?.strength(0); } catch {}
    }, 5000);
    return () => clearTimeout(timer);
  }, [nodes, physicsEnabled]);

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 700);
      graphRef.current.zoom(5, 700);
    }
  }, [setSelectedNode]);

  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    if (!isFinite(node.x) || !isFinite(node.y)) return;

    const color = getRaagColor(node.raagSlug);
    const baseR = MOOD_RADIUS[node.mood] || 6;
    const isSelected = selectedNode?.id === node.id;
    const isHovered = hoveredNode?.id === node.id;
    const r = isSelected ? baseR * 1.7 : isHovered ? baseR * 1.3 : baseR;

    // Outer glow
    const glowR = r * 2.8;
    const gradient = ctx.createRadialGradient(node.x, node.y, r * 0.3, node.x, node.y, glowR);
    gradient.addColorStop(0, color + 'aa');
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
      ctx.arc(node.x, node.y, r + 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1.5 / globalScale;
      ctx.stroke();
    }

    // Node text on zoom
    const textZoom = 4;
    if (globalScale > textZoom) {
      const fade = Math.min(1, (globalScale - textZoom) / 2);
      const text = textMode === 'gurmukhi'
        ? (node.gurmukhi || '').slice(0, 40)
        : textMode === 'transliteration'
        ? (node.transliteration || '').slice(0, 40)
        : (node.english || '').slice(0, 45);

      if (text) {
        const fontSize = 9 / globalScale;
        ctx.font = `${fontSize}px Inter, sans-serif`;
        ctx.globalAlpha = fade * 0.9;
        ctx.textAlign = 'center';

        // Background pill
        const tw = ctx.measureText(text).width;
        const ph = fontSize * 1.6;
        const pw = tw + fontSize * 1.2;
        const py = node.y + r + fontSize * 1.4;
        ctx.fillStyle = 'rgba(6,11,24,0.85)';
        ctx.beginPath();
        ctx.roundRect(node.x - pw / 2, py - ph / 2, pw, ph, fontSize * 0.3);
        ctx.fill();

        ctx.fillStyle = '#E8EDF5';
        ctx.fillText(text, node.x, py + fontSize * 0.35);
        ctx.globalAlpha = 1;
      }
    } else if (globalScale > 2.5 && (isSelected || isHovered)) {
      // Show writer name at medium zoom for selected/hovered
      const label = (node.writer || '').replace(' Ji', '');
      ctx.font = `${8 / globalScale}px Inter, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.textAlign = 'center';
      ctx.globalAlpha = 0.8;
      ctx.fillText(label, node.x, node.y + r + 10 / globalScale);
      ctx.globalAlpha = 1;
    }
  }, [selectedNode, hoveredNode, textMode]);

  const linkCanvasObject = useCallback((link, ctx) => {
    const src = typeof link.source === 'object' ? link.source : null;
    const tgt = typeof link.target === 'object' ? link.target : null;
    if (!src || !tgt) return;
    if (!isFinite(src.x) || !isFinite(src.y) || !isFinite(tgt.x) || !isFinite(tgt.y)) return;

    const srcId = src.id, tgtId = tgt.id;
    const srcBc = breadcrumb.indexOf(srcId);
    const tgtBc = breadcrumb.indexOf(tgtId);
    const isBreadcrumb = srcBc !== -1 && tgtBc !== -1 && Math.abs(srcBc - tgtBc) === 1;

    ctx.beginPath();
    ctx.moveTo(src.x, src.y);
    ctx.lineTo(tgt.x, tgt.y);
    if (isBreadcrumb) {
      ctx.strokeStyle = 'rgba(249,115,22,0.35)';
      ctx.lineWidth = 1.5;
    } else {
      ctx.strokeStyle = `rgba(90,112,144,${(link.strength || 0.3) * 0.25})`;
      ctx.lineWidth = 0.5;
    }
    ctx.stroke();
  }, [breadcrumb]);

  const graphData = {
    nodes: nodes.map(n => ({ ...n })),
    links: edges.map(e => ({ ...e })),
  };

  return (
    <div style={{ opacity: dimmed ? 0.15 : 1, transition: 'opacity 0.5s', filter: dimmed ? 'blur(2px)' : 'none' }}>
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
          onZoom={({ k }) => setZoom(k)}
          cooldownTicks={physicsEnabled ? 300 : 0}
          d3AlphaDecay={0.025}
          d3VelocityDecay={0.35}
          nodeRelSize={1}
          enableNodeDrag={!dimmed}
          enableZoomInteraction={!dimmed}
          minZoom={0.05}
          maxZoom={16}
        />
      ) : (
        <div className="flex items-center justify-center w-full h-screen" style={{ background: '#060B18' }} />
      )}
    </div>
  );
}
