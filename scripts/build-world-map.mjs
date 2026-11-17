// Builds the data for the interactive partner world map (no dependencies).
//
//   node scripts/build-world-map.mjs            downloads source data into a cache, then builds
//   RAW_DIR=/path/to/raw node scripts/build-world-map.mjs   use already-downloaded files
//
// Sources (open data, attribution shown on the map):
//   - World countries: Natural Earth 1:10m, India point of view (official Indian boundaries)
//   - States / districts: geoBoundaries (gbOpen ADM1 + ADM2), per-country licences
//   - Hong Kong districts: Natural Earth 1:10m admin-1
//
// Output (public/maps):
//   world.json            every country outline (world view)
//   world-hi.json         the same outlines in more detail (used when zoomed in)
//   c/<ISO3>.json         the country's states / provinces
//   s/<ISO3>/<id>.json    the districts inside one state
//   partners.json         partner counts per country, state and district + city pins
//
// Everything is pre-projected (Miller cylindrical) on a 1000-unit-wide canvas and
// stored as compact SVG path strings, so the browser only has to draw.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = process.env.RAW_DIR || path.join(ROOT, 'node_modules/.cache/world-map');
const OUT = path.join(ROOT, 'public/maps');
const PARTNERS = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/partnerNetwork.json'), 'utf8'));

export const ISO3 = ('IND SAU USA CAN GBR IRL EST FRA HUN CYP RUS SWE DEU NLD ESP CHE ITA AUT ARE TUR BHR QAT SGP '
  + 'HKG MYS LKA BGD BRN JPN PHL IDN CHN THA VNM NZL AUS KEN UGA ZAF ZMB NGA EGY').split(' ');

/* ---------- download (only when RAW_DIR has no files) ---------- */
async function download() {
  fs.mkdirSync(RAW, { recursive: true });
  const get = async (url, file) => {
    const dest = path.join(RAW, file);
    if (fs.existsSync(dest)) return;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
    console.log('downloaded', file);
  };
  const NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/';
  await get(NE + 'ne_10m_admin_0_countries_ind.geojson', 'world_ind.geojson');
  await get(NE + 'ne_10m_admin_1_states_provinces.geojson', 'ne_admin1.geojson');
  for (const iso of ISO3) {
    for (const lvl of ['ADM1', 'ADM2']) {
      if (fs.existsSync(path.join(RAW, `${iso}_${lvl}.geojson`))) continue;
      const meta = await (await fetch(`https://www.geoboundaries.org/api/current/gbOpen/${iso}/${lvl}/`)).json().catch(() => null);
      if (meta?.simplifiedGeometryGeoJSON) await get(meta.simplifiedGeometryGeoJSON, `${iso}_${lvl}.geojson`);
    }
  }
}

/* ---------- projection: Miller cylindrical, 1000 units wide ---------- */
const W = 1000;
const LAT_MAX = 84;
const LAT_MIN = -58; // crop Antarctica
// Miller cylindrical: like Mercator near the equator, much less stretched
// near the poles, so the whole world fits in a wide, short frame
const projY = (lat) => {
  const φ = (Math.max(-89, Math.min(89, lat)) * Math.PI) / 180;
  return W / 2 - (W / (2 * Math.PI)) * 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * φ));
};
const projX = (lon) => ((lon + 180) / 360) * W;
const Y0 = projY(LAT_MAX);
const H = projY(LAT_MIN) - Y0;

// keep countries that cross the 180° line in one piece when zoomed in
const LON_SHIFT = {
  RUS: (lon) => (lon < -150 ? lon + 360 : lon),
  USA: (lon) => (lon > 100 ? lon - 360 : lon),
  NZL: (lon) => (lon < -150 ? lon + 360 : lon),
};
const projector = (iso) => {
  const shift = LON_SHIFT[iso] || ((x) => x);
  return ([lon, lat]) => [projX(shift(lon)), projY(lat) - Y0];
};

/* ---------- geometry helpers ---------- */
const polygonsOf = (geom) => (!geom ? [] : geom.type === 'Polygon' ? [geom.coordinates] : geom.type === 'MultiPolygon' ? geom.coordinates : []);

