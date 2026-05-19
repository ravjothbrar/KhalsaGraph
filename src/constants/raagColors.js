// Maps raagSlug → hex colour. Grouped by musical family.
export const raagColors = {
  // Bhairav family → deep indigo/purple
  'sri': '#6366f1',
  'bhairav': '#7c3aed',
  'asa': '#8b5cf6',
  'devgandhari': '#6d28d9',

  // Yaman/Kalyan family → emerald
  'yaman-kalyan': '#10b981',
  'kalyan': '#059669',
  'gond': '#34d399',
  'nat-narain': '#6ee7b7',

  // Bilaval family → sky blue
  'bilaval': '#0ea5e9',
  'dhanasri': '#38bdf8',
  'tilang': '#7dd3fc',
  'bihagra': '#0284c7',

  // Poorvi family → amber/gold
  'poorbi': '#f59e0b',
  'poorvi': '#d97706',
  'basant': '#fbbf24',
  'sarang': '#f59e0b',

  // Kafi family → rose/coral
  'kafi': '#f43f5e',
  'parbhati': '#e11d48',
  'bhairo': '#fb7185',
  'ramkali': '#f87171',

  // Todi family → violet
  'todi': '#8b5cf6',
  'prabhati': '#a78bfa',
  'maru': '#7c3aed',
  'suhi': '#c084fc',

  // Marwa family → teal
  'marwa': '#14b8a6',
  'kedara': '#0d9488',
  'bairarri': '#2dd4bf',

  // Remaining raags
  'gauri': '#ec4899',
  'majh': '#06b6d4',
  'wadhans': '#84cc16',
  'sorath': '#f97316',
  'default': '#94a3b8',
};

export function getRaagColor(raagSlug) {
  if (!raagSlug) return raagColors.default;
  const key = raagSlug.toLowerCase().replace(/\s+/g, '-');
  return raagColors[key] || raagColors.default;
}
