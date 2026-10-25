import journal from '../data/journal.json';
import { spots } from './title-plate';

export function initLists() {
  document.getElementById('journal-list')!.innerHTML = journal.map((a) =>
    `<li><button class="card" data-article="${a.id}"><span class="spot" aria-hidden="true">${spots[a.spot]}</span><span class="kicker">${a.kicker}</span><h3>${a.title}</h3><span class="card-meta">Читать ${a.readMin} мин</span><span class="card-go">Читать статью</span></button></li>`).join('');
}
