import zones from '../data/zones.json';
import procedures from '../data/procedures.json';
import { store } from '../store';
import { plural, rub } from '../format';

type Proc = (typeof procedures)[number];
const countLabel = (n: number) => `${n} ${plural(n, 'процедура', 'процедуры', 'процедур')}`;

// Метки на портрете: точка на лице [x, y] и подпись-кнопка [x, y, сторона], всё в % от изображения 1000×960
const PINS: Record<string, { dot: [number, number]; label: [number, number]; side: 'l' | 'r' }> = {
  forehead: { dot: [47, 28], label: [5, 14], side: 'l' }, eyes: { dot: [62, 47], label: [95, 36], side: 'r' },
  cheeks: { dot: [37, 57], label: [4, 55], side: 'l' }, lips: { dot: [51.5, 58.5], label: [95, 66], side: 'r' },
  jawline: { dot: [50, 70], label: [8, 82], side: 'l' },
};

export function initFaceMap() {
  const portrait = document.getElementById('portrait')!;
  const panel = document.getElementById('zone-panel')!;
  const mq = matchMedia('(min-width:1024px)');
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('.zone-btn')];
  const glows = [...portrait.querySelectorAll<HTMLElement>('[data-glow]')];
  let selected: string | null = null;
  let hover: string | null = null;
  let opener: HTMLElement | null = null;

  const inZone = (z: string) => procedures.filter((p) => p.zone === z);
  const planCount = (z: string) => inZone(z).filter((p) => store.has(p.id)).length;
  const zoneName = (z: string) => zones.find((x) => x.id === z)!.name;
  const ariaLabel = (z: string) => `${zoneName(z)}, ${countLabel(inZone(z).length)}`;

  const pins = new Map<string, HTMLButtonElement>();
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'leaders'); svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
  portrait.append(svg);
  Object.entries(PINS).forEach(([id, p]) => {
    const [dx, dy] = p.dot, [lx, ly] = p.label;
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', String(dx)); line.setAttribute('y1', String(dy)); line.setAttribute('x2', String(lx)); line.setAttribute('y2', String(ly)); line.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.append(line);
    const dot = document.createElement('i'); dot.className = 'dot'; dot.style.left = `${dx}%`; dot.style.top = `${dy}%`; dot.setAttribute('aria-hidden', 'true'); portrait.append(dot);
    const b = document.createElement('button');
    b.className = `callout ${p.side}`; b.type = 'button'; b.dataset.zone = id; b.style.left = `${lx}%`; b.style.top = `${ly}%`;
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = `<span class="co-name">${zoneName(id)}</span><span class="co-n" aria-hidden="true"></span>`;
    b.addEventListener('click', () => toggle(id, b));
    b.addEventListener('pointerenter', () => { hover = id; paint(); });
    b.addEventListener('pointerleave', () => { hover = null; paint(); });
    portrait.append(b); pins.set(id, b);
  });
  buttons.forEach((b) => {
    b.addEventListener('click', () => toggle(b.dataset.zone!, b));
    b.addEventListener('pointerenter', () => { hover = b.dataset.zone!; paint(); });
    b.addEventListener('pointerleave', () => { hover = null; paint(); });
  });

  function toggle(id: string, from: HTMLElement) {
    if (selected === id) return close();
    opener = from; selected = id; render();
    if (!mq.matches) portrait.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  function close() { selected = null; render(); if (!mq.matches) opener?.focus(); }

  function paint() {
    glows.forEach((g) => { g.classList.toggle('on', g.dataset.glow === selected); g.classList.toggle('hov', g.dataset.glow === hover && hover !== selected); });
    pins.forEach((b, id) => {
      const on = id === selected, n = planCount(id);
      b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', ariaLabel(id));
      b.classList.toggle('is-selected', on); b.classList.toggle('has-count', n > 0);
      b.querySelector('.co-n')!.textContent = n ? String(n) : '';
    });
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.zone === selected)));
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
    paint();
    panel.classList.toggle('open', selected !== null);
    document.body.classList.toggle('sheet-open', selected !== null && !mq.matches);
    if (!selected) { panel.innerHTML = '<p class="panel-empty">Выберите зону на лице, и здесь появятся процедуры, цены и длительность.</p>'; return; }
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
    const focusId = (document.activeElement as HTMLElement | null)?.dataset?.proc;
    const had = selected;
    render();
    if (had && focusId) panel.querySelector<HTMLElement>(`[data-proc="${focusId}"]`)?.focus();
  });
}
