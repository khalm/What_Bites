/* WhatBites — velg riktig agn fra boksen din / pick the right bait from your box.
 * 100 % free: weather from Open-Meteo, fish records from GBIF, place names from OpenStreetMap,
 * species names/photos/info from Wikipedia, and all photo analysis runs on the phone
 * (vision.js) with a rules engine (engine.js).
 */
const $ = (id) => document.getElementById(id);

/* ---------- language ---------- */
const T = {
  no: {
    savedOffline: '📦 Lagret for bruk uten nett.',
    usingSaved: (place, age) => `📴 Uten nett — bruker data lagret ${place ? 'for ' + place + ' ' : ''}${age}.`,
    offlineNothing: '📴 Uten nett, og ingen lagrede data her. Appen bruker GPS, solhøyde og bildene dine — vær og fiskearter mangler.',
    forecastOld: 'Værvarselet er for gammelt — skydekket tas fra bildet.',
    age: { now: 'nå nettopp', hours: (h) => `for ${h} t siden`, days: (d) => `for ${d} ${d === 1 ? 'dag' : 'dager'} siden` },
    planTitle: '🗺️ Planlegg tur — lagre et sted for bruk uten nett', planHint: 'Søk opp vannet du skal til mens du har nett. Appen lagrer værvarsel for 4 dager, fiskearter og vanntype.',
    planPh: 'f.eks. Mjøsa eller Akerselva', planSearch: 'Søk', searching: 'Søker…', noPlaces: 'Fant ingen steder.',
    planNeedsNet: 'Du trenger nett for å planlegge en tur.', savingTrip: (n) => `Lagrer ${n}…`,
    tripSaved: (n, f, w) => `✓ ${n} er lagret${w ? ' (' + w.toLowerCase() + ')' : ''}: værvarsel for 4 dager og ${f} fiskearter.`,
    savedPlaces: 'Lagrede steder', remove: 'Fjern', offlineBadge: '📴 Uten nett',
    s1title: 'Sted og vær', s1intro: 'Finn plassen din for å hente vær og hvilke fisk som finnes der.',
    useLoc: '📍 Bruk min posisjon', refreshLoc: '📍 Oppdater posisjon', finding: 'Finner deg…', loading: 'Henter vær og fisk…',
    gotIt: 'Klart. Vis meg vannet nå.', noGeo: 'Nettleseren støtter ikke posisjon.',
    geoFail: (m) => `Fikk ikke posisjon (${m}). Tillat posisjon for denne siden og prøv igjen.`,
    fishNearby: 'Fisk registrert i nærheten', fishSource: 'Arter fra GBIF-observasjoner innen ca. 30 km. Info og bilder fra Wikipedia.',
    fishTap: 'Trykk på en art for bilde og info, og for å velge hva du fisker etter i dag.',
    fishingFor: 'Fisker etter:', clearPref: 'alle arter',
    noFish: 'Fant ingen fiskeregistreringer i nærheten — appen bruker vanlige arter for vanntypen.', noWeather: 'Vær er ikke tilgjengelig akkurat nå.',
    wind: 'Vind', cloud: 'Skydekke', rainNow: 'Nedbør nå', day: '☀️ Dag', night: '🌙 Natt',
    hpa: { rising: 'hPa, stigende', falling: 'hPa, fallende', steady: 'hPa, stabilt' },
    s2title: 'Vis vannet', s2intro: 'Appen sjekker skydekke, lys, vanntype og hvor klart vannet er — fra bildene dine, værvarselet og kartet.',
    ovBtn: '📷 Oversiktsbilde (vann + himmel)', cuBtn: '📷 Nærbilde rett ned i vannet',
    ck: { sky: 'Skydekke', light: 'Lys', water: 'Vanntype', clarity: 'Sikt i vannet' },
    skyVals: { clear: 'Klart', partly: 'Delvis skyet', overcast: 'Overskyet', sunset: 'Solnedgang', dark: 'Mørk himmel' },
    src: { photo: 'bilde', weather: 'værvarsel', gps: 'kart', sun: 'solhøyde', camera: 'kameraets lysmåler', user: 'valgt av deg', clock: 'klokka' },
    missing: 'mangler', within: { near: 'innen 200 m', km: 'innen 1 km', plan: 'planlagt tur' },
    ask: {
      start: 'Ta et oversiktsbilde: stå ved vannet og hold telefonen slik at horisonten er midt i bildet — litt himmel øverst og vann nederst.',
      noSky: 'Fant ikke himmel i bildet. Vipp telefonen litt opp, så en stripe himmel kommer med øverst.',
      noWater: 'Fant ikke vann i bildet. Pek kameraet mot vannflaten, ikke bare land eller trær.',
      needCloseup: 'Nå et nærbilde: hold telefonen rett ned mot vannet ved kanten, ca. en halv meter over, så appen ser hvor klart vannet er.',
      reflection: 'Vannet speiler himmelen, så fargen kan ikke leses. Ta et nærbilde rett ned i vannet — skygg gjerne med kroppen.',
      closeupUnsure: 'Litt usikkert. Prøv et nytt nærbilde rett ned der det er grunt, uten sol-gjenskinn.',
      closeupNoWater: 'Det så ikke ut som vann. Hold kameraet rett ned mot vannflaten.',
      tooDark: 'For mørkt til å lese bildet. Velg sikt (og vanntype) selv under, eller lys på vannet med lommelykt.',
      askUser: 'Klarte ikke å avgjøre sikten fra bildene. Velg selv under.',
    },
    pickWater: 'Fant ikke sikkert hvilket vann du er ved. Velg vanntype under.',
    pickClarity: 'Velg sikt i vannet under.',
    skipSky: 'Hopp over himmelbildet — bruk værvarselet',
    allDone: '✓ Alt er sjekket! Gå videre til agnboksen.',
    analyzing: 'Leser bildet…', fixHere: 'Rett selv om noe er feil',
    locFirst: 'Tips: trykk «Bruk min posisjon» i steg 1, så kan appen sjekke værvarselet og hvilket vann du er ved.',
    notes: {
      skyConflictPhoto: 'Bildet viser et annet skydekke enn værvarselet — appen stoler på bildet.',
      skyConflictWeather: 'Bildet og værvarselet er uenige om skydekket — appen bruker værvarselet.',
      waterConflict: 'Bildet ser ut som en annen vanntype enn kartet viser. Sjekk at vanntypen stemmer.',
      lightDarker: 'Kameraet målte mindre lys enn ventet (skygge eller mørke skyer) — appen bruker det.',
      heavyRain: 'Mye regn siste døgn — vannet kan være mer farget enn vanlig.',
    },
    s2btn: '📷 Ta bilde av plassen', water: 'Vanntype', clarity: 'Sikt i vannet', light: 'Lys',
    opts: {
      water: { lake: 'Innsjø', river: 'Elv', sea: 'Sjø' },
      clarity: { clear: 'Klart', stained: 'Litt farget', murky: 'Grumsete' },
      light: { sun: 'Sol', overcast: 'Overskyet', low: 'Skumring', night: 'Natt' },
    },
    segHelp: 'Det du velger her overstyrer bildene og værvarselet. Trykk på valgt knapp igjen for å la appen bestemme.',
    tooDark: 'Det er for mørkt til å lese bildet. Velg lys, vanntype og sikt selv under.',
    darkNow: 'Det er mørkt nå, så bildet kan ikke leses. Velg vanntype og sikt selv.',
    s3title: 'Vis agnboksen', s3intro: 'Åpne boksen og ta bilde rett ovenfra i godt lys (bruk lommelykt om det er mørkt).', s3btn: '🎣 Ta bilde av agnboksen',
    modelNote: 'Første gang lastes en gratis AI-modell ned (ca. 155 MB).',
    modelReady: 'AI-modellen er lastet ned og ligger på telefonen.',
    bannerTitle: '📶 Last ned AI-modellen mens du har Wi-Fi',
    bannerText: 'Appen trenger en gratis AI-modell (ca. 155 MB) for å finne agnet i bildet. Last den ned nå på Wi-Fi — da virker appen også ved vannet uten nett.',
    bannerMobile: 'Det ser ut som du er på mobildata. Vent gjerne til du har Wi-Fi.',
    later: 'Senere', downloadNow: 'Last ned nå', bannerDone: '✅ Ferdig! Modellen ligger nå på telefonen.',
    downloading: (p, mb) => `Laster ned AI-modell… ${Math.round(p * 100)} % av ${mb} MB`,
    detecting: 'Ser etter agn i bildet…', use: 'Bruk', others: 'Andre i boksen', target: 'Mål', how: 'Slik', size: 'Størrelse',
    noBaits: 'Fant ikke noe agn. Prøv et nærmere og lysere bilde rett ovenfra, med agnet spredt litt utover.',
    fixType: 'Feil type eller farge? Endre det, så regnes valget ut på nytt.',
    buyTitle: 'Til neste gang', buyIntro: '',
    buySkitt: 'Søk hos Skittfiske ↗', buyFinn: 'Brukt på Finn.no ↗', shopsNear: 'Fiskebutikker i nærheten', route: 'Veibeskrivelse ↗',
    shopsLoading: 'Ser etter butikker i nærheten…', noShops: 'Fant ingen fiskebutikker innen 25 km.', wormBuy: 'Fiskemark får du i fiskebutikker og på mange bensinstasjoner.',
    bestColors: 'Beste farger nå', favColors: 'Gode farger',
    camStarting: 'Starter kamera…', camHint: 'Hold telefonen rett over boksen. Trykk 🔦 for lys.',
    camNoTorch: 'Telefonen lar ikke appen styre lyset. Bruk lommelykt, eller «Velg bilde».',
    torchOn: 'Lys på', torchOff: 'Lys av', camGallery: 'Velg bilde', camClose: 'Lukk kamera', camShoot: 'Ta bilde',
    flashNote: '📸 Bildet er tatt med blits — da ser agn ofte blankere og lysere ut enn de er. Sjekk fargene i lista under og rett dem om nødvendig.',
    dimNote: '🔦 Bildet er mørkt, så fargene kan være feil. Lys på boksen med lommelykt og ta et nytt bilde, eller rett fargene i lista.',
    nightShiny: '🌙 Blanke farger blinker dårlig i mørket — dette er bare det beste i boksen. Et svart, lilla eller selvlysende agn er bedre om natta.', typeLbl: 'Agntype', colorLbl: 'Farge',
    modelFail: 'Kunne ikke laste AI-modellen. Sjekk nettet og prøv igjen.',
    disclaimer: 'Agnvalg er forslag — sjekk lokale fiskeregler og fredningstider.',
    pickOn: '🎯 Jeg fisker etter denne', pickOff: '✖ Fjern fra dagens arter', readWiki: 'Les mer på Wikipedia ↗', close: 'Lukk',
    noInfo: 'Fant ingen artikkel om denne arten.', typicalSize: 'Typisk agn',
  },
  en: {
    savedOffline: '📦 Saved for use without signal.',
    usingSaved: (place, age) => `📴 No signal — using data saved ${place ? 'for ' + place + ' ' : ''}${age}.`,
    offlineNothing: '📴 No signal and no saved data here. The app uses GPS, sun height and your photos — weather and fish species are missing.',
    forecastOld: 'The saved forecast is too old — cloud cover comes from the photo.',
    age: { now: 'just now', hours: (h) => `${h} h ago`, days: (d) => `${d} ${d === 1 ? 'day' : 'days'} ago` },
    planTitle: '🗺️ Plan a trip — save a place for use without signal', planHint: 'Look up the water you are going to while you have signal. The app saves a 4-day forecast, fish species and water type.',
    planPh: 'e.g. Mjøsa or Akerselva', planSearch: 'Search', searching: 'Searching…', noPlaces: 'No places found.',
    planNeedsNet: 'You need signal to plan a trip.', savingTrip: (n) => `Saving ${n}…`,
    tripSaved: (n, f, w) => `✓ ${n} is saved${w ? ' (' + w.toLowerCase() + ')' : ''}: 4-day forecast and ${f} fish species.`,
    savedPlaces: 'Saved places', remove: 'Remove', offlineBadge: '📴 No signal',
    s1title: 'Where & weather', s1intro: 'Find your spot to load weather and the fish that live there.',
    useLoc: '📍 Use my location', refreshLoc: '📍 Refresh location', finding: 'Finding you…', loading: 'Loading weather and fish…',
    gotIt: 'Got it. Now show me the water.', noGeo: 'This browser has no location support.',
    geoFail: (m) => `Couldn't get location (${m}). Allow location for this site and try again.`,
    fishNearby: 'Fish recorded nearby', fishSource: 'Species from GBIF observation records within ~30 km. Info and photos from Wikipedia.',
    fishTap: 'Tap a species for a photo and info, and to choose what you are fishing for today.',
    fishingFor: 'Fishing for:', clearPref: 'all species',
    noFish: 'No fish records nearby — the app uses common species for the water type.', noWeather: 'Weather unavailable right now.',
    wind: 'Wind', cloud: 'Cloud cover', rainNow: 'Rain now', day: '☀️ Day', night: '🌙 Night',
    hpa: { rising: 'hPa, rising', falling: 'hPa, falling', steady: 'hPa, steady' },
    s2title: 'Show the water', s2intro: 'The app checks cloud cover, light, water type and water clarity — from your photos, the weather forecast and the map.',
    ovBtn: '📷 Overview photo (water + sky)', cuBtn: '📷 Close-up straight down into the water',
    ck: { sky: 'Cloud cover', light: 'Light', water: 'Water type', clarity: 'Water clarity' },
    skyVals: { clear: 'Clear', partly: 'Partly cloudy', overcast: 'Overcast', sunset: 'Sunset', dark: 'Dark sky' },
    src: { photo: 'photo', weather: 'forecast', gps: 'map', sun: 'sun height', camera: "camera's light meter", user: 'chosen by you', clock: 'clock' },
    missing: 'missing', within: { near: 'within 200 m', km: 'within 1 km', plan: 'planned trip' },
    ask: {
      start: 'Take an overview photo: stand by the water and hold the phone so the horizon is in the middle — some sky at the top, water at the bottom.',
      noSky: "Couldn't find sky in the photo. Tilt the phone up a little so a strip of sky is included at the top.",
      noWater: "Couldn't find water in the photo. Point the camera at the water surface, not just land or trees.",
      needCloseup: 'Now a close-up: hold the phone straight down over the water at the edge, about half a metre above, so the app can see how clear it is.',
      reflection: 'The water is mirroring the sky, so its colour can\'t be read. Take a close-up straight down — shade it with your body if you can.',
      closeupUnsure: 'Not quite sure. Try another close-up straight down where it is shallow, without sun glare.',
      closeupNoWater: "That didn't look like water. Hold the camera straight down at the water surface.",
      tooDark: 'Too dark to read the photo. Choose clarity (and water type) yourself below, or shine a torch on the water.',
      askUser: "Couldn't decide the clarity from the photos. Please choose below.",
    },
    pickWater: "Couldn't tell for sure which water you are at. Choose the water type below.",
    pickClarity: 'Choose the water clarity below.',
    skipSky: 'Skip the sky photo — use the forecast',
    allDone: '✓ Everything checked! Move on to your bait box.',
    analyzing: 'Reading the photo…', fixHere: 'Correct it yourself if something is wrong',
    locFirst: 'Tip: tap "Use my location" in step 1 so the app can check the forecast and which water you are at.',
    notes: {
      skyConflictPhoto: 'The photo shows different cloud cover than the forecast — the app trusts the photo.',
      skyConflictWeather: 'The photo and the forecast disagree on cloud cover — the app uses the forecast.',
      waterConflict: 'The photo looks like a different water type than the map shows. Check the water type is right.',
      lightDarker: 'The camera measured less light than expected (shade or dark clouds) — the app uses that.',
      heavyRain: 'Lots of rain in the last 24 hours — the water may be more coloured than usual.',
    },
    s2btn: '📷 Photograph the spot', water: 'Water type', clarity: 'Water clarity', light: 'Light',
    opts: {
      water: { lake: 'Lake', river: 'River', sea: 'Sea' },
      clarity: { clear: 'Clear', stained: 'Stained', murky: 'Murky' },
      light: { sun: 'Sunny', overcast: 'Overcast', low: 'Dusk', night: 'Night' },
    },
    segHelp: 'What you choose here overrides the photos and forecast. Tap a selected button again to let the app decide.',
    tooDark: 'Too dark to read the photo. Choose light, water type and clarity yourself below.',
    darkNow: "It's dark now, so a photo can't be read. Choose water type and clarity yourself.",
    s3title: 'Show your bait box', s3intro: 'Open your tackle box and photograph it from above in good light (use a torch if dark).', s3btn: '🎣 Photograph bait box',
    modelNote: 'The first time, a free AI model is downloaded (about 155 MB).',
    modelReady: 'The AI model is downloaded and stored on your phone.',
    bannerTitle: '📶 Download the AI model while on Wi-Fi',
    bannerText: 'The app needs a free AI model (about 155 MB) to find the baits in your photo. Download it now on Wi-Fi — then the app also works by the water without signal.',
    bannerMobile: 'Looks like you are on mobile data. You may want to wait for Wi-Fi.',
    later: 'Later', downloadNow: 'Download now', bannerDone: '✅ Done! The model is now stored on your phone.',
    downloading: (p, mb) => `Downloading AI model… ${Math.round(p * 100)}% of ${mb} MB`,
    detecting: 'Looking for baits in the photo…', use: 'Use', others: 'Others in the box', target: 'Target', how: 'How', size: 'Size',
    noBaits: "I couldn't find any baits. Try a closer, brighter photo from above, with the baits spread out a bit.",
    fixType: 'Wrong type or colour? Change it and the pick is recalculated.',
    buyTitle: 'For next time', buyIntro: '',
    buySkitt: 'Search Skittfiske ↗', buyFinn: 'Used on Finn.no ↗', shopsNear: 'Fishing shops nearby', route: 'Directions ↗',
    shopsLoading: 'Looking for shops nearby…', noShops: 'No fishing shops found within 25 km.', wormBuy: 'Worms are sold in fishing shops and many petrol stations.',
    bestColors: 'Best colours now', favColors: 'Good colours',
    camStarting: 'Starting camera…', camHint: 'Hold the phone straight above the box. Tap 🔦 for light.',
    camNoTorch: "This phone doesn't let the app control the light. Use a torch, or \"Choose photo\".",
    torchOn: 'Light on', torchOff: 'Light off', camGallery: 'Choose photo', camClose: 'Close camera', camShoot: 'Take photo',
    flashNote: '📸 The photo was taken with flash — lures often look shinier and lighter than they are. Check the colours in the list below and correct them if needed.',
    dimNote: '🔦 The photo is dark, so the colours may be wrong. Light the box with a torch and take a new photo, or correct the colours in the list.',
    nightShiny: '🌙 Shiny colours flash poorly in the dark — this is just the best in your box. A black, purple or glow lure is better at night.', typeLbl: 'Bait type', colorLbl: 'Colour',
    modelFail: "Couldn't load the AI model. Check your connection and try again.",
    disclaimer: 'Bait picks are suggestions — check local fishing rules and seasons.',
    pickOn: "🎯 I'm fishing for this", pickOff: "✖ Remove from today's species", readWiki: 'Read more on Wikipedia ↗', close: 'Close',
    noInfo: 'No article found for this species.', typicalSize: 'Typical bait',
  },
};
let lang = localStorage.getItem('wb_ui') || 'no';
const t = (k) => T[lang][k];
const L = () => (lang === 'no' ? 0 : 1);

