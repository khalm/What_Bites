/* WhatBites on-device vision — everything runs on the phone, free, no account.
 * - detectBaits(): OWL-ViT zero-shot object detection (Transformers.js, ~155 MB, downloaded once and cached)
 * - readEnvironment(): quick pixel statistics of the spot photo (light, sky, water colour)
 * - colorOf(): dominant colour class of each detected bait
 */
(function (root) {
  const MODEL = 'Xenova/owlvit-base-patch32';
  // Library versions to try, in order. v3 is the long-tested line; v4 is newer.
  const TF_URLS = [
    'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1',
    'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0/dist/transformers.min.js',
  ];

  // Text prompts → bait type. OWL-ViT matches image regions against these phrases.
  const PROMPTS = [
    ['a metal fishing spoon lure', 'spoon'],
    ['a spinner fishing lure with a rotating blade', 'spinner'],
    ['a hard plastic fishing lure shaped like a small fish', 'wobbler'],
    ['a soft rubber fishing lure', 'softbait'],
    ['a soft plastic worm fishing lure', 'softbait'],
    ['a metal jig fishing lure', 'jig'],
    ['a jig head with a hook', 'jig'],
    ['a fishing fly made of feathers', 'fly'],
    ['live earthworms used as fishing bait', 'worm'],
  ];

  let detectorPromise = null;
  function loadDetector(onProgress) {
    if (!detectorPromise) {
      detectorPromise = (async () => {
        const errors = [];
        for (const url of TF_URLS) {
          try {
            const tf = await import(url);
            if (tf.env) { tf.env.allowLocalModels = false; tf.env.useBrowserCache = true; }
            const files = {};
            const det = await tf.pipeline('zero-shot-object-detection', MODEL, {
              dtype: 'q8',
              device: 'wasm',
              progress_callback: (p) => {
                if (p.status !== 'progress' || !p.total) return;
                files[p.file] = [p.loaded, p.total];
                const [l, t] = Object.values(files).reduce((a, [x, y]) => [a[0] + x, a[1] + y], [0, 0]);
                onProgress?.(l / t, t);
              },
            });
            return det;
          } catch (e) {
            console.error('WhatBites model load failed with', url, e);
            errors.push(`${url.match(/@([\d.]+)/)?.[1] || url}: ${e?.message || e}`);
          }
        }
        const err = new Error(errors.join(' | '));
        err.details = errors;
        throw err;
      })().catch((e) => { detectorPromise = null; throw e; });
    }
    return detectorPromise;
  }

  function iou(a, b) {
    const x0 = Math.max(a.xmin, b.xmin), y0 = Math.max(a.ymin, b.ymin);
    const x1 = Math.min(a.xmax, b.xmax), y1 = Math.min(a.ymax, b.ymax);
    const inter = Math.max(0, x1 - x0) * Math.max(0, y1 - y0);
    const area = (r) => (r.xmax - r.xmin) * (r.ymax - r.ymin);
    return inter / (area(a) + area(b) - inter || 1);
  }

  /** Returns [{id, type, score, box:[x0,y0,x1,y1] fractions}] */
  async function detectBaits(imageUrl, onProgress) {
    const detector = await loadDetector(onProgress);
    onProgress?.(1);
    const labels = PROMPTS.map((p) => p[0]);
    const raw = await detector(imageUrl, labels, { threshold: 0.06, percentage: true });
    const typeOf = Object.fromEntries(PROMPTS);
    const dets = raw
      .map((d) => ({ ...d, type: typeOf[d.label] }))
      .filter((d) => {
        const w = d.box.xmax - d.box.xmin, h = d.box.ymax - d.box.ymin;
        return w * h < 0.5 && w > 0.02 && h > 0.02; // drop "whole box" and specks
      })
      .sort((a, b) => b.score - a.score);
    // Non-max suppression across all labels
    const keep = [];
    for (const d of dets) {
      if (keep.every((k) => iou(k.box, d.box) < 0.4)) keep.push(d);
      if (keep.length >= 15) break;
    }
    return keep.map((d, i) => ({
      id: i + 1, type: d.type, conf: d.score,
      box: [d.box.xmin, d.box.ymin, d.box.xmax, d.box.ymax].map((v) => Math.min(1, Math.max(0, v))),
    }));
  }

  /* ---------- pixel helpers ---------- */
  function pixels(img, x0 = 0, y0 = 0, x1 = 1, y1 = 1, size = 96) {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const W = img.naturalWidth, H = img.naturalHeight;
    ctx.drawImage(img, x0 * W, y0 * H, Math.max(1, (x1 - x0) * W), Math.max(1, (y1 - y0) * H), 0, 0, size, size);
    return ctx.getImageData(0, 0, size, size).data;
  }
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
  function stats(data) {
    let n = 0, s = 0, v = 0, hx = 0, hy = 0, vv = 0;
    for (let i = 0; i < data.length; i += 4) {
      const [h, sa, va] = hsv(data[i], data[i + 1], data[i + 2]);
      n++; s += sa; v += va; vv += va * va;
      hx += Math.cos(h * Math.PI / 180) * sa; hy += Math.sin(h * Math.PI / 180) * sa; // saturation-weighted mean hue
    }
    const mv = v / n;
    return { sat: s / n, val: mv, hue: (Math.atan2(hy, hx) * 180 / Math.PI + 360) % 360, contrast: Math.sqrt(Math.max(0, vv / n - mv * mv)) };
  }

  /** Light and water clarity guessed from the spot photo. User can correct in the UI. */
  function readEnvironment(img) {
    const all = stats(pixels(img));
    const sky = stats(pixels(img, 0, 0, 1, 0.3));
    const water = stats(pixels(img, 0, 0.55, 1, 1));
    // Too dark to say anything useful about the water — let the user choose
    if (all.val < 0.15) return { tooDark: true, light: 'night', clarity: null };
    let light;
    if (all.val < 0.3) light = 'low';
    else if (sky.val > 0.6 && sky.sat < 0.18) light = 'overcast';
    else if (all.val > 0.5) light = 'sun';
    else light = 'overcast';
    let clarity;
    const brownish = water.hue >= 25 && water.hue <= 75; // brown / yellow-green
    if (brownish && water.sat > 0.25) clarity = 'murky';
    else if (brownish || (water.contrast < 0.08 && water.val > 0.45)) clarity = 'stained';
    else clarity = 'clear';
    return { tooDark: false, light, clarity };
  }

  /** Classify one pixel into a lure colour name. */
  function pixelColor(r, g, b) {
    const [h, sa, v] = hsv(r, g, b);
    if (v < 0.2) return 'black';
    if (sa < 0.16) {
      if (v > 0.8) return 'white';
      if (v > 0.5) return 'grey-light';   // silver or white, decided later by shine
      return 'grey-dark';                 // natural/dull
    }
    // brownish = low brightness warm hue
    if (h >= 10 && h < 50 && v < 0.5 && sa < 0.75) return 'brown';
    if (h < 12 || h >= 345) return (sa < 0.45 && v > 0.7) ? 'pink' : 'red';
    if (h < 30) return (sa > 0.45 && v < 0.8) ? 'copper' : 'orange';
    if (h < 42) return (sa < 0.8 && v < 0.88) ? 'gold' : 'orange';
    if (h < 62) return (sa > 0.8 && v > 0.85) ? 'yellow' : 'gold';
    if (h < 95) return 'chartreuse';
    if (h < 170) return sa < 0.35 ? 'grey-dark' : 'green';
    if (h < 255) return 'blue';
    if (h < 300) return 'purple';
    return 'pink';
  }

  /**
   * Main and second colour of a bait inside its box. Looks at the middle of the box to skip background.
   * Returns { color, color2|null }.
   */
  function colorOf(img, box) {
    const [x0, y0, x1, y1] = box;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hw = (x1 - x0) * 0.32, hh = (y1 - y0) * 0.32;
    const d = pixels(img, cx - hw, cy - hh, cx + hw, cy + hh, 40);
    const counts = {};
    let n = 0, vs = 0, vv = 0, greyN = 0;
    for (let i = 0; i < d.length; i += 4) {
      const c = pixelColor(d[i], d[i + 1], d[i + 2]);
      counts[c] = (counts[c] || 0) + 1; n++;
      if (c.startsWith('grey') || c === 'white') {
        const v = Math.max(d[i], d[i + 1], d[i + 2]) / 255; vs += v; vv += v * v; greyN++;
      }
    }
    // Shiny metal = lots of grey/white with strong brightness variation (reflections) → silver
    const greyStd = greyN ? Math.sqrt(Math.max(0, vv / greyN - (vs / greyN) ** 2)) : 0;
    const merge = (from, to) => { if (counts[from]) { counts[to] = (counts[to] || 0) + counts[from]; delete counts[from]; } };
    if (greyStd > 0.14) { merge('grey-light', 'silver'); merge('white', 'silver'); }
    else { merge('grey-light', (counts.white || 0) > (counts['grey-light'] || 0) ? 'white' : 'silver'); }
    merge('grey-dark', 'natural');
    merge('brown', 'natural');
    // Gold-looking metal with reflections
    if ((counts.yellow || 0) && greyStd > 0.14 && (counts.yellow || 0) < (counts.gold || 0) * 2) merge('yellow', 'gold');

    const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    let color = ranked[0]?.[0] || 'natural';
    let color2 = null;
    // Mostly black but with a real colour → black is often just shadow; prefer the colour if it is substantial
    if (color === 'black' && ranked[1] && ranked[1][1] > n * 0.25) { color2 = 'black'; color = ranked[1][0]; }
    else if (ranked[1] && ranked[1][1] > n * 0.22 && ranked[1][0] !== color) color2 = ranked[1][0];
    return { color, color2 };
  }

  /* ---------- spot photos ---------- */
  /** Small RGBA grid of the whole photo for Scene.analyzeGrid */
  function grid(img, size = 64) {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, size, size);
    return { data: ctx.getImageData(0, 0, size, size).data, w: size, h: size };
  }

  // What the AI model looks for in a spot photo
  const SCENE_LABELS = {
    sky: ['the sky', 'clouds in the sky'],
    water: ['water surface', 'a body of water'],
    lake: ['a calm lake'],
    river: ['a flowing river', 'a stream with rapids'],
    sea: ['the sea with waves', 'the ocean coast'],
  };
  const unionBox = (ds) => [Math.min(...ds.map((d) => d.box.xmin)), Math.min(...ds.map((d) => d.box.ymin)),
    Math.max(...ds.map((d) => d.box.xmax)), Math.max(...ds.map((d) => d.box.ymax))].map((v) => Math.min(1, Math.max(0, v)));

  /** Sky box, water box and water-type votes from the AI model (only if it is already downloaded). */
  async function sceneHints(imageUrl) {
    const detector = await loadDetector();
    const labels = Object.values(SCENE_LABELS).flat();
    const raw = await detector(imageUrl, labels, { threshold: 0.05, percentage: true });
    const groupOf = {};
    for (const [g, ls] of Object.entries(SCENE_LABELS)) for (const l of ls) groupOf[l] = g;
    const by = {};
    for (const d of raw) (by[groupOf[d.label]] ||= []).push(d);
    const best = (g, min) => (by[g] || []).filter((d) => d.score >= min);
    const sky = best('sky', 0.08), water = [...best('water', 0.08), ...best('lake', 0.08), ...best('river', 0.08), ...best('sea', 0.08)];
    const top = (g) => Math.max(0, ...(by[g] || []).map((d) => d.score));
    return {
      skyBox: sky.length ? unionBox(sky) : null,
      waterBox: water.length ? unionBox(water) : null,
      typeVotes: { lake: top('lake'), river: top('river'), sea: top('sea') },
    };
  }

  /** Read exposure time, f-number and ISO from the photo file (the camera's own light meter). */
  async function readExif(file) {
    try {
      const buf = await file.slice(0, 256 * 1024).arrayBuffer();
      const v = new DataView(buf);
      if (v.getUint16(0) !== 0xFFD8) return null;
      let off = 2;
      while (off + 4 < v.byteLength) {
        const marker = v.getUint16(off); const len = v.getUint16(off + 2);
        if (marker === 0xFFE1 && v.getUint32(off + 4) === 0x45786966) { // "Exif"
          const t0 = off + 10; const le = v.getUint16(t0) === 0x4949;
          const u16 = (o) => v.getUint16(t0 + o, le), u32 = (o) => v.getUint32(t0 + o, le);
          const rat = (o) => { const a = u32(o), b = u32(o + 4); return b ? a / b : null; };
          const readIfd = (ifd) => {
            const tags = {}; const n = u16(ifd);
            for (let i = 0; i < n; i++) {
              const e = ifd + 2 + i * 12, tag = u16(e), type = u16(e + 2);
              if (type === 3) tags[tag] = u16(e + 8);
              else if (type === 4) tags[tag] = u32(e + 8);
              else if (type === 5 || type === 10) tags[tag] = rat(u32(e + 8));
            }
            return tags;
          };
          const ifd0 = readIfd(u32(4));
          const ex = ifd0[0x8769] ? readIfd(ifd0[0x8769]) : {};
          const res = { t: ex[0x829A] || null, N: ex[0x829D] || null, iso: ex[0x8827] || ex[0x8833] || null,
            flash: ex[0x9209] != null ? (ex[0x9209] & 1) === 1 : null };
          return res.t && res.iso ? res : (res.flash != null ? res : null);
        }
        if ((marker & 0xFF00) !== 0xFF00) break;
        off += 2 + len;
      }
    } catch { /* no EXIF */ }
    return null;
  }

  root.Vision = { detectBaits, readEnvironment, colorOf, loadDetector, grid, sceneHints, readExif };
})(window);
