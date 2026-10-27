import glossary from '../data/glossary.json';
import procedures from '../data/procedures.json';
import { store } from '../store';

const kinds = ['все', 'процедура', 'ингредиент', 'термин'];
const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е');

export function initGlossary() {
  const list = document.getElementById('gloss-list')!;
  const q = document.getElementById('gloss-q') as HTMLInputElement;
  const chips = document.getElementById('gloss-kinds')!;
  const count = document.getElementById('gloss-count')!;
  let kind = 'все';
  chips.innerHTML = kinds.map((k) => `<button type="button" class="chip" data-kind="${k}" aria-pressed="${k === kind}">${k[0].toUpperCase() + k.slice(1)}</button>`).join('');

  const render = () => {
    const needle = norm(q.value.trim());
    const items = [...glossary]
      .filter((g) => (kind === 'все' || g.kind === kind) && (!needle || norm(g.term + ' ' + g.short).includes(needle)))
      .sort((a, b) => a.term.localeCompare(b.term, 'ru'));
    count.textContent = items.length ? `Найдено записей: ${items.length}` : 'Ничего не найдено. Попробуйте другое слово или сбросьте фильтр.';
    list.innerHTML = items.map((g) => {
      const proc = (g as { proc?: string }).proc;
      const p = proc ? procedures.find((x) => x.id === proc) : null;
      const inPlan = proc ? store.has(proc) : false;
      const acts = [
        g.links.length ? `<button class="btn btn-line btn-sm" data-zone-go="${g.links[0]}">Показать на карте</button>` : '',
        p ? `<button class="btn ${inPlan ? 'btn-secondary' : 'btn-primary'} btn-sm" data-add="${p.id}" aria-pressed="${inPlan}">${inPlan ? 'Убрать из плана' : 'Добавить в план'}</button>` : '',
      ].join('');
      return `<li><h3>${g.term} <span class="kind">${g.kind}</span></h3><p>${g.short}</p>${acts ? `<div class="gloss-acts">${acts}</div>` : ''}</li>`;
    }).join('');
  };
  q.addEventListener('input', render);
  chips.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-kind]');
    if (!b) return;
    kind = b.dataset.kind!;
    chips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String((c as HTMLElement).dataset.kind === kind)));
    render();
  });
  list.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const z = t.closest<HTMLElement>('[data-zone-go]');
    if (z) document.dispatchEvent(new CustomEvent('select-zone', { detail: { zone: z.dataset.zoneGo } }));
    const a = t.closest<HTMLElement>('[data-add]');
    if (a) store.has(a.dataset.add!) ? store.remove(a.dataset.add!) : store.add(a.dataset.add!);
  });
  store.subscribe(() => {
    const f = (document.activeElement as HTMLElement | null)?.dataset?.add;
    render();
    if (f) list.querySelector<HTMLElement>(`[data-add="${f}"]`)?.focus();
  });
}