/* ---------- state ---------- */
const state = {
  lat: null, lon: null, place: '', weather: null, fish: [],
  env: { water: 'lake', clarity: 'stained', light: 'overcast' },
  envSetByUser: {},
  bait: null, // { img, baits:[{id,type,color,box}] }
  // Species the user is fishing for in this session (cleared when the app/tab is closed)
  preferred: JSON.parse(sessionStorage.getItem('wb_pref') || '[]'),
};
const savePref = () => sessionStorage.setItem('wb_pref', JSON.stringify(state.preferred));

function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  // The button shows the language you switch TO
  $('langFlag').textContent = lang === 'no' ? '🇬🇧' : '🇳🇴';
  $('langCode').textContent = lang === 'no' ? 'EN' : 'NO';
  $('modelNote').textContent = modelOk() ? t('modelReady') : t('modelNote');
  renderBanner();
  if (state.lat !== null) { $('locBtn').textContent = t('refreshLoc'); renderConditions(); loadWikiNames(); }
  renderSegs(); renderSpot(); renderTrips(); renderNet();
  $('planQ').placeholder = t('planPh');
  if (state.bait) renderBaitResult();
}
$('langBtn').onclick = () => { lang = lang === 'no' ? 'en' : 'no'; localStorage.setItem('wb_ui', lang); applyLang(); };

