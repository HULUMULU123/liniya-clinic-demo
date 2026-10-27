// Рендер плиток галереи (запускается только через scripts/render-tiles.mjs, в сборку сайта не входит).
import { PerspectiveCamera, Scene, WebGLRenderer, ACESFilmicToneMapping, DirectionalLight, AmbientLight, Object3D, SRGBColorSpace } from 'three';
import * as O from './objects';

interface Spec { name: string; w: number; h: number; bg: [string, string]; items: { make: () => Object3D; x: number; y: number; z?: number; s?: number; rx?: number; ry?: number; rz?: number }[] }

const S = (name: string, w: number, h: number, bg: [string, string], items: Spec['items']): Spec => ({ name, w, h, bg, items });
const specs: Spec[] = [
  S('t1', 720, 900, ['#ffb3d1', '#ec4f94'], [
    { make: () => O.dropperBottle(0xff9ec4), x: 0, y: -0.2, s: 1.15, ry: -0.5 }, { make: () => O.pearl(0.5), x: 2.0, y: -1.7, z: 1.0 }, { make: () => O.pearl(0.32), x: -2.1, y: 1.8, z: 0.5 }, { make: () => O.pearl(0.22), x: 1.5, y: 2.2 }]),
  S('t2', 1000, 720, ['#b79cff', '#5a37d8'], [
    { make: () => O.chromeBlob(1.7, 2), x: -1.7, y: 0, s: 1 }, { make: () => O.flower(0xffa8e0), x: 2.4, y: 0.5, s: 1.1, rx: -0.3, ry: 0.3 }, { make: () => O.pearl(0.45), x: 0.3, y: -1.7, z: 1.5 }]),
  S('t3', 720, 900, ['#ffd36b', '#ff8a1f'], [
    { make: () => O.jar(0xfff0f3), x: 0, y: -0.3, s: 1.5, rx: 0.35 }, { make: () => O.pearl(0.4), x: -2.0, y: 1.6 }, { make: () => O.pearl(0.6, 0xffe0c8), x: 2.1, y: -1.9, z: 1.0 }]),
  S('t4', 1000, 720, ['#8fd3ff', '#2f7ff0'], [
    { make: () => O.droplet(1.6, 0x9ad8ff), x: -2.0, y: -0.2, ry: 0.4 }, { make: () => O.droplet(1.0, 0xc7b6ff), x: 0.4, y: 0.5, rz: 0.3 }, { make: () => O.pearl(0.5), x: 2.3, y: -0.8 }, { make: () => O.ring(1.1), x: 2.6, y: 1.5, rx: 1.0 }]),
  S('t5', 720, 900, ['#ff9a9a', '#e0334c'], [
    { make: () => O.heart(0xc4122a), x: 0, y: 0, s: 1.15, rz: 0.2, ry: -0.35 }, { make: () => O.pearl(0.4), x: 2.1, y: 2.0 }, { make: () => O.sparkle(0.8), x: -2.2, y: 2.1 }, { make: () => O.sparkle(0.5), x: 2.4, y: -2.0 }]),
  S('t6', 1000, 720, ['#a9eec0', '#2fb872'], [
    { make: () => O.flower(0xffc6e5, 8), x: -1.8, y: 0.1, s: 1.5, rx: -0.4, ry: 0.4 }, { make: () => O.flower(0xffffff, 6), x: 2.3, y: -0.6, s: 0.9, rx: -0.2, ry: -0.3 }, { make: () => O.pearl(0.35), x: 0.4, y: 1.8 }]),
  S('t7', 720, 900, ['#2b2140', '#6b3fa0'], [
    { make: () => O.lipstick(0xe0245e), x: -0.8, y: -0.3, s: 1.5, rz: 0.35 }, { make: () => O.chromeBlob(0.9, 5), x: 1.9, y: -1.7 }, { make: () => O.ring(0.9), x: 1.6, y: 1.8, rx: 0.8 }, { make: () => O.sparkle(0.6), x: -2.1, y: 2.0 }]),
  S('t8', 1000, 720, ['#ff9fcf', '#c93a8f'], [
    { make: () => O.pearl(0.9), x: -2.6, y: 0.2 }, { make: () => O.chromeBlob(0.7, 3), x: -0.9, y: -1.1 }, { make: () => O.pearl(0.75, 0xffe9d6), x: 0.6, y: 0.7 }, { make: () => O.pearl(0.45), x: 2.0, y: -0.7 }, { make: () => O.pearl(0.3), x: 3.1, y: 1.3 }]),
  S('t9', 720, 900, ['#ffe27a', '#ffa400'], [
    { make: () => O.chromeBlob(1.4, 9), x: 0.2, y: -0.4, s: 1.1 }, { make: () => O.droplet(0.8, 0xffa8d0), x: -2.1, y: 1.7 }, { make: () => O.flower(0xff9f43, 6), x: 2.0, y: 2.0, s: 0.6 }]),
  S('t10', 1000, 720, ['#ffb59a', '#f2603b'], [
    { make: () => O.jar(0xffe6ef), x: -2.2, y: -0.5, s: 1.0, rx: 0.4 }, { make: () => O.dropperBottle(0xffb0d0), x: 0.4, y: -0.1, s: 0.85, ry: 0.5 }, { make: () => O.lipstick(0xc2183c), x: 2.8, y: -0.4, s: 0.9, rz: -0.25 }, { make: () => O.sparkle(0.5), x: 1.6, y: 2.0 }]),
];

(async () => {
  const out: Record<string, string> = {};
  for (const sp of specs) {
    const r = new WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    r.setSize(sp.w, sp.h, false); r.setPixelRatio(1); r.toneMapping = ACESFilmicToneMapping; r.toneMappingExposure = 0.95; r.outputColorSpace = SRGBColorSpace;
    const scene = new Scene(); O.applyEnvironment(r, scene); scene.environmentIntensity = 0.62;
    scene.background = O.gradientBackground(sp.bg[0], sp.bg[1]);
    scene.add(new AmbientLight(0xffffff, 0.35)); const d = new DirectionalLight(0xffffff, 1.4); d.position.set(3, 5, 6); scene.add(d);
    const cam = new PerspectiveCamera(32, sp.w / sp.h, 0.1, 100); cam.position.set(0, 0, 11);
    for (const it of sp.items) { const o = it.make(); o.position.set(it.x, it.y, it.z ?? 0); o.scale.multiplyScalar(it.s ?? 1); o.rotation.set(it.rx ?? 0, it.ry ?? 0, it.rz ?? 0); scene.add(o); }
    r.render(scene, cam);
    out[sp.name] = r.domElement.toDataURL('image/jpeg', 0.9);
    r.dispose();
  }
  (window as unknown as { __tiles: Record<string, string> }).__tiles = out;
  document.title = 'done';
})();
