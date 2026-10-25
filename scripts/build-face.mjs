// Строит src/assets/face-base.svg из canonical_face_model.obj (MediaPipe, Apache 2.0).
// Запуск: node scripts/build-face.mjs
import { writeFileSync } from 'node:fs';
import { loadPoints, simplify, smooth, pick, centroid, f } from './face-lib.mjs';

const P = loadPoints();
const mirror = (ids) => ids; // индексы MediaPipe заданы явно для обеих сторон

const OVAL = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];
const LIPS_OUT = [61,146,91,181,84,17,314,405,321,375,291,409,270,269,267,0,37,39,40,185];
const LIPS_MID = [78,95,88,178,87,14,317,402,318,324,308,415,310,311,312,13,82,81,80,191]; // для линии разреза
const EYE_R = [33,7,163,144,145,153,154,155,133,173,157,158,159,160,161,246];
const EYE_L = [263,249,390,373,374,380,381,382,362,398,384,385,386,387,388,466];
const BROW_R = { up: [70,63,105,66,107], lo: [46,53,52,65,55] };
const BROW_L = { up: [300,293,334,296,336], lo: [276,283,282,295,285] };
const NOSE_BASE = [64,98,97,2,326,327,294];

// ---------- линии лица ----------
const mid = (b) => b.up.map((u, i) => [(P[u][0] + P[b.lo[i]][0]) / 2, (P[u][1] + P[b.lo[i]][1]) / 2]);
const line = (pts, closed = false, tol = 0.6) => `<path pathLength="1" d="${smooth(closed ? pts : simplify(pts, tol), closed)}"/>`;

const oval = pick(P, OVAL);
// шея и плечо одной линией: вниз от челюсти и плавный изгиб в линию плеча
const neck = (a, dir) => {
  const [x, y] = P[a];
  const x0 = x + dir * 3, y0 = y + 1;
  return `M${f(x0)} ${f(y0)}C${f(x0)} ${f(y0 + 24)} ${f(x0 - dir * 2)} ${f(y0 + 40)} ${f(x0 - dir * 4)} ${f(y0 + 52)}C${f(x0 - dir * 8)} ${f(y0 + 64)} ${f(x0 - dir * 60)} ${f(y0 + 74)} ${f(x0 - dir * 120)} ${f(y0 + 96)}`;
};
const faceLines = [
  line(oval, true, 0.4),
  line(pick(P, EYE_R), true, 0.3), line(pick(P, EYE_L), true, 0.3),
  line(mid(BROW_R)), line(mid(BROW_L)),
  line(pick(P, NOSE_BASE)),
  line(pick(P, [193, 122, 196, 3, 236, 198, 209]), false, 0.8),
  line(pick(P, [417, 351, 419, 248, 456, 420, 429]), false, 0.8),
  line(pick(P, LIPS_OUT), true, 0.3),
  line(pick(P, [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308]), false, 0.3),
  `<path pathLength="1" d="${neck(149, 1)}${neck(378, -1)}"/>`,
].join('\n    ');

// ---------- зоны ----------
const hull = (pts) => {
  const s = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const p of s) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (const p of [...s].reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
};
const grow = (pts, k) => { const c = centroid(pts); return pts.map(([x, y]) => [c[0] + (x - c[0]) * k, c[1] + (y - c[1]) * k]); };
const zonePath = (pts) => smooth(pts, true, 0.22);

const hullZone = (ids, k = 1) => grow(hull(pick(P, ids)), k);
const [jx1, jx2] = [P[149][0] + 3, P[378][0] - 3];
const ZONES = {
  forehead: pick(P, [21,54,103,67,109,10,338,297,332,284,251, 300,293,334,296,336,107,66,105,63,70]),
  eyes: grow(hull([...pick(P, [70,63,105,66,107,336,296,334,293,300,46,276,111,117,340,346,34,264]), ...pick(P, EYE_R), ...pick(P, EYE_L)]), 1.02),
  cheeksL: hullZone([34,111,117,118,119,120,36,205,206,187,147,123,137,227]),
  cheeksR: hullZone([264,340,346,347,348,349,266,425,426,411,376,352,366,447]),
  lips: grow(hull([...pick(P, LIPS_OUT), P[152], P[148], P[377], P[200]]), 1.16),
  jaw: pick(P, [58,172,136,150,149,176,148,152,377,400,378,379,365,397,288, 367,364,394,395,369,396,175,171,140,170,169,135,138]),
};
const rawNeck = `M${f(jx1)} ${f(P[149][1] + 1)}L${f(jx2)} ${f(P[149][1] + 1)}L${f(jx2 - 4)} ${f(P[149][1] + 54)}L${f(jx1 + 4)} ${f(P[149][1] + 54)}Z`;
const paths = {
  jawline: zonePath(ZONES.jaw) + rawNeck,
  cheeks: zonePath(ZONES.cheeksL) + zonePath(ZONES.cheeksR),
  forehead: zonePath(ZONES.forehead),
  eyes: zonePath(ZONES.eyes),
  lips: zonePath(ZONES.lips),
};
const PINS = {
  forehead: centroid(pick(P, [9, 107, 336])).map((v, i) => (i ? v - 38 : v)),
  eyes: centroid(pick(P, EYE_L)),
  cheeks: centroid(pick(P, [330, 347, 280])),
  lips: centroid(pick(P, LIPS_OUT)),
  jawline: [P[152][0], P[152][1] + 40],
};
// порядок слоёв: нижние области раньше, малые сверху
const order = ['jawline', 'cheeks', 'forehead', 'eyes', 'lips'];
const zones = order.map((z) => `  <g id="zone-${z}"><path class="zone-hit" fill="transparent" d="${paths[z]}"/><circle class="zone-pin" cx="${f(PINS[z][0])}" cy="${f(PINS[z][1])}" r="10"/></g>`).join('\n');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" fill="none" aria-hidden="true">
  <!-- Сгенерировано scripts/build-face.mjs из MediaPipe canonical_face_model.obj (Apache 2.0). Не править вручную. -->
  <g id="face-lines" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
    ${faceLines}
  </g>
${zones}
</svg>
`;
writeFileSync(new URL('../src/assets/face-base.svg', import.meta.url), svg);
console.log('face-base.svg written,', svg.length, 'bytes');

// полигоны зон для scripts/build-mesh.mjs (раздача вершин 3D-сетки по зонам)
writeFileSync(new URL('./data/zone-polys.json', import.meta.url), JSON.stringify({
  polys: { lips: ZONES.lips, eyes: ZONES.eyes, forehead: ZONES.forehead, cheeksL: ZONES.cheeksL, cheeksR: ZONES.cheeksR, jaw: ZONES.jaw },
  pins: PINS,
}));