function ringArea(r) {
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]);
  return a / 2;
}
function ringCentroid(r) {
  let x = 0; let y = 0; let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const f = r[j][0] * r[i][1] - r[i][0] * r[j][1];
    x += (r[j][0] + r[i][0]) * f; y += (r[j][1] + r[i][1]) * f; a += f;
  }
  return a ? [x / (3 * a), y / (3 * a)] : r[0];
}
function bboxOf(rings) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const r of rings) for (const [x, y] of r) { if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y; if (x > b[2]) b[2] = x; if (y > b[3]) b[3] = y; }
  return b;
}
const union = (a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])];

// even-odd point in polygon over all rings of a feature
function inside([x, y], polys) {
  let hit = false;
  for (const poly of polys) {
    let c = false;
    for (const r of poly) for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      if ((r[i][1] > y) !== (r[j][1] > y) && x < ((r[j][0] - r[i][0]) * (y - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) c = !c;
    }
    if (c) hit = true;
  }
  return hit;
}

// a point guaranteed to be inside the feature (used to place districts in states)
function innerPoint(polys) {
  let best = null; let bestA = -1;
  for (const p of polys) { const a = Math.abs(ringArea(p[0])); if (a > bestA) { bestA = a; best = p; } }
  if (!best) return null;
  const c = ringCentroid(best[0]);
  if (inside(c, [best])) return c;
  const [, y0, , y1] = bboxOf([best[0]]);
  for (const t of [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8]) {
    const y = y0 + (y1 - y0) * t; const xs = [];
    for (const r of best) for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      if ((r[i][1] > y) !== (r[j][1] > y)) xs.push(((r[j][0] - r[i][0]) * (y - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]);
    }
    xs.sort((a, b) => a - b);
    let w = 0; let m = null;
    for (let i = 0; i + 1 < xs.length; i += 2) if (xs[i + 1] - xs[i] > w) { w = xs[i + 1] - xs[i]; m = [(xs[i] + xs[i + 1]) / 2, y]; }
    if (m) return m;
  }
  return c;
}

// Douglas-Peucker (iterative)
function simplify(pts, tol) {
  if (pts.length <= 4) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]]; const t2 = tol * tol;
  while (stack.length) {
    const [s, e] = stack.pop(); let max = 0; let idx = -1;
    const [ax, ay] = pts[s]; const [bx, by] = pts[e]; const dx = bx - ax; const dy = by - ay; const L = dx * dx + dy * dy;
    for (let i = s + 1; i < e; i++) {
      const [px, py] = pts[i];
      let d;
      if (!L) d = (px - ax) ** 2 + (py - ay) ** 2;
      else { const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L)); d = (px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2; }
      if (d > max) { max = d; idx = i; }
    }
    if (max > t2 && idx > 0) { keep[idx] = 1; stack.push([s, idx], [idx, e]); }
  }
  return pts.filter((_, i) => keep[i]);
}

// compact relative SVG path; rounding is done on absolute values so it never drifts
function toPath(polys, tol) {
  const dec = Math.max(0, Math.min(4, Math.ceil(-Math.log10(tol / 2))));
  const f = 10 ** dec; const R = (v) => Math.round(v * f);
  const fmt = (v) => (v / f).toFixed(dec).replace(/\.?0+$/, '').replace(/^(-?)0\./, '$1.') || '0';
  let maxA = 0;
  for (const p of polys) maxA = Math.max(maxA, Math.abs(ringArea(p[0])));
  let d = '';
  for (const p of polys) {
    const outerA = Math.abs(ringArea(p[0]));
    if (outerA < (tol * 3) ** 2 && outerA < maxA) continue; // drop specks, never the main shape
    for (const ring of p) {
      let r = simplify(ring, tol);
      if (r.length < 4) { if (outerA === maxA && ring === p[0]) r = ring; else continue; }
      let [px, py] = [R(r[0][0]), R(r[0][1])];
      const start = `M${fmt(px)} ${fmt(py)}l`;
      const parts = [];
      for (let i = 1; i < r.length - 1; i++) {
        const x = R(r[i][0]); const y = R(r[i][1]);
        if (x === px && y === py) continue;
        parts.push(`${fmt(x - px)} ${fmt(y - py)}`); px = x; py = y;
      }
      if (parts.length < 2) continue; // collapsed to a point at this detail level
      d += start + parts.join(' ').replace(/ -/g, '-') + 'z';
    }
  }
  return d;
}

