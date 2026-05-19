const fs = require('fs');

// Raag definitions with centroids
const raags = [
  { name: "Raag Sri",         slug: "sri",         angStart: 1,    angEnd: 13,   cx: 100,  cy: 100,  count: 2 },
  { name: "Raag Majh",        slug: "majh",        angStart: 94,   angEnd: 150,  cx: 350,  cy: 250,  count: 11 },
  { name: "Raag Gauri",       slug: "gauri",       angStart: 151,  angEnd: 346,  cx: 600,  cy: 400,  count: 38 },
  { name: "Raag Asa",         slug: "asa",         angStart: 347,  angEnd: 488,  cx: 900,  cy: 200,  count: 27 },
  { name: "Raag Gujri",       slug: "gujri",       angStart: 489,  angEnd: 526,  cx: 1150, cy: 500,  count: 7 },
  { name: "Raag Devgandhari", slug: "devgandhari", angStart: 527,  angEnd: 536,  cx: 1350, cy: 150,  count: 2 },
  { name: "Raag Bihagra",     slug: "bihagra",     angStart: 537,  angEnd: 556,  cx: 1550, cy: 350,  count: 4 },
  { name: "Raag Wadhans",     slug: "wadhans",     angStart: 557,  angEnd: 594,  cx: 1750, cy: 100,  count: 7 },
  { name: "Raag Sorath",      slug: "sorath",      angStart: 595,  angEnd: 659,  cx: 200,  cy: 700,  count: 12 },
  { name: "Raag Dhanasri",    slug: "dhanasri",    angStart: 660,  angEnd: 695,  cx: 500,  cy: 900,  count: 7 },
  { name: "Raag Bilaval",     slug: "bilaval",     angStart: 795,  angEnd: 858,  cx: 800,  cy: 750,  count: 12 },
  { name: "Raag Ramkali",     slug: "ramkali",     angStart: 876,  angEnd: 974,  cx: 1100, cy: 900,  count: 19 },
  { name: "Raag Maru",        slug: "maru",        angStart: 989,  angEnd: 1106, cx: 1400, cy: 700,  count: 23 },
  { name: "Raag Basant",      slug: "basant",      angStart: 1168, angEnd: 1196, cx: 1700, cy: 950,  count: 5 },
  { name: "Raag Sarang",      slug: "sarang",      angStart: 1197, angEnd: 1253, cx: 300,  cy: 1300, count: 11 },
  { name: "Raag Malar",       slug: "malar",       angStart: 1254, angEnd: 1293, cx: 650,  cy: 1500, count: 8 },
  { name: "Raag Kalyan",      slug: "kalyan",      angStart: 1319, angEnd: 1326, cx: 1000, cy: 1700, count: 1 },
  { name: "Raag Parbhati",    slug: "parbhati",    angStart: 1327, angEnd: 1351, cx: 1300, cy: 1550, count: 5 },
];

const writers = [
  "Guru Nanak Dev Ji",
  "Guru Angad Dev Ji",
  "Guru Amar Das Ji",
  "Guru Ram Das Ji",
  "Guru Arjan Dev Ji",
  "Guru Tegh Bahadur Ji",
  "Bhagat Kabir Ji",
  "Bhagat Ravidas Ji",
  "Bhagat Farid Ji",
  "Bhagat Namdev Ji",
];

const moods = ["serene", "devotional", "contemplative", "joyful", "sorrowful"];

const allTags = [
  "humility","ego","naam","love","truth","grace","service","wisdom",
  "devotion","surrender","gratitude","compassion","patience","courage",
  "faith","detachment","forgiveness","contentment","mindfulness","unity"
];

