// Процедурные 3D-объекты на тему бьюти: жемчуг, флакон, баночка, помада, цветок, сердце, капля, хромовая капля.
// Ничего не загружается из сети: геометрия строится кодом, отражения берутся из RoomEnvironment.
import {
  CanvasTexture, Color, CylinderGeometry, DoubleSide, ExtrudeGeometry, Group, IcosahedronGeometry, LatheGeometry, Mesh,
  MeshPhysicalMaterial, PMREMGenerator, Scene, SphereGeometry, Shape, TorusGeometry, Vector2, WebGLRenderer, BufferAttribute,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export function applyEnvironment(renderer: WebGLRenderer, scene: Scene) {
  const pm = new PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  pm.dispose();
}

const phys = (o: ConstructorParameters<typeof MeshPhysicalMaterial>[0]) => new MeshPhysicalMaterial(o);

export const mats = {
  chrome: () => phys({ color: 0xf2f2f2, metalness: 1, roughness: 0.14 }),
  gold: () => phys({ color: 0xd9a35a, metalness: 1, roughness: 0.16 }),
  pearl: (c = 0xf4e9e6) => phys({ color: c, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05, iridescence: 1, iridescenceIOR: 1.35, sheen: 1, sheenColor: new Color(0xffd6ef) }),
  gloss: (c: number) => phys({ color: c, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.04 }),
  glass: (c: number) => phys({ color: c, roughness: 0.04, transmission: 1, thickness: 1.4, ior: 1.45, transparent: true, attenuationColor: new Color(c), attenuationDistance: 2.2 }),
  velvet: (c: number) => phys({ color: c, roughness: 0.85, sheen: 0.5, sheenRoughness: 0.5, sheenColor: new Color(0xff8a9a), clearcoat: 0.4, clearcoatRoughness: 0.3 }),
  soft: (c: number) => phys({ color: c, roughness: 0.55, sheen: 1, sheenRoughness: 0.5, sheenColor: new Color(0xffffff), clearcoat: 0.3 }),
};

const lathe = (pts: [number, number][], mat: MeshPhysicalMaterial, seg = 64) => new Mesh(new LatheGeometry(pts.map(([x, y]) => new Vector2(x, y)), seg), mat);

export function pearl(r = 1, c?: number) { return new Mesh(new SphereGeometry(r, 64, 48), mats.pearl(c)); }

export function chromeBlob(r = 1, seed = 1) {
  const g = new IcosahedronGeometry(r, 40);
  const p = g.getAttribute('position') as BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), l = Math.hypot(x, y, z);
    const n = Math.sin(x * 1.3 + seed) * Math.cos(y * 1.6 + seed * 1.7) + Math.sin(z * 1.4 + seed * 0.6) * 0.6;
    const k = 1 + n * 0.2;
    p.setXYZ(i, (x / l) * r * k, (y / l) * r * k, (z / l) * r * k);
  }
  g.computeVertexNormals();
  const m = mats.chrome(); m.roughness = 0.3; return new Mesh(g, m);
}

export function droplet(s = 1, c = 0xffb5d8, glass = true) {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 40; i++) { const t = i / 40; const y = -1 + t * 2.6; const r = Math.sin(Math.PI * Math.pow(t, 0.75)) * (1 - t * 0.55) * 0.9; pts.push([Math.max(r, 0.0001), y]); }
  const m = lathe(pts, glass ? mats.glass(c) : mats.gloss(c)); m.scale.setScalar(s); return m;
}

export function dropperBottle(c = 0xf6a3c4) {
  const g = new Group();
  const body = lathe([[0.0001, -1.4], [0.82, -1.4], [0.98, -1.2], [1, -0.4], [0.9, 0.35], [0.5, 0.65], [0.46, 0.95], [0.0001, 0.95]], mats.glass(c));
  const liquid = lathe([[0.0001, -1.3], [0.76, -1.3], [0.92, -1.15], [0.93, -0.5], [0.0001, -0.5]], mats.gloss(c));
  const collar = new Mesh(new CylinderGeometry(0.62, 0.62, 0.5, 48), mats.gold()); collar.position.y = 1.15;
  const bulb = lathe([[0.0001, 1.4], [0.38, 1.4], [0.5, 1.9], [0.38, 2.7], [0.0001, 2.9]], mats.gloss(0x2a2a30));
  g.add(body, liquid, collar, bulb); g.position.y = -0.5; const o = new Group(); o.add(g); return o;
}

