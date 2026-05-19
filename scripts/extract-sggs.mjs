/**
 * Batch-extracts all SGGS shabads from the ShabadOS SQLite database.
 * Uses bulk JOIN queries instead of per-row fetches for speed.
 * Run: node scripts/extract-sggs.mjs
 */
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

const db = new Database(
  join(__dirname, '../node_modules/@shabados/database/dist/master.sqlite'),
  { readonly: true }
);

const SECTION_TO_SLUG = {
  'Jap':'sri','So Dar':'sri','So Purakh':'sri','Sohila':'sri',
  'Siree Raag':'sri','Raag Maajh':'majh','Raag Gauree':'gauri',
  'Raag Aasaa':'asa','Raag Goojaree':'gujri','Raag Dayv-Gandhaaree':'devgandhari',
  'Raag Bihaagraa':'bihagra','Raag Vadhans':'wadhans','Raag Sorath':'sorath',
  'Raag Dhanaasree':'dhanasri','Raag Jaitsree':'nat-narain','Raag Todee':'todi',
  'Raag Baihaaree':'bihagra','Raag Tilang':'tilang','Raag Soohee':'suhi',
  'Raag Bilaaval':'bilaval','Raag Gond':'gond','Raag Raamkalee':'ramkali',
  'Raag Nat Naaraayan':'nat-narain','Raag Maale Gauraa':'malar',
  'Raag Maaroo':'maru','Raag Tukhaari':'basant','Raag Kaydaaraa':'kedara',
  'Raag Bhairao':'bhairo','Raag Basant':'basant','Raag Saarang':'sarang',
  'Raag Malaar':'malar','Raag Kaanraa':'todi','Raag Kalyaan':'kalyan',
  'Raag Prabhaatee':'parbhati','Raag Jaijaavantee':'parbhati',
};

const RAAG_CENTROIDS = {
  sri:{x:200,y:200},majh:{x:500,y:150},gauri:{x:800,y:200},asa:{x:1100,y:150},
  gujri:{x:1400,y:200},devgandhari:{x:1700,y:150},bihagra:{x:200,y:500},
  wadhans:{x:500,y:500},sorath:{x:800,y:500},dhanasri:{x:1100,y:500},
  'nat-narain':{x:1400,y:500},todi:{x:1700,y:500},tilang:{x:200,y:800},
  suhi:{x:500,y:800},bilaval:{x:800,y:800},gond:{x:1100,y:800},
  ramkali:{x:1400,y:800},maru:{x:200,y:1100},basant:{x:500,y:1100},
  sarang:{x:800,y:1100},malar:{x:1100,y:1100},kedara:{x:1400,y:1100},
  bhairo:{x:1700,y:1100},kalyan:{x:200,y:1400},parbhati:{x:500,y:1400},
  default:{x:1000,y:1000},
};

const AUTHOR_MAP = {
  NANK:'Guru Nanak Dev Ji',ANGD:'Guru Angad Dev Ji',AMAR:'Guru Amardas Ji',
  RAMD:'Guru Ram Das Ji',ARJN:'Guru Arjan Dev Ji',TGBH:'Guru Tegh Bahadur Ji',
  GOBIND:'Guru Gobind Singh Ji',KBIR:'Bhagat Kabir Ji',FARID:'Bhagat Farid Ji',
  RVDS:'Bhagat Ravidas Ji',NMDV:'Bhagat Namdev Ji',TRLC:'Bhagat Trilochan Ji',
  DHNA:'Bhagat Dhanna Ji',BENI:'Bhagat Benee Ji',PIPA:'Bhagat Pipa Ji',
  SAIN:'Bhagat Sain Ji',BHKN:'Bhagat Bhikhan Ji',JYDEV:'Bhagat Jaidev Ji',
  PRMD:'Bhagat Parmanand Ji',SDNA:'Bhagat Sadna Ji',
};

const TAG_KEYWORDS = {
  humility:['humble','humility','lowly','meek','servant'],
  ego:['ego','pride','conceit','arrogance'],
  naam:['name','naam','word','shabad'],
  love:['love','beloved','heart','yearning'],
  truth:['truth','true','eternal','unchanging'],
  grace:['grace','mercy','blessing','kirpa'],
  service:['serve','service','seva','devotee'],
  wisdom:['wisdom','knowledge','understanding'],
  devotion:['devot','worship','pious','bhakti'],
  surrender:['surrender','refuge','sanctuary'],
  gratitude:['thank','grateful','praise'],
  compassion:['compassion','kind','tender'],
  patience:['patient','endure','stable'],
  courage:['courage','fearless','bold'],
  faith:['faith','trust','believe'],
  detachment:['detach','renounce','vairag'],
  forgiveness:['forgive','pardon','absolve'],
  contentment:['content','satisfaction','enough'],
  mindfulness:['aware','conscious','attentive'],
  unity:['one','unity','all','together','merge'],
};

