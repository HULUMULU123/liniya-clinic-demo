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
import { initReveal } from './components/reveal';
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
initReveal();