/* ---------- helpers ---------- */
function busy(on, text = '', progress = null) {
  $('busyText').textContent = text;
  $('busy').classList.toggle('hidden', !on);
  $('busyBar').classList.toggle('hidden', progress === null);
  if (progress !== null) $('busyFill').style.width = `${Math.round(progress * 100)}%`;
}
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function showError(el, msg) { el.classList.remove('hidden', 'pick'); el.innerHTML = `<p class="err">${esc(msg)}</p>`; }
async function getJSON(url, ms = 9000) {
  // Weak signal by the water: give up after a while instead of hanging
  const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), ms);
  const r = await fetch(url, { signal: ctl.signal }).finally(() => clearTimeout(to));
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}
const modelOk = () => !!localStorage.getItem('wb_model_ok');

const WMO = {
  0: ['Klart', 'Clear'], 1: ['Lettskyet', 'Mostly clear'], 2: ['Delvis skyet', 'Partly cloudy'], 3: ['Overskyet', 'Overcast'],
  45: ['Tåke', 'Fog'], 48: ['Rimtåke', 'Rime fog'], 51: ['Lett yr', 'Light drizzle'], 53: ['Yr', 'Drizzle'], 55: ['Kraftig yr', 'Heavy drizzle'],
  61: ['Lett regn', 'Light rain'], 63: ['Regn', 'Rain'], 65: ['Kraftig regn', 'Heavy rain'], 66: ['Underkjølt regn', 'Freezing rain'],
  67: ['Underkjølt regn', 'Freezing rain'], 71: ['Lett snø', 'Light snow'], 73: ['Snø', 'Snow'], 75: ['Kraftig snø', 'Heavy snow'],
  77: ['Snøkorn', 'Snow grains'], 80: ['Regnbyger', 'Showers'], 81: ['Regnbyger', 'Showers'], 82: ['Kraftige byger', 'Heavy showers'],
  85: ['Snøbyger', 'Snow showers'], 86: ['Snøbyger', 'Snow showers'], 95: ['Torden', 'Thunderstorm'], 96: ['Torden', 'Thunderstorm'], 99: ['Torden', 'Thunderstorm'],
};
const sky = (code) => (WMO[code] || ['Ukjent', 'Unknown'])[L()];
const compass = (deg) => (lang === 'no'
  ? ['N', 'NØ', 'Ø', 'SØ', 'S', 'SV', 'V', 'NV'] : ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'])[Math.round(deg / 45) % 8];

/* ---------- species names & info (Wikipedia) ---------- */
const wikiCache = {}; // `${lang}|${sci}` -> {title, extract, img, url} | null
function wikiKey(sci, lg = lang) { return `${lg}|${sci}`; }
function loadWikiCacheFromStorage() {
  try { Object.assign(wikiCache, JSON.parse(localStorage.getItem('wb_wiki') || '{}')); } catch { /* ignore */ }
}
function saveWikiCache() { try { localStorage.setItem('wb_wiki', JSON.stringify(wikiCache)); } catch { /* full */ } }

async function wikiSummary(sci, lg = lang) {
  const k = wikiKey(sci, lg);
  if (k in wikiCache) return wikiCache[k];
  const host = lg === 'no' ? 'no' : 'en';
  let v = null;
  try {
    const d = await getJSON(`https://${host}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(sci.replace(/ /g, '_'))}`);
    if (d.type !== 'disambiguation' && d.extract) {
      v = {
        title: d.title,
        extract: d.extract,
        img: d.thumbnail?.source || d.originalimage?.source || '',
        url: d.content_urls?.mobile?.page || d.content_urls?.desktop?.page || '',
      };
    }
  } catch (err) {
    // Only remember "no article" for a real 404 — not when there is just no signal
    if (!String(err?.message).startsWith('404')) return null;
  }
  wikiCache[k] = v;
  saveWikiCache();
  return v;
}

/** Common name: built-in list first, then the Wikipedia article title (if it isn't just the Latin name). */
function commonName(sci) {
  const s = Engine.SPECIES[sci];
  if (s) return lang === 'no' ? s.no : s.en;
  const w = wikiCache[wikiKey(sci)];
  if (w && w.title && w.title.toLowerCase() !== sci.toLowerCase()) {
    const name = w.title.replace(/\s*\(.*\)$/, '');
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  return '';
}

let wikiLoading = false;
async function loadWikiNames() {
  if (wikiLoading) return;
  wikiLoading = true;
  const missing = state.fish.filter((f) => !Engine.SPECIES[f.name] && !(wikiKey(f.name) in wikiCache));
  // a few at a time, to be gentle on Wikipedia
  for (let i = 0; i < missing.length; i += 5) {
    await Promise.all(missing.slice(i, i + 5).map((f) => wikiSummary(f.name)));
    renderFishChips();
  }
  wikiLoading = false;
}

/* ---------- species sheet ---------- */
let sheetSci = null;
async function openSheet(sci) {
  sheetSci = sci;
  const name = commonName(sci);
  $('sheetTitle').textContent = name || sci;
  $('sheetSci').textContent = sci;
  $('sheetText').textContent = '…';
  $('sheetImgWrap').classList.add('hidden');
  $('sheetWiki').classList.add('hidden');
  const z = Engine.SIZES[sci];
  $('sheetSize').textContent = z ? `${t('typicalSize')}: ${z.g[0]}–${z.g[1]} g, ${z.cm[0]}–${z.cm[1]} cm · ${lang === 'no' ? 'krok' : 'hook'} ${z.hook}` : '';
  const fav = Engine.FAV_COLORS[sci];
  if (fav) $('sheetSize').textContent += `${z ? ' · ' : ''}${t('favColors')}: ${fav.map((c) => (Engine.COLOR_NAMES[c] || [c, c])[L()]).join(', ')}`;
  renderSheetPick();
  $('sheet').showModal();
  let w = await wikiSummary(sci);
  if (!w) w = await wikiSummary(sci, lang === 'no' ? 'en' : 'no'); // fall back to the other language
  if (sheetSci !== sci) return;
  if (w) {
    if (!name && w.title.toLowerCase() !== sci.toLowerCase()) $('sheetTitle').textContent = w.title;
    $('sheetText').textContent = w.extract;
    if (w.img) { $('sheetImg').src = w.img; $('sheetImg').alt = w.title; $('sheetImgWrap').classList.remove('hidden'); }
    if (w.url) { $('sheetWiki').href = w.url; $('sheetWiki').textContent = t('readWiki'); $('sheetWiki').classList.remove('hidden'); }
  } else {
    $('sheetText').textContent = t('noInfo');
  }
  renderFishChips();
}
function renderSheetPick() {
  const on = state.preferred.includes(sheetSci);
  $('sheetPick').textContent = on ? t('pickOff') : t('pickOn');
  $('sheetPick').classList.toggle('primary', !on);
}
$('sheetPick').onclick = () => {
  const i = state.preferred.indexOf(sheetSci);
  if (i >= 0) state.preferred.splice(i, 1); else state.preferred.push(sheetSci);
  savePref(); renderSheetPick(); renderFishChips(); rerank();
};
$('sheetClose').onclick = () => $('sheet').close();
$('sheet').addEventListener('click', (e) => { if (e.target === $('sheet')) $('sheet').close(); }); // tap outside

/* ---------- model download banner ---------- */
function renderBanner() {
  const show = !modelOk() && !sessionStorage.getItem('wb_banner_later');
  $('modelBanner').classList.toggle('hidden', !show && !$('modelBanner').dataset.done);
  if (!show) return;
  const conn = navigator.connection;
  const onMobile = conn && (conn.type === 'cellular' || conn.saveData);
  $('bannerText').textContent = t('bannerText') + (onMobile ? ` ${t('bannerMobile')}` : '');
}
$('bannerLater').onclick = () => { sessionStorage.setItem('wb_banner_later', '1'); $('modelBanner').classList.add('hidden'); };
$('bannerGo').onclick = async () => {
  $('bannerGo').disabled = true; $('bannerLater').disabled = true;
  $('bannerBar').classList.remove('hidden');
  try {
    await Vision.loadDetector((p, total) => {
      $('bannerFill').style.width = `${Math.round(p * 100)}%`;
      $('bannerText').textContent = t('downloading')(p, total ? Math.round(total / 1e6) : 155);
    });
    localStorage.setItem('wb_model_ok', '1');
    localStorage.setItem(OFFLINE_KEY, '1');
    $('modelBanner').dataset.done = '1';
    $('bannerText').textContent = t('bannerDone');
    $('bannerBar').classList.add('hidden');
    $('bannerGo').classList.add('hidden');
    $('bannerLater').textContent = t('close'); $('bannerLater').disabled = false;
    $('bannerLater').onclick = () => $('modelBanner').classList.add('hidden');
    $('modelNote').textContent = t('modelReady');
  } catch (err) {
    console.error(err);
    $('bannerText').innerHTML = `${esc(t('modelFail'))}<br><small class="errdetail">${esc(String(err.message).slice(0, 300))}</small>`;
    $('bannerGo').disabled = false; $('bannerLater').disabled = false;
  }
};

/* ---------- plan a trip (save a place for offline use) ---------- */
function ageText(ts) {
  const h = (Date.now() - ts) / 3600000;
  if (h < 1) return t('age').now;
  if (h < 24) return t('age').hours(Math.round(h));
  return t('age').days(Math.round(h / 24));
}
function renderTrips() {
  const list = loadSpots();
  $('tripList').innerHTML = list.length ? `<p class="tiny muted">${t('savedPlaces')}:</p>` + list.map((sp, i) => `<li>
    <span>📦 <b>${esc(sp.name || sp.place || `${sp.lat.toFixed(2)}, ${sp.lon.toFixed(2)}`)}</b> <span class="muted">· ${ageText(sp.ts)}</span></span>
    <button type="button" class="x" data-i="${i}" aria-label="${esc(t('remove'))}">✕</button></li>`).join('') : '';
}
$('tripList').addEventListener('click', (e) => {
  const b = e.target.closest('button.x'); if (!b) return;
  const list = loadSpots(); list.splice(Number(b.dataset.i), 1); saveSpots(list); renderTrips();
});
async function searchPlaces() {
  const q = $('planQ').value.trim(); if (!q) return;
  if (navigator.onLine === false) { $('planStatus').textContent = t('planNeedsNet'); return; }
  $('planStatus').textContent = t('searching');
  try {
    const res = await getJSON(`https://nominatim.openstreetmap.org/search?format=json&limit=6&countrycodes=no,se,dk,fi&accept-language=${lang === 'no' ? 'nb' : 'en'}&q=${encodeURIComponent(q)}`);
    $('planStatus').textContent = res.length ? '' : t('noPlaces');
    $('planResults').innerHTML = res.map((r, i) => `<li><button type="button" class="link" data-i="${i}">${esc(r.display_name)}</button></li>`).join('');
    $('planResults').onclick = (e) => { const b = e.target.closest('button.link'); if (b) saveTrip(res[Number(b.dataset.i)]); };
  } catch { $('planStatus').textContent = t('planNeedsNet'); }
}
$('planGo').onclick = searchPlaces;
$('planQ').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); searchPlaces(); } });
async function saveTrip(r) {
  const lat = Number(r.lat), lon = Number(r.lon);
  const name = (r.name || r.display_name || '').split(',')[0];
  $('planResults').innerHTML = '';
  $('planStatus').textContent = t('savingTrip')(name);
  const [w, f, g] = await Promise.allSettled([loadWeatherRaw(lat, lon), loadFish(lat, lon), loadNearbyWater(lat, lon)]);
  const gps = Trip.waterFromPlace(r) || (g.status === 'fulfilled' ? g.value : null);
  const fish = f.status === 'fulfilled' ? f.value : [];
  rememberSpot({ lat, lon, name, place: r.display_name.split(',').slice(0, 2).join(','), fish, gps, raw: w.status === 'fulfilled' ? w.value : null });
  prefetchSpecies(fish);
  $('planStatus').textContent = t('tripSaved')(name, fish.length, gps ? t('opts').water[gps.type] : '');
}