function inferMood(t) {
  const s = (t||'').toLowerCase();
  if (s.match(/grief|sorrow|lament|weep|tears/)) return 'sorrowful';
  if (s.match(/joy|bliss|delight|spring|blossom/)) return 'joyful';
  if (s.match(/meditat|contempl|reflect|ponder/)) return 'contemplative';
  if (s.match(/love|devot|worship|praise|blessed/)) return 'devotional';
  return 'serene';
}

function inferTags(t) {
  const s = (t||'').toLowerCase();
  const found = Object.entries(TAG_KEYWORDS)
    .filter(([,ws]) => ws.some(w => s.includes(w)))
    .map(([tag]) => tag);
  if (found.length < 2) { found.push('naam','devotion'); }
  return [...new Set(found)].slice(0, 5);
}

function jitter(r) { return (Math.random()-0.5)*2*r; }
function parseName(j) { try { return JSON.parse(j).Latn || ''; } catch { return ''; } }

console.log('Loading all SGGS lines in bulk…');
const t0 = Date.now();

// Single bulk query: all SGGS lines with Gurmukhi
const allGurmukhi = db.prepare(`
  SELECT l.line_group_id, al.data as gurmukhi, al.additional,
         lg.author_id, s.name as section_name
  FROM lines l
  JOIN asset_lines al ON al.line_id = l.id AND al.type='primary' AND al.asset_id='SSA2'
  JOIN line_groups lg ON lg.id = l.line_group_id
  JOIN sections s ON s.id = lg.section_id AND s.source_id='SGGS'
  ORDER BY l.line_group_id, l.line_group_order
`).all();

console.log(`  Loaded ${allGurmukhi.length} Gurmukhi lines in ${Date.now()-t0}ms`);

// Single bulk query: all SGGS English translations
const t1 = Date.now();
const allEnglish = db.prepare(`
  SELECT l.line_group_id, al.data as english
  FROM lines l
  JOIN asset_lines al ON al.line_id = l.id AND al.type='translation' AND al.asset_id='DSSK'
  JOIN line_groups lg ON lg.id = l.line_group_id
  JOIN sections s ON s.id = lg.section_id AND s.source_id='SGGS'
  ORDER BY l.line_group_id, l.line_group_order
`).all();

console.log(`  Loaded ${allEnglish.length} English lines in ${Date.now()-t1}ms`);

// Group by line_group_id
const gmByGroup = {};
for (const row of allGurmukhi) {
  if (!gmByGroup[row.line_group_id]) {
    gmByGroup[row.line_group_id] = { lines: [], author_id: row.author_id, section_name: row.section_name, ang: 0 };
  }
  gmByGroup[row.line_group_id].lines.push(row.gurmukhi);
  if (!gmByGroup[row.line_group_id].ang && row.additional) {
    try { const a = JSON.parse(row.additional); if (a.page) gmByGroup[row.line_group_id].ang = a.page; } catch {}
  }
}

const enByGroup = {};
for (const row of allEnglish) {
  if (!enByGroup[row.line_group_id]) enByGroup[row.line_group_id] = [];
  // Skip bare headers like "Gauree, Fifth Mehl:"
  if (!row.english.match(/^[A-Za-z ]+,?\s+(First|Second|Third|Fourth|Fifth|Ninth|Tenth)\s+Mehl[,:]?\s*$/i)) {
    enByGroup[row.line_group_id].push(row.english);
  }
}

console.log(`Building ${Object.keys(gmByGroup).length} shabads…`);

const nodes = [];
for (const [lgId, gm] of Object.entries(gmByGroup)) {
  const en = enByGroup[lgId];
  if (!en || en.length === 0) continue;

  const english = en.join(' ').trim();
  if (!english || english.length < 20) continue;

  const sectionName = parseName(gm.section_name);
  const raagSlug = SECTION_TO_SLUG[sectionName] || 'sri';
  const centroid = RAAG_CENTROIDS[raagSlug] || RAAG_CENTROIDS.default;
  const writer = AUTHOR_MAP[gm.author_id] || 'Unknown';

  nodes.push({
    id: `SGGS_${String(gm.ang).padStart(4,'0')}_${nodes.length}`,
    ang: gm.ang || 1,
    gurmukhi: gm.lines.join(' '),
    transliteration: '',
    english,
    raag: sectionName || 'Raag Sri',
    raagSlug,
    writer,
    mood: inferMood(english),
    tags: inferTags(english),
    clusterX: centroid.x + jitter(160),
    clusterY: centroid.y + jitter(160),
  });
}

console.log(`\n✓ Extracted ${nodes.length} real SGGS shabads`);

const dist = {};
nodes.forEach(n => { dist[n.raag] = (dist[n.raag]||0)+1; });
Object.entries(dist).sort((a,b)=>b[1]-a[1]).forEach(([r,c]) => console.log(`  ${r}: ${c}`));

const avgWords = nodes.reduce((s,n) => s + n.english.split(' ').length, 0) / nodes.length;
console.log(`\nAvg English length: ${avgWords.toFixed(1)} words`);

writeFileSync(join(__dirname, 'sggs_raw.json'), JSON.stringify(nodes));
console.log(`✓ Written to scripts/sggs_raw.json`);
