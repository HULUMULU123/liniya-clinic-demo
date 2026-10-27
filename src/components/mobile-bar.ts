import { plural, rub } from '../format';

export function initMobileBar() {
  const bar = document.getElementById('mobile-bar')!;
  const info = bar.querySelector<HTMLElement>('[data-info]')!;
  let has = false, inHero = true;
  const sync = () => {
    const show = has && !inHero;
    bar.classList.toggle('show', show);
    bar.toggleAttribute('inert', !show);
    document.body.classList.toggle('has-bar', show);
  };
  document.addEventListener('plan-change', (e) => {
    const { count, total } = (e as CustomEvent).detail as { count: number; total: number };
    has = count > 0;
    info.textContent = `План: ${count} ${plural(count, 'процедура', 'процедуры', 'процедур')} · от ${rub(total)}`;
    sync();
  });
  const hero = document.getElementById('top')!;
  new IntersectionObserver((en) => { inHero = en[0].intersectionRatio > 0.5; sync(); }, { threshold: [0, 0.6, 1] }).observe(hero);
}
