import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import { initPlan } from './components/plan';
import { initFaceMap } from './components/face-map';
import { initMobileBar } from './components/mobile-bar';
import { initTitlePlate } from './components/title-plate';
import { initLists } from './components/lists';
import { initJournal } from './components/journal';
import { initGlossary } from './components/glossary';
import { initWeather } from './components/weather';
import { initBooking } from './components/booking';
import { initHeader } from './components/header';
import { config } from './config';

// бумажное зерно: один раз на старте, едва заметная плитка 128×128
function grain() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d')!;
  const img = x.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 22;
  }
  x.putImageData(img, 0, 0);
  document.body.style.setProperty('--grain', `url(${c.toDataURL('image/png')})`);
}

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.classList.add('anim');
document.title = `${config.name} — демо сайта клиники`;
grain();
initTitlePlate();
initLists();
initJournal();
initGlossary();
initPlan();
initFaceMap();
initMobileBar();
initBooking();
initHeader();
initWeather();
// стартовые состояния для анимаций: римские цифры в маске, блоки секций скрыты до появления
if (document.documentElement.classList.contains('anim')) {
  document.querySelectorAll<HTMLElement>('.roman').forEach((r) => { r.innerHTML = `<span>${r.textContent}</span>`; });
  document.querySelectorAll<HTMLElement>('.sec-head .sub,.sec-head .kicker,.cards>li,.gloss-tools,.steps>li,.team>li,.faq,.contacts-grid>*:not(:first-child),.plan-sec,.map-grid,.addr,.sample-note').forEach((t) => t.classList.add('reveal'));
}
// анимации GSAP: отдельный чанк после загрузки; если не подгрузился, прячущие стили снимаются
const root = document.documentElement;
if (root.classList.contains('anim')) {
  const giveUp = setTimeout(() => root.classList.remove('anim'), 6000);
  const load = () => import('./components/motion').then((m) => { clearTimeout(giveUp); m.initMotion(); document.dispatchEvent(new Event('motion-ready')); }).catch(() => root.classList.remove('anim'));
  if (document.readyState === 'complete') load(); else addEventListener('load', load, { once: true });
}
