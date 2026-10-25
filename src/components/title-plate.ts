import still from '../assets/plates/still-life.svg?raw';
import snowflake from '../assets/spots/snowflake.svg?raw';
import label from '../assets/spots/label.svg?raw';
import list from '../assets/spots/list.svg?raw';
import seasons from '../assets/spots/seasons.svg?raw';
import dropper from '../assets/spots/dropper.svg?raw';
import lens from '../assets/spots/lens.svg?raw';
import quill from '../assets/spots/quill.svg?raw';

export const spots: Record<string, string> = { snowflake, label, list, seasons, dropper, lens, quill };

export function initTitlePlate() {
  const host = document.getElementById('still-life')!;
  host.innerHTML = still;
  const legend = [...document.querySelectorAll<HTMLElement>('#still-legend li')];
  const items = [...host.querySelectorAll<SVGGElement>('.item[data-n]')];
  const set = (n: string | null) => {
    legend.forEach((l) => l.classList.toggle('on', l.dataset.n === n));
    items.forEach((i) => i.classList.toggle('on', i.dataset.n === n));
  };
  [...items, ...legend].forEach((el) => {
    el.addEventListener('pointerenter', () => set((el as HTMLElement | SVGElement).getAttribute('data-n')));
    el.addEventListener('pointerleave', () => set(null));
  });
  document.querySelectorAll<HTMLElement>('[data-spot]').forEach((s) => (s.innerHTML = spots[s.dataset.spot!]));
}
