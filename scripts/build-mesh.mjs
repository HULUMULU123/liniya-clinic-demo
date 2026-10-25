// Строит src/data/face-mesh.json (3D-сетка лица) из canonical_face_model.obj (MediaPipe, Apache 2.0).
// Порядок: node scripts/build-face.mjs, затем node scripts/build-mesh.mjs.
import { readFileSync, writeFileSync } from 'node:fs';
import { loadPoints } from './face-lib.mjs';

const obj = readFileSync(new URL('./data/canonical_face_model.obj', import.meta.url), 'utf8').split('\n');
const P2 = loadPoints();
const raw = obj.filter((l) => l.startsWith('v ')).map((l) => l.trim().split(/\s+/).slice(1).map(Number));
const xs = raw.map((p) => p[0]);
const k = 260 / (Math.max(...xs) - Math.min(...xs));
const tris = obj.filter((l) => l.startsWith('f ')).map((l) => l.trim().split(/\s+/).slice(1).map((t) => +t.split('/')[0] - 1));
const idx = tris.flat();

const bb = (a) => [Math.min(...a), Math.max(...a)];
const [x0, x1] = bb(P2.map((p) => p[0])), [y0, y1] = bb(P2.map((p) => p[1]));
const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
const pos = P2.map(([x, y], i) => [x - cx, cy - y, raw[i][2] * k]);

const { polys, pins } = JSON.parse(readFileSync(new URL('./data/zone-polys.json', import.meta.url), 'utf8'));
const inPoly = ([x, y], poly) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const ZONE_IDS = ['forehead', 'eyes', 'cheeks', 'lips', 'jawline'];
const test = [['lips', 'lips'], ['eyes', 'eyes'], ['forehead', 'forehead'], ['cheeksL', 'cheeks'], ['cheeksR', 'cheeks'], ['jaw', 'jawline']];
const zone = P2.map((p) => { for (const [poly, z] of test) if (inPoly(p, polys[poly])) return ZONE_IDS.indexOf(z); return -1; });
const browTop = Math.min(...polys.eyes.map((p) => p[1]));
const mouthY = Math.max(...[61, 291].map((i) => P2[i][1]));
zone.forEach((z, i) => { if (z >= 0) return; const y = P2[i][1]; zone[i] = ZONE_IDS.indexOf(y < browTop ? 'forehead' : y <= mouthY + 6 ? 'cheeks' : 'jawline'); });

const ecount = new Map();
for (const t of tris) for (let e = 0; e < 3; e++) { const a = t[e], b = t[(e + 1) % 3], key = a < b ? `${a}_${b}` : `${b}_${a}`; ecount.set(key, (ecount.get(key) || 0) + 1); }
const adj = P2.map(() => new Set()), hops = P2.map(() => Infinity), queue = [];
for (const [key, c] of ecount) { const [a, b] = key.split('_').map(Number); adj[a].add(b); adj[b].add(a); if (c === 1) for (const v of [a, b]) if (hops[v] === Infinity) { hops[v] = 0; queue.push(v); } }
for (let q = 0; q < queue.length; q++) for (const n of adj[queue[q]]) if (hops[n] === Infinity) { hops[n] = hops[queue[q]] + 1; queue.push(n); }
const edge = hops.map((h) => { const t = Math.min(1, h / 4); return +(t * t * (3 - 2 * t)).toFixed(3); });

const anchorPin = { forehead: pins.forehead, eyes: pins.eyes, cheeks: pins.cheeks, lips: pins.lips, jawline: P2[175] };
const anchors = {};
for (const [z, pin] of Object.entries(anchorPin)) {
  let best = -1, d = Infinity;
  P2.forEach((p, i) => { if (zone[i] !== ZONE_IDS.indexOf(z) && !(z === 'jawline' && i === 175)) return; const dd = Math.hypot(p[0] - pin[0], p[1] - pin[1]); if (dd < d) { d = dd; best = i; } });
  anchors[z] = pos[best].map((v) => +v.toFixed(1));
}
const r = (v) => +v.toFixed(1);
writeFileSync(new URL('../src/data/face-mesh.json', import.meta.url), JSON.stringify({ pos: pos.flat().map(r), idx, zone, edge, anchors, zones: ZONE_IDS }));
console.log('mesh:', P2.length, 'vertices,', tris.length, 'triangles');
