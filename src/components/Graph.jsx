import { useRef, useEffect, useCallback, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useStore } from '../store/useStore';
import { getRaagColor } from '../constants/raagColors';

const MOOD_RADIUS = { serene: 5, devotional: 7, contemplative: 6, joyful: 8, sorrowful: 5 };

function drawStars(ctx, width, height) {
  const stars = [];
  const seed = 42;
  for (let i = 0; i < 200; i++) {
    const x = ((seed * (i * 9301 + 49297) % 233280) / 233280) * width;
    const y = ((seed * (i * 7919 + 11071) % 233280) / 233280) * height;
    const r = Math.random() * 1.2 + 0.3;
    stars.push({ x, y, r });
  }
  ctx.save();
  ctx.fillStyle = '#ffffff';
  for (const s of stars) {
    ctx.globalAlpha = Math.random() * 0.5 + 0.2;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

export default function Graph() {
  const graphRef = useRef(null);
  const nodes = useStore(s => s.nodes);
  const edges = useStore(s => s.edges);
  const selectedNode = useStore(s => s.selectedNode);
  const setSelectedNode = useStore(s => s.setSelectedNode);
  const breadcrumb = useStore(s => s.breadcrumb);
  const physicsEnabled = useStore(s => s.physicsEnabled);

  const [hoveredNode, setHoveredNode] = useState(null);
  const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const onResize = () => setDims({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Freeze simulation after 4 seconds for performance
  useEffect(() => {
    if (!graphRef.current || !physicsEnabled) return;
    const timer = setTimeout(() => {
      graphRef.current?.d3Force('charge')?.strength(0);
    }, 4000);
    return () => clearTimeout(timer);
  }, [nodes, physicsEnabled]);

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 800);
      graphRef.current.zoom(4, 800);
    }
  }, [setSelectedNode]);

  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const color = getRaagColor(node.raagSlug);
    const baseR = MOOD_RADIUS[node.mood] || 6;
    const isSelected = selectedNode?.id === node.id;
    const isHovered = hoveredNode?.id === node.id;
    const r = isSelected ? baseR * 1.6 : isHovered ? baseR * 1.25 : baseR;

    // Guard against unpositioned nodes (NaN/undefined during initial layout)
    if (!isFinite(node.x) || !isFinite(node.y)) return;

    // Glow effect
    const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 2.5);
    gradient.addColorStop(0, color + 'cc');
    gradient.addColorStop(1, color + '00');
    ctx.beginPath();
    ctx.arc(node.x, node.y, r * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Main circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // White ring for selected
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 2, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Label at high zoom
    if (globalScale > 3 && node.writer) {
      const label = node.writer.length > 20 ? node.writer.slice(0, 18) + '…' : node.writer;
      ctx.font = `${10 / globalScale}px sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.textAlign = 'center';
      ctx.fillText(label, node.x, node.y + r + 8 / globalScale);
    }

    // Draw breadcrumb trail lines
    const bcIdx = breadcrumb.indexOf(node.id);
    if (bcIdx > 0) {
      // This is handled in linkCanvasObject for breadcrumb links
    }
  }, [selectedNode, hoveredNode, breadcrumb]);

  const linkCanvasObject = useCallback((link, ctx) => {
    // Breadcrumb links are drawn in nodeCanvasObject overlay
    const srcId = typeof link.source === 'object' ? link.source.id : link.source;
    const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
    const srcBc = breadcrumb.indexOf(srcId);
    const tgtBc = breadcrumb.indexOf(tgtId);

    if (srcBc !== -1 && tgtBc !== -1 && Math.abs(srcBc - tgtBc) === 1) {
      const src = typeof link.source === 'object' ? link.source : null;
      const tgt = typeof link.target === 'object' ? link.target : null;
      if (src && tgt) {
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        return;
      }
    }

    const src = typeof link.source === 'object' ? link.source : null;
    const tgt = typeof link.target === 'object' ? link.target : null;
    if (!src || !tgt) return;
    if (!isFinite(src.x) || !isFinite(src.y) || !isFinite(tgt.x) || !isFinite(tgt.y)) return;

    ctx.beginPath();
    ctx.moveTo(src.x, src.y);
    ctx.lineTo(tgt.x, tgt.y);
    ctx.strokeStyle = `rgba(148, 163, 184, ${(link.strength || 0.3) * 0.3})`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }, [breadcrumb]);

  const graphData = {
    nodes: nodes.map(n => ({ ...n })),
    links: edges.map(e => ({ ...e })),
  };

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full" style={{ background: '#050510' }}>
        <div className="text-slate-400 text-center">
          <div className="text-4xl mb-4">✦</div>
          <div className="text-lg">Loading KhalsaGraph…</div>
        </div>
      </div>
    );
  }

  return (
    <ForceGraph2D
      ref={graphRef}
      graphData={graphData}
      width={dims.w}
      height={dims.h}
      backgroundColor="#050510"
      nodeCanvasObject={nodeCanvasObject}
      nodeCanvasObjectMode={() => 'replace'}
      linkCanvasObject={linkCanvasObject}
      linkCanvasObjectMode={() => 'replace'}
      onNodeClick={handleNodeClick}
      onNodeHover={setHoveredNode}
      onBackgroundClick={() => setSelectedNode(null)}
      cooldownTicks={physicsEnabled ? 200 : 0}
      d3AlphaDecay={0.02}
      d3VelocityDecay={0.3}
      nodeRelSize={1}
      enableNodeDrag={true}
      enableZoomInteraction={true}
      minZoom={0.2}
      maxZoom={12}
    />
  );
}
