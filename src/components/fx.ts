// 3D-объекты бьюти привязаны к разделам: каждый появляется рядом со «своим» блоком, плывёт в пределах него и исчезает.
// Одновременно на экране два-три небольших объекта у краёв, контент они не закрывают.
import { ACESFilmicToneMapping, AmbientLight, DirectionalLight, Group, Object3D, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import * as O from '../three/objects';

interface Place { sel: string; side: -1 | 1; fx: number; fy: number; s: number; drift: number; m?: boolean; make: () => Object3D }
// fx: расстояние от центра в долях ширины экрана; fy: положение внутри раздела (0 верх, 1 низ); s: размер; m: показывать на телефоне
const PLACES: Place[] = [
  { sel: '#about', side: 1, fx: 0.4, fy: 0.3, s: 0.62, drift: 0.5, m: true, make: () => O.flower(0xb978f0) },
  { sel: '#about', side: -1, fx: 0.42, fy: 0.72, s: 0.42, drift: 0.8, make: () => O.heart(0xc4122a) },
  { sel: '#about', side: -1, fx: 0.37, fy: 0.12, s: 0.34, drift: 0.4, m: true, make: () => O.pearl(0.55) },
  { sel: '#services', side: 1, fx: 0.41, fy: 0.07, s: 0.5, drift: 0.6, m: true, make: () => O.chromeBlob(1, 4) },
  { sel: '#face', side: 1, fx: 0.42, fy: 0.04, s: 0.36, drift: 0.5, m: true, make: () => O.droplet(0.9, 0x7ec8ff, false) },
  { sel: '#journal', side: -1, fx: 0.41, fy: 0.08, s: 0.46, drift: 0.5, m: true, make: () => O.ring(0.9) },
  { sel: '#faq', side: 1, fx: 0.4, fy: 0.15, s: 0.4, drift: 0.6, make: () => O.sparkle(0.9) },
  { sel: '#contacts', side: -1, fx: 0.4, fy: 0.84, s: 0.46, drift: 0.5, make: () => O.chromeBlob(0.9, 7) },
  { sel: '#contacts', side: 1, fx: 0.4, fy: 0.06, s: 0.5, drift: 0.7, m: true, make: () => O.lipstick(0xe0245e) },
];

export function initFx() {
  const canvas = document.getElementById('fx') as HTMLCanvasElement | null;
  if (!canvas) return;
  let renderer: WebGLRenderer;
  try { renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' }); } catch { return; }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = matchMedia('(max-width: 767px)').matches;
  renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new Scene();
  O.applyEnvironment(renderer, scene);
  scene.environmentIntensity = 0.95;
  scene.add(new AmbientLight(0xffffff, 0.4));
  const key = new DirectionalLight(0xffffff, 1.5); key.position.set(3, 5, 6); scene.add(key);
  const cam = new PerspectiveCamera(30, 1, 0.1, 100); cam.position.z = 14;

  const root = new Group(); scene.add(root);
  const items = PLACES.filter((p) => !small || p.m).map((p, i) => {
    const el = document.querySelector<HTMLElement>(p.sel);
    const o = p.make(); o.visible = false; root.add(o);
    return { p, el, o, phase: i * 1.9 };
  }).filter((it) => it.el);

  const m = { x: 0, y: 0, tx: 0, ty: 0 };
  let w = 0, h = 0, last = 0, raf = 0, vis = !document.hidden;
  const resize = () => {
    w = innerWidth; h = innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25)); renderer.setSize(w, h, false);
    cam.aspect = w / h; cam.updateProjectionMatrix();
  };
  const frame = (t: number) => {
    const time = reduced ? 0 : t / 1000;
    const vh = 2 * cam.position.z * Math.tan((cam.fov * Math.PI) / 360), vw = vh * cam.aspect;
    m.x += (m.tx - m.x) * 0.06; m.y += (m.ty - m.y) * 0.06;
    let any = false;
    items.forEach((it, i) => {
      const r = it.el!.getBoundingClientRect();
      // положение на экране в пикселях: внутри раздела плюс лёгкий дрейф относительно центра экрана
      const yPx = r.top + it.p.fy * r.height - (r.top + r.height / 2 - h / 2) * 0.12 * it.p.drift;
      const onScreen = r.bottom > -80 && r.top < h + 80 && yPx > -120 && yPx < h + 120;
      // плавное появление и исчезновение у краёв экрана
      const edge = Math.max(0, Math.min(1, Math.min(yPx + 60, h + 60 - yPx) / 220));
      it.o.visible = onScreen && edge > 0.01;
      if (!it.o.visible) return;
      any = true;
      const xf = 0.5 + it.p.side * (small ? 0.5 : it.p.fx) + Math.sin(time * 0.6 + it.phase) * 0.008 + m.x * 0.012;
      it.o.position.set((xf - 0.5) * vw, (0.5 - yPx / h) * vh + Math.sin(time * 0.8 + it.phase) * 0.12 - m.y * 0.1, 0);
      it.o.scale.setScalar(it.p.s * (small ? 0.62 : 1) * (0.4 + 0.6 * edge));
      it.o.rotation.y = 0.4 + time * 0.3 * (i % 2 ? 1 : -1) + scrollY * 0.0012;
      it.o.rotation.x = 0.25 * it.p.side + Math.sin(time * 0.5 + it.phase) * 0.18 + scrollY * 0.0006;
    });
    if (any || last) renderer.render(scene, cam);
    last = any ? 1 : 0;
  };
  const loop = (t: number) => { raf = 0; if (!vis) return; frame(t); raf = requestAnimationFrame(loop); };
  const start = () => { if (!raf) raf = requestAnimationFrame(loop); };
  document.addEventListener('visibilitychange', () => { vis = !document.hidden; if (vis && !reduced) start(); });
  addEventListener('resize', () => { resize(); frame(performance.now()); });
  addEventListener('scroll', () => { if (reduced) frame(performance.now()); }, { passive: true });
  if (!reduced) addEventListener('pointermove', (e) => { m.tx = (e.clientX / w - 0.5) * 2; m.ty = (e.clientY / h - 0.5) * 2; });
  resize(); frame(0);
  if (!reduced) start();
}
