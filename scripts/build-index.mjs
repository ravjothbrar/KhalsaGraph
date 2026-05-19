/**
 * Build script: reads sggs_raw.json, transforms nodes, generates bani_index.json
 * and embeddings.bin (stub zero vectors if no Python/transformer available).
 *
 * Run: node scripts/build-index.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const RAAG_CENTROIDS = {
  'sri':          { x: 200,  y: 200  },
  'majh':         { x: 500,  y: 150  },
  'gauri':        { x: 800,  y: 200  },
  'asa':          { x: 1100, y: 150  },
  'gujri':        { x: 1400, y: 200  },
  'devgandhari':  { x: 1700, y: 150  },
  'bihagra':      { x: 200,  y: 500  },
  'wadhans':      { x: 500,  y: 500  },
  'sorath':       { x: 800,  y: 500  },
  'dhanasri':     { x: 1100, y: 500  },
  'bilaval':      { x: 1400, y: 500  },
  'ramkali':      { x: 1700, y: 500  },
  'maru':         { x: 200,  y: 800  },
  'basant':       { x: 500,  y: 800  },
  'sarang':       { x: 800,  y: 800  },
  'malar':        { x: 1100, y: 800  },
  'kalyan':       { x: 1400, y: 800  },
  'parbhati':     { x: 1700, y: 800  },
  'tilang':       { x: 200,  y: 1100 },
  'suhi':         { x: 500,  y: 1100 },
  'bilaval':      { x: 800,  y: 1100 },
  'poorbi':       { x: 1100, y: 1100 },
  'kedara':       { x: 1400, y: 1100 },
  'bhairo':       { x: 1700, y: 1100 },
  'nat-narain':   { x: 200,  y: 1400 },
  'prabhati':     { x: 500,  y: 1400 },
  'yaman-kalyan': { x: 800,  y: 1400 },
  'todi':         { x: 1100, y: 1400 },
  'marwa':        { x: 1400, y: 1400 },
  'bhairav':      { x: 1700, y: 1400 },
  'default':      { x: 1000, y: 1000 },
};

function jitter(range = 150) {
  return (Math.random() - 0.5) * 2 * range;
}

function getCluster(raagSlug) {
  const key = (raagSlug || 'default').toLowerCase().replace(/\s+/g, '-');
  return RAAG_CENTROIDS[key] || RAAG_CENTROIDS.default;
}

function slugify(raag) {
  return (raag || 'default').toLowerCase()
    .replace(/^raag\s+/i, '')
    .trim()
    .replace(/\s+/g, '-');
}

function transformNode(raw, idx) {
  const raagSlug = raw.raagSlug || slugify(raw.raag);
  const centroid = getCluster(raagSlug);
  return {
    id: raw.id || `SGGS_${String(raw.ang || idx).padStart(4, '0')}_${idx}`,
    ang: raw.ang || idx + 1,
    gurmukhi: raw.gurmukhi || '',
    transliteration: raw.transliteration || '',
    english: raw.english || '',
    raag: raw.raag || 'Raag Sri',
    raagSlug,
    writer: raw.writer || 'Guru Nanak Dev Ji',
    mood: raw.mood || 'serene',
    tags: raw.tags || ['naam', 'devotion'],
    clusterX: centroid.x + jitter(),
    clusterY: centroid.y + jitter(),
  };
}

function buildEdges(nodes) {
  const edges = [];
  const tagMap = new Map();

  for (const node of nodes) {
    for (const tag of (node.tags || [])) {
      if (!tagMap.has(tag)) tagMap.set(tag, []);
      tagMap.get(tag).push(node.id);
    }
  }

  const edgeSet = new Set();
  const degreeCount = new Map();

  for (const [, ids] of tagMap) {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i], b = ids[j];
        const key = a < b ? `${a}|${b}` : `${b}|${a}`;
        if (!edgeSet.has(key)) {
          const degA = degreeCount.get(a) || 0;
          const degB = degreeCount.get(b) || 0;
          if (degA < 8 && degB < 8) {
            edgeSet.add(key);
            degreeCount.set(a, degA + 1);
            degreeCount.set(b, degB + 1);
            if (edges.length >= 5000) break;
          }
        }
      }
      if (edges.length >= 5000) break;
    }
    if (edges.length >= 5000) break;
  }

  // Count shared tags for strength
  const tagSets = new Map(nodes.map(n => [n.id, new Set(n.tags || [])]));
  for (const key of edgeSet) {
    const [src, tgt] = key.split('|');
    const shared = [...(tagSets.get(src) || [])].filter(t => tagSets.get(tgt)?.has(t)).length;
    if (shared >= 2) {
      edges.push({ source: src, target: tgt, strength: Math.min(shared / 5, 1) });
    }
  }

  return edges;
}

// Generate stub zero embeddings
function generateEmbeddings(count) {
  const DIM = 384;
  const buf = new Float32Array(count * DIM);
  // Zero embeddings — semantic search will not work meaningfully, but app loads
  return buf;
}

async function main() {
  const rawPath = join(__dirname, 'sggs_raw.json');
  if (!existsSync(rawPath)) {
    console.error('Error: scripts/sggs_raw.json not found.');
    process.exit(1);
  }

  console.log('Reading source data…');
  const raw = JSON.parse(readFileSync(rawPath, 'utf8'));
  const rawNodes = Array.isArray(raw) ? raw : raw.nodes || [];

  console.log(`Transforming ${rawNodes.length} nodes…`);
  const nodes = rawNodes.map((n, i) => transformNode(n, i));

  console.log('Building edges…');
  const edges = buildEdges(nodes);
  console.log(`  Generated ${edges.length} edges`);

  const output = { nodes, edges };
  const outPath = join(ROOT, 'public', 'bani_index.json');
  writeFileSync(outPath, JSON.stringify(output));
  console.log(`✓ Written public/bani_index.json (${nodes.length} nodes, ${edges.length} edges)`);

  console.log('Generating stub embeddings (zero vectors)…');
  const embedBuf = generateEmbeddings(nodes.length);
  const binPath = join(ROOT, 'public', 'embeddings.bin');
  writeFileSync(binPath, Buffer.from(embedBuf.buffer));
  console.log(`✓ Written public/embeddings.bin (${nodes.length} × 384 floats)`);

  console.log('\nDone! Run "npm run build" to build the site.');
  console.log('Note: Stub embeddings mean semantic search will return approximate results.');
  console.log('For real embeddings, install sentence-transformers and run the Python pipeline.');
}

main().catch(e => { console.error(e); process.exit(1); });
