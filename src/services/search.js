import { create, insert, search } from '@orama/orama';

let db = null;

export async function initSearch(nodes) {
  db = await create({
    schema: {
      id: 'string',
      english: 'string',
      transliteration: 'string',
      raag: 'string',
      writer: 'string',
      tags: 'string',
      mood: 'string',
    },
  });

  for (const node of nodes) {
    await insert(db, {
      id: node.id,
      english: node.english || '',
      transliteration: node.transliteration || '',
      raag: node.raag || '',
      writer: node.writer || '',
      tags: (node.tags || []).join(' '),
      mood: node.mood || '',
    });
  }
}

export async function keywordSearch(query, limit = 10) {
  if (!db || !query.trim()) return [];
  const results = await search(db, {
    term: query,
    properties: ['english', 'transliteration', 'raag', 'writer', 'tags'],
    limit,
  });
  return results.hits.map(h => h.document.id);
}
