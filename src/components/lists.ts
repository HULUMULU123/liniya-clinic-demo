import journal from '../data/journal.json';
import procedures from '../data/procedures.json';
import glossary from '../data/glossary.json';
import plans from '../data/plans.json';
import services from '../data/services.json';
import { store } from '../store';
import { rub } from '../format';
import { tileSize, tileUrl } from '../gallery';

const img = (name: string, alt = '', cls = '') => { const [w, h] = tileSize(name); return `<img${cls ? ` class="${cls}"` : ''} src="${tileUrl(name)}" width="${w}" height="${h}" alt="${alt}" loading="lazy" decoding="async">`; };
const byId = new Map(procedures.map((p) => [p.id, p]));
const sum = (ids: string[]) => ids.reduce((s, id) => s + byId.get(id)!.priceFrom * byId.get(id)!.sessions, 0);

export function initLists() {
  // бегущая строка с ингредиентами и процедурами
  const words = glossary.map((g) => g.term).join('</span><i>✦</i><span>');
  document.querySelector('#m-words .marquee-track')!.innerHTML = `<span>${words}</span><i>✦</i>`.repeat(2);

  // галерея: свободная россыпь плиток, каждая плывёт со своей скоростью
  const layout: [string, number, number, number, number, number, number, number, number][] = [
    // имя, left, top, width, угол (десктоп, %), left, top, width, угол (телефон, %)
    ['t2', 3, 1, 30, -3, 3, 0, 56, -3], ['t1', 37, 9, 16, 4, 62, 3.5, 34, 4], ['t4', 57, 0, 26, 2, 12, 16, 62, 2], ['t5', 85, 13, 13, -5, 66, 22, 30, -5],
    ['t3', 9, 36, 17, 5, 4, 36, 38, 5], ['t6', 29, 43, 28, -2, 30, 46, 64, -2], ['t7', 63, 37, 16, 3, 56, 63, 38, 3],
    ['t8', 79, 50, 19, -4, 4, 70, 56, -4], ['t9', 40, 76, 15, 4, 62, 84, 32, 4], ['t10', 8, 74, 26, -3, 8, 92, 60, -3],
  ];
  document.getElementById('scatter')!.innerHTML = layout.map(([n, l, t, w, r, ml, mt, mw, mr], i) =>
    `<figure class="tile" data-speed="${((i * 37) % 7 - 3) / 8}" style="--l:${l}%;--t:${t}%;--w:${w}%;--r:${r}deg;--ml:${ml}%;--mt:${mt}%;--mw:${mw}%;--mr:${mr}deg">${img(n)}</figure>`).join('');

  // услуги: нумерованный список
  document.getElementById('svc-list')!.innerHTML = services.map((s) =>
    `<li class="svc-row"><a href="#${s.go}"><span class="no">${s.no}</span><span class="txt"><span class="nm">${s.title}</span><span class="bl">${s.text}</span></span><span class="pr price">от ${rub(s.price)}</span></a></li>`).join('');

  // курсы: широкие слайды, листаются по горизонтали при прокрутке
  document.getElementById('stack')!.innerHTML = plans.map((p) => `<article class="slide">
    <div class="slide-text"><span class="pno" aria-hidden="true">${p.no}</span><h3>${p.title}</h3>
      <p class="muted stack-blurb">${p.blurb}</p>
      <ul class="chips-row">${p.items.map((id) => `<li>${byId.get(id)!.name}</li>`).join('')}</ul>
      <p class="slide-price price">от ${rub(sum(p.items) + 2000)}<small> с консультацией, цены условные, демо</small></p>
      <button class="btn btn-grad" data-add-plan="${p.id}">Добавить в план</button></div>
    <div class="slide-art"><figure class="a-main">${img(p.tiles[0])}</figure><figure class="a-b">${img(p.tiles[1])}</figure><figure class="a-c">${img(p.tiles[2])}</figure></div></article>`).join('');
  const syncPlans = (ids: string[]) => plans.forEach((p) => {
    const b = document.querySelector<HTMLElement>(`[data-add-plan="${p.id}"]`);
    if (b) b.textContent = p.items.every((x) => ids.includes(x)) ? 'Убрать из плана' : 'Добавить в план';
  });
  store.subscribe(syncPlans);
  document.getElementById('stack')!.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-add-plan]');
    if (!b) return;
    const p = plans.find((x) => x.id === b.dataset.addPlan)!;
    const all = p.items.every((x) => store.has(x));
    p.items.forEach((x) => (all ? store.remove(x) : store.add(x)));
  });

  // журнал: карточки россыпью, плывут с разной скоростью
  document.getElementById('journal-rows')!.innerHTML = journal.map((a, i) => {
    const first = (a.body as (string | { p: string })[]).map((b) => (typeof b === 'string' ? b : b.p))[0];
    const snip = first.length > 130 ? `${first.slice(0, 127)}…` : first;
    return `<li class="c-item" data-speed="${[0.18, -0.12, 0.3, -0.2][i % 4]}" style="--o:${[0, 70, 20, 110][i % 4]}px;--r:${[-2, 2, 1.5, -2.5][i % 4]}deg"><button class="t-card" data-article="${a.id}"><span class="t-top"><span class="avatar" style="background-image:url(${tileUrl(a.tile)})"></span><span class="t-by"><b>${a.kicker}</b><span>Читать ${a.readMin} мин</span></span></span><span class="t-text">${a.title}</span><span class="t-snip">${snip}</span></button></li>`;
  }).join('');

  document.getElementById('svc-list')!.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    if (a && a.getAttribute('href') === '#face') document.getElementById('face')?.scrollIntoView({ behavior: 'smooth' });
  });
}
