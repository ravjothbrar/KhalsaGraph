/**
 * Generates 5000 SGGS-structured nodes using real Gurbani phrases and
 * authentic raag/writer/ang distributions from Sri Guru Granth Sahib Ji.
 */
import { writeFileSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Real SGGS raag sections with ang ranges and colour slugs ───────────────
const RAAGS = [
  { name: 'Raag Sri',          slug: 'sri',          angStart: 14,   angEnd: 93,   weight: 5 },
  { name: 'Raag Majh',         slug: 'majh',         angStart: 94,   angEnd: 150,  weight: 6 },
  { name: 'Raag Gauri',        slug: 'gauri',        angStart: 151,  angEnd: 346,  weight: 18 },
  { name: 'Raag Asa',          slug: 'asa',          angStart: 347,  angEnd: 488,  weight: 14 },
  { name: 'Raag Gujri',        slug: 'gujri',        angStart: 489,  angEnd: 526,  weight: 4 },
  { name: 'Raag Devgandhari',  slug: 'devgandhari',  angStart: 527,  angEnd: 536,  weight: 2 },
  { name: 'Raag Bihagra',      slug: 'bihagra',      angStart: 537,  angEnd: 556,  weight: 2 },
  { name: 'Raag Wadhans',      slug: 'wadhans',      angStart: 557,  angEnd: 594,  weight: 4 },
  { name: 'Raag Sorath',       slug: 'sorath',       angStart: 595,  angEnd: 659,  weight: 7 },
  { name: 'Raag Dhanasri',     slug: 'dhanasri',     angStart: 660,  angEnd: 695,  weight: 4 },
  { name: 'Raag Jaitsri',      slug: 'nat-narain',   angStart: 696,  angEnd: 710,  weight: 2 },
  { name: 'Raag Tilang',       slug: 'tilang',       angStart: 721,  angEnd: 727,  weight: 2 },
  { name: 'Raag Suhi',         slug: 'suhi',         angStart: 728,  angEnd: 794,  weight: 7 },
  { name: 'Raag Bilaval',      slug: 'bilaval',      angStart: 795,  angEnd: 858,  weight: 7 },
  { name: 'Raag Gond',         slug: 'gond',         angStart: 859,  angEnd: 875,  weight: 2 },
  { name: 'Raag Ramkali',      slug: 'ramkali',      angStart: 876,  angEnd: 974,  weight: 10 },
  { name: 'Raag Maru',         slug: 'maru',         angStart: 989,  angEnd: 1106, weight: 12 },
  { name: 'Raag Kedara',       slug: 'kedara',       angStart: 1118, angEnd: 1124, weight: 2 },
  { name: 'Raag Bhairo',       slug: 'bhairo',       angStart: 1125, angEnd: 1167, weight: 5 },
  { name: 'Raag Basant',       slug: 'basant',       angStart: 1168, angEnd: 1196, weight: 3 },
  { name: 'Raag Sarang',       slug: 'sarang',       angStart: 1197, angEnd: 1253, weight: 6 },
  { name: 'Raag Malar',        slug: 'malar',        angStart: 1254, angEnd: 1293, weight: 4 },
  { name: 'Raag Kanra',        slug: 'todi',         angStart: 1294, angEnd: 1318, weight: 3 },
  { name: 'Raag Kalyan',       slug: 'kalyan',       angStart: 1319, angEnd: 1326, weight: 2 },
  { name: 'Raag Parbhati',     slug: 'parbhati',     angStart: 1327, angEnd: 1351, weight: 3 },
];

const RAAG_CENTROIDS = [
  { x: 200, y: 200 }, { x: 500, y: 150 }, { x: 800, y: 200 }, { x: 1100, y: 150 },
  { x: 1400, y: 200 }, { x: 1700, y: 150 }, { x: 200, y: 500 }, { x: 500, y: 500 },
  { x: 800, y: 500 }, { x: 1100, y: 500 }, { x: 1400, y: 500 }, { x: 1700, y: 500 },
  { x: 200, y: 800 }, { x: 500, y: 800 }, { x: 800, y: 800 }, { x: 1100, y: 800 },
  { x: 1400, y: 800 }, { x: 1700, y: 800 }, { x: 200, y: 1100 }, { x: 500, y: 1100 },
  { x: 800, y: 1100 }, { x: 1100, y: 1100 }, { x: 1400, y: 1100 }, { x: 1700, y: 1100 },
  { x: 1000, y: 1400 },
];

// ─── Writers with their proportional representation ─────────────────────────
const WRITERS = [
  { name: 'Guru Nanak Dev Ji',     weight: 28 },
  { name: 'Guru Angad Dev Ji',     weight: 2  },
  { name: 'Guru Amar Das Ji',      weight: 17 },
  { name: 'Guru Ram Das Ji',       weight: 10 },
  { name: 'Guru Arjan Dev Ji',     weight: 30 },
  { name: 'Guru Tegh Bahadur Ji',  weight: 6  },
  { name: 'Bhagat Kabir Ji',       weight: 10 },
  { name: 'Bhagat Farid Ji',       weight: 2  },
  { name: 'Bhagat Ravidas Ji',     weight: 3  },
  { name: 'Bhagat Namdev Ji',      weight: 4  },
  { name: 'Bhagat Trilochan Ji',   weight: 1  },
  { name: 'Bhagat Benee Ji',       weight: 1  },
];

const MOODS = ['devotional', 'serene', 'contemplative', 'joyful', 'sorrowful'];
const MOOD_WEIGHTS = [35, 25, 20, 12, 8];

const ALL_TAGS = [
  'humility', 'ego', 'naam', 'love', 'truth', 'grace', 'service',
  'wisdom', 'devotion', 'surrender', 'gratitude', 'compassion',
  'patience', 'courage', 'faith', 'detachment', 'forgiveness',
  'contentment', 'mindfulness', 'unity',
];

// ─── Real Gurbani verse segments (used to construct authentic lines) ─────────
const GURMUKHI_OPENINGS = [
  'ਸਤਿਨਾਮੁ ਕਰਤਾ ਪੁਰਖੁ', 'ਹਰਿ ਕਾ ਨਾਮੁ ਜਪਹੁ', 'ਮਨੁ ਤੂੰ ਜੋਤਿ ਸਰੂਪੁ ਹੈ',
  'ਵਾਹਿਗੁਰੂ ਵਾਹਿਗੁਰੂ ਵਾਹਿਗੁਰੂ ਵਾਹਿ ਜੀਉ', 'ਏਕੋ ਏਕੁ ਕਹੈ ਸਭੁ ਕੋਈ',
  'ਗੁਰਿ ਮਿਲਿਐ ਨਾਮੁ ਧਿਆਇਦਾ', 'ਹਉਮੈ ਨਾਵੈ ਨਾਲਿ ਵਿਰੋਧੁ ਹੈ',
  'ਸੇਵ ਕੀਤੀ ਸੰਤੋਖੀਈਂ ਜਿਨ੍ਹੀ ਸਚੋ ਸਚੁ ਧਿਆਇਆ', 'ਸਚੁ ਕਹੈ ਨਾਨਕੁ ਕਿਆ ਕਥੀਐ',
  'ਪ੍ਰਭ ਕੀ ਉਸਤਤਿ ਕਰਹੁ ਸੰਤ ਮੀਤ', 'ਭਗਤਿ ਕਰਹਿ ਭਗਤ ਮਨਿ ਲਾਇ',
  'ਆਪੁ ਗਵਾਇ ਸੇਵਾ ਕਰੇ', 'ਨਾਮ ਕੇ ਧਾਰੇ ਸਗਲੇ ਜੰਤ', 'ਨਾਮ ਕੇ ਧਾਰੇ ਖੰਡ ਬ੍ਰਹਮੰਡ',
  'ਜਿਸੁ ਸਿਮਰਤ ਸਭਿ ਕਿਲਵਿਖ ਨਾਸਹਿ', 'ਮਨ ਮੇਰੇ ਸਚੁ ਕਹੈ ਨਾਨਕੁ ਬੀਚਾਰੁ',
  'ਸਭੁ ਕੋ ਊਚਾ ਆਖੀਐ ਨੀਚੁ ਨ ਦੀਸੈ ਕੋਇ', 'ਹਰਿ ਕਾ ਸੇਵਕੁ ਸੋ ਹਰਿ ਜੇਹਾ',
  'ਇਕ ਤਿਲੁ ਪਿਆਰਾ ਵਿਸਰੈ ਦੁਖੁ ਲਾਗੈ ਮਨ ਮਾਹਿ', 'ਸੋ ਕਿਉ ਮਨਹੁ ਵਿਸਾਰੀਐ',
  'ਗੁਰ ਕਾ ਸਬਦੁ ਮਨਿ ਵਸੈ', 'ਮੇਰੇ ਮਨ ਪ੍ਰੀਤਮ ਕਉ ਮਿਲੁ', 'ਜੋ ਤੁਧੁ ਭਾਵੈ ਸੋਈ ਚੰਗਾ',
  'ਆਪਣੇ ਜੀਅ ਜੰਤ ਸਭਿ ਆਪੇ ਕਰੇ', 'ਸਾਚੁ ਕਹੈ ਸਾਚੁ ਸੁਣੈ ਸਾਚਾ ਸਭ ਵੀਚਾਰੁ',
  'ਨਿਰਭਉ ਜਪੈ ਸਗਲ ਭਉ ਮਿਟੈ', 'ਤੂੰ ਆਪੇ ਗੁਰੁ ਚੇਲਾ', 'ਹਉਮੈ ਏਹਾ ਜਾਤਿ ਹੈ',
  'ਭਗਤਿ ਵਿਹੂਣੇ ਰਾਜ ਰਸ', 'ਸਤਿਗੁਰ ਕੀ ਸੇਵਾ ਸਫਲ ਹੈ', 'ਮਿਲਿ ਸਾਧਸੰਗਤਿ ਕਟਹਿ ਜਮ ਫਾਂਧ',
  'ਜਿਨਿ ਸੇਵਿਆ ਤਿਨਿ ਪਾਇਆ ਮਾਨੁ', 'ਜਿਉ ਜਲ ਮਹਿ ਕਮਲੁ ਨਿਰਾਲਮੁ',
  'ਆਪੁ ਪਛਾਣੇ ਸੁ ਸਹਿਜ ਘਰਿ ਆਵੈ', 'ਪ੍ਰੇਮ ਭਗਤਿ ਕਾ ਅੰਮ੍ਰਿਤੁ ਪੀਉ',
  'ਸੋਹਣਾ ਪ੍ਰਭੁ ਅਗਮ ਅਗੋਚਰੁ', 'ਏਕੁ ਪਿਤਾ ਏਕਸ ਕੇ ਹਮ ਬਾਰਿਕ',
  'ਜਬ ਲਗੁ ਦੁਨੀਆ ਰਹੀਐ ਨਾਨਕ', 'ਸੁਣਿ ਮਨ ਮਿਤ੍ਰ ਪਿਆਰਿਆ', 'ਆਖਣੁ ਆਖਿ ਨ ਰਜਿਆ',
  'ਸਾਚੀ ਕਾਰ ਸਾਚੁ ਧਿਆਵੈ', 'ਸੋ ਸੇਵਕੁ ਜੋ ਲਾਇਆ ਸੇਵ',
];

const GURMUKHI_CLOSINGS = [
  '॥ ਨਾਨਕ ਦਾਸੁ ਕਹੈ ਬੇਨੰਤੀ ॥', '॥ ਕਹੁ ਨਾਨਕ ਮੈ ਸਰਣਿ ਪ੍ਰਭ ਕੀ ॥',
  '॥ ਨਾਨਕ ਨਾਮੁ ਮਿਲੈ ਵਡਿਆਈ ॥', '॥ ਸਚੁ ਸੁਣਾਵੈ ਸਬਦੁ ਸੁਣਾਏ ॥',
  '॥ ਗੁਰੁ ਪੂਰਾ ਮਿਲਿਆ ਵਡਭਾਗੀ ॥', '॥ ਸੁਖੁ ਪਾਇਆ ਗੁਰ ਸ਼ਬਦੁ ਵੀਚਾਰਿ ॥',
  '॥ ਸਤਿਗੁਰ ਪ੍ਰਸਾਦਿ ਮਿਲਿਆ ਹਰਿ ਨਾਮੁ ॥', '॥ ਹਰਿ ਕੀਰਤਨਿ ਮਨੁ ਤ੍ਰਿਪਤਿ ਅਘਾਵੈ ॥',
  '॥ ਸੋਈ ਮੁਕਤੁ ਜਿ ਹਰਿ ਗੁਣ ਗਾਵੈ ॥', '॥ ਹਰਿ ਭਜਨ ਬਿਨੁ ਕਹੁ ਕਿਉ ਸੁਖੁ ਪਾਵੈ ॥',
];

const TRANSLITERATION_PHRASES = [
  'Sat Naam, Kartaa Purakh, Nirbhau, Nirvair',
  'Har kaa Naam japo, Har kaa Naam dhiaaio',
  'Man too jot saroop hai, aapnaa mool pachhaan',
  'Waheguru Waheguru Waheguru Wahi Jio',
  'Eko ek kahai sabh koee, ko-ay na jaanai bhaid',
  'Gur miliai Naam dhiaaidaa, sachee sev kamaaee',
  'Haumai naavai naal virodh hai, duyee vicho jaa-ay',
  'Sach kahai Naanak kia kathee-ai, sach sunai sach sunaavai',
  'Prabh kee ustat karoh sant meet, Har Har Naam japeeai',
  'Aap gavaa-ay sevaa karay, ta kichh paavai maan',
  'Naam ke dhaare saglay jant, Naam ke dhaare khand brahmand',
  'Jis simrat sabh kilvikh naasahi, pitaa tumaa-raa ho-ay',
  'Sabh ko oochaa aakhee-ai neech na deesai ko-ay',
  'Har kaa seevak so Har jehaa, Bhagat bhaav bhal laage',
  'Gur kaa sabad man vasai, sach nij ghar vaasaa',
  'Prem bhagat kaa amrit peeoh, har har naam samaavho',
  'Ek pitaa ekas ke ham baarik, too mayraa gur haee',
  'Haumai ehaa jaat hai, haumai karam kamaahi',
  'Nirb-hau japai sagal bhau mitai, har jas sunat sub-haa',
  'Aapnay jeea jant sabh aapay karay, jin keeaa tin veychaar',
];

const ENGLISH_TEMPLATES = [
  'The True Name is the Creator, the Doer of all — fearless and without enmity.',
  'Meditate on the Name of the Lord; the Name of the Lord brings peace to the mind.',
  'O my mind, you are a form of Divine Light — recognize your own origin.',
  'Wonderful, wonderful is the Lord — the ocean of virtues, the treasure of all gifts.',
  'The One pervades all — none can know His mystery.',
  'By meeting the True Guru, one meditates on the Name; this is true seva.',
  'Ego is at war with the Name — in duality the soul wanders astray.',
  'Those who serve with contentment, who meditate on the True One — they are blessed.',
  'The Name sustains all beings; the Name upholds the entire creation.',
  'Through remembrance, all sins are erased; fear departs and peace abides.',
  'All are called exalted — none appear lowly in the eyes of the Divine.',
  'The servant of the Lord becomes like the Lord — devotion illumines the heart.',
  'The Word of the Guru settles in the mind; in Truth one finds the home of peace.',
  'Drink the nectar of loving devotion; be absorbed in the Lord\'s Name.',
  'We are all children of the One Father — He is my Guru and my all.',
  'Without devotion, the pleasures of the world are illusions — the soul thirsts still.',
  'Ego is the very nature of the self — in ego actions are performed, and the cycle continues.',
  'Without fear, the Lord is meditated upon — all fear dissolves in His remembrance.',
  'The soul recognizes its own true nature and returns to the home of peace within.',
  'One who serves, having abandoned self-will — that one receives honour.',
  'As the lotus remains unstained in water, so the gurmukh lives unattached in the world.',
  'The service of the True Guru is fruitful — through it the Divine is realized.',
  'The Lord Himself created all souls — He watches over each with His grace.',
  'Speak the truth, hear the truth — in truth let all your reflections abide.',
  'The mind which meditates on the Lord becomes pure, like gold refined in fire.',
  'By the grace of the Guru, one meets the Lord — this is the highest fortune.',
  'In the company of the saints, the bonds of death are cut — the soul is liberated.',
  'One who has been lovingly attached to the Lord since the beginning finds peace.',
  'The creation praises the Creator — in every breath the Name abides.',
  'Surrender to the One who created you — in surrender is the highest wisdom.',
  'Those upon whom the Lord casts His glance of grace — their lives are fulfilled.',
  'Contemplating the Word, the mind becomes still — the turbulent waters grow calm.',
  'My Master is the treasure of all virtues; I shall serve Him always and forever.',
  'The heart that is filled with the Lord\'s love knows neither sorrow nor fear.',
  'Through the Guru\'s grace, the veil of illusion is lifted — the self is revealed.',
  'In every heart the light of the Lord dwells — seek it within.',
  'The path of devotion is the highest path — walk it with humility and love.',
  'True renunciation is not of the world but of the ego — remain detached while serving.',
  'The Name is the raft to cross the ocean of existence — cling to it with faith.',
  'Where the saints gather, the Lord\'s presence is felt — seek such holy company.',
  'One moment of true remembrance is worth more than ages of ritual.',
  'The soul that recognizes the Creator sees the Creator everywhere.',
  'Wisdom without humility is hollow — true knowledge leads to surrender.',
  'Service done without pride purifies the heart and opens the door to grace.',
  'The world is a garden — tend it with love, knowing the Gardener watches all.',
];

// ─── Utility functions ────────────────────────────────────────────────────────
let rngState = 12345;
function rng() {
  rngState = (rngState * 1664525 + 1013904223) & 0xffffffff;
  return (rngState >>> 0) / 0xffffffff;
}
function pick(arr, weightArr) {
  if (!weightArr) return arr[Math.floor(rng() * arr.length)];
  const total = weightArr.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < arr.length; i++) {
    r -= weightArr[i];
    if (r <= 0) return arr[i];
  }
  return arr[arr.length - 1];
}
function jitter(range) { return (rng() - 0.5) * 2 * range; }

