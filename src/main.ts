import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import { initPlan } from './components/plan';
import { initFaceMap } from './components/face-map';
import { initMobileBar } from './components/mobile-bar';
import { initLists } from './components/lists';
import { initJournal } from './components/journal';
import { initGlossary } from './components/glossary';
import { initBooking } from './components/booking';
import { initWeather } from './components/weather';
import { initHeader } from './components/header';
import { config } from './config';

document.title = `${config.name} — демо сайта клиники`;
initLists();
initJournal();
initGlossary();
initPlan();
initFaceMap();
initMobileBar();
initBooking();
initHeader();
initWeather();

const root = document.documentElement;
const idle = (cb: () => void) => ((window as unknown as { requestIdleCallback?: (f: () => void) => void }).requestIdleCallback ?? ((f: () => void) => setTimeout(f, 200)))(cb);

// 3D-объекты и анимации грузим после первой отрисовки отдельными чанками
const later = () => {
  setTimeout(() => import('./components/fx').then((m) => m.initFx()).catch(() => undefined), 1800);
  if (root.classList.contains('anim')) {
    const giveUp = setTimeout(() => root.classList.remove('anim'), 6000);
    import('./components/motion').then((m) => { clearTimeout(giveUp); m.initMotion(); }).catch(() => root.classList.remove('anim'));
  }
};
// стартовые состояния: блоки секций скрыты до появления
if (root.classList.contains('anim')) {
  document.querySelectorAll<HTMLElement>('.sec .sub,.sec .kicker,.gloss-tools,.faq,.contacts-left>:not(h2),.book-wrap,.sample-note,.about-text,.about-in .btn,.svc-note,.plan-sec>*:not(h3),.side-col').forEach((t) => t.classList.add('reveal'));
}
if (document.readyState === 'complete') idle(later); else addEventListener('load', () => idle(later), { once: true });
