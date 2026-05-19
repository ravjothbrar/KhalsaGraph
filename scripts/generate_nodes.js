// Helper script to plan raag centroids and counts
const raags = [
  { name: "Raag Sri",         slug: "sri",         angStart: 1,    angEnd: 13,   range: 12 },
  { name: "Raag Majh",        slug: "majh",        angStart: 94,   angEnd: 150,  range: 56 },
  { name: "Raag Gauri",       slug: "gauri",       angStart: 151,  angEnd: 346,  range: 195 },
  { name: "Raag Asa",         slug: "asa",         angStart: 347,  angEnd: 488,  range: 141 },
  { name: "Raag Gujri",       slug: "gujri",       angStart: 489,  angEnd: 526,  range: 37 },
  { name: "Raag Devgandhari", slug: "devgandhari", angStart: 527,  angEnd: 536,  range: 9 },
  { name: "Raag Bihagra",     slug: "bihagra",     angStart: 537,  angEnd: 556,  range: 19 },
  { name: "Raag Wadhans",     slug: "wadhans",     angStart: 557,  angEnd: 594,  range: 37 },
  { name: "Raag Sorath",      slug: "sorath",      angStart: 595,  angEnd: 659,  range: 64 },
  { name: "Raag Dhanasri",    slug: "dhanasri",    angStart: 660,  angEnd: 695,  range: 35 },
  { name: "Raag Bilaval",     slug: "bilaval",     angStart: 795,  angEnd: 858,  range: 63 },
  { name: "Raag Ramkali",     slug: "ramkali",     angStart: 876,  angEnd: 974,  range: 98 },
  { name: "Raag Maru",        slug: "maru",        angStart: 989,  angEnd: 1106, range: 117 },
  { name: "Raag Basant",      slug: "basant",      angStart: 1168, angEnd: 1196, range: 28 },
  { name: "Raag Sarang",      slug: "sarang",      angStart: 1197, angEnd: 1253, range: 56 },
  { name: "Raag Malar",       slug: "malar",       angStart: 1254, angEnd: 1293, range: 39 },
  { name: "Raag Kalyan",      slug: "kalyan",      angStart: 1319, angEnd: 1326, range: 7 },
  { name: "Raag Parbhati",    slug: "parbhati",    angStart: 1327, angEnd: 1351, range: 24 },
];

const totalRange = raags.reduce((s, r) => s + r.range, 0);
console.log("Total range:", totalRange);
raags.forEach(r => {
  const count = Math.round((r.range / totalRange) * 200);
  console.log(`${r.name}: ${count} nodes`);
});