export function jar(c = 0xf8cbd8) {
  const g = new Group();
  const base = lathe([[0.0001, -0.7], [1.15, -0.7], [1.3, -0.5], [1.3, 0.35], [1.2, 0.5], [0.0001, 0.5]], mats.soft(c));
  const lid = new Mesh(new CylinderGeometry(1.35, 1.35, 0.55, 64), mats.chrome()); lid.position.y = 0.8;
  const top = new Mesh(new CylinderGeometry(1.2, 1.35, 0.12, 64), mats.pearl(0xffd6e6)); top.position.y = 1.12;
  g.add(base, lid, top); return g;
}

export function lipstick(c = 0xc2183c) {
  const g = new Group();
  const tube = new Mesh(new CylinderGeometry(0.62, 0.62, 1.7, 48), mats.gold()); tube.position.y = -0.85;
  const ring = new Mesh(new CylinderGeometry(0.66, 0.66, 0.5, 48), mats.chrome()); ring.position.y = 0.1;
  const bullet = lathe([[0.0001, 0], [0.52, 0], [0.52, 0.9], [0.4, 1.35], [0.0001, 1.6]], mats.gloss(c)); bullet.position.y = 0.34;
  g.add(tube, ring, bullet); return g;
}

export function heart(c = 0xd1182f) {
  const s = new Shape();
  s.moveTo(0, -1); s.bezierCurveTo(-0.2, -0.75, -1.5, -0.2, -1.5, 0.55); s.bezierCurveTo(-1.5, 1.25, -0.6, 1.5, 0, 0.85);
  s.bezierCurveTo(0.6, 1.5, 1.5, 1.25, 1.5, 0.55); s.bezierCurveTo(1.5, -0.2, 0.2, -0.75, 0, -1);
  const g = new ExtrudeGeometry(s, { depth: 0.6, bevelEnabled: true, bevelThickness: 0.45, bevelSize: 0.4, bevelSegments: 16, curveSegments: 40 });
  g.center(); return new Mesh(g, mats.velvet(c));
}

export function flower(c = 0xb978f0, n = 7) {
  const g = new Group();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const petal = new Mesh(new SphereGeometry(0.62, 40, 32), mats.soft(c));
    petal.scale.set(1, 1.35, 0.6);
    petal.position.set(Math.cos(a) * 0.95, Math.sin(a) * 0.95, 0);
    petal.rotation.z = a - Math.PI / 2;
    g.add(petal);
  }
  const mid = new Mesh(new SphereGeometry(0.4, 32, 24), mats.soft(0xffd23f)); mid.position.z = 0.22; g.add(mid);
  return g;
}

export function ring(r = 1) { return new Mesh(new TorusGeometry(r, r * 0.14, 32, 96), mats.chrome()); }

export function sparkle(s = 1, c = 0xffffff) {
  const pts: [number, number][] = [[0.0001, -1], [0.12, -0.2], [0.0001, 0]];
  const m = new Group();
  const a = lathe([[0.0001, 1], [0.14, 0.14], [0.0001, 0]], mats.chrome(), 4); const b = lathe([[0.0001, -1], [0.14, -0.14], [0.0001, 0]], mats.chrome(), 4);
  const h = new Group(); h.add(a, b); const h2 = h.clone(); h2.rotation.z = Math.PI / 2;
  m.add(h, h2); m.scale.setScalar(s); void pts; void c; return m;
}

export function gradientBackground(top: string, bottom: string) {
  const c = document.createElement('canvas'); c.width = 4; c.height = 256;
  const x = c.getContext('2d')!, g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, top); g.addColorStop(1, bottom);
  x.fillStyle = g; x.fillRect(0, 0, 4, 256);
  return new CanvasTexture(c);
}
void DoubleSide;
