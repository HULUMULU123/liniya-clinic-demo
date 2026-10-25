import faceSvg from '../assets/face-base.svg?raw';
import zones from '../data/zones.json';
import procedures from '../data/procedures.json';
import { store } from '../store';
import { plural, rub } from '../format';

type Proc = (typeof procedures)[number];
const countLabel = (n: number) => `${n} ${plural(n, 'процедура', 'процедуры', 'процедур')}`;

interface View { update(): void }

export function initFaceMap() {
  const faceEl = document.getElementById('face-fig')!;
  const panel = document.getElementById('zone-panel')!;
  const mq = matchMedia('(min-width:1024px)');
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('.zone-btn')];
  let selected: string | null = null;
  let opener: HTMLElement | SVGElement | null = null;
  let view: View = { update() {} };

  const inZone = (z: string) => procedures.filter((p) => p.zone === z);
  const planCount = (z: string) => inZone(z).filter((p) => store.has(p.id)).length;
  const zoneName = (z: string) => zones.find((x) => x.id === z)!.name;
  const ariaLabel = (z: string) => `${zoneName(z)}, ${countLabel(inZone(z).length)}`;

  // запасной вариант: линейная SVG-иллюстрация (без WebGL)
  function svgView(): View {
    faceEl.classList.remove('is-3d');
    faceEl.innerHTML = faceSvg;
    if (document.documentElement.classList.contains('anim')) import('./motion').then((m) => m.drawFace(faceEl));
    const groups = new Map<string, SVGGElement>();
    faceEl.querySelectorAll<SVGGElement>('g[id^="zone-"]').forEach((g) => {
      const id = g.id.replace('zone-', '');
      groups.set(id, g);
      g.setAttribute('role', 'button');
      g.setAttribute('tabindex', '0');
      g.setAttribute('aria-pressed', 'false');
      const pin = g.querySelector('.zone-pin')!;
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('class', 'zone-count');
      t.setAttribute('x', pin.getAttribute('cx')!);
      t.setAttribute('y', pin.getAttribute('cy')!);
      t.setAttribute('aria-hidden', 'true');
      g.append(t);
      g.addEventListener('click', () => toggle(id, g));
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(id, g); } });
    });
    return {
      update() {
        groups.forEach((g, id) => {
          const on = id === selected, n = planCount(id);
          g.setAttribute('aria-pressed', String(on));
          g.setAttribute('aria-label', ariaLabel(id));
          g.classList.toggle('is-selected', on);
          g.classList.toggle('has-pin', on || n > 0);
          g.querySelector('.zone-count')!.textContent = n ? String(n) : '';
        });
      },
    };
  }

  // 3D-голова: Three.js грузится отдельным чанком, метки зон остаются настоящими кнопками
  async function mount3d(): Promise<View | null> {
    const { createFace3D } = await import('./face3d');
    faceEl.innerHTML = '';
    faceEl.classList.add('is-3d');
    const pins = new Map<string, HTMLButtonElement>();
    zones.filter((z) => z.id !== 'skin').forEach((z) => {
      const b = document.createElement('button');
      b.className = 'pin3d';
      b.type = 'button';
      b.dataset.zone = z.id;
      b.setAttribute('aria-pressed', 'false');
      b.innerHTML = '<span class="pin3d-dot"><span class="pin3d-n" aria-hidden="true"></span></span>';
      b.addEventListener('click', () => toggle(z.id, b));
      faceEl.append(b);
      pins.set(z.id, b);
    });
    const f3 = createFace3D(faceEl, {
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      onPick: (z) => toggle(z, pins.get(z)!),
      onProject: (z, x, y) => { const b = pins.get(z)!; b.style.left = `${x}%`; b.style.top = `${y}%`; },
    });
    if (!f3) { faceEl.querySelectorAll('.pin3d').forEach((e) => e.remove()); return null; }
    return {
      update() {
        f3.update(selected);
        pins.forEach((b, id) => {
          const on = id === selected, n = planCount(id);
          b.setAttribute('aria-pressed', String(on));
          b.setAttribute('aria-label', ariaLabel(id));
          b.classList.toggle('is-selected', on);
          b.classList.toggle('has-count', n > 0);
          b.querySelector('.pin3d-n')!.textContent = n ? String(n) : '';
        });
      },
    };
  }

  buttons.forEach((b) => b.addEventListener('click', () => toggle(b.dataset.zone!, b)));

  function toggle(id: string, from: HTMLElement | SVGElement) {
    if (selected === id) return close();
    opener = from;
    selected = id;
    render();
    if (!mq.matches) faceEl.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  function close() {
    selected = null;
    render();
    if (!mq.matches) opener?.focus();
  }

  function card(p: Proc) {
    const inPlan = store.has(p.id);
    const course = p.sessions > 1 ? `<p class="proc-course">Курс: ${p.sessions} визита, интервал ${p.intervalDays} дней</p>` : '';
    return `<li class="proc"><h4>${p.name}</h4><p class="muted">${p.desc}</p>
      <dl class="proc-meta"><div><dt class="sr-only">Цена</dt><dd class="price proc-price">от ${rub(p.priceFrom)} <span>${p.unit}</span></dd></div>
      <div><dt>Длительность</dt><dd>${p.durationMin} мин</dd></div><div><dt>Восстановление</dt><dd>${p.recovery}</dd></div></dl>${course}
      <button class="btn ${inPlan ? 'btn-secondary' : 'btn-primary'} btn-sm" data-proc="${p.id}" aria-pressed="${inPlan}">${inPlan ? 'Убрать из плана' : 'Добавить в план'}</button></li>`;
  }

  function render() {
    view.update();
    zones.forEach((z) => buttons.find((b) => b.dataset.zone === z.id)?.setAttribute('aria-pressed', String(z.id === selected)));
    panel.classList.toggle('open', selected !== null);
    document.body.classList.toggle('sheet-open', selected !== null && !mq.matches);
    if (!selected) { panel.innerHTML = '<p class="muted panel-empty">Выберите зону, и здесь появятся процедуры, цены и длительность.</p>'; return; }
    panel.innerHTML = `<div class="panel-head"><h3 id="panel-title" tabindex="-1">${zoneName(selected)}</h3><button class="panel-close" aria-label="Закрыть">×</button></div>
      <ul class="procs">${inZone(selected).map(card).join('')}</ul><p class="muted note">Цены условные, демо</p>`;
    panel.querySelector('.panel-close')!.addEventListener('click', close);
    panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap');
    if (!mq.matches) (panel.querySelector('.panel-close') as HTMLElement).focus();
  }

  panel.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-proc]');
    if (!b) return;
    const id = b.dataset.proc!;
    store.has(id) ? store.remove(id) : store.add(id);
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && selected) close(); });
  mq.addEventListener('change', render);
  document.addEventListener('select-zone', (e) => {
    const z = (e as CustomEvent).detail.zone as string;
    document.getElementById('face')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (selected !== z) { opener = buttons.find((b) => b.dataset.zone === z) ?? null; selected = z; render(); }
  });
  store.subscribe(() => {
    // перерисовываем панель на месте, не теряя фокус на нажатой кнопке
    const focusId = (document.activeElement as HTMLElement | null)?.dataset?.proc;
    const had = selected;
    render();
    if (had && focusId) panel.querySelector<HTMLElement>(`[data-proc="${focusId}"]`)?.focus();
  });
  render();

  // 3D подгружаем, когда карта близко к экрану; без WebGL остаётся SVG
  const start = async () => {
    try { view = (await mount3d()) ?? svgView(); } catch { view = svgView(); }
    render();
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { io.disconnect(); start(); } }, { rootMargin: '600px' });
    io.observe(faceEl);
  } else start();
}
