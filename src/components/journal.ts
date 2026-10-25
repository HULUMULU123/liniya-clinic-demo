import journal from '../data/journal.json';
import { createDrawer } from '../ui/drawer';
import { spots } from './title-plate';

type Block = string | { h: string; p: string };

export function initJournal() {
  const drawer = createDrawer('Статья журнала', 'reader');
  document.getElementById('journal-list')!.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-article]');
    if (!btn) return;
    const a = journal.find((x) => x.id === btn.dataset.article)!;
    const body = (a.body as Block[]).map((b) => (typeof b === 'string' ? `<p>${b}</p>` : `<h3>${b.h}</h3><p>${b.p}</p>`)).join('');
    drawer.open(`<article class="article"><div class="spot" aria-hidden="true">${spots[a.spot]}</div><p class="kicker">${a.kicker} · ${a.readMin} мин чтения</p>
      <h2 tabindex="-1">${a.title}</h2><div class="prose">${body}</div>
      <p class="article-end">Это общая информация. Индивидуальные рекомендации даёт врач на консультации.</p>
      <p class="sample-note">Текст-образец. В рабочей версии материалы пишет и проверяет врач клиники.</p></article>`, btn);
  });
}