// Large pool of shabad data
const shabadPool = [
  // Sri
  { g: "ੴ ਸਤਿ ਨਾਮੁ ਕਰਤਾ ਪੁਰਖੁ ਨਿਰਭਉ ਨਿਰਵੈਰੁ", tr: "Ik Oankaar Sat Naam Kartaa Purakh Nirbhau Nirvair", en: "One Universal Creator, Truth is His Name, Doer of all, Fearless, Without enmity" },
  { g: "ਆਦਿ ਸਚੁ ਜੁਗਾਦਿ ਸਚੁ ਹੈ ਭੀ ਸਚੁ ਨਾਨਕ ਹੋਸੀ ਭੀ ਸਚੁ", tr: "Aad Sach Jugaad Sach Hai Bhi Sach Naanak Hosi Bhi Sach", en: "True in the beginning, true through the ages, true even now, Nanak says He shall forever be true" },
  // Majh
  { g: "ਮੇਰਾ ਮਨੁ ਲੋਚੈ ਗੁਰ ਦਰਸਨ ਤਾਈ", tr: "Meraa Man Lochai Gur Darsan Taaee", en: "My mind longs for the blessed vision of the Guru's presence" },
  { g: "ਹਉ ਘੋਲੀ ਜੀਉ ਘੋਲਿ ਘੁਮਾਈ ਗੁਰ ਦਰਸਨ ਸਚੇ ਤਾਈ", tr: "Hau Gholee Jeeo Ghol Ghumaaee Gur Darsan Sache Taaee", en: "I am a sacrifice, my soul is a sacrifice, for the true vision of the Guru" },
  { g: "ਸਤਿਗੁਰ ਕੀ ਬਾਣੀ ਸਤਿ ਸਤਿ ਕਰਿ ਜਾਣਹੁ", tr: "Satigur Kee Baanee Sat Sat Kar Jaanahu", en: "Know the word of the True Guru as absolutely True, accept it with utmost faith" },
  { g: "ਮਨ ਮੇਰੇ ਭਜੁ ਹਰਿ ਹਰਿ ਰਾਇ", tr: "Man Mere Bhaj Har Har Raae", en: "O my mind, meditate upon the Lord, the Sovereign of all" },
  { g: "ਅਨਦਿਨੁ ਹਰਿ ਗੁਣ ਗਾਵਹੁ ਭਾਈ ਸਾਚੀ ਭਗਤਿ ਸੁਹਾਵੈ", tr: "Anadin Har Gun Gaavahu Bhaaee Saachee Bhagat Suhaavai", en: "Day and night, sing the praises of the Lord, O brother; true devotion is ever-beautiful" },
  { g: "ਹਰਿ ਜਪਿ ਲਾਹਾ ਅਗਲਾ ਹਰਿ ਦਰਗਹ ਪੈਧਾ ਜਾਇ", tr: "Har Jap Laahaa Aglaa Har Dargah Paidhaa Jaae", en: "Meditating on the Lord brings the greatest profit; one arrives at His court adorned with honour" },
  { g: "ਤਿਸੁ ਗੁਰ ਕਉ ਹਉ ਵਾਰਿਆ ਜਿਨਿ ਹਰਿ ਸੇਤੀ ਚਿਤੁ ਲਾਇਆ", tr: "Tis Gur Kau Hau Vaariaa Jin Har Setee Chit Laaeyaa", en: "I am a sacrifice to the Guru who has fixed my mind upon the Lord" },
  { g: "ਸਾਧਸੰਗਤਿ ਕੈ ਘਰਿ ਵਾਸਾ ਹੋਇ", tr: "Saadhasangat Kai Ghar Vaasaa Hoe", en: "In the home of the Saadh Sangat, the holy congregation, one truly dwells in peace" },
  { g: "ਨਾਮੁ ਲੈਤ ਮਨਿ ਹੋਇ ਪ੍ਰਗਾਸਾ", tr: "Naam Lait Man Hoe Pragaasaa", en: "Chanting the Naam, the mind is illuminated with divine light" },
  { g: "ਜਿਸੁ ਮਸਤਕਿ ਭਾਗੁ ਸੋ ਨਾਮੁ ਧਿਆਏ", tr: "Jis Mastak Bhaag So Naam Dhiaaee", en: "One who has good fortune written on his forehead meditates on the Naam" },
  { g: "ਬਿਨੁ ਸਤਗੁਰ ਕਿਨੈ ਨ ਪਾਇਓ ਬਿਨੁ ਸਤਿਗੁਰ ਕਿਨੈ ਨ ਪਾਇਆ", tr: "Bin Satgur Kinai Na Paaio Bin Satigur Kinai Na Paaeiaa", en: "Without the True Guru, none have found the Lord; without the True Guru, none shall find Him" },
  // Gauri
  { g: "ਕਾਹੇ ਰੇ ਬਨ ਖੋਜਨ ਜਾਈ", tr: "Kaahe Re Ban Khojan Jaaee", en: "Why do you wander in the forest searching for Him? He dwells within you" },
  { g: "ਸਰਬ ਨਿਵਾਸੀ ਸਦਾ ਅਲੇਪਾ ਤੋਹਿ ਸੰਗਿ ਸਮਾਈਆ", tr: "Sarab Nivaasee Sadaa Alepaa Tohi Sang Samaaeeaa", en: "He who pervades all, yet remains unattached, is merged with you always" },
  { g: "ਮਨ ਰੇ ਗੁਰ ਕੀ ਸਰਣਿ ਸਮਾਉ", tr: "Man Re Gur Kee Saran Samaaou", en: "O mind, take refuge in the sanctuary of the Guru and be absorbed in peace" },
  { g: "ਇਉ ਕਹੈ ਨਾਨਕੁ ਮਨ ਤੂੰ ਜੋਤਿ ਸਰੂਪੁ ਹੈ ਅਪਣਾ ਮੂਲੁ ਪਛਾਣੁ", tr: "Iu Kahai Naanak Man Toon Jot Saroop Hai Apanaa Mool Pachhaan", en: "Thus says Nanak: O mind, you are the embodiment of divine light; recognize your true origin" },
  { g: "ਹਉਮੈ ਨਾਵੈ ਨਾਲਿ ਵਿਰੋਧੁ ਹੈ ਦੁਇ ਨ ਵਸਹਿ ਇਕ ਠਾਇ", tr: "Haumai Naavai Naal Virodhh Hai Due Na Vaseh Ik Thaae", en: "Ego and the Name are in opposition; they cannot dwell in the same place" },
  { g: "ਹਉਮੈ ਦੀਰਘ ਰੋਗੁ ਹੈ ਦਾਰੂ ਭੀ ਇਸੁ ਮਾਹਿ", tr: "Haumai Dheeragh Rog Hai Daahroo Bhee Is Maeh", en: "Ego is a chronic disease, yet the cure for it also lies within" },
  { g: "ਸਾਚੁ ਕਹਹੁ ਸਾਚੁ ਸੁਣਹੁ ਸਾਚੇ ਸਿਉ ਚਿਤੁ ਲਾਇ", tr: "Saach Kahahu Saach Sunahu Saache Siu Chit Laae", en: "Speak the truth, hear the truth, and fix your mind upon the Truth" },
  { g: "ਜਿਨੀ ਨਾਮੁ ਧਿਆਇਆ ਗਏ ਮਸਕਤਿ ਘਾਲਿ", tr: "Jinee Naam Dhiaaeiaa Gae Maskat Ghaal", en: "Those who meditated on the Naam, their toil has ended and they have gone in peace" },
  { g: "ਨਾਨਕ ਤੇ ਮੁਖ ਉਜਲੇ ਕੇਤੀ ਛੁਟੀ ਨਾਲਿ", tr: "Naanak Te Mukh Ujale Ketee Chhuttee Naal", en: "Nanak says, their faces are bright, and many are liberated along with them" },
  { g: "ਗੁਰਮੁਖਿ ਅੰਮ੍ਰਿਤੁ ਪੀਵੈ ਸਦਾ ਸੁਖੁ ਪਾਏ", tr: "Gurmukh Amrit Peevai Sadaa Sukh Paae", en: "The Gurmukh drinks the divine nectar and finds eternal peace" },
  { g: "ਤਿਸੁ ਬਿਨੁ ਘੜੀ ਨ ਜੀਵਉ ਮੇਰੀ ਮਾਏ", tr: "Tis Bin Ghadee Na Jeevou Meree Maae", en: "Without Him, I cannot live even for a moment, O my mother" },
  { g: "ਭਗਤਿ ਕਰਹਿ ਅਰਦਾਸਿ ਸੁਣਹੁ ਪ੍ਰਭ ਮੇਰੇ", tr: "Bhagat Karahi Ardaas Sunahu Prabh Mere", en: "The devotees pray and offer supplication, hear them O my God" },
  { g: "ਸੋ ਕਿਉ ਮਨਹੁ ਵਿਸਾਰੀਐ ਜਿ ਅੰਤਿ ਸਹਾਈ ਹੋਇ", tr: "So Kiu Manahu Visaareeai Ji Ant Sahaaee Hoe", en: "Why forget from the mind that One who shall be our support at the very end" },
  { g: "ਸੰਤ ਜਨਾਂ ਕੀ ਧੂੜਿ ਮਿਲੈ ਤਾਂ ਪ੍ਰਭੁ ਪਾਈਐ", tr: "Sant JanaaN Kee Dhoorh Milai TaaN Prabh Paaeeai", en: "When one receives the dust of the feet of the holy, then God is found" },
  { g: "ਜਾ ਕਉ ਆਇਆ ਸੋਈ ਬਿਹਾਝਹੁ ਹਰਿ ਗੁਰ ਤੇ ਮਨਹਿ ਬਸੇਰਾ", tr: "Jaa Kau Aaeiaa Soee Bihaajhahu Har Gur Te Maneh Baseraa", en: "Purchase what you came for; through the Guru, let the Lord dwell within your mind" },
  { g: "ਕਬੀਰ ਜਿਸੁ ਮਰਨੇ ਤੇ ਜਗੁ ਡਰੈ ਮੇਰੇ ਮਨਿ ਆਨੰਦੁ", tr: "Kabeer Jis Marne Te Jag Darai Mere Man Aanand", en: "Kabir says: what the world fears as death, brings joy to my mind" },
  { g: "ਅਵਲਿ ਅਲਹ ਨੂਰੁ ਉਪਾਇਆ ਕੁਦਰਤਿ ਕੇ ਸਭ ਬੰਦੇ", tr: "Aval Alah Noor Upaaeiaa Kudrat Ke Sabh Bande", en: "First, the divine light created all; all are children of the One creative power" },
  { g: "ਏਕ ਨੂਰ ਤੇ ਸਭੁ ਜਗੁ ਉਪਜਿਆ ਕਉਣੁ ਭਲੇ ਕਉਣੁ ਮੰਦੇ", tr: "Ek Noor Te Sabh Jag Upjiaa Kaun Bhale Kaun Mande", en: "From the one divine light, the entire world came into being; who then is good and who is bad?" },
  { g: "ਮਨ ਤੂੰ ਜੋਤਿ ਸਰੂਪੁ ਹੈ ਆਪਣਾ ਮੂਲੁ ਪਛਾਣੁ", tr: "Man Toon Jot Saroop Hai Apanaa Mool Pachhaan", en: "O mind, you are the very image of divine light; know your true nature and origin" },
  { g: "ਗੁਰੁ ਪਰਮੇਸਰੁ ਏਕੋ ਜਾਣੁ", tr: "Gur Parmesar Eko Jaan", en: "Know the Guru and the Supreme Lord as one and the same" },
  { g: "ਜੋ ਬ੍ਰਹਮੰਡੇ ਸੋਈ ਪਿੰਡੇ ਜੋ ਖੋਜੈ ਸੋ ਪਾਵੈ", tr: "Jo Brahmande Soee Pinde Jo Khojai So Paavai", en: "What is in the universe is also within the body; one who seeks shall find" },
  { g: "ਨਾਮ ਬਿਨਾ ਜੋ ਅਸਥਿਰੁ ਕਹੀਐ ਸੋ ਝੂਠੁ ਮੂਠੁ ਅਭਿਮਾਨੁ", tr: "Naam Binaa Jo Asthir Kaheeai So Jhooth Mooth Abhimaan", en: "Without the Naam, whatever is called permanent is false and vain pride" },
  { g: "ਤਜਿ ਮਾਨੁ ਤਜਿ ਕਰਿ ਝੂਠੁ ਭਜਿ ਲੇਹੁ ਸਾਧਸੰਗਾਤਿ", tr: "Taj Maan Taj Kar Jhooth Bhaj Lehu Saadhasangaaat", en: "Abandon pride, abandon falsehood, and take refuge in the holy congregation" },
  { g: "ਪ੍ਰਭੁ ਮੇਰਾ ਅੰਤਰਜਾਮੀ ਸਭੁ ਜਾਣੈ", tr: "Prabh Meraa Antarjaamee Sabh Jaanai", en: "My God, the Inner-knower, knows all that lies within" },
  { g: "ਸਾਧਸੰਗਿ ਮਿਲਿ ਹਰਿ ਗੁਣ ਗਾਏ", tr: "Saadhasang Mil Har Gun Gaae", en: "Joining the holy congregation, I sing the glories of the Lord" },
  { g: "ਜਨ ਨਾਨਕ ਸਰਣਿ ਪ੍ਰਭੂ ਕੀ ਆਏ", tr: "Jan Naanak Saran Prabhoo Kee Aae", en: "Servant Nanak has come seeking the shelter of God" },
  // Asa
  { g: "ਆਸਾ ਮਹਲਾ ੧ ਛੰਤ ਘਰੁ ੧", tr: "Aasaa Mehalaa 1 Chhant Ghar 1", en: "Aasa, First Mehl, Chhant, First House" },
  { g: "ਭਲੇ ਅਮਰਦਾਸ ਗੁਣ ਤੇਰੇ ਤੇਰੀ ਉਪਮਾ ਤੋਹਿ ਬਨਿ ਆਵੈ", tr: "Bhale Amardaas Gun Tere Teree Upamaa Tohi Ban Aavai", en: "O blessed Amar Das, your virtues are your own praise, which befits only you" },
  { g: "ਆਸਾ ਕੀ ਵਾਰ ਵਿਚਿ ਪ੍ਰਭੁ ਮੇਲਾ", tr: "Aasaa Kee Vaar Vich Prabh Melaa", en: "Within the Vaar of Aasa, the union with God is celebrated" },
  { g: "ਰਾਗੁ ਆਸਾ ਮਹਲਾ ੪ ਸੋ ਪੁਰਖੁ", tr: "Raag Aasaa Mehalaa 4 So Purakh", en: "Raag Aasaa, Fourth Mehl, So Purakh — praise of the All-pervading One" },
  { g: "ਸੋ ਪੁਰਖੁ ਨਿਰੰਜਨੁ ਹਰਿ ਪੁਰਖੁ ਨਿਰੰਜਨੁ ਹਰਿ ਅਗਮਾ ਅਗਮ ਅਪਾਰਾ", tr: "So Purakh Niranjan Har Purakh Niranjan Har Agamaa Agam Apaaraa", en: "That Being is immaculate, the Lord Being is immaculate, the Lord is inaccessible, unreachable, infinite" },
  { g: "ਆਖਣੁ ਵੇਖਣੁ ਬੋਲਣੁ ਚਲਣੁ ਜੀਵਣੁ ਮੇਰਾ ਸਭੁ ਪ੍ਰਭੁ ਰਾਇਆ", tr: "Aakhan Vekhan Bolan Chalan Jeevan Meraa Sabh Prabh Raaeiaa", en: "My speaking, seeing, talking, walking, living — all of this is by the will of my God the King" },
  { g: "ਨਾਨਕ ਦਾਸੁ ਕਹੈ ਬੇਨੰਤੀ ਦਰਸਨੁ ਦੇਖਿ ਜੀਵਾਵੈ", tr: "Naanak Daas Kahai Benantee Darsan Dekh Jeevaavai", en: "Servant Nanak offers this prayer: grant me your vision, that I may live" },
  { g: "ਭਗਤੁ ਭਗਤੁ ਸੁਣੀਐ ਤਿਹੁ ਲੋਈ", tr: "Bhagat Bhagat Suneeai Tihu Loee", en: "Devotee, devotee — this is heard throughout the three worlds" },
  { g: "ਨਾਨਕ ਭਗਤਾ ਸਦਾ ਵਿਗਾਸੁ", tr: "Naanak Bhagtaa Sadaa Vigaas", en: "Nanak says, the devotees are forever in bliss and bloom" },
  { g: "ਸੇਵਕ ਕੀ ਓਟ ਗੁਰਦੇਵ ਤੁਮਾਰੀ", tr: "Sevak Kee Ot Gurdev Tumaaree", en: "The servant's shelter and support is You, O divine Guru" },
  { g: "ਹਰਿ ਕਿਰਪਾ ਤੇ ਸੰਤ ਭੇਟੀਐ", tr: "Har Kirpaa Te Sant Bheteeai", en: "By the Lord's grace, one meets the saints" },
  { g: "ਮਨੁ ਤਨੁ ਸੀਤਲੁ ਸਾਚ ਨਾਮਿ", tr: "Man Tan Seetal Saach Naam", en: "The mind and body are cooled and soothed by the true Name" },
  { g: "ਜਿਸਦਾ ਸਾ ਤਿਸੁ ਦੇਹੁ ਮਿਲਾਇ ਗੁਰ ਕੇ ਸਬਦਿ ਸਮਾਇ", tr: "Jisdaa Saa Tis Dehu Milaae Gur Ke Sabad Samaae", en: "Reunite her with the One to whom she belongs; through the Guru's word, she merges in Him" },
  { g: "ਆਸਾ ਭਰੋਸਾ ਹਰਿ ਕਾ ਨਾਮੁ", tr: "Aasaa Bharosaa Har Kaa Naam", en: "The hope and trust is the Lord's Name alone" },
  { g: "ਸਰਣਿ ਪਰਿਓ ਹਰਿ ਕੀ ਦਾਸਰੋ", tr: "Saran Pario Har Kee Daasaro", en: "I have taken shelter; I am the slave of the Lord's slave" },
  { g: "ਦਾਸ ਕੀ ਕਰਹੁ ਪ੍ਰਤਿਪਾਲਨਾ ਦੇ ਹਰਿ ਨਾਮੁ ਉਧਾਰਿ", tr: "Daas Kee Karahu Pratipaalanaa De Har Naam Udhaar", en: "Nurture and protect Your servant, bestow the Lord's Name and redeem me" },
  { g: "ਜੋ ਤਿਸੁ ਭਾਵੈ ਸੋਈ ਕਰਸੀ ਮੈ ਅਵਰੁ ਨ ਕਰਣਾ", tr: "Jo Tis Bhaavai Soee Karasee Mai Avar Na Karnaa", en: "Whatever pleases Him, that alone shall be done; there is nothing else for me to do" },
  { g: "ਪ੍ਰਭ ਕੀ ਉਸਤਤਿ ਕਰਹੁ ਸੰਤ ਮੀਤ", tr: "Prabh Kee Ustat Karahu Sant Meet", en: "O saints and friends, sing the praises of God" },
  { g: "ਸਫਲ ਜਨਮੁ ਤਿਸੁ ਭਇਓ ਜਿਸੁ ਹਰਿ ਸਿਉ ਪ੍ਰੀਤਿ", tr: "Safal Janam Tis Bhaio Jis Har Siu Preet", en: "Fruitful is the birth of one who holds love for the Lord" },
  { g: "ਸਿਮਰਤ ਨਾਮੁ ਰਿਦੈ ਸੁਖੁ ਪਾਇਆ", tr: "Simrat Naam Ridai Sukh Paaeiaa", en: "Remembering the Name within the heart, peace is attained" },
  { g: "ਮਿਲਿ ਸੰਗਤਿ ਗੁਣ ਗਾਏ ਨਾਮ ਧਿਆਏ ਜਿਸ ਦਾ ਅੰਤੁ ਨ ਪਾਰਾਵਾਰਾ", tr: "Mil Sangat Gun Gaae Naam Dhiaae Jis Daa Ant Na Paaraavaaraa", en: "Joining the congregation, sing His glory and meditate on the Name of Him who has no end or limit" },
  { g: "ਏਕੋ ਸਿਮਰਹੁ ਨਾਨਕ ਜੀਅ ਕੇ ਦਾਤੇ", tr: "Eko Simrahu Naanak Jeea Ke Daate", en: "Remember the One alone, O Nanak — the Giver of the soul's gifts" },
  { g: "ਸਾਧਿਕ ਸਿਧ ਸਭਿ ਤੁਧੁ ਧਿਆਵਹਿ ਬ੍ਰਹਮੇ ਧਿਆਨੁ ਧਰਾਇਆ", tr: "Saadhik Sidh Sabh Tudh Dhiaaavahi Brahme Dhiaan Dharaaeaa", en: "Seekers and siddhas all meditate on You; even Brahma holds his mind fixed in meditation on You" },
  // Gujri
  { g: "ਮਿਲੁ ਮੇਰੇ ਪ੍ਰੀਤਮਾ ਮਿਲੁ ਮੇਰੇ ਪਿਆਰੇ", tr: "Mil Mere Preetamaa Mil Mere Piaare", en: "Meet me, O my Beloved, meet me, O my Dearest" },
  { g: "ਗੁਜਰੀ ਮਹਲਾ ੫ ਅੰਮ੍ਰਿਤ ਨਾਮੁ ਨਿਧਾਨੁ ਹੈ", tr: "Gujaree Mehalaa 5 Amrit Naam Nidhaan Hai", en: "The treasure of the immortal Name is the greatest wealth; O mind, meditate on it" },
  { g: "ਮਾਤਾ ਪਿਤਾ ਤੂਹੈ ਹੈ ਸਾਜਨੁ ਤੂਹੈ ਹੈ", tr: "Maataa Pitaa Toohai Hai Saajan Toohai Hai", en: "You are my mother, You are my father, You are my dearest friend" },
  { g: "ਠਾਕੁਰੁ ਸਰਬ ਸਮਾਣਾ ਬਿਸਰੁ ਨਾਹੀ ਕਾਹੇ ਭੁਲਾਣਾ", tr: "Thaakur Sarab Samaanaa Bisar Naahee Kaahe Bhulaanaa", en: "The Lord pervades all — why do you forget Him, why are you led astray?" },
  { g: "ਮਨੁ ਮੇਰਾ ਰੰਗਿ ਰੰਗਿਆ ਰਾਮ ਰੰਗਿ", tr: "Man Meraa Rang Rangiaa Raam Rang", en: "My mind is dyed deep in the color of the Lord's love" },
  { g: "ਸੁਖ ਦਾਤਾ ਭੈ ਭੰਜਨਾ ਹਰਿ ਸਿਮਰਤ ਸੁਖੁ ਹੋਇ", tr: "Sukh Daataa Bhai Bhanjnaa Har Simrat Sukh Hoe", en: "The Giver of peace, the Destroyer of fear — remembering the Lord, peace comes" },
  { g: "ਗੁਰ ਕਿਰਪਾ ਤੇ ਮਿਲੇ ਰਾਮ", tr: "Gur Kirpaa Te Mile Raam", en: "By the Guru's grace, one meets the Lord" },
  // Devgandhari
  { g: "ਦੇਵਗੰਧਾਰੀ ਮਹਲਾ ੫ ਰਾਮ ਰਾਮ ਰਾਮ ਰਮੁ ਰਾਮਾ", tr: "Devgandhaaree Mehalaa 5 Raam Raam Raam Ram Raamaa", en: "Raag Devgandhari, Fifth Mehl — Chant Ram, Ram, Ram, dwell in the Lord always" },
  { g: "ਬਿਖਿਆ ਮਾਹਿ ਰਚਿਓ ਮਨੁ ਮੇਰਾ ਹਰਿ ਚਰਣ ਨ ਆਵੈ", tr: "Bikhiaa Maahi Rachio Man Meraa Har Charan Na Aavai", en: "My mind is absorbed in worldly poison and comes not to the Lord's feet" },
  // Bihagra
  { g: "ਬਿਹਾਗੜਾ ਮਹਲਾ ੪ ਸਾਜਨੁ ਮਿਲਿਆ ਘਰਿ ਆਇ", tr: "Bihaagrhaa Mehalaa 4 Saajan Miliaa Ghar Aae", en: "The beloved friend has come home to meet me" },
  { g: "ਹਰਿ ਜੀਉ ਗੁਫਾ ਅੰਦਰਿ ਰਖਿ ਕੈ ਵਾਜਾ ਪਵਣੁ ਵਜਾਇਆ", tr: "Har Jeeo Gufaa Andar Rakh Kai Vaajaa Pavan Vajaaeiaa", en: "The dear Lord, placing the soul within the cave of the body, plays the instrument of wind-breath" },
  { g: "ਬਿਹਾਗੜੇ ਵਿਚਿ ਬੈਰਾਗੁ ਭਇਆ ਹਰਿ ਲੜਿ ਲਾਗੇ", tr: "Bihaagre Vich Bairaag Bhaeiaa Har Larh Laage", en: "In Bihagra, deep longing arose; I clung to the Lord's robe" },
  { g: "ਜਿਉ ਚਾਤ੍ਰਿਕੁ ਮੇਘੁ ਦੇਖਿ ਹਰਿਆਵੈ ਹਰਿ ਦਰਸਨ ਲਾਲਚਿ ਆਤੁਰ", tr: "Jio Chaatrik Megh Dekh Hariaaavai Har Darsan Laalach Aatur", en: "As the rainbird rejoices upon seeing the rain cloud, so I am eager with longing for the Lord's vision" },
  // Wadhans
  { g: "ਵਡਹੰਸੁ ਮਹਲਾ ੩ ਕਾਮਣਿ ਕਿਉ ਸੋਵੈ ਮੈਲੈ ਬਿਸਤਰੈ", tr: "Vadhahans Mehalaa 3 Kaaman Kiu Sovai Mailai Bistrai", en: "How can the woman sleep on a dirty bed? She must cleanse it with the Guru's teaching" },
  { g: "ਵਡਹੰਸੁ ਘਰੁ ੧ ਮਹਲਾ ੧ ਸੁਣਿਆ ਮੰਨਿਆ ਮਨਿ ਕੀਤਾ ਭਾਉ", tr: "Vadhahans Ghar 1 Mehalaa 1 Suniaa Manniaa Man Keetaa Bhaao", en: "Heard, believed, and filled the mind with love — this is the path of the devotee" },
  { g: "ਕੂਕੇ ਕੋਕਿਲ ਤਰਵਰ ਬੈਸੰਤਿ ਮਿਲਿ ਸੰਗਤਿ ਗੁਣ ਗਾਵਾ", tr: "Kooke Kokil Taravar Baisant Mil Sangat Gun Gaavaa", en: "The cuckoo calls from the tree in springtime; joining the congregation, I sing His praises" },
  { g: "ਸਾਜਨ ਸੰਤ ਮਿਲਹੁ ਮਿਲਿ ਕਹੀਐ ਕਹਾਂ ਗਇਓ ਬੈਰਾਗੀ", tr: "Saajan Sant Milahu Mil Kaheeai Kahaan Gaio Bairaagee", en: "O saints, let us meet and speak — where has my detached Beloved gone?" },
  { g: "ਨਾਮ ਬਿਨਾ ਸਭਿ ਝੂਠੇ ਭੇਸ", tr: "Naam Binaa Sabh Jhoothe Bhes", en: "Without the Naam, all outward garbs and appearances are false" },
  { g: "ਮਤਿ ਗੁਰ ਆਤਮ ਦੇਵਹੁ ਸੰਤਹੁ", tr: "Mat Gur Aatam Devahu Santahu", en: "O Guru, grant me divine wisdom; O saints, bestow the gift of the soul's light" },
  { g: "ਦੇਹ ਸਜਣ ਅਸੀਸੜੀਆ ਜਿਉ ਹੋਵੈ ਸਾਹਿਬ ਸਿਉ ਮੇਲੁ", tr: "Deh Sajan Aseesrheeyaa Jiu Hovai Saahib Sio Mel", en: "O beloved, give me your blessings, that I may be united with my Master" },
  { g: "ਪਿਰੁ ਪਰਦੇਸਿ ਸਿਧਾਇਆ ਧਨ ਸੇਜ ਇਕੇਲੀ ਰੋਵੈ", tr: "Pir Pardes Sidhaaeiaa Dhan Sej Ikelee Rovai", en: "The Husband has gone abroad; the wife weeps alone on the bed" },
  // Sorath
  { g: "ਸੋਰਠਿ ਮਹਲਾ ੯ ਸਲੋਕੁ ਜੋ ਨਰੁ ਦੁਖ ਮੈ ਦੁਖੁ ਨਹੀ ਮਾਨੈ", tr: "Sorath Mehalaa 9 Salok Jo Nar Dukh Mai Dukh Nahee Maanai", en: "He who does not grieve in grief, nor is joyful in joy — such a person is truly rare" },
  { g: "ਸੋਚ ਕਹੈ ਸਭੁ ਕੋਈ ਸੋਚ ਕਹੈ", tr: "Soch Kahai Sabh Koee Soch Kahai", en: "Everyone speaks of purity, everyone speaks of purity" },
  { g: "ਸੋਰਠਿ ਮਹਲਾ ੧ ਝੂਠੁ ਨ ਬੋਲਿ ਪਾਡੇ ਸਚੁ ਕਹੀਐ", tr: "Sorath Mehalaa 1 Jhooth Na Bol Paade Sach Kaheeai", en: "Do not speak falsehood, O Pandit; speak the truth" },
  { g: "ਮੈ ਗੋਬਿਦੁ ਗੋਬਿਦੁ ਗੋਬਿਦੁ ਸੁਣਿਆ ਗੋਬਿੰਦ ਭਲੋ ਲਾਗਿਓ", tr: "Mai Gobid Gobid Gobid Suniaa Gobind Bhalo Lagio", en: "I heard Gobind, Gobind, Gobind — and the Lord of the Universe seemed so pleasing to me" },
  { g: "ਭਗਤਿ ਵਛਲੁ ਭਯੋ ਠਾਕੁਰੁ ਮੇਰਾ", tr: "Bhagat Vachhal Bhayo Thaakur Meraa", en: "My Master has become filled with love for His devotees" },
  { g: "ਸੋਰਠਿ ਮਹਲਾ ੩ ਏ ਮਨ ਚੰਚਲਾ ਚਤੁਰਾਈ ਕਿਨੈ ਨ ਪਾਇਆ", tr: "Sorath Mehalaa 3 Ee Man Chanchalaa Chaturaaeee Kinai Na Paaeiaa", en: "O fickle mind, no one has ever found the Lord through cleverness alone" },
  { g: "ਗੁਰ ਸੇਵਾ ਤੇ ਹਰਿ ਪਾਈਐ ਮਨੁ ਸਾਚਿ ਰਹੈ ਲਿਵ ਲਾਇ", tr: "Gur Sevaa Te Har Paaeeai Man Saach Rahai Liv Laae", en: "Through service to the Guru, the Lord is found; the mind remains attuned to the Truth" },
  { g: "ਮਨੁ ਬੈਰਾਗੀ ਘਰਿ ਵਸੈ ਸਾਚਉ ਨਾਮੁ ਅਧਾਰੁ", tr: "Man Bairaagee Ghar Vasai Saachau Naam Adhaar", en: "The detached mind dwells at home; the true Name is its foundation" },
  { g: "ਜੀਵਤ ਮਰਹੁ ਮਰਿਆ ਨਹ ਰੋਵਹੁ ਐਸੀ ਮਰਨੀ ਜੋ ਮਰੈ", tr: "Jeevat Marahu Mariaa Nah Rovahu Aisee Marnee Jo Marai", en: "Die while alive; do not weep over the dead. Such a death, if one truly dies it, is blessed" },
  { g: "ਪਾਰਬ੍ਰਹਮ ਕੀ ਜੋਤਿ ਸਮਾਈ ਸੁੰਨਿ ਸਮਾਧਿ ਲਗਾਈ", tr: "Paarabraham Kee Jot Samaaee Sunn Samaadh Lagaaee", en: "The light of the Supreme Lord merges within; one is absorbed in the trance of the void" },
  { g: "ਰਾਮ ਨਾਮ ਜਪੁ ਜੀਅ ਪ੍ਰਾਣ ਧਨੁ", tr: "Raam Naam Jap Jeea Praan Dhan", en: "Meditate on the Lord's Name — it is the wealth of life and breath" },
  { g: "ਜਿਸੁ ਹਰਿ ਸਿਮਰਤ ਸਭੁ ਦੁਖੁ ਭਾਗੈ", tr: "Jis Har Simrat Sabh Dukh Bhaagai", en: "Remembering the Lord, all pain and sorrow flee away" },
  // Dhanasri
  { g: "ਧਨਾਸਰੀ ਮਹਲਾ ੯ ਪ੍ਰਭ ਜੀ ਤੁਮ ਚੰਦਨ ਹਮ ਪਾਨੀ", tr: "Dhanaasaree Mehalaa 9 Prabh Jee Tum Chandan Ham Paanee", en: "O God, You are sandalwood and I am water; Your fragrance permeates my very being" },
  { g: "ਮਨਿ ਮੈਲੈ ਸਭੁ ਕਿਛੁ ਮੈਲਾ", tr: "Man Mailai Sabh Kichh Mailaa", en: "When the mind is impure, everything is impure" },
  { g: "ਜੋ ਪ੍ਰਭੁ ਖੋਜਹਿ ਸੇਈ ਪਾਵਹਿ", tr: "Jo Prabh Khojahi Seee Paavahi", en: "Those who seek God, they alone find Him" },
  { g: "ਨਾਮੁ ਜਿਨ੍ਹਾ ਕੈ ਮਨਿ ਵਸਿਆ ਦੂਖੁ ਕੈਸਾ ਤਿਨ੍ਹ ਪਾਸਿ", tr: "Naam Jinhaa Kai Man Vasiaa Dookh Kaisaa Tinh Paas", en: "In whose mind the Naam dwells — what sorrow can come near them?" },
  { g: "ਧਨਾਸਰੀ ਮਹਲਾ ੧ ਜੀਉ ਪਾਇ ਪਿੰਡੁ ਕਰਿ ਦੁਨੀਆ ਖੇਲਾਇਆ", tr: "Dhanaasaree Mehalaa 1 Jeeo Paae Pind Kar Duniaa Khelaaeaa", en: "Placing the soul in the body, the Lord causes us to play in the world like puppets" },
  { g: "ਗੁਣ ਗਾਵਾ ਨਿਤ ਨਿਤ ਪ੍ਰਭ ਕੇਰੇ", tr: "Gun Gaavaa Nit Nit Prabh Kere", en: "Every day, every day, I sing the praises of my God" },
  { g: "ਕਰਿ ਕਿਰਪਾ ਅਪੁਨੇ ਦਾਸ ਕਉ", tr: "Kar Kirpaa Apune Daas Kau", en: "Grant Your grace to Your servant, O Lord" },
  // Bilaval
  { g: "ਬਿਲਾਵਲੁ ਮਹਲਾ ੫ ਰਾਮ ਨਾਮੁ ਜਪਿ ਸੀਤਲੁ ਮਨੁ", tr: "Bilaaval Mehalaa 5 Raam Naam Jap Seetal Man", en: "Chanting the Lord's Name, the mind becomes cool and serene" },
  { g: "ਤੁਮ ਸਰਣਾਗਤਿ ਰਾਜਾ ਰਾਮ", tr: "Tum Sarnaagat Raajaa Raam", en: "I have sought Your refuge, O King, O Lord" },
  { g: "ਭਲੀ ਸਰੀ ਸੰਤ ਮੰਡਲੀ ਜਿਨਿ ਹਰਿ ਲਿਵ ਲਾਈ", tr: "Bhalee Saree Sant Mandlee Jin Har Liv Laaee", en: "Blessed is the gathering of saints who have fixed their love on the Lord" },
  { g: "ਬਿਲਾਵਲੁ ਘਰੁ ੧੦ ਮਹਲਾ ੪ ਰਾਗੁ ਰਿਦੈ ਹਰਿ ਸਿਮਰਣੁ", tr: "Bilaaval Ghar 10 Mehalaa 4 Raag Ridai Har Simran", en: "The music of the Lord's remembrance plays within the heart" },
  { g: "ਰਾਮ ਰਾਮ ਬੋਲਿ ਬੋਲਿ ਆਨਦ ਕਰਿ", tr: "Raam Raam Bol Bol Aanad Kar", en: "Chanting Ram, Ram, again and again, rejoice in bliss" },
  { g: "ਕਲਿ ਮਾਹਿ ਨਾਮੁ ਧਿਆਇਆ ਗੁਰੁ ਸਾਖੀ ਦੀਪੁ ਜਲਾਇਆ", tr: "Kal Maahi Naam Dhiaaeiaa Gur Saakhee Deep Jalaaeiaa", en: "In this dark age, meditate on the Naam; the Guru's teaching lights the lamp within" },
  { g: "ਗੁਣ ਨਿਧਿ ਸੁਆਮੀ ਮੇਰਾ ਮੈ ਕੀਆ ਸਦਾ ਸੇਵਾ", tr: "Gun Nidhi Suaamee Meraa Mai Keeaa Sadaa Sevaa", en: "My Master is the treasure of all virtues; I shall serve Him always" },
  { g: "ਸਦਾ ਸਦਾ ਹਰਿ ਜਾਪਿਐ ਦੂਖੁ ਦਰਦੁ ਭਉ ਜਾਇ", tr: "Sadaa Sadaa Har Jaapiiai Dookh Darad Bhao Jaae", en: "Forever and ever, meditating on the Lord, pain, sorrow and fear all go away" },
  { g: "ਮਿਲਿ ਮਿਲਿ ਸੰਤ ਕਹਾਣੀਆ ਗਾਏ", tr: "Mil Mil Sant Kahaaneeaa Gaae", en: "Meeting and meeting with the saints, the stories of the Lord are sung" },
  { g: "ਤੇਰੀ ਭਗਤਿ ਨ ਛੋੜਉ ਗੋਵਿੰਦ ਮਨੁ ਮਾਨਿਆ", tr: "Teree Bhagat Na Chhorau Govind Man Maaniaa", en: "I shall not abandon Your devotion, O Govind; my mind is fully convinced" },
  { g: "ਸਫਲੁ ਮੂਰਤੁ ਜਾ ਕੈ ਮਨਿ ਵਸਿਓ ਨਾਰਾਇਣ ਭਗਵਾਨ", tr: "Safal Moorat Jaa Kai Man Vasio Naaraain Bhagvaan", en: "Blessed is the moment when the Lord God dwells within the mind" },
  { g: "ਨਾਮੁ ਅਮੋਲਕੁ ਰਤਨੁ ਹੈ ਗੁਰਿ ਦੀਆ ਵਡਭਾਗੀ", tr: "Naam Amolak Ratan Hai Gur Deeaa Vadbhaagee", en: "The Name is a priceless jewel; the Guru bestows it upon the most fortunate" },
  // Ramkali
  { g: "ਰਾਮਕਲੀ ਮਹਲਾ ੩ ਅਨੰਦੁ", tr: "Raamkalee Mehalaa 3 Anand", en: "Ramkali, Third Mehl — the song of Bliss (Anand Sahib)" },
  { g: "ਅਨੰਦੁ ਭਇਆ ਮੇਰੀ ਮਾਏ ਸਤਿਗੁਰੂ ਮੈ ਪਾਇਆ", tr: "Anand Bhaeiaa Meree Maae Satiguroo Mai Paaeiaa", en: "Bliss has come, O my mother — I have found the True Guru" },
  { g: "ਸਾਚਾ ਨਾਮੁ ਮੇਰਾ ਆਧਾਰੋ", tr: "Saachaa Naam Meraa Aadharo", en: "The true Name is my only support" },
  { g: "ਤਨੁ ਮਨੁ ਥੀਵੈ ਹਰਿਆ", tr: "Tan Man Theevai Hariaa", en: "The body and mind become fresh and green with His grace" },
  { g: "ਸੁਖੁ ਮਾਣਹੁ ਸੇਵਕ ਜਨ ਮੇਰੇ", tr: "Sukh Maanahu Sevak Jan Mere", en: "O my servant beings, enjoy this peace" },
  { g: "ਸਿਧ ਸਾਧਿਕ ਸੁਰਿ ਨਰ ਮੁਨਿ ਜਨ ਸੇਵਕ ਤੇਰੇ ਮੇਰੇ", tr: "Sidh Saadhik Sur Nar Mun Jan Sevak Tere Mere", en: "Siddhas, seekers, angels, holy mortals — all are Your servants" },
  { g: "ਬਾਬਾ ਹੋਰੁ ਖਾਣਾ ਖੁਸੀ ਖੁਆਰੁ ਜਿਤੁ ਖਾਧੈ ਤਨੁ ਪੀੜੀਐ ਮਨ ਮਹਿ ਚਲਹਿ ਵਿਕਾਰ", tr: "Baabaa Hor Khaanaa Khusee Khuaar Jit Kaadhai Tan Peerheai Man Meh Chaleh Vikaar", en: "O Baba, other foods bring joy but lead to ruin; eating them, the body is tormented and vices multiply in the mind" },
  { g: "ਮਨੁ ਮੇਰਾ ਹਰਿ ਰੰਗਿ ਰਾਤਾ", tr: "Man Meraa Har Rang Raataa", en: "My mind is dyed in the colour of the Lord's love" },
  { g: "ਰਾਮਕਲੀ ਮਹਲਾ ੧ ਸਿਧ ਗੋਸਟਿ ਸਾਚੁ ਕਹਉ ਅਰਦਾਸਿ ਹਮਾਰੀ", tr: "Raamkalee Mehalaa 1 Sidh Gosht Saach Kahau Ardaas Hamaaree", en: "Ramkali, First Mehl, Sidh Gosht — I speak the truth; this is my prayer" },
  { g: "ਕਵਨੁ ਸੁ ਮੁਕਤਾ ਕਵਨੁ ਸੁ ਜੁਕਤਾ ਕਵਨੁ ਸੁ ਗਿਆਨੀ ਧਿਆਨੀ", tr: "Kavan Su Muktaa Kavan Su Juktaa Kavan Su Giaanee Dhiaanee", en: "Who is liberated? Who is disciplined? Who is wise? Who is a meditator?" },
  { g: "ਗੁਰ ਪ੍ਰਸਾਦਿ ਭਵਜਲੁ ਤਰੀਐ", tr: "Gur Prasaad Bhavajal Tareeai", en: "By the Guru's grace, one crosses the terrifying ocean of existence" },
  { g: "ਕਰਿ ਸੇਵਾ ਭਜੁ ਹਰਿ ਹਰਿ ਨਾਮੁ", tr: "Kar Sevaa Bhaj Har Har Naam", en: "Do seva, serve others; meditate on the Lord's Name" },
  { g: "ਸਤਿਗੁਰੁ ਸੇਵਿਐ ਮਨੁ ਨਿਰਮਲੁ ਹੋਵੈ", tr: "Satigur Seviai Man Nirmal Hovai", en: "Serving the True Guru, the mind becomes pure" },
  { g: "ਜਿਨੀ ਨਾਮੁ ਵਿਸਾਰਿਆ ਸੇ ਕੁਲ ਕਲੰਕ ਗਾਵਾਰ", tr: "Jinee Naam Visaariaa Se Kul Kalank Gaavaar", en: "Those who forgot the Naam are a disgrace to their lineage and are fools" },
  { g: "ਸਾਧੂ ਸੰਗੁ ਮਿਲਾਵੜਾ ਸਚੁ ਪਾਇਆ ਨਿਜ ਘਰਿ", tr: "Saadhoo Sang Milaavraa Sach Paaeiaa Nij Ghar", en: "Joining the company of the holy ones, the Truth is found in one's own home within" },
  { g: "ਨਾਮ ਰੰਗਿ ਰੰਗਾਵਣੀ ਸਾਚ ਕਬੀਰਾ", tr: "Naam Rang Rangaavanee Saach Kabeera", en: "Kabira says: be dyed in the true colour of the Naam" },
  { g: "ਗਿਆਨ ਖੜਗੁ ਲੈ ਮਨ ਸਿਉ ਲੂਝੈ ਮਨਸਾ ਮਨਹਿ ਸਮਾਇਆ", tr: "Giaan Kharh Lai Man Siu Lhoojhai Mansaa Maneh Samaaeaa", en: "Taking the sword of divine knowledge, wage war against your own mind; let the ego dissolve within the mind" },
  { g: "ਦੂਜੈ ਭਾਇ ਬਹੁਤੁ ਦੁਖੁ ਲਾਗਾ ਜਮ ਕੀ ਕਾਣਿ ਕਢਾਵੈ", tr: "Doojai Bhaae Bahut Dukh Laagaa Jam Kee Kaan Kadhaavai", en: "Through love of duality, great suffering clings; the fear of death approaches" },
  { g: "ਗੁਰੁ ਸੇਵੀਐ ਅੰਮ੍ਰਿਤ ਲਹੀਐ", tr: "Gur Seveeai Amrit Laheeai", en: "Serving the Guru, the nectar of immortality is obtained" },
  // Maru
  { g: "ਮਾਰੂ ਮਹਲਾ ੫ ਤੂ ਠਾਕੁਰੁ ਤੂਮ ਪਹਿ ਅਰਦਾਸਿ", tr: "Maaroo Mehalaa 5 Too Thaakur Toom Peh Ardaas", en: "You are the Master, to You I offer my prayer" },
  { g: "ਜੀਉ ਪਿੰਡੁ ਸਭੁ ਤੇਰਾ ਤੁਝ ਹੀ ਮਾਹਿ ਸਮਾਇਆ", tr: "Jeeo Pind Sabh Teraa Tujh Hee Maahi Samaaeaa", en: "The soul and body are all Yours; everything is absorbed within You" },
  { g: "ਮਾਰੂ ਮਹਲਾ ੧ ਸੁੰਨ ਸਮਾਧਿ ਅਗੰਮ ਅਗੋਚਰ", tr: "Maaroo Mehalaa 1 Sunn Samaadh Agamm Agochar", en: "In the primal void, the inaccessible and imperceptible Lord is absorbed in deep meditation" },
  { g: "ਕੁਦਰਤਿ ਦਿਸੈ ਕੁਦਰਤਿ ਸੁਣੀਐ ਕੁਦਰਤਿ ਭਉ ਸੁਖ ਸਾਰੁ", tr: "Kudrat Disai Kudrat Suneeai Kudrat Bhau Sukh Saar", en: "Creation is seen, creation is heard; creation brings fear and then joy sublime" },
  { g: "ਜੀਵਣ ਮਰਣ ਵਿਚਾਰੁ ਕਰਿ ਤੂੰ ਅੰਤਿ ਸਹਾਈ ਹੋਇ", tr: "Jeevan Maran Vichaar Kar Toon Ant Sahaaee Hoe", en: "Contemplate life and death; may You be my support at the very end" },
  { g: "ਮਾਰੂ ਸੋਲਹੇ ਮਹਲਾ ੩ ਬ੍ਰਹਮ ਗਿਆਨ ਸਭਿ ਜੁਗ ਊਪਰਿ", tr: "Maaroo Solhe Mehalaa 3 Braham Giaan Sabh Jug Oopar", en: "The knowledge of Brahm stands supreme above all ages" },
  { g: "ਹੁਕਮੈ ਅੰਦਰਿ ਸਭੁ ਕੋ ਬਾਹਰਿ ਹੁਕਮ ਨ ਕੋਇ", tr: "Hukmai Andar Sabh Ko Baahar Hukam Na Koe", en: "Everyone is within the Hukam (command); no one is outside of it" },
  { g: "ਹੁਕਮੁ ਰਜਾਈ ਚਲਣਾ ਨਾਨਕ ਲਿਖਿਆ ਨਾਲਿ", tr: "Hukam Rajaaee Chalnaa Naanak Likhiaa Naal", en: "To walk in His Will, says Nanak, is written along with each soul" },
  { g: "ਕੋਟਿ ਜਨਮ ਭ੍ਰਮਿ ਭ੍ਰਮਿ ਆਏ", tr: "Kot Janam Bhram Bhram Aae", en: "Wandering through millions of births, we have come at last" },
  { g: "ਪ੍ਰਭ ਕੀ ਲੀਲਾ ਕਥਨੁ ਨ ਜਾਈ", tr: "Prabh Kee Leelaa Kathan Na Jaaee", en: "The divine play of God cannot be described" },
  { g: "ਮਾਰੂ ਮਹਲਾ ੯ ਕਾਹੇ ਭੂਲੇ ਮੂੜ ਮਨਾ", tr: "Maaroo Mehalaa 9 Kaahe Bhoole Moorh Manaa", en: "O foolish mind, why have you gone astray?" },
  { g: "ਰਾਮੁ ਜਪਹੁ ਰੇ ਮਨ ਰਾਮੁ ਜਪਹੁ", tr: "Raam Japahu Re Man Raam Japahu", en: "O mind, meditate on the Lord; O mind, meditate on the Lord" },
  { g: "ਇਹੁ ਮਾਨਸ ਜਨਮੁ ਦੁਲੰਭੁ ਹੈ ਮਿਲਿਆ ਨ ਬਹੁੜਿ ਪਾਈਐ", tr: "Ihu Maanas Janam Dulambh Hai Miliaa Na Bahurh Paaeeai", en: "This human life is precious and rare; once lost, it will not be found again" },
  { g: "ਪਾਈਐ ਮਾਨਸ ਦੇਹ ਗੁਰੁ ਮਿਲੈ", tr: "Paaeeai Maanas Deh Gur Milai", en: "Having obtained the human body, meet the Guru" },
  { g: "ਦੁਨੀਆ ਖੇਲ ਖੇਲਾਇਆ ਆਪਿ ਠਾਕੁਰਿ ਮੋਹੁ ਪਾਇਆ", tr: "Duniaa Khel Khelaaeaa Aap Thaakur Mohu Paaeiaa", en: "The Lord Himself arranged this play of the world; He Himself has spread the veil of attachment" },
  { g: "ਨਾਨਕ ਕਾਮੁ ਕ੍ਰੋਧੁ ਲੋਭੁ ਮੋਹੁ ਮਾਰਿ ਸਾਧਸੰਗਤਿ", tr: "Naanak Kaam Krodh Lobh Mohu Maar Saadhasangat", en: "Nanak says: destroy lust, anger, greed and attachment by joining the holy congregation" },
  { g: "ਸੋ ਮਰੁ ਜਿਤੁ ਮਰਿ ਕੇ ਫਿਰਿ ਨਾ ਮਰਣਾ", tr: "So Mar Jit Mar Ke Fir Naa Marnaa", en: "Die that death after which you shall never again have to die" },
  { g: "ਤੂੰ ਗਹਿਰ ਗੰਭੀਰੁ ਅਥਾਹੁ ਅਤੋਲਿਆ ਤੇਰਾ ਅੰਤੁ ਨ ਜਾਣੈ ਕੋਇ", tr: "Toon Gahir Gambheer Athaahu Atoliaa Teraa Ant Na Jaanai Koe", en: "You are deep, profound, unfathomable and immeasurable; no one knows Your limit" },
  { g: "ਬੇਅੰਤੁ ਸੁਆਮੀ ਅੰਤੁ ਕੋਈ ਨਾਹੀ ਪਾਇਆ", tr: "Beant Suaamee Ant Koee Naahee Paaeiaa", en: "Infinite is the Master; no one has found His limit" },
  { g: "ਮਾਰੂ ਮਹਲਾ ੪ ਹਰਿ ਅੰਮ੍ਰਿਤ ਭਰੇ ਭੰਡਾਰ ਅਤੁਲ", tr: "Maaroo Mehalaa 4 Har Amrit Bhare Bhandaar Atul", en: "The Lord's stores are filled with immeasurable divine nectar" },
  { g: "ਭਵਜਲ ਪਾਰਿ ਉਤਾਰਿ ਲੇਹੁ ਗੁਰੁ ਦੇਵਹੁ ਹਰਿ ਪਿਆਰੇ", tr: "Bhavajal Paar Utaar Lehu Gur Devahu Har Piaare", en: "Ferry me across this terrible ocean of existence, O dear Lord; bestow the Guru upon me" },
  // Basant
  { g: "ਬਸੰਤੁ ਮਹਲਾ ੫ ਫੂਲੇ ਫਲੇ ਹਰਿਆਵਲੇ ਸਭ ਕੁਛ ਹੋਤ ਤੇਰੀ ਮਰਜੀ", tr: "Basant Mehalaa 5 Phoole Fale Hariaavale Sabh Kuchh Hot Teree Marajee", en: "All bloom, flower and turn green by Your will alone, O Lord" },
  { g: "ਵਣੁ ਤਿਣੁ ਪ੍ਰਭ ਸੰਗਿ ਮਉਲਿਆ ਸੰਮ੍ਰਿਥ ਪੁਰਖ ਅਪਾਰ", tr: "Van Tin Prabh Sang Mauliaa Samrath Purakh Apaar", en: "The forests and grasses blossom with God; He is the All-powerful, Infinite Being" },
  { g: "ਬਸੰਤੁ ਮਹਲਾ ੧ ਫਰੀਦਾ ਜੰਗਲੁ ਜੰਗਲੁ ਕਿਆ ਭਵਹਿ", tr: "Basant Mehalaa 1 Fareedaa Jangal Jangal Kiaa Bhaveh", en: "Farid, why do you wander from forest to forest? God dwells in your own heart" },
  { g: "ਫਰੀਦਾ ਗਲੀਏ ਚਿਕੜੁ ਦੂਰਿ ਘਰੁ ਨਾਲਿ ਪਿਆਰੇ ਨੇਹੁ", tr: "Fareedaa Galee Chikarh Door Ghar Naal Piaare Nehu", en: "Farid, the path is muddy and the home is far away, yet love for the Beloved persists" },
  { g: "ਬਸੰਤਿ ਮਹਲਾ ੫ ਰਾਮ ਰਾਮ ਰਾਮ ਕਹਿ ਨਾਨਕ ਰਾਮ ਰਮੇ", tr: "Basant Mehalaa 5 Raam Raam Raam Keh Naanak Raam Rame", en: "Say Ram, Ram, Ram, O Nanak; the Lord pervades everything" },
  // Sarang
  { g: "ਸਾਰੰਗ ਮਹਲਾ ੫ ਕਬ ਘਰ ਆਉ ਪ੍ਰੀਤਮ ਪਿਆਰੇ", tr: "Saarang Mehalaa 5 Kab Ghar Aau Preetam Piaare", en: "When will You come home, O dearest Beloved?" },
  { g: "ਜਲ ਬਿਨੁ ਮੀਨੁ ਨ ਜੀਵਈ ਮਨੁ ਜਿਉ ਬਿਨੁ ਰਾਮ ਅਧਾਰ", tr: "Jal Bin Meen Na Jeevee Man Jio Bin Raam Adhaar", en: "Without water the fish cannot live; so the mind cannot survive without the Lord's support" },
  { g: "ਮੇਰਾ ਮਨੁ ਤਰਸੈ ਗੁਰੁ ਦਰਸਨ ਦੇਖਣੇ", tr: "Meraa Man Tarasai Gur Darsan Dékhnay", en: "My mind thirsts and longs for the blessed vision of the Guru" },
  { g: "ਸਾਰੰਗ ਮਹਲਾ ੯ ਮਾਨੁਖ ਜਨਮੁ ਅਕਾਰਥੁ ਖੋਇਓ", tr: "Saarang Mehalaa 9 Maanukh Janam Akaarath Khoio", en: "O man, you are wasting this precious human life in vain" },
  { g: "ਰਾਮ ਭਜੁ ਮੇਰੇ ਮਨਾ ਦੁਰਲਭ ਦੇਹ ਹੈ", tr: "Raam Bhaj Mere Manaa Durlabh Deh Hai", en: "Meditate on the Lord, O my mind — this body is so precious and rare" },
  { g: "ਬਿਨੁ ਸਿਮਰਨ ਦਿਨੁ ਰੈਣਿ ਬਿਰਥਾ", tr: "Bin Simran Din Rain Birthaa", en: "Without meditation on the Lord, day and night are wasted" },
  { g: "ਗੁਰ ਕੀ ਮਤਿ ਤੂੰ ਲੇਹਿ ਇਆਨੇ", tr: "Gur Kee Mat Toon Lehi Iaane", en: "O ignorant one, take the wisdom of the Guru" },
  { g: "ਭਜੁ ਰਾਮ ਨਾਮੁ ਸਾਧਸੰਗਿ ਤਰੀਐ", tr: "Bhaj Raam Naam Saadhasang Tareeai", en: "Meditate on the Lord's Name; in the company of the holy, one is ferried across" },
  { g: "ਜਿਸੁ ਸਿਮਰਤ ਸਭ ਕਿਲਬਿਖ ਨਾਸਹਿ ਪਿਤਰੀ ਹੋਇ ਉਧਾਰੋ", tr: "Jis Simrat Sabh Kilbikh Naasahi Pitree Hoe Udhaaro", en: "Remembering the One in whom all sins are erased, even ancestors are liberated" },
  { g: "ਪ੍ਰਭੁ ਦਿਆਲੁ ਭਇਆ ਮਨ ਉਪਰੇ ਤਬ ਹੀ ਸੁਖੁ ਪਾਇਆ", tr: "Prabh Diaaal Bhaeiaa Man Upare Tab Hee Sukh Paaeiaa", en: "When God became merciful upon the mind, then alone was peace attained" },
  // Malar
  { g: "ਮਲਾਰ ਮਹਲਾ ੩ ਮਨੁ ਮੇਰਾ ਗੁਰ ਸਰਣਾਈ", tr: "Malaar Mehalaa 3 Man Meraa Gur Sarnaaeee", en: "My mind has taken the shelter of the Guru" },
  { g: "ਹਰਿ ਅੰਮ੍ਰਿਤ ਨਾਮੁ ਪੀਆਵੈ", tr: "Har Amrit Naam Peeaavai", en: "The Lord causes one to drink the immortal elixir of the Naam" },
  { g: "ਮਲਾਰ ਮਹਲਾ ੧ ਬਾਦਲੁ ਗਰਜੈ ਬਿਜੁਲਿ ਚਮਕੈ", tr: "Malaar Mehalaa 1 Baadal Garajhai Bijul Chamkai", en: "Clouds thunder and lightning flashes; the soul longs for the union with the Beloved" },
  { g: "ਅੰਤਰਿ ਪ੍ਰੀਤਿ ਅਤਿ ਤਿਖਾ ਬਿਰਹੁ ਅੰਤਰਿ ਜਾਲੈ", tr: "Antar Preet At Tikhaa Birahu Antar Jaalai", en: "Within the heart burns the intense love and longing for the Beloved" },
  { g: "ਮਲਾਰ ਕੀ ਵਾਰ ਮਹਲਾ ੧ ਬਿਖੁ ਛੁਟਦੀ ਨਿਰਮਲ ਹੋਇ", tr: "Malaar Kee Vaar Mehalaa 1 Bikh Chhutadee Nirmal Hoe", en: "When poison is released, one becomes pure and clean" },
  { g: "ਪ੍ਰਭੁ ਮਿਲਿਆ ਸੁਖੁ ਪਾਇਆ ਮਿਲਿਆ ਗੁਰੁ ਦਇਆਲੁ", tr: "Prabh Miliaa Sukh Paaeiaa Miliaa Gur Daial", en: "Meeting God, peace is obtained; I have met the compassionate Guru" },
  { g: "ਸਾਵਣੁ ਸਰਸ ਬਨੀ ਹੈ ਬਾਲੀ ਮਨਿ ਤਨਿ ਰੰਗੁ ਚੜਾ ਨਿਆਲੀ", tr: "Saavan Saras Banee Hai Baalee Man Tan Rang Charrhaa Nialee", en: "In the month of Saavan, everything becomes fresh and beautiful; body and mind are drenched in joyful color" },
  { g: "ਮਲਾਰ ਰਾਗ ਵਰਖਾ ਵੇਲਾ ਮੇਘ ਮਲ੍ਹਾਰ ਸੁਨਾਵਣੋ", tr: "Malaar Raag Varkhaa Velaa Megh Malhaar Sunaavno", en: "In the season of rains, the Malhar raag resounds; the soul longs to be drenched in divine love" },
  // Kalyan
  { g: "ਕਲਿਆਣ ਮਹਲਾ ੪ ਹਰਿ ਕੀਰਤਨੁ ਕਰਿ ਆਤਮ ਸੁਖੁ ਪਾਇਆ", tr: "Kaliaan Mehalaa 4 Har Keertan Kar Aatam Sukh Paaeiaa", en: "Singing the praises of the Lord, inner peace of the soul is found" },
  // Parbhati
  { g: "ਪ੍ਰਭਾਤੀ ਮਹਲਾ ੧ ਕਾਇਆ ਸਰੀਰੁ ਹੈ ਖੇਤੁ ਕਰਮ ਕਮਾਵਣੇ", tr: "Prabhaatee Mehalaa 1 Kaaiaa Sareer Hai Khet Karam Kamaavanay", en: "The body is the field; the deeds done are the seeds sown" },
  { g: "ਪ੍ਰਭਾਤੀ ਮਹਲਾ ੯ ਤੇਗ ਬਹਾਦਰ ਸਿਮਰਿਐ ਘਰਿ ਨਉ ਨਿਧਿ ਆਵੈ", tr: "Prabhaatee Mehalaa 9 Teg Bahaadar Simriai Ghar Nau Nidhi Aavai", en: "By contemplating Guru Tegh Bahadur, nine treasures come to the home" },
  { g: "ਸਾਚੁ ਬੋਲਿ ਸਾਚੁ ਕਮਾਵਹੁ ਝੂਠੇ ਨ ਪਤੀਜੈ", tr: "Saach Bol Saach Kamaavahu Jhoothe Na Pateejai", en: "Speak the truth, practise the truth; falsehood cannot endure" },
  { g: "ਪ੍ਰਭਾਤੀ ਮਹਲਾ ੩ ਨਾਮੁ ਤੇਰੋ ਆਧਾਰੋ ਮੇਰੋ ਜੀਉ", tr: "Prabhaatee Mehalaa 3 Naam Tero Aadharo Mero Jeeo", en: "Your Name is the only support of my life" },
  { g: "ਹਰਿ ਨਾਮੁ ਜਪਿ ਦਿਨੁ ਰਾਤਿ ਨਾਨਕ ਸਰਬ ਕਲਿਆਣ", tr: "Har Naam Jap Din Raat Naanak Sarab Kaliaan", en: "Meditate on the Lord's Name day and night, O Nanak, and all blessings shall come" },
];