/* ---------- signal indicator ---------- */
function renderNet() {
  const off = navigator.onLine === false;
  $('netBadge').classList.toggle('hidden', !off);
  $('netBadge').textContent = t('offlineBadge');
}
// Signal back → fetch the current forecast, fish and map data straight away
window.addEventListener('online', () => {
  renderNet();
  if (state.lat !== null && state.offline) loadConditions(state.lat, state.lon);
});
window.addEventListener('offline', renderNet);

/* ---------- step 1: location, weather, fish ---------- */
$('locBtn').onclick = () => {
  if (!navigator.geolocation) { $('condStatus').textContent = t('noGeo'); return; }
  $('condStatus').textContent = t('finding');
  navigator.geolocation.getCurrentPosition(
    (pos) => loadConditions(pos.coords.latitude, pos.coords.longitude),
    (err) => { $('condStatus').textContent = t('geoFail')(err.message); },
    { enableHighAccuracy: true, timeout: 15000 },
  );
};

/* ---------- offline: saved spots ---------- */
const loadSpots = () => { try { return JSON.parse(localStorage.getItem('wb_spots') || '[]'); } catch { return []; } };
const saveSpots = (list) => { try { localStorage.setItem('wb_spots', JSON.stringify(list)); } catch { /* storage full */ } };
function rememberSpot(spotData) { saveSpots(Trip.upsertSpot(loadSpots(), { ...spotData, ts: Date.now() })); renderTrips(); }

