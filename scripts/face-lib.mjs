import { readFileSync } from 'node:fs';

export function loadPoints(file = new URL('./data/canonical_face_model.obj', import.meta.url)) {
  const raw = readFileSync(file, 'utf8').split('\n').filter((l) => l.startsWith('v '))
    .map((l) => l.trim().split(/\s+/).slice(1, 3).map(Number)); // только x, y
  const xs = raw.map((p) => p[0]), ys = raw.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  // лицо во viewBox 400×500: ширина 260, по оси x=0 модели, сверху отступ 36
  const k = 260 / (maxX - minX);
  const P = raw.map(([x, y]) => [200 + x * k, 36 + (maxY - y) * k * 1.16]); // вытяжка: модель шире живого лица
  const chin = P[152][1], top = 130;
  // сужаем нижнюю часть лица к подбородку
  const out = P.map(([x, y]) => {
    const t = Math.max(0, Math.min(1, (y - top) / (chin - top)));
    return [200 + (x - 200) * (1 - 0.16 * Math.pow(t, 1.2)), y];
  });
  // в модели нет черепа: поднимаем верх овала куполом
  const dome = { 10: 15, 109: 14, 338: 14, 67: 10, 297: 10, 103: 5, 332: 5 };
  for (const [i, d] of Object.entries(dome)) out[i][1] -= d;
  return out;
}

const f = (n) => +n.toFixed(1);

// Ramer–Douglas–Peucker
export function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  let idx = 0, dmax = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i];
    const d = Math.abs((b[1] - a[1]) * x - (b[0] - a[0]) * y + b[0] * a[1] - b[1] * a[0]) / (Math.hypot(b[0] - a[0], b[1] - a[1]) || 1);
    if (d > dmax) { dmax = d; idx = i; }
  }
  if (dmax <= tol) return [a, b];
  return [...simplify(pts.slice(0, idx + 1), tol).slice(0, -1), ...simplify(pts.slice(idx), tol)];
}

// Catmull-Rom → кубические Безье
export function smooth(pts, closed = false, tension = 0.5) {
  const n = pts.length;
  const g = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2), t = tension / 3 * 2;
    const c1 = [p1[0] + (p2[0] - p0[0]) * t / 2, p1[1] + (p2[1] - p0[1]) * t / 2];
    const c2 = [p2[0] - (p3[0] - p1[0]) * t / 2, p2[1] - (p3[1] - p1[1]) * t / 2];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + (closed ? 'Z' : '');
}

export const pick = (P, ids) => ids.map((i) => P[i]);
export const centroid = (pts) => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
export { f };