const round = (b, n = 2) => b.map((v) => +v.toFixed(n));
// plain English names: "Mahārāshtra" -> "Maharashtra"
const clean = (n) => String(n).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
const read = (f) => JSON.parse(fs.readFileSync(path.join(RAW, f), 'utf8'));
const write = (f, obj) => { const p = path.join(OUT, f); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(obj)); return fs.statSync(p).size; };
const projectPolys = (geom, proj) => polygonsOf(geom).map((poly) => poly.map((ring) => ring.map(proj)));

// main view box of a country: drop far-away overseas parts (French Guiana, Canaries...)
function focusBox(allPolys) {
  const parts = allPolys.flat().map((p) => ({ b: bboxOf([p[0]]), a: Math.abs(ringArea(p[0])), c: ringCentroid(p[0]) }));
  const total = parts.reduce((s, p) => s + p.a, 0);
  const main = parts.reduce((m, p) => (p.a > m.a ? p : m));
  const diag = Math.hypot(main.b[2] - main.b[0], main.b[3] - main.b[1]);
  const mc = [(main.b[0] + main.b[2]) / 2, (main.b[1] + main.b[3]) / 2];
  let box = main.b;
  for (const p of parts) if (p.a >= total * 0.004 && Math.hypot(p.c[0] - mc[0], p.c[1] - mc[1]) < diag * 4) box = union(box, p.b);
  return box;
}
const FOCUS_OVERRIDE = { USA: [-125, 24.4, -66.9, 49.5] }; // lower 48 states