async function loadConditions(lat, lon) {
  state.lat = lat; state.lon = lon;
  $('condStatus').textContent = t('loading');
  spot.gpsLoading = true;
  const online = navigator.onLine !== false;
  const none = Promise.reject(new Error('offline'));
  none.catch(() => {});
  const [w, f, p, g] = await Promise.allSettled(online
    ? [loadWeatherRaw(lat, lon), loadFish(lat, lon), loadPlace(lat, lon), loadNearbyWater(lat, lon)]
    : [none, none, none, none]);
  let raw = w.status === 'fulfilled' ? w.value : null;
  let fish = f.status === 'fulfilled' && f.value.length ? f.value : null;
  let place = p.status === 'fulfilled' ? p.value : null;
  let gps = g.status === 'fulfilled' ? g.value : undefined; // undefined = lookup failed, null = no water found

  // Fresh data → save it for later use without signal
  if (raw || fish) {
    const old = Trip.nearestSpot(loadSpots(), lat, lon, 3);
    rememberSpot({ lat, lon, place: place || old?.place || '', fish: fish || old?.fish || [], gps: gps !== undefined ? gps : old?.gps || null, raw: raw || old?.raw || null });
    prefetchSpecies(fish || []);
  }
  // Missing data → use the nearest saved spot
  const used = [];
  const saved = Trip.nearestSpot(loadSpots(), lat, lon, 30);
  if (saved) {
    if (!raw && saved.raw) { raw = saved.raw; used.push('weather'); }
    if (!fish && saved.fish?.length) { fish = saved.fish; used.push('fish'); }
    if (!place && saved.place) place = saved.place;
    if (gps === undefined && saved.gps && (saved.km < 1.5 || saved.gps.tier === 'plan')) { gps = saved.gps; used.push('water'); }
  }
  state.weather = raw ? Trip.weatherAt(raw, Date.now()) : null;
  const forecastExpired = raw && !state.weather;
  state.fish = fish || [];
  state.place = place || `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
  spot.gps = gps || null;
  spot.gpsLoading = false;
  state.offline = (!online || used.length) ? { used, saved, online, forecastExpired } : null;
  // No water found on the map: weak hint from which fish live nearby
  if (!spot.gps) {
    const guessW = Engine.guessWater(state.fish);
    if (guessW) spot.gps = { type: guessW, name: '', types: [guessW], ambiguous: true, tier: 'species' };
  }
  $('locBtn').textContent = t('refreshLoc');
  renderConditions(); updateSpot(); renderNet();
  if (online) loadWikiNames();
}

/** Save species info and photos while there is signal. */
async function prefetchSpecies(fish) {
  for (const f of fish.slice(0, 25)) {
    try {
      const w = await wikiSummary(f.name);
      if (w?.img) fetch(w.img, { mode: 'no-cors' }).catch(() => {}); // stored by the service worker
    } catch { /* ignore */ }
  }
}

/** Hourly forecast for yesterday + the next 4 days, so it can be used later without signal. */
async function loadWeatherRaw(lat, lon) {
  const url = 'https://api.open-meteo.com/v1/forecast?' + new URLSearchParams({
    latitude: lat, longitude: lon, timezone: 'auto', wind_speed_unit: 'ms',
    hourly: 'temperature_2m,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,surface_pressure,precipitation,is_day',
    daily: 'sunrise,sunset', past_days: 1, forecast_days: 4,
  });
  const d = await getJSON(url);
  d._fetched = Date.now();
  return d;
}

// GBIF moved occurrences to Catalogue of Life keys in 2026. Try that first, then the old backbone key.
const GBIF_FISH_QUERIES = [
  { taxonKey: '8V4VD', checklistKey: '7ddf754f-d193-4cc9-b351-99906754a03b' }, // Teleostei (COL)
  { taxonKey: '204' },                                                          // Actinopterygii (old backbone)
];
async function loadFish(lat, lon) {
  const dLat = 0.27, dLon = 0.27 / Math.max(Math.cos(lat * Math.PI / 180), 0.2); // ~30 km box
  for (const q of GBIF_FISH_QUERIES) {
    try {
      const url = 'https://api.gbif.org/v1/occurrence/search?' + new URLSearchParams({
        decimalLatitude: `${lat - dLat},${lat + dLat}`, decimalLongitude: `${lon - dLon},${lon + dLon}`,
        limit: 300, ...q,
      });
      const d = await getJSON(url);
      const counts = {};
      for (const r of d.results || []) if (r.species) counts[r.species] = (counts[r.species] || 0) + 1;
      const list = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([name, count]) => ({ name, count }));
      if (list.length) return list;
    } catch { /* try next */ }
  }
  return [];
}

async function loadPlace(lat, lon) {
  const d = await getJSON(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=12&accept-language=${lang === 'no' ? 'nb' : 'en'}&lat=${lat}&lon=${lon}`);
  const a = d.address || {};
  return [a.village || a.town || a.city || a.municipality || a.county, a.country].filter(Boolean).join(', ') || d.display_name;
}

function renderConditions() {
  const off = state.offline;
  let status = t('gotIt');
  if (off && off.saved && (off.used.length || !off.online)) status = t('usingSaved')(off.saved.place || '', ageText(off.saved.ts));
  else if (off && !off.online) status = t('offlineNothing');
  else status += ' ' + t('savedOffline');
  if (off && off.forecastExpired) status += ' ' + t('forecastOld');
  $('condStatus').textContent = status;
  $('conditions').classList.remove('hidden');
  $('placeName').textContent = state.place;
  const w = state.weather;
  $('weatherGrid').innerHTML = w ? [
    [`${Math.round(w.temp)}°C`, sky(w.code)],
    [`${w.wind.toFixed(1)} m/s`, `${t('wind')} ${compass(w.windDeg)}`],
    [`${w.cloud}%`, t('cloud')],
    [`${w.pressure}`, t('hpa')[w.pressureTrend]],
    [`${w.rain} mm`, t('rainNow')],
    [w.isDay ? t('day') : t('night'), `${w.sunrise}–${w.sunset}`],
  ].map(([b, s]) => `<div class="stat"><b>${esc(b)}</b><span>${esc(s)}</span></div>`).join('')
    : `<p class="err">${esc(t('noWeather'))}</p>`;
  renderFishChips();
}