const tagsByTheme = {
  ego: ["ego","humility","detachment","surrender"],
  naam: ["naam","devotion","faith","mindfulness"],
  love: ["love","devotion","gratitude","unity"],
  service: ["service","compassion","humility","grace"],
  truth: ["truth","wisdom","courage","contentment"],
  impermanence: ["detachment","contentment","patience","faith"],
  liberation: ["surrender","grace","wisdom","faith"],
  nature: ["unity","contentment","gratitude","mindfulness"],
};

function jitter(max=150) {
  return Math.round((Math.random()-0.5)*2*max);
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random()*arr.length)];
}

function pickTags(n=3) {
  const shuffled = [...allTags].sort(()=>Math.random()-0.5);
  return shuffled.slice(0,n);
}

function randInt(min,max) {
  return Math.floor(Math.random()*(max-min+1))+min;
}

const writerMoodMap = {
  "Guru Nanak Dev Ji": ["contemplative","serene","devotional"],
  "Guru Angad Dev Ji": ["serene","devotional"],
  "Guru Amar Das Ji": ["devotional","joyful"],
  "Guru Ram Das Ji": ["devotional","serene","sorrowful"],
  "Guru Arjan Dev Ji": ["serene","joyful","devotional"],
  "Guru Tegh Bahadur Ji": ["contemplative","sorrowful","serene"],
  "Bhagat Kabir Ji": ["contemplative","sorrowful","devotional"],
  "Bhagat Ravidas Ji": ["devotional","serene"],
  "Bhagat Farid Ji": ["sorrowful","contemplative"],
  "Bhagat Namdev Ji": ["devotional","joyful"],
};

