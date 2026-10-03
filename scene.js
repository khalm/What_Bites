/* WhatBites scene analysis — what the spot photos show, cross-checked with weather and GPS.
 * Pure functions (no DOM), so they can be tested in Node. vision.js turns photos into grids.
 *
 * Photos are of two kinds:
 *  - 'overview': looking out over the water with some sky → sky (cloud cover), water present, water type hints
 *  - 'closeup' : straight down into the water at the edge → water clarity (no sky reflections)
 */
(function (root) {
  /* ---------- pixel basics ---------- */
  function hsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    if (d) {
      if (max === r) h = ((g - b) / d) % 6; else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
      h = (h * 60 + 360) % 360;
    }
    return [h, max ? d / max : 0, max];
  }
  const lum = (d, i) => (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;

  const isBlueSky = (h, s, v) => h >= 185 && h <= 255 && s > 0.12 && v > 0.35;
  const isGreySky = (h, s, v) => s < 0.16 && v > 0.42;
  const isSunsetSky = (h, s, v) => (h <= 50 || h >= 320) && s > 0.25 && v > 0.4;
  const isVegetation = (h, s, v) => h >= 65 && h <= 165 && s > 0.3 && v > 0.12 && v < 0.85;

  /** Statistics for a rectangle of the grid (fractions 0–1). */
  function regionStats(g, x0, y0, x1, y1) {
    const { data: d, w, h } = g;
    const X0 = Math.max(0, Math.floor(x0 * w)), X1 = Math.min(w, Math.ceil(x1 * w));
    const Y0 = Math.max(0, Math.floor(y0 * h)), Y1 = Math.min(h, Math.ceil(y1 * h));
    let n = 0, s = 0, v = 0, vv = 0, hx = 0, hy = 0, r = 0, gg = 0, b = 0;
    let blue = 0, grey = 0, sunset = 0, veg = 0, brown = 0, tx = 0, ty = 0, nt = 0;
    for (let y = Y0; y < Y1; y++) {
      for (let x = X0; x < X1; x++) {
        const i = (y * w + x) * 4;
        const [H, S, V] = hsv(d[i], d[i + 1], d[i + 2]);
        n++; s += S; v += V; vv += V * V; r += d[i]; gg += d[i + 1]; b += d[i + 2];
        hx += Math.cos(H * Math.PI / 180) * S; hy += Math.sin(H * Math.PI / 180) * S;
        if (isBlueSky(H, S, V)) blue++;
        if (isGreySky(H, S, V)) grey++;
        if (isSunsetSky(H, S, V)) sunset++;
        if (isVegetation(H, S, V)) veg++;
        if (H >= 15 && H <= 55 && S > 0.18 && V < 0.75) brown++;
        if (x + 1 < X1 && y + 1 < Y1) {
          const L = lum(d, i);
          tx += Math.abs(lum(d, i + 4) - L);
          ty += Math.abs(lum(d, i + w * 4) - L);
          nt++;
        }
      }
    }
    if (!n) return null;
    const mv = v / n;
    const Tx = nt ? tx / nt : 0, Ty = nt ? ty / nt : 0;
    return {
      n, sat: s / n, val: mv, std: Math.sqrt(Math.max(0, vv / n - mv * mv)),
      hue: (Math.atan2(hy, hx) * 180 / Math.PI + 360) % 360,
      rgb: [r / n / 255, gg / n / 255, b / n / 255],
      blueFrac: blue / n, greyFrac: grey / n, sunsetFrac: sunset / n, vegFrac: veg / n, brownFrac: brown / n,
      Tx, Ty, T: (Tx + Ty) / 2,
    };
  }

  /* ---------- sky ---------- */
  /** Find sky at the top of the image without the AI model: rows that are smooth and sky-coloured. */
  function findSkyRows(g) {
    const { w, h } = g;
    let end = 0, misses = 0, started = false;
    for (let y = 0; y < h; y++) {
      const st = regionStats(g, 0, y / h, 1, (y + 1) / h);
      const like = st.blueFrac + st.greyFrac + st.sunsetFrac * 0.8;
      const rowT = st.Tx;
      const skyRow = like > 0.55 && rowT < 0.045 && st.val > 0.3;
      if (skyRow) { started = true; end = y + 1; misses = 0; } else if (started) { if (++misses > 1) break; } else if (y > h * 0.1) break;
    }
    return end / h;
  }

  /** Classify the sky region: clear / partly / overcast / sunset / dark. */
  function skyCondition(st) {
    if (!st) return null;
    let cond, conf = 0.75;
    if (st.val < 0.3) { cond = 'dark'; conf = 0.6; }
    else if (st.sunsetFrac > 0.3) cond = 'sunset';
    else if (st.blueFrac > 0.55) cond = 'clear';
    else if (st.blueFrac > 0.2) cond = 'partly';
    else if (st.greyFrac > 0.5) cond = 'overcast';
    else { cond = 'overcast'; conf = 0.5; }
    // Blown-out white sky: could be bright haze or overexposed sun — less sure
    if (cond === 'overcast' && st.val > 0.93 && st.sat < 0.06) conf = 0.5;
    return { cond, conf };
  }

  /* ---------- water clarity ---------- */
  /**
   * Clarity from the water area. T = texture (bottom/stones visible → high), colour tells brown/green/grey.
   * Returns { clarity, conf, reflection }.
   */
  function waterClarity(st, skySt, mode) {
    if (!st) return { clarity: null, conf: 0, reflection: false };
    const { hue, sat, T, val } = st;
    // Water that just mirrors the sky can't be judged
    let reflection = false;
    if (skySt) {
      const dist = Math.hypot(st.rgb[0] - skySt.rgb[0], st.rgb[1] - skySt.rgb[1], st.rgb[2] - skySt.rgb[2]);
      reflection = dist < 0.14 && T < 0.03;
    } else if (mode === 'overview' && st.greyFrac > 0.6 && T < 0.02) reflection = true;

    let clarity, conf;
    const brown = hue >= 15 && hue <= 55;
    const greenish = hue > 55 && hue < 165;
    const blueish = hue >= 165 && hue <= 240;
    // Tea-coloured (humic) water is dark but see-through; muddy water is lighter and opaque
    if (brown && sat > 0.4 && val < 0.45 && T < 0.08) { clarity = 'stained'; conf = 0.65; }
    else if (brown && sat > 0.3 && T < 0.04) { clarity = 'murky'; conf = 0.7; }
    else if (brown && sat > 0.18 && T > 0.08) { clarity = 'clear'; conf = 0.6; }      // stones on the bottom visible
    else if (brown && sat > 0.18) { clarity = 'stained'; conf = T > 0.05 ? 0.55 : 0.7; }
    else if (greenish && sat > 0.3 && T < 0.035) { clarity = 'murky'; conf = 0.6; }
    else if (sat < 0.15 && T < 0.03 && val > 0.35 && val < 0.8) { clarity = 'murky'; conf = 0.45; } // milky/silty grey
    else if (T > 0.065) { clarity = 'clear'; conf = 0.7; }                                            // bottom visible
    else if (blueish || greenish) { clarity = 'clear'; conf = T > 0.04 ? 0.65 : 0.45; }
    else { clarity = 'stained'; conf = 0.4; }

    if (mode === 'overview') conf *= 0.75;        // far away + surface glare
    if (reflection) conf = Math.min(conf, 0.3);
    return { clarity, conf, reflection };
  }

  /* ---------- whole photo ---------- */
  /**
   * Analyse one photo grid.
   * hints (optional, from the AI model): { skyBox:[x0,y0,x1,y1], waterBox:[...], typeVotes:{lake,river,sea} }
   */
  function analyzeGrid(g, mode, hints = {}) {
    const all = regionStats(g, 0, 0, 1, 1);
    const out = { mode, meanV: all.val, tooDark: all.val < 0.13, sky: { found: false }, water: { found: false }, typeVotes: hints.typeVotes || null };
    if (out.tooDark) return out;

    if (mode === 'overview') {
      // Sky
      let skySt = null, skyFrac = 0;
      if (hints.skyBox) {
        const [x0, y0, x1, y1] = hints.skyBox;
        const st = regionStats(g, x0, y0, x1, y1);
        if (st && st.blueFrac + st.greyFrac + st.sunsetFrac > 0.45 && st.T < 0.07) { skySt = st; skyFrac = (x1 - x0) * (y1 - y0); }
      }
      if (!skySt) {
        skyFrac = findSkyRows(g);
        // Calm water mirroring a grey sky looks like more sky — the sky can't fill the whole photo
        if (skyFrac > 0.7) { out.mirror = true; skyFrac = 0.45; }
        if (skyFrac >= 0.07) skySt = regionStats(g, 0, 0, 1, skyFrac);
      }
      if (skySt) {
        const c = skyCondition(skySt);
        if (skyFrac < 0.12) c.conf -= 0.1;
        out.sky = { found: true, frac: skyFrac, ...c };
      }
      // Water
      let wSt = null, wFrac = 0;
      if (hints.waterBox) {
        const [x0, y0, x1, y1] = hints.waterBox;
        wSt = regionStats(g, x0, y0, x1, y1); wFrac = (x1 - x0) * (y1 - y0);
        if (wSt && wSt.vegFrac > 0.5) wSt = null;
      }
      if (!wSt) {
        const top = Math.max(out.sky.found ? out.sky.frac : 0, 0.35);
        const st = regionStats(g, 0, Math.min(top, 0.9), 1, 1);
        const ratio = st ? st.Ty / (st.Tx + 1e-3) : 0;
        const waterLike = st && (out.mirror || (st.vegFrac < 0.45 && st.T < 0.08 && (ratio > 1.05 || st.T < 0.025)));
        if (waterLike) { wSt = st; wFrac = 1 - top; }
      }
      if (wSt) {
        out.water = { found: true, frac: wFrac, far: wFrac < 0.2, ...waterClarity(wSt, skySt, 'overview') };
      }
    } else {
      // Close-up: the middle of the frame should be water
      const st = regionStats(g, 0.15, 0.15, 0.85, 0.85);
      const looksLikeSky = st.blueFrac + st.greyFrac > 0.8 && st.T < 0.01 && st.val > 0.6;
      // Plants are green AND textured; algae-green water is smooth
      const found = !(st.vegFrac > 0.5 && st.T > 0.05) && !looksLikeSky;
      if (found) out.water = { found: true, frac: 0.7, far: false, ...waterClarity(st, null, 'closeup') };
    }
    out.sunnyHint = all.std > 0.27; // strong shadows/highlights
    return out;
  }

  /* ---------- camera light meter (EXIF) ---------- */
  /** EV at ISO 100 from exposure time (s), f-number and ISO. ~15 sun, ~12 overcast, ~8 dusk, <5 night. */
  function evFromExif(ex) {
    if (!ex || !ex.t || !ex.iso) return null;
    const N = ex.N || 1.8;
    return Math.log2((N * N) / ex.t) - Math.log2(ex.iso / 100);
  }
  function lightFromEv(ev) {
    if (ev == null || !isFinite(ev)) return null;
    if (ev >= 13) return 'sun';
    if (ev >= 9.5) return 'overcast';
    if (ev >= 3.5) return 'low';
    return 'night';
  }

  /* ---------- sun height (NOAA approximation) ---------- */
  function sunElevation(lat, lon, date = new Date()) {
    const rad = Math.PI / 180;
    const jd = date.getTime() / 86400000 + 2440587.5;
    const n = jd - 2451545.0;
    const L = (280.46 + 0.9856474 * n) % 360;
    const g = (357.528 + 0.9856003 * n) % 360;
    const lambda = L + 1.915 * Math.sin(g * rad) + 0.02 * Math.sin(2 * g * rad);
    const eps = 23.439 - 0.0000004 * n;
    const decl = Math.asin(Math.sin(eps * rad) * Math.sin(lambda * rad));
    const ra = Math.atan2(Math.cos(eps * rad) * Math.sin(lambda * rad), Math.cos(lambda * rad));
    const gmst = (18.697374558 + 24.06570982441908 * n) % 24;
    const ha = ((gmst * 15 + lon) * rad - ra);
    const el = Math.asin(Math.sin(lat * rad) * Math.sin(decl) + Math.cos(lat * rad) * Math.cos(decl) * Math.cos(ha));
    return el / rad;
  }

  /* ---------- OpenStreetMap water ---------- */
  /** Classify Overpass elements into lake / river / sea, with name. */
  function classifyOsm(elements) {
    const found = [];
    for (const e of elements || []) {
      const t = e.tags || {};
      let type = null;
      if (t.natural === 'coastline' || t.natural === 'bay' || t.natural === 'strait' || t.place === 'sea') type = 'sea';
      else if (t.waterway === 'river' || t.waterway === 'stream' || t.waterway === 'canal' || ['river', 'stream', 'canal', 'rapids'].includes(t.water)) type = 'river';
      else if (t.natural === 'water') type = t.water === 'lagoon' ? 'sea' : 'lake';
      if (type) found.push({ type, name: t.name || '', small: t.waterway === 'stream' || t.water === 'pond' || t.water === 'stream' });
    }
    if (!found.length) return null;
    // Prefer named, non-tiny water; count types
    const types = [...new Set(found.map((f) => f.type))];
    const pick = found.find((f) => f.name && !f.small) || found.find((f) => !f.small) || found[0];
    return { type: pick.type, name: pick.name, types, ambiguous: types.length > 1 };
  }

  /* ---------- combine everything ---------- */
  const weatherSky = (cloud) => (cloud == null ? null : cloud < 30 ? 'clear' : cloud < 75 ? 'partly' : 'overcast');
  const SKY_RANK = { clear: 0, partly: 1, overcast: 2 };

  /**
   * Decide water type, clarity, sky and light, with sources, conflicts and what photo to ask for next.
   * inp = { photos:[analyzeGrid results], user:{water,clarity,light}, skipSky, gps:{type,name,tier,ambiguous,types},
   *         weather:{cloud, isDay, rain24}, sunElev, ev }
   */
  function decide(inp) {
    const photos = inp.photos || [];
    const user = inp.user || {};
    const items = {};
    const notes = [];

    // --- Sky (cloud cover) ---
    const skyPh = photos.filter((p) => p.sky && p.sky.found).sort((a, b) => b.sky.conf - a.sky.conf)[0]?.sky;
    const wSky = weatherSky(inp.weather?.cloud);
    let sky = { value: null, src: [], ok: false, conflict: false };
    if (skyPh && skyPh.conf >= 0.5) {
      sky.value = skyPh.cond; sky.src.push('photo'); sky.ok = true;
      if (wSky && SKY_RANK[skyPh.cond] != null) {
        if (Math.abs(SKY_RANK[skyPh.cond] - SKY_RANK[wSky]) >= 2) {
          sky.conflict = true;
          if (skyPh.conf < 0.65) { sky.value = wSky; notes.push('skyConflictWeather'); } else notes.push('skyConflictPhoto');
        } else sky.src.push('weather');
      }
    } else if (wSky) {
      sky.value = wSky; sky.src.push('weather');
      sky.ok = !!inp.skipSky;
    }
    items.sky = sky;

    // --- Light ---
    const light = { value: null, src: [], ok: false, conflict: false };
    const se = inp.sunElev;
    const evLight = lightFromEv(inp.ev);
    if (user.light) { light.value = user.light; light.src.push('user'); light.ok = true; }
    else {
      if (se != null) {
        if (se < -6) light.value = 'night';
        else if (se < 6) light.value = 'low';
        light.src.push('sun');
      } else if (inp.weather && inp.weather.isDay === false) {
        // No position, but the forecast knows it's dark
        light.value = 'night'; light.src.push('weather');
      } else if (inp.hour != null && (inp.hour >= 23 || inp.hour < 4)) {
        // Nothing else to go on: late night by the clock
        light.value = 'night'; light.src.push('clock');
      }
      if (!light.value) {
        const sc = sky.value;
        if (sc === 'sunset' || sc === 'dark') light.value = 'low';
        else if (sc === 'clear' || (sc === 'partly' && (inp.weather?.cloud ?? 50) < 60)) light.value = 'sun';
        else if (sc) light.value = 'overcast';
        if (sc) light.src.push(sky.src[0]);
      }
      if (evLight) {
        const order = ['night', 'low', 'overcast', 'sun'];
        if (!light.value) { light.value = evLight; light.src.push('camera'); }
        else if (Math.abs(order.indexOf(evLight) - order.indexOf(light.value)) >= 2) {
          // Camera says much darker than expected (storm, deep shade) → trust the camera for darkness
          light.conflict = true;
          if (order.indexOf(evLight) < order.indexOf(light.value)) { light.value = evLight; notes.push('lightDarker'); }
        } else light.src.push('camera');
      }
      light.ok = !!light.value && (light.src.length > 0);
    }
    items.light = light;

    // --- Water type ---
    const water = { value: null, src: [], ok: false, conflict: false, name: '' };
    const votes = {};
    for (const p of photos) for (const [k, v] of Object.entries(p.typeVotes || {})) votes[k] = Math.max(votes[k] || 0, v);
    const vSorted = Object.entries(votes).sort((a, b) => b[1] - a[1]);
    const photoType = vSorted[0] && vSorted[0][1] > 0.12 && (!vSorted[1] || vSorted[0][1] > vSorted[1][1] * 1.3) ? vSorted[0][0] : null;
    if (user.water) { water.value = user.water; water.src.push('user'); water.ok = true; }
    else if (inp.gps && inp.gps.type) {
      const gp = inp.gps;
      if (gp.ambiguous && photoType && gp.types.includes(photoType)) { water.value = photoType; water.src.push('gps', 'photo'); }
      else { water.value = gp.type; water.src.push('gps'); }
      water.name = gp.name || '';
      water.ok = !gp.ambiguous || water.src.includes('photo');
      if (photoType && photoType !== water.value && !gp.ambiguous) { water.conflict = true; notes.push('waterConflict'); }
      else if (photoType === water.value && !water.src.includes('photo')) water.src.push('photo');
    } else if (photoType) { water.value = photoType; water.src.push('photo'); water.ok = true; }
    items.water = water;

    // --- Clarity ---
    const clarity = { value: null, src: [], ok: false, conflict: false };
    const clPh = photos.filter((p) => p.water && p.water.found && p.water.clarity)
      .sort((a, b) => (b.mode === 'closeup') - (a.mode === 'closeup') || b.water.conf - a.water.conf)[0]?.water;
    if (user.clarity) { clarity.value = user.clarity; clarity.src.push('user'); clarity.ok = true; }
    else if (clPh) {
      clarity.value = clPh.clarity; clarity.src.push('photo'); clarity.ok = clPh.conf >= 0.5;
    }
    if (inp.weather?.rain24 > 10 && !user.clarity) {
      notes.push('heavyRain');
      if (clarity.value === 'clear' && !clarity.ok) clarity.value = 'stained';
      if (!clarity.value) clarity.value = 'stained';
      if (clarity.value !== 'clear') clarity.src.push('weather');
    }
    items.clarity = clarity;

    // --- What to ask for next ---
    const haveOverview = photos.some((p) => p.mode === 'overview');
    const lastPhoto = photos[photos.length - 1];
    let next = null, reason = null;
    if (lastPhoto && lastPhoto.tooDark) { reason = 'tooDark'; }
    if (!sky.ok && !inp.skipSky && !(lastPhoto && lastPhoto.tooDark) && (light.value !== 'night')) {
      next = 'overview'; reason = reason || (haveOverview ? 'noSky' : 'start');
    } else if (!water.ok && !user.water && !haveOverview) {
      next = 'overview'; reason = reason || 'start';
    } else if (!clarity.ok && light.value !== 'night' && !(lastPhoto && lastPhoto.tooDark)) {
      next = 'closeup';
      const lastW = [...photos].reverse().find((p) => p.water && p.water.found)?.water;
      reason = reason || (photos.some((p) => p.mode === 'closeup') ? (lastW?.reflection ? 'reflection' : 'closeupUnsure') : lastW?.reflection ? 'reflection' : 'needCloseup');
    }
    if (lastPhoto && lastPhoto.mode === 'overview' && !lastPhoto.water.found && !lastPhoto.tooDark && !next) { next = 'overview'; reason = 'noWater'; }
    if (lastPhoto && lastPhoto.mode === 'closeup' && !lastPhoto.water.found && !lastPhoto.tooDark) { next = 'closeup'; reason = 'closeupNoWater'; }
    // Don't loop forever: after two unclear close-ups, let the user choose
    const closeups = photos.filter((p) => p.mode === 'closeup').length;
    let giveUpClarity = false;
    if (next === 'closeup' && closeups >= 2) { next = null; reason = 'askUser'; giveUpClarity = true; }

    const env = {
      water: water.value || 'lake',
      clarity: clarity.value || 'stained',
      light: light.value || (sky.value === 'clear' ? 'sun' : 'overcast'),
    };
    const done = sky.ok && light.ok && water.ok && clarity.ok;
    return { env, items, next, reason, notes, done, needPick: { water: !water.ok && haveOverview, clarity: !clarity.ok && (giveUpClarity || light.value === 'night' || !!lastPhoto?.tooDark) } };
  }

  const api = { hsv, regionStats, findSkyRows, skyCondition, waterClarity, analyzeGrid, evFromExif, lightFromEv, sunElevation, classifyOsm, weatherSky, decide };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Scene = api;
})(typeof window !== 'undefined' ? window : globalThis);