function renderFishChips() {
  // Known sport fish first, then by number of records
  const fish = [...state.fish].sort((a, b) => (!!Engine.SPECIES[b.name] - !!Engine.SPECIES[a.name]) || b.count - a.count);
  $('fishList').innerHTML = fish.length
    ? fish.map((f) => {
      const c = commonName(f.name);
      const sel = state.preferred.includes(f.name);
      return `<button type="button" class="chip${sel ? ' sel' : ''}" data-sci="${esc(f.name)}">${sel ? '🎯 ' : ''}${c ? esc(c) + ' ' : ''}<i>${esc(f.name)}</i></button>`;
    }).join('')
    : `<span class="muted">${esc(t('noFish'))}</span>`;
  const pl = $('prefLine');
  if (state.preferred.length) {
    pl.classList.remove('hidden');
    pl.innerHTML = `🎯 <b>${t('fishingFor')}</b> ${esc(state.preferred.map((s) => commonName(s) || s).join(', '))} · <button type="button" id="clearPref">${t('clearPref')}</button>`;
    $('clearPref').onclick = () => { state.preferred = []; savePref(); renderFishChips(); rerank(); };
  } else pl.classList.add('hidden');
}
$('fishList').addEventListener('click', (e) => {
  const chip = e.target.closest('button.chip'); if (chip) openSheet(chip.dataset.sci);
});

/* ---------- step 2: the spot (photos + forecast + map) ---------- */
const spot = { photos: [], thumbs: [], ev: null, skipSky: false, gps: null, gpsLoading: false, decision: null };

/* Nearest water from OpenStreetMap (free Overpass API, two servers) */
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
async function overpass(q) {
  for (const url of OVERPASS) {
    try {
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 12000);
      const r = await fetch(url, { method: 'POST', body: 'data=' + encodeURIComponent(q),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: ctl.signal });
      clearTimeout(to);
      if (r.ok) return await r.json();
    } catch { /* try next server */ }
  }
  throw new Error('overpass unavailable');
}
async function loadNearbyWater(lat, lon) {
  const a = (r) => `(around:${r},${lat},${lon})`;
  const q = (r) => `[out:json][timeout:12];(way${a(r)}["natural"="water"];relation${a(r)}["natural"="water"];`
    + `way${a(r)}["waterway"~"^(river|stream|canal)$"];way${a(r)}["natural"="coastline"];`
    + `way${a(r)}["natural"~"^(bay|strait)$"];relation${a(r)}["natural"~"^(bay|strait)$"];);out tags 40;`;
  for (const [r, tier] of [[200, 'near'], [1000, 'km']]) {
    const d = await overpass(q(r));
    const c = Scene.classifyOsm(d.elements);
    if (c) return { ...c, tier };
  }
  return null;
}

function userOverrides() {
  const u = {};
  for (const k of ['water', 'clarity', 'light']) if (state.envSetByUser[k]) u[k] = state.env[k];
  return u;
}

function updateSpot() {
  // Sun height needs a position: use the current one, or else the last saved place (close enough for sun height)
  const pos = state.lat !== null ? { lat: state.lat, lon: state.lon } : loadSpots()[0] || null;
  const sunElev = pos ? Scene.sunElevation(pos.lat, pos.lon) : null;
  const d = Scene.decide({
    photos: spot.photos, user: userOverrides(), skipSky: spot.skipSky, gps: spot.gps,
    weather: state.weather ? { cloud: state.weather.cloud, rain24: state.weather.rain24, isDay: state.weather.isDay } : null,
    sunElev, ev: spot.ev, hour: new Date().getHours(),
  });
  spot.decision = d;
  for (const k of ['water', 'clarity', 'light']) if (!state.envSetByUser[k]) state.env[k] = d.env[k];
  renderSpot(); renderSegs(); rerank();
}

function renderSpot() {
  const d = spot.decision;
  if (!d) return;
  const val = {
    sky: (v) => t('skyVals')[v] || '',
    light: (v) => t('opts').light[v] || '',
    water: (v) => t('opts').water[v] || '',
    clarity: (v) => t('opts').clarity[v] || '',
  };
  const icons = { sky: '☁️', light: '💡', water: '🌊', clarity: '💧' };
  $('checklist').innerHTML = ['sky', 'light', 'water', 'clarity'].map((k) => {
    const it = d.items[k];
    const src = [...new Set(it.src)].map((s2) => t('src')[s2]).filter(Boolean).join(' + ');
    const status = it.conflict ? '<span class="st warn">⚠</span>' : it.ok ? '<span class="st ok">✓</span>' : '<span class="st todo">•</span>';
    return `<li>${status}<span class="ic">${icons[k]}</span><span class="lbl">${t('ck')[k]}</span>
      <span class="val">${it.value ? esc(val[k](it.value)) + (k === 'water' && it.name ? ' · ' + esc(it.name) : '') : `<span class="muted">${t('missing')}</span>`}
      ${k === 'water' && it.src.includes('gps') && t('within')[spot.gps?.tier] ? `<span class="muted"> (${t('within')[spot.gps.tier]})</span>` : ''}
      ${src ? `<small>${esc(src)}</small>` : ''}</span></li>`;
  }).join('');

  $('spotNotes').innerHTML = d.notes.map((n) => `<p class="note">${esc(t('notes')[n] || '')}</p>`).join('')
    + (state.lat === null ? `<p class="note">${esc(t('locFirst'))}</p>` : '');

  // What to do next
  const ask = $('spotAsk');
  let msg = '';
  if (d.next) msg = t('ask')[d.reason] || t('ask').start;
  else if (d.reason === 'tooDark' || d.reason === 'askUser') msg = t('ask')[d.reason];
  if (!msg && d.needPick.water) msg = t('pickWater');
  if (!msg && d.needPick.clarity) msg = t('pickClarity');
  if (!msg && d.done) msg = t('allDone');
  ask.textContent = msg;
  ask.className = 'ask' + (d.done && !d.next ? ' done' : '');
  $('ovBtn').classList.toggle('primary', d.next === 'overview');
  $('cuBtn').classList.toggle('primary', d.next === 'closeup');
  $('skipSky').classList.toggle('hidden', !(d.next === 'overview' && !d.items.sky.ok && state.weather && spot.photos.length > 0));
  if (d.needPick.water || d.needPick.clarity) $('fixBox').open = true;
  $('spotThumbs').innerHTML = spot.thumbs.map((th) =>
    `<figure><img src="${th.src}" alt=""><figcaption>${th.mode === 'overview' ? '🏞️' : '💧'}</figcaption></figure>`).join('');
}

function renderSegs() {
  document.querySelectorAll('.seg').forEach((seg) => {
    const g = seg.dataset.group;
    seg.innerHTML = Object.entries(t('opts')[g]).map(([k, label]) =>
      `<button type="button" data-v="${k}" class="${state.env[g] === k ? 'on' : ''}${state.envSetByUser[g] && state.env[g] === k ? ' mine' : ''}">${esc(label)}</button>`).join('');
  });
}
document.querySelectorAll('.seg').forEach((seg) => seg.addEventListener('click', (e) => {
  const v = e.target.dataset?.v; if (!v) return;
  const g = seg.dataset.group;
  // Tap your own choice again → let the app decide
  if (state.envSetByUser[g] && state.env[g] === v) delete state.envSetByUser[g];
  else { state.env[g] = v; state.envSetByUser[g] = true; }
  updateSpot();
}));
$('skipSky').onclick = () => { spot.skipSky = true; updateSpot(); };

async function handleSpotPhoto(file, mode) {
  if (state.lat === null) $('locBtn').click(); // get forecast + map in the background
  busy(true, t('analyzing'));
  try {
    const img = await loadImage(file);
    const exif = await Vision.readExif(file);
    const ev = Scene.evFromExif(exif);
    if (ev != null) spot.ev = ev;
    let hints = {};
    if (mode === 'overview' && modelOk()) {
      try { hints = await Vision.sceneHints(scaledUrl(img, 768)); } catch (err) { console.warn('scene hints failed', err); }
    }
    const res = Scene.analyzeGrid(Vision.grid(img), mode, hints);
    spot.photos.push(res);
    spot.thumbs.push({ src: img.src, mode });
    updateSpot();
    $('step2').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } finally { busy(false); }
}
$('ovInput').onchange = (e) => { const f = e.target.files[0]; if (f) handleSpotPhoto(f, 'overview'); e.target.value = ''; };
$('cuInput').onchange = (e) => { const f = e.target.files[0]; if (f) handleSpotPhoto(f, 'closeup'); e.target.value = ''; };

/* ---------- image utils ---------- */
async function loadImage(file) {
  const img = new Image();
  img.src = URL.createObjectURL(file);
  await img.decode();
  return img;
}
// Downscale for the detector (keeps it fast and light on memory, important on iPhone)
function scaledUrl(img, max = 1024) {
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * scale); c.height = Math.round(img.naturalHeight * scale);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.9);
}