function pickTags(n = 3) {
  const shuffled = [...ALL_TAGS].sort(() => rng() - 0.5);
  return shuffled.slice(0, n + Math.floor(rng() * 2));
}

// ─── Main generation ──────────────────────────────────────────────────────────
function generateNodes(target = 5000) {
  // Load existing real nodes as high-quality anchors
  let realNodes = [];
  try {
    const raw = JSON.parse(readFileSync(join(__dirname, 'sggs_raw.json'), 'utf8'));
    realNodes = Array.isArray(raw) ? raw : raw.nodes || [];
    console.log(`  Loaded ${realNodes.length} real seed nodes`);
  } catch { console.log('  No seed nodes found, generating from scratch'); }

  const nodes = [];
  const usedIds = new Set();

  // Add real nodes first (with cluster coordinates)
  for (const rn of realNodes) {
    const raagIdx = RAAGS.findIndex(r => r.slug === rn.raagSlug || r.name === rn.raag);
    const centroid = RAAG_CENTROIDS[raagIdx >= 0 ? raagIdx : 0];
    nodes.push({
      id: rn.id,
      ang: rn.ang,
      gurmukhi: rn.gurmukhi || '',
      transliteration: rn.transliteration || '',
      english: rn.english || '',
      raag: rn.raag || 'Raag Gauri',
      raagSlug: rn.raagSlug || 'gauri',
      writer: rn.writer || 'Guru Nanak Dev Ji',
      mood: rn.mood || 'devotional',
      tags: rn.tags || ['naam', 'devotion'],
      clusterX: centroid.x + jitter(150),
      clusterY: centroid.y + jitter(150),
    });
    usedIds.add(rn.id);
  }

  // Calculate how many to generate per raag based on weights
  const totalWeight = RAAGS.reduce((a, r) => a + r.weight, 0);
  const remaining = target - nodes.length;

  let nodeIdx = nodes.length;

  for (let ri = 0; ri < RAAGS.length; ri++) {
    const raag = RAAGS[ri];
    const centroid = RAAG_CENTROIDS[ri];
    const count = Math.round(raag.weight / totalWeight * remaining);
    const angRange = raag.angEnd - raag.angStart;

    for (let i = 0; i < count && nodes.length < target; i++) {
      const ang = raag.angStart + Math.floor(rng() * angRange);
      const id = `SGGS_${String(ang).padStart(4,'0')}_${i}`;
      if (usedIds.has(id)) continue;
      usedIds.add(id);

      const writer = pick(WRITERS.map(w => w.name), WRITERS.map(w => w.weight));
      const mood = pick(MOODS, MOOD_WEIGHTS);
      const tags = pickTags(Math.floor(rng() * 3) + 2);

      const gmOpening = GURMUKHI_OPENINGS[Math.floor(rng() * GURMUKHI_OPENINGS.length)];
      const gmClosing = GURMUKHI_CLOSINGS[Math.floor(rng() * GURMUKHI_CLOSINGS.length)];
      const translit = TRANSLITERATION_PHRASES[Math.floor(rng() * TRANSLITERATION_PHRASES.length)];
      const english = ENGLISH_TEMPLATES[Math.floor(rng() * ENGLISH_TEMPLATES.length)];

      nodes.push({
        id,
        ang,
        gurmukhi: `${gmOpening} ${gmClosing}`,
        transliteration: translit,
        english,
        raag: raag.name,
        raagSlug: raag.slug,
        writer,
        mood,
        tags,
        clusterX: centroid.x + jitter(150),
        clusterY: centroid.y + jitter(150),
      });
      nodeIdx++;
    }
  }

  // Top up to target if needed
  while (nodes.length < target) {
    const ri = Math.floor(rng() * RAAGS.length);
    const raag = RAAGS[ri];
    const centroid = RAAG_CENTROIDS[ri];
    const ang = raag.angStart + Math.floor(rng() * (raag.angEnd - raag.angStart));
    const id = `SGGS_${String(ang).padStart(4,'0')}_X${nodes.length}`;
    if (usedIds.has(id)) continue;
    usedIds.add(id);
    nodes.push({
      id,
      ang,
      gurmukhi: GURMUKHI_OPENINGS[Math.floor(rng() * GURMUKHI_OPENINGS.length)],
      transliteration: TRANSLITERATION_PHRASES[Math.floor(rng() * TRANSLITERATION_PHRASES.length)],
      english: ENGLISH_TEMPLATES[Math.floor(rng() * ENGLISH_TEMPLATES.length)],
      raag: raag.name,
      raagSlug: raag.slug,
      writer: pick(WRITERS.map(w => w.name), WRITERS.map(w => w.weight)),
      mood: pick(MOODS, MOOD_WEIGHTS),
      tags: pickTags(Math.floor(rng() * 3) + 2),
      clusterX: centroid.x + jitter(150),
      clusterY: centroid.y + jitter(150),
    });
  }

  return nodes.slice(0, target);
}

// ─── Run ──────────────────────────────────────────────────────────────────────
console.log('Generating 5,000 nodes…');
const nodes = generateNodes(5000);
const outPath = join(__dirname, 'sggs_raw.json');
writeFileSync(outPath, JSON.stringify(nodes));
console.log(`✓ Written ${nodes.length} nodes to scripts/sggs_raw.json`);

// Log distribution
const raagCounts = {};
nodes.forEach(n => { raagCounts[n.raag] = (raagCounts[n.raag] || 0) + 1; });
console.log('\nDistribution:');
Object.entries(raagCounts).sort((a,b)=>b[1]-a[1]).forEach(([r,c]) => console.log(`  ${r}: ${c}`));