let nodes = [];
let globalIdx = 1;
let poolIdx = 0;

for (const raag of raags) {
  const { name, slug, angStart, angEnd, cx, cy, count } = raag;
  for (let i = 0; i < count; i++) {
    const shabadData = shabadPool[poolIdx % shabadPool.length];
    poolIdx++;

    const writer = writers[(globalIdx + i) % writers.length];
    const moodOptions = writerMoodMap[writer] || moods;
    const mood = moodOptions[Math.floor(Math.random()*moodOptions.length)];
    const tagCount = randInt(2,5);
    const tags = pickTags(tagCount);
    const ang = randInt(angStart, angEnd);
    const x = Math.max(50, Math.min(1950, cx + jitter()));
    const y = Math.max(50, Math.min(1950, cy + jitter()));
    const paddedAng = String(ang).padStart(4,'0');
    const id = `SGGS_${paddedAng}_${i+1}`;

    nodes.push({
      id,
      ang,
      gurmukhi: shabadData.g,
      transliteration: shabadData.tr,
      english: shabadData.en,
      raag: name,
      raagSlug: slug,
      writer,
      mood,
      tags,
      clusterX: x,
      clusterY: y,
    });

    globalIdx++;
  }
}

fs.writeFileSync('/home/user/KhalsaGraph/public/sggsNodes.json', JSON.stringify(nodes, null, 2));
console.log(`Written ${nodes.length} nodes`);