/* ---------- step 3: bait box ---------- */
/* Analyse a bait-box photo (from the in-app camera or a file) */
async function processBaitPhoto(img, exif = null, meta = {}) {
  const out = $('baitResult');
  try {
    const meanV = Scene.regionStats(Vision.grid(img), 0, 0, 1, 1).val;
    drawBaits(img, []);
    const firstTime = !modelOk();
    busy(true, firstTime ? t('downloading')(0, 155) : t('detecting'), firstTime ? 0 : null);
    let dets;
    try {
      dets = await Vision.detectBaits(scaledUrl(img), (p, total) => {
        if (p >= 1) busy(true, t('detecting'));
        else busy(true, t('downloading')(p, total ? Math.round(total / 1e6) : 155), p);
      });
    } catch (err) { console.error(err); throw new Error(`${t('modelFail')} (${String(err.message).slice(0, 300)})`); }
    localStorage.setItem('wb_model_ok', '1');
    $('modelNote').textContent = t('modelReady');
    $('modelBanner').classList.add('hidden');
    if (!dets.length) throw new Error(t('noBaits'));
    state.bait = { img, baits: dets.map((d) => ({ ...d, ...Vision.colorOf(img, d.box) })), flash: !!exif?.flash && !meta.torch, dim: meanV < 0.18 && !meta.torch };
    // The camera's light reading from the bait photo also tells if it's dark out (not with flash — that changes exposure)
    const ev = Scene.evFromExif(exif);
    if (ev != null && spot.ev == null && !exif?.flash) { spot.ev = ev; updateSpot(); }
    renderBaitResult();
    $('baitStage').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) { state.bait = null; showError(out, err.message); }
  finally { busy(false); }
}

// Gallery / system camera fallback
$('baitInput').onchange = async (e) => {
  const file = e.target.files[0]; if (!file) return;
  e.target.value = '';
  closeCamera();
  const img = await loadImage(file);
  processBaitPhoto(img, await Vision.readExif(file));
};

/* ---------- in-app camera with steady light (torch) ---------- */
const cam = { stream: null, track: null, torch: false, torchOk: false, autoTimer: null };

async function openCamera() {
  if (!navigator.mediaDevices?.getUserMedia) { $('baitInput').click(); return; } // no in-app camera → system camera
  $('camera').classList.remove('hidden');
  $('camHint').textContent = t('camStarting');
  try {
    cam.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false,
    });
    cam.track = cam.stream.getVideoTracks()[0];
    $('camVideo').srcObject = cam.stream;
    await $('camVideo').play();
    const caps = cam.track.getCapabilities ? cam.track.getCapabilities() : {};
    cam.torchOk = !!caps.torch;
    $('camTorch').classList.toggle('hidden', !cam.torchOk);
    $('camHint').textContent = cam.torchOk ? t('camHint') : t('camNoTorch');
    // Dark out (night/dusk) → light on straight away; otherwise check the picture after a moment
    if (cam.torchOk && ['night', 'low'].includes(state.env.light)) setTorch(true);
    else if (cam.torchOk) cam.autoTimer = setTimeout(() => { if (cam.stream && !cam.torch && previewBrightness() < 0.2) setTorch(true); }, 900);
  } catch (err) {
    console.warn('camera failed', err);
    closeCamera();
    $('baitInput').click(); // permission denied or no camera → system camera
  }
}

async function setTorch(on) {
  if (!cam.track || !cam.torchOk) return;
  try {
    await cam.track.applyConstraints({ advanced: [{ torch: on }] });
    cam.torch = on;
  } catch { cam.torch = false; }
  $('camTorch').classList.toggle('on', cam.torch);
  $('camTorch').setAttribute('aria-pressed', String(cam.torch));
  $('camTorchLbl').textContent = cam.torch ? t('torchOff') : t('torchOn');
}

function previewBrightness() {
  const v = $('camVideo');
  if (!v.videoWidth) return 1;
  const c = document.createElement('canvas'); c.width = 32; c.height = 32;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(v, 0, 0, 32, 32);
  const d = ctx.getImageData(0, 0, 32, 32).data;
  let sum = 0; for (let i = 0; i < d.length; i += 4) sum += Math.max(d[i], d[i + 1], d[i + 2]);
  return sum / (d.length / 4) / 255;
}

async function snapPhoto() {
  const v = $('camVideo');
  if (!v.videoWidth) return;
  const c = document.createElement('canvas');
  c.width = v.videoWidth; c.height = v.videoHeight;
  c.getContext('2d').drawImage(v, 0, 0);
  const torch = cam.torch;
  const img = new Image();
  img.src = c.toDataURL('image/jpeg', 0.92);
  await img.decode();
  closeCamera();
  processBaitPhoto(img, null, { torch });
}

function closeCamera() {
  clearTimeout(cam.autoTimer);
  if (cam.track && cam.torch) { try { cam.track.applyConstraints({ advanced: [{ torch: false }] }); } catch { /* ignore */ } }
  if (cam.stream) cam.stream.getTracks().forEach((tr) => tr.stop());
  cam.stream = null; cam.track = null; cam.torch = false;
  $('camVideo').srcObject = null;
  $('camera').classList.add('hidden');
  $('camTorch').classList.remove('on');
}

$('baitBtn').onclick = openCamera;
$('camTorch').onclick = () => setTorch(!cam.torch);
$('camShoot').onclick = snapPhoto;
$('camClose').onclick = closeCamera;
$('camGallery').onclick = () => $('baitInput').click();
document.addEventListener('visibilitychange', () => { if (document.hidden && cam.stream) closeCamera(); });

function rerank() { if (state.bait) renderBaitResult(); }

// Small colour dot for lists
const SWATCH = {
  silver: 'linear-gradient(135deg,#f4f6f8,#9aa3ab 50%,#eef1f3)', gold: 'linear-gradient(135deg,#ffe28a,#c9971c 55%,#fff0b3)',
  copper: 'linear-gradient(135deg,#f3b07a,#a5562a 55%,#f0b98d)', white: '#f5f5f5', red: '#d62828', orange: '#ff8c1a',
  yellow: '#ffe11a', chartreuse: '#b6f21b', green: '#2e9e4f', blue: '#2f6fd6', pink: '#ff8fb1', purple: '#7a3cc2',
  black: '#111', natural: '#8a7354', glow: 'radial-gradient(circle,#eaffd0,#9cff57)',
};
const swatch = (c) => `<span class="swatch" style="background:${SWATCH[c] || '#888'}"></span>`;
const colorName = (c) => (Engine.COLOR_NAMES[c] || Engine.COLOR_NAMES.natural)[L()];

/* ---------- buy suggestion ---------- */
function buyBlock(ranked) {
  const ideal = Engine.idealBait(ranked, state.env, state.weather, state.fish, lang, state.preferred);
  if (!ideal) return '';
  const q = Engine.shopQuery(ideal, state.env);
  const name = `${Engine.TYPE_NAMES[ideal.type][L()]}, ${colorName(ideal.color)}`.toLowerCase();
  const skitt = `https://www.skittfiske.no/sok?q=${encodeURIComponent(q)}`;
  const finn = `https://www.finn.no/recommerce/forsale/search?q=${encodeURIComponent(q)}`;
  // Small and quiet: one line, details only when tapped
  return `<details class="buy">
    <summary>💡 ${t('buyTitle')}: <b>${swatch(ideal.color)}${esc(name)}</b></summary>
    <p class="tiny muted">${esc(ideal.why.join(' · '))}${ideal.size ? ` · ${esc(ideal.size)}` : ''}</p>
    ${ideal.type === 'worm' ? `<p class="tiny muted">${t('wormBuy')}</p>`
      : `<p class="tiny"><a href="${skitt}" target="_blank" rel="noopener">${t('buySkitt')}</a> · <a href="${finn}" target="_blank" rel="noopener">${t('buyFinn')}</a></p>`}
    <div id="shopList">${renderShops()}</div>
  </details>`;
}

