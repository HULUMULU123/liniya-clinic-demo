import {
  BufferAttribute, BufferGeometry, Group, Mesh, PerspectiveCamera, Raycaster, Scene,
  ShaderMaterial, Vector2, Vector3, WebGLRenderer,
} from 'three';
import meshData from '../data/face-mesh.json';

export interface Face3D { update(selected: string | null): void; dispose(): void }

const VERT = `
attribute float aEdge; attribute vec2 aW;
varying vec3 vN; varying vec2 vW; varying float vEdge; varying vec3 vP;
void main(){ vN = normalize(normalMatrix * normal); vW = aW; vEdge = aEdge; vP = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

// «Гравюра»: тёплая глиняная заливка, тушевые линии-срезы, штриховка в тени; фон прозрачный, лицо лежит прямо на бумаге
const FRAG = `
uniform vec3 uLight;
varying vec3 vN; varying vec2 vW; varying float vEdge; varying vec3 vP;
float lines(float v, float s, float width){
  float f = abs(fract(v / s) - 0.5) * s;
  float w = fwidth(v) * 0.8 + 0.0005;
  return 1.0 - smoothstep(width * w, width * w + w * 1.2 + 0.25, f);
}
void main(){
  vec3 n = normalize(vN); vec3 L = normalize(uLight);
  float d = clamp(dot(n, L) * 0.85 + 0.15, 0.0, 1.0);
  float sel = smoothstep(0.15, 0.85, vW.x);
  float hov = smoothstep(0.15, 0.85, vW.y);
  float zone = max(sel, hov * 0.5);
  vec3 shade = mix(vec3(0.66, 0.43, 0.36), vec3(0.96, 0.84, 0.76), pow(d, 0.9));
  shade = mix(shade, vec3(0.80, 0.38, 0.27), zone * 0.5);
  float ink = lines(vP.y, 7.0, 0.4 + (1.0 - d) * 0.8) * (0.22 + (1.0 - d) * 0.5);
  float hatch = lines(vP.x + vP.y * 0.7, 5.0, 0.4) * smoothstep(0.38, 0.1, d) * 0.5;
  float rim = pow(1.0 - max(n.z, 0.0), 2.6);
  vec3 inkC = vec3(0.115, 0.095, 0.082);
  vec3 col = mix(shade, inkC, clamp(ink + hatch + rim * 0.55, 0.0, 0.9));
  gl_FragColor = vec4(col, vEdge);
}`;

export function createFace3D(
  host: HTMLElement,
  opts: { reduced: boolean; onPick?: (zone: string) => void; onProject?: (zone: string, x: number, y: number) => void },
): Face3D | null {
  let renderer: WebGLRenderer;
  try { renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); } catch { return null; }
  if (!renderer.getContext()) return null;

  const zones = meshData.zones as string[];
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array(meshData.pos), 3));
  const aW = new BufferAttribute(new Float32Array(meshData.zone.length * 2), 2);
  geo.setAttribute('aW', aW);
  geo.setAttribute('aEdge', new BufferAttribute(new Float32Array(meshData.edge), 1));
  geo.setIndex(meshData.idx);
  geo.computeVertexNormals();
  let selZone = -1, hoverZone = -1;
  const applyW = () => { meshData.zone.forEach((z, i) => aW.setXY(i, z === selZone ? 1 : 0, z === hoverZone ? 1 : 0)); aW.needsUpdate = true; };
  applyW();

  const uniforms = { uLight: { value: new Vector3(-0.5, 0.55, 0.8) } };
  const mat = new ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, transparent: true });
  const group = new Group();
  const mesh = new Mesh(geo, mat);
  group.add(mesh);
  const scene = new Scene();
  scene.add(group);
  const camera = new PerspectiveCamera(26, 0.8, 100, 3000);
  camera.position.set(0, 0, 800);

  renderer.setClearColor(0x000000, 0);
  host.prepend(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:pan-y';

  const anchors = zones.map((z) => new Vector3(...(meshData.anchors as Record<string, number[]>)[z]));
  const rot = { x: 0, y: 0, tx: 0, ty: 0 };
  const light = uniforms.uLight.value, lightT = light.clone();
  let raf = 0, size = [0, 0];

  const draw = () => {
    group.rotation.set(rot.x, rot.y, 0);
    group.updateMatrixWorld(true);
    renderer.render(scene, camera);
    const v = new Vector3();
    zones.forEach((z, i) => { v.copy(anchors[i]).applyMatrix4(group.matrixWorld).project(camera); opts.onProject?.(z, (v.x * 0.5 + 0.5) * 100, (-v.y * 0.5 + 0.5) * 100); });
  };
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h || (w === size[0] && h === size[1])) return;
    size = [w, h];
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    draw();
  };
  const tick = () => {
    raf = 0;
    const k = 0.12;
    rot.x += (rot.tx - rot.x) * k; rot.y += (rot.ty - rot.y) * k;
    light.lerp(lightT, k);
    draw();
    if (Math.abs(rot.tx - rot.x) + Math.abs(rot.ty - rot.y) + light.distanceTo(lightT) > 0.002) raf = requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

  const ray = new Raycaster(), ndc = new Vector2();
  const zoneAt = (e: PointerEvent) => {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObject(mesh)[0];
    return hit?.face ? meshData.zone[hit.face.a] : -1;
  };
  const onMove = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    const nx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1)), ny = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
    const hover = e.pointerType === 'touch' ? -1 : zoneAt(e);
    if (hoverZone !== hover) { hoverZone = hover; applyW(); renderer.domElement.style.cursor = hover >= 0 ? 'pointer' : ''; }
    if (!opts.reduced && e.pointerType !== 'touch') { rot.ty = nx * 0.38; rot.tx = ny * 0.16; lightT.set(nx * 1.1, -ny * 1.1 + 0.2, 0.8); }
    kick();
  };
  const onLeave = () => { hoverZone = -1; applyW(); kick(); };
  host.addEventListener('pointermove', onMove);
  host.addEventListener('pointerleave', onLeave);
  if (opts.onPick) renderer.domElement.addEventListener('pointerup', (e) => { const z = zoneAt(e); if (z >= 0) opts.onPick!(zones[z]); });
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  return {
    update(selected) { selZone = selected ? zones.indexOf(selected) : -1; applyW(); draw(); },
    dispose() { ro.disconnect(); cancelAnimationFrame(raf); renderer.dispose(); geo.dispose(); mat.dispose(); renderer.domElement.remove(); },
  };
}
