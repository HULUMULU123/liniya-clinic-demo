import procedures from '../data/procedures.json';
import { config } from '../config';
import { store } from '../store';
import { plural, rub } from '../format';

type Proc = (typeof procedures)[number];
const byId = new Map(procedures.map((p) => [p.id, p]));
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

export const planTotal = (ids: string[]) =>
  config.consultation.priceFrom + ids.reduce((s, id) => s + byId.get(id)!.priceFrom * byId.get(id)!.sessions, 0);

interface Node { day: number; items: string[] }
export function buildTimeline(ids: string[]): Node[] {
  const days = new Map<number, string[]>([[0, [config.consultation.name]]]);
  const put = (d: number, t: string) => days.set(d, [...(days.get(d) ?? []), t]);
  let control = 0;
  ids.map((id) => byId.get(id)!).forEach((p: Proc) => {
    for (let s = 0; s < p.sessions; s++) put(s * p.intervalDays, p.sessions > 1 ? `${p.name} (${s + 1} из ${p.sessions})` : p.name);
    control = Math.max(control, (p.sessions - 1) * p.intervalDays + p.followUpDays);
  });
  if (ids.length) put(control, 'Контроль');
  return [...days].sort((a, b) => a[0] - b[0]).map(([day, items]) => ({ day, items }));
}
const dayLabel = (d: number) => (d === 0 ? 'день 0' : `через ${d} ${plural(d, 'день', 'дня', 'дней')}`);

export function initPlan() {
  const box = document.getElementById('plan-box')!;
  const full = document.getElementById('plan-full')!;
  const live = document.getElementById('plan-live')!;
  let shown = config.consultation.priceFrom;
  let raf = 0, liveTimer = 0;

  const totalHtml = (ids: string[]) => `<p class="plan-total"><span class="total-line">от <strong class="price" data-total>${rub(shown)}</strong></span> <span class="muted">· цены условные, демо</span></p>`;
  const actions = (ids: string[]) => `<div class="plan-actions">
      <button class="btn btn-primary" data-act="book">Записаться с этим планом</button>
      <button class="btn btn-secondary" data-act="copy">Скопировать ссылку</button>
      ${typeof navigator.share === 'function' ? '<button class="btn btn-secondary" data-act="share">Поделиться</button>' : ''}
      <button class="btn btn-quiet" data-act="clear">Очистить</button></div>`;
  const empty = `<p class="muted">Выберите зону на карте, и здесь появится ваш план</p><a class="btn btn-secondary" href="#map">Выбрать зону</a>`;

  function listHtml(ids: string[]) {
    const row = (name: string, price: number, note: string, id?: string) =>
      `<li class="plan-row"><div><span class="plan-name">${name}</span>${note ? `<span class="muted plan-note">${note}</span>` : ''}</div>
       <span class="price plan-price">от ${rub(price)}</span>${id ? `<button class="plan-remove" data-remove="${id}" aria-label="Убрать из плана: ${name}">Убрать</button>` : '<span></span>'}</li>`;
    return `<ul class="plan-list">${row(config.consultation.name, config.consultation.priceFrom, '')}${ids.map((id) => {
      const p = byId.get(id)!;
      return row(p.name, p.priceFrom * p.sessions, p.sessions > 1 ? `курс из ${p.sessions} визитов, ${rub(p.priceFrom)} за визит` : '', p.id);
    }).join('')}</ul>`;
  }

  function timelineHtml(ids: string[]) {
    const nodes = buildTimeline(ids);
    return `<ol class="timeline" style="--n:${nodes.length}"><li class="tl-line" aria-hidden="true"></li>${nodes.map((n, i) =>
      `<li class="tl-node" style="--i:${i}"><span class="tl-dot" aria-hidden="true"></span><strong>${dayLabel(n.day)}</strong><ul>${n.items.map((t) => `<li>${t}</li>`).join('')}</ul></li>`).join('')}</ol>`;
  }

  function animateTotal(to: number) {
    cancelAnimationFrame(raf);
    const els = document.querySelectorAll<HTMLElement>('[data-total]');
    const from = shown;
    const done = () => { shown = to; els.forEach((e) => (e.textContent = rub(to))); clearTimeout(liveTimer); liveTimer = window.setTimeout(() => (live.textContent = `Итого от ${rub(to)}, цены условные, демо`), 150); };
    if (reduced.matches || from === to) return done();
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 600), e = 1 - Math.pow(1 - k, 3);
      const v = Math.round(from + (to - from) * e);
      els.forEach((el) => (el.textContent = rub(v)));
      if (k < 1) raf = requestAnimationFrame(step); else done();
    };
    raf = requestAnimationFrame(step);
  }

  let prevIds: string[] = [];
  store.subscribe((ids) => {
    const target = planTotal(ids);
    const has = ids.length > 0;
    box.innerHTML = `<h3>План визита</h3>${has ? `${listHtml(ids)}${totalHtml(ids)}${actions(ids)}` : empty}`;
    full.innerHTML = has
      ? `${totalHtml(ids)}${timelineHtml(ids)}${actions(ids)}`
      : `<p class="muted">Пока в плане нет процедур.</p><a class="btn btn-secondary" href="#map">Выбрать зону</a>`;
    box.classList.toggle('has-items', has);
    const added = ids.find((id) => !prevIds.includes(id));
    if (added) box.querySelector(`[data-remove="${added}"]`)?.closest('.plan-row')?.classList.add('is-new');
    prevIds = ids;
    animateTotal(target);
    document.dispatchEvent(new CustomEvent('plan-change', { detail: { count: ids.length, total: target } }));
  });

  const flash = (btn: HTMLElement, text: string) => {
    const old = btn.textContent;
    btn.textContent = text;
    setTimeout(() => { if (btn.isConnected) btn.textContent = old; }, 2000);
  };
  document.addEventListener('click', async (e) => {
    const t = e.target as HTMLElement;
    const rm = t.closest<HTMLElement>('[data-remove]');
    if (rm) return store.remove(rm.dataset.remove!);
    const btn = t.closest<HTMLElement>('[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === 'clear') store.clear();
    if (act === 'book') document.dispatchEvent(new CustomEvent('open-booking', { detail: { opener: btn } }));
    if (act === 'copy') {
      try { await navigator.clipboard.writeText(location.href); flash(btn, 'Ссылка скопирована'); }
      catch { const i = document.createElement('input'); i.value = location.href; document.body.append(i); i.select(); try { document.execCommand('copy'); flash(btn, 'Ссылка скопирована'); } catch { flash(btn, 'Скопируйте из адресной строки'); } i.remove(); }
    }
    if (act === 'share') { try { await navigator.share({ title: `${config.name}: мой план визита`, url: location.href }); } catch { /* закрыли окно */ } }
  });
}