/* Nearby physical shops from OpenStreetMap */
const shops = { list: [], loaded: false, loading: false };
function distKm(a, b, c, d) {
  const R = 6371, r = Math.PI / 180;
  const x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
async function loadShops() {
  shops.loading = true;
  const a = `(around:25000,${state.lat},${state.lon})`;
  const q = `[out:json][timeout:15];(nwr${a}["shop"="fishing"];nwr${a}["shop"="hunting"];nwr${a}["shop"="outdoor"];nwr${a}["shop"="sports"]["sport"~"fishing"];);out center tags 40;`;
  try {
    const d = await overpass(q);
    const rank = { fishing: 0, hunting: 1, outdoor: 2, sports: 3 };
    shops.list = (d.elements || []).map((e) => {
      const la = e.lat ?? e.center?.lat, lo = e.lon ?? e.center?.lon;
      return { name: e.tags?.name || '', kind: e.tags?.shop, lat: la, lon: lo, km: distKm(state.lat, state.lon, la, lo), web: e.tags?.website || e.tags?.['contact:website'] || '' };
    }).filter((x) => x.name && x.lat).sort((x, y) => (rank[x.kind] - rank[y.kind]) * 3 + (x.km - y.km)).slice(0, 4)
      .sort((x, y) => x.km - y.km);
  } catch { shops.list = []; }
  shops.loaded = true; shops.loading = false;
  const el = document.getElementById('shopList'); if (el) el.innerHTML = renderShops();
}
function renderShops() {
  if (state.lat === null) return '';
  if (!shops.loaded) return `<p class="tiny muted">${t('shopsLoading')}</p>`;
  if (!shops.list.length) return `<p class="tiny muted">${t('noShops')}</p>`;
  return `<p class="tiny muted">${t('shopsNear')}:</p><ul class="shops">${shops.list.map((sh) => `<li>
    <span><b>${esc(sh.name)}</b> <span class="muted">· ${sh.km < 10 ? sh.km.toFixed(1) : Math.round(sh.km)} km</span>
    ${sh.web ? `<br><a href="${esc(sh.web)}" target="_blank" rel="noopener">${esc(sh.web.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a>` : ''}</span>
    <a class="route" href="https://www.google.com/maps/dir/?api=1&destination=${sh.lat},${sh.lon}" target="_blank" rel="noopener">${t('route')}</a></li>`).join('')}</ul>`;
}

function renderBaitResult() {
  const { img, baits } = state.bait;
  const res = Engine.rank(baits, state.env, state.weather, state.fish, lang, state.preferred);
  const best = res.baits[0];
  drawBaits(img, res.baits, best);
  const colors = (b) => colorName(b.color) + (b.color2 ? `/${colorName(b.color2)}` : '');
  const name = (b) => `${Engine.TYPE_NAMES[b.type][L()]}, ${colors(b)}`;
  const typeSelect = (b) => `<select data-id="${b.id}" data-field="type" aria-label="${esc(t('typeLbl'))}">${Engine.TYPES.map((ty) =>
    `<option value="${ty}"${ty === b.type ? ' selected' : ''}>${esc(Engine.TYPE_NAMES[ty][L()])}</option>`).join('')}</select>`;
  const colorSelect = (b) => `<select data-id="${b.id}" data-field="color" aria-label="${esc(t('colorLbl'))}">${Engine.COLORS.map((c) =>
    `<option value="${c}"${c === b.color ? ' selected' : ''}>${esc(colorName(c))}</option>`).join('')}</select>`;
  const targets = res.targets.map((x) => (Engine.SPECIES[x.key] ? (lang === 'no' ? x.sp.no : x.sp.en) : (commonName(x.key) || x.key))).join(', ');
  const inBox = new Set(baits.flatMap((b) => [b.color, b.color2]));
  const out = $('baitResult');
  out.classList.remove('hidden'); out.classList.add('pick');
  out.innerHTML = `<h4>✅ ${t('use')} #${best.id}: ${esc(name(best))}</h4>
    <p>${esc(best.why.join(' · ') || '')}</p>
    ${state.env.light === 'night' && ['silver', 'natural', 'blue', 'gold'].includes(best.color) ? `<p class="note">${t('nightShiny')}</p>` : ''}
    ${state.bait.flash ? `<p class="note">${t('flashNote')}</p>` : state.bait.dim ? `<p class="note">${t('dimNote')}</p>` : ''}
    <p><b>${t('target')}:</b> ${state.preferred.length ? '🎯 ' : ''}${esc(targets)}<br>
    ${res.size ? `<b>${t('size')}:</b> ${esc(res.size)}<br>` : ''}
    <b>${t('how')}:</b> ${esc(res.tip)}</p>
    <div class="bestcols"><b>${t('bestColors')}:</b> ${res.bestColors.map((c) =>
      `<span class="colchip${inBox.has(c) ? ' have' : ''}">${swatch(c)}${esc(colorName(c))}${inBox.has(c) ? ' ✓' : ''}</span>`).join('')}</div>
    <h3>${t('others')}</h3>
    <ul class="baits">${res.baits.map((b) => `<li class="${b === best ? 'best' : ''}">
      <span class="badge">#${b.id}</span>${swatch(b.color)}${typeSelect(b)}${colorSelect(b)}<span class="score">${b.score}</span></li>`).join('')}</ul>
    <p class="tiny muted">${t('fixType')}</p>
    ${buyBlock(res.baits)}`;
  const buy = out.querySelector('details.buy');
  if (buy) buy.addEventListener('toggle', () => { if (buy.open && state.lat !== null && !shops.loaded && !shops.loading) loadShops(); });
  out.querySelectorAll('select').forEach((sel) => sel.onchange = () => {
    const b = state.bait.baits.find((x) => x.id === Number(sel.dataset.id));
    if (!b) return;
    if (sel.dataset.field === 'color') { b.color = sel.value; b.color2 = null; } else b.type = sel.value;
    renderBaitResult();
  });
}

function drawBaits(img, baits, best) {
  $('baitStage').classList.remove('hidden');
  const cv = $('baitCanvas');
  const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
  cv.width = Math.round(img.naturalWidth * scale);
  cv.height = Math.round(img.naturalHeight * scale);
  const ctx = cv.getContext('2d');
  ctx.drawImage(img, 0, 0, cv.width, cv.height);
  if (!baits.length) return;
  const W = cv.width, H = cv.height, lw = Math.max(3, W / 200);
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, W, H); // dim everything
  [...baits.filter((b) => b !== best), best].forEach((b) => {   // winner drawn last, on top
    const [x0, y0, x1, y1] = b.box;
    const x = x0 * W, y = y0 * H, w = (x1 - x0) * W, h = (y1 - y0) * H;
    const isBest = b === best;
    if (isBest) { ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.drawImage(img, 0, 0, W, H); ctx.restore(); }
    ctx.lineWidth = isBest ? lw * 2 : lw;
    ctx.strokeStyle = isBest ? '#4fd1a5' : 'rgba(255,255,255,0.6)';
    ctx.strokeRect(x, y, w, h);
    const label = isBest ? `★ #${b.id}` : `#${b.id}`;
    const fs = Math.max(14, W / (isBest ? 24 : 36));
    ctx.font = `700 ${fs}px system-ui, sans-serif`;
    const tw = ctx.measureText(label).width + fs * 0.8;
    const ly = y - fs * 1.4 < 0 ? y + h : y - fs * 1.4;
    const lx = Math.min(x, W - tw);
    ctx.fillStyle = isBest ? '#4fd1a5' : 'rgba(0,0,0,0.75)';
    ctx.fillRect(lx, ly, tw, fs * 1.4);
    ctx.fillStyle = isBest ? '#04211a' : '#fff';
    ctx.fillText(label, lx + fs * 0.4, ly + fs * 1.05);
  });
}

/* ---------- start ---------- */
loadWikiCacheFromStorage();
applyLang();
$('appVersion').textContent = `WhatBites v${window.WB_VERSION || ''}`;
if (navigator.storage?.persist) navigator.storage.persist().catch(() => {}); // ask the phone not to delete the saved model/data
// Once per app version, while online: load the AI model in the background so the library and its
// WebAssembly files get stored for offline use (the model itself is already on the phone).
const OFFLINE_KEY = 'wb_offline_ready_v15';
if (modelOk() && navigator.onLine !== false && !localStorage.getItem(OFFLINE_KEY)) {
  setTimeout(() => Vision.loadDetector().then(() => localStorage.setItem(OFFLINE_KEY, '1')).catch(() => {}), 8000);
}
updateSpot();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