/* ---------- build ---------- */
async function main() {
  if (!fs.existsSync(path.join(RAW, 'world_ind.geojson'))) await download();
  fs.rmSync(OUT, { recursive: true, force: true });
  let bytes = 0;

  // world
  const world = read('world_ind.geojson').features.filter((f) => f.properties.ADM0_A3 !== 'ATA');
  const wp = projector(null);
  const worldOut = world.map((f) => {
    const polys = projectPolys(f.geometry, wp);
    return { id: f.properties.ADM0_A3, n: f.properties.NAME, d: toPath(polys, 0.22), b: round(bboxOf(polys.flat())) };
  });
  bytes += write('world.json', { w: W, h: +H.toFixed(2), features: worldOut });
  // sharper outlines, loaded only once someone zooms into a country
  bytes += write('world-hi.json', world.map((f) => [f.properties.ADM0_A3, toPath(projectPolys(f.geometry, wp), 0.045)]));

  // partner cities projected per country
  const cities = PARTNERS.cities.map((c) => ({ ...c, p: projector(c.iso)([c.lon, c.lat]) }));
  const counts = {}; const pins = [];
  const ne1 = read('ne_admin1.geojson').features;

  for (const iso of ISO3) {
    const proj = projector(iso);
    let adm1 = fs.existsSync(path.join(RAW, `${iso}_ADM1.geojson`)) ? read(`${iso}_ADM1.geojson`).features : [];
    if (!adm1.length) adm1 = ne1.filter((f) => f.properties.adm0_a3 === iso).map((f) => ({ ...f, properties: { shapeName: f.properties.name } }));
    const adm2 = fs.existsSync(path.join(RAW, `${iso}_ADM2.geojson`)) ? read(`${iso}_ADM2.geojson`).features : [];

    const states = adm1.map((f, i) => ({ id: `${iso}-${i}`, n: clean(f.properties.shapeName || `Region ${i + 1}`), polys: projectPolys(f.geometry, proj) }))
      .filter((s) => s.polys.length);
    const all = states.map((s) => s.polys);
    const focus = FOCUS_OVERRIDE[iso]
      ? (([a, b, c, d]) => { const p = proj([a, d]); const q = proj([c, b]); return [p[0], p[1], q[0], q[1]]; })(FOCUS_OVERRIDE[iso])
      : focusBox(all);
    const ext = Math.max(focus[2] - focus[0], focus[3] - focus[1]);
    const tol1 = ext / 1400;

    // districts grouped by the state that contains them
    const byState = new Map(states.map((s) => [s.id, []]));
    adm2.forEach((f, i) => {
      const polys = projectPolys(f.geometry, proj);
      if (!polys.length) return;
      const pt = innerPoint(polys);
      const st = states.find((s) => { const b = bboxOf(s.polys.map((p) => p[0])); return pt[0] >= b[0] && pt[0] <= b[2] && pt[1] >= b[1] && pt[1] <= b[3] && inside(pt, s.polys); })
        || states.reduce((m, s) => { const c = innerPoint(s.polys); const d = Math.hypot(c[0] - pt[0], c[1] - pt[1]); return d < m.d ? { s, d } : m; }, { s: null, d: Infinity }).s;
      if (st) byState.get(st.id).push({ id: `${st.id}-${i}`, n: clean(f.properties.shapeName || `District ${i + 1}`), polys });
    });

    const stateOut = states.map((s) => {
      const b = bboxOf(s.polys.flat());
      return { id: s.id, n: s.n, d: toPath(s.polys, tol1), b: round(b, 3), c: round(innerPoint(s.polys), 3), k: byState.get(s.id).length };
    });
    bytes += write(`c/${iso}.json`, { id: iso, focus: round(focus, 3), features: stateOut });

    for (const s of states) {
      const ds = byState.get(s.id);
      if (!ds.length) continue;
      const sb = bboxOf(s.polys.flat());
      const tol2 = Math.max(sb[2] - sb[0], sb[3] - sb[1]) / 1400;
      const out = ds.map((d) => ({ id: d.id, n: d.n, d: toPath(d.polys, tol2), b: round(bboxOf(d.polys.flat()), 4), c: round(innerPoint(d.polys), 4) }));
      bytes += write(`s/${iso}/${s.id}.json`, { id: s.id, features: out });
    }

    // place this country's partner cities into state + district
    const nearest = (pt, list) => list.reduce((m, x) => { const c = innerPoint(x.polys); const d = Math.hypot(c[0] - pt[0], c[1] - pt[1]); return d < m.d ? { x, d } : m; }, { x: null, d: Infinity }).x;
    for (const c of cities.filter((x) => x.iso === iso)) {
      const st = states.find((s) => inside(c.p, s.polys)) || nearest(c.p, states);
      const ds = byState.get(st.id);
      const dt = ds.length ? (ds.find((d) => inside(c.p, d.polys)) || nearest(c.p, ds)) : null;
      const C = (counts[iso] ||= { n: 0, states: {} });
      C.n += c.n;
      const S = (C.states[st.id] ||= { n: 0, name: st.n, districts: {} });
      S.n += c.n;
      if (dt) { const D = (S.districts[dt.id] ||= { n: 0, name: dt.n }); D.n += c.n; }
      pins.push({ iso, s: st.id, dt: dt?.id || null, city: c.city, n: c.n, x: +c.p[0].toFixed(4), y: +c.p[1].toFixed(4) });
    }
    console.log(iso.padEnd(4), String(states.length).padStart(3), 'states', String(adm2.length).padStart(5), 'districts');
  }

  const total = PARTNERS.cities.reduce((s, c) => s + c.n, 0);
  const regions = Object.values(counts).reduce((s, c) => s + Object.keys(c.states).length, 0);
  bytes += write('partners.json', { total, countries: Object.keys(counts).length, regions, counts, pins });
  console.log(`\npartners ${total} in ${Object.keys(counts).length} countries, ${regions} states/regions; output ${(bytes / 1e6).toFixed(1)} MB`);
}

main().catch((e) => { console.error(e); process.exit(1); });
