let pipeline = null;
let embeddingsMatrix = null;
let nodeCount = 0;

export async function initSemanticSearch(N, onProgress) {
  if (pipeline) return;
  onProgress?.('Loading semantic model (23 MB)…');
  const { pipeline: createPipeline } = await import('@xenova/transformers');
  pipeline = await createPipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

  onProgress?.('Loading embeddings…');
  const base = import.meta.env.BASE_URL || '/';
  const res = await fetch(`${base}embeddings.bin`);
  if (!res.ok) throw new Error('embeddings.bin not found — run npm run build:data first');
  const buf = await res.arrayBuffer();
  embeddingsMatrix = new Float32Array(buf);
  nodeCount = N;
  onProgress?.(null);
}

export async function semanticSearch(query, nodes, topK = 10, onProgress) {
  await initSemanticSearch(nodes.length, onProgress);
  const output = await pipeline(query, { pooling: 'mean', normalize: true });
  const queryVec = output.data;

  const scores = new Float32Array(nodeCount);
  const DIM = 384;
  for (let i = 0; i < nodeCount; i++) {
    let dot = 0;
    const offset = i * DIM;
    for (let d = 0; d < DIM; d++) dot += queryVec[d] * embeddingsMatrix[offset + d];
    scores[i] = dot;
  }

  const indexed = Array.from(scores, (s, i) => [i, s]);
  indexed.sort((a, b) => b[1] - a[1]);
  return indexed.slice(0, topK).map(([i]) => nodes[i]);
}
