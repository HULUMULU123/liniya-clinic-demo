// GSAP-анимации «Атласа»: подгружается отдельным чанком после загрузки страницы.
// Плагины GSAP бесплатны, ключ не нужен (npm-пакет gsap). Первый экран анимируется на CSS и не ждёт этот чанк.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, SplitText, DrawSVGPlugin);

const root = document.documentElement;
const q = <T extends Element>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
let ready = false;

export function initMotion() {
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    root.classList.add('motion');
    ready = true;

    // 1. Титульная таблица: линии рисуются предмет за предметом, затем выносные линии и цифры
    const still = document.getElementById('still-life');
    const svg = still?.querySelector('svg');
    if (svg) {
      const groups = q<SVGGElement>('.ground,.item', svg);
      const leaders = svg.querySelector('.leaders')!;
      gsap.set(q('[pathLength]', svg), { drawSVG: '0%' });
      const filled = q<SVGElement>('[fill]:not([fill="none"])', svg).map((el) => [el, Number(el.getAttribute('fill-opacity') ?? 1)] as const);
      filled.forEach(([el]) => gsap.set(el, { fillOpacity: 0 }));
      gsap.set(q('circle:not([pathLength]),text', leaders), { opacity: 0 });
      still!.classList.add('ready');
      const tl = gsap.timeline({ delay: 0.5, defaults: { ease: 'power2.inOut' } });
      groups.forEach((g, i) => {
        const at = i * 0.5;
        tl.to(q('[pathLength]', g), { drawSVG: '0% 100%', duration: 2.6, stagger: 0.07 }, at);
      });
      filled.forEach(([el, o]) => tl.to(el, { fillOpacity: o, duration: 0.9, ease: 'power1.out' }, '>-0.8'));
      tl.addLabel('leaders', '>-0.4')
        .to(q('[pathLength]', leaders), { drawSVG: '0% 100%', duration: 0.9, stagger: 0.15, ease: 'power2.out' }, 'leaders')
        .to(q('circle:not([pathLength])', leaders), { opacity: 1, scale: 1, transformOrigin: '50% 50%', duration: 0.5, stagger: 0.15, ease: 'back.out(2)' }, 'leaders+=0.7')
        .to(q('text', leaders), { opacity: 1, duration: 0.4, stagger: 0.15 }, 'leaders+=0.8')
        .from('#still-legend li', { opacity: 0, x: -10, duration: 0.5, stagger: 0.1, ease: 'power2.out' }, 'leaders+=0.4');
    }

    // 1б. Титульный текст: слова проявляются волной, кнопки поднимаются
    const lead = document.querySelector<HTMLElement>('.plate-text .lead');
    if (lead) SplitText.create(lead, { type: 'words', autoSplit: true, onSplit: (self) => { gsap.set(lead, { opacity: 1 }); return gsap.from(self.words, { opacity: 0, y: 14, duration: 0.7, stagger: 0.05, ease: 'power3.out', delay: 0.5 }); } });
    gsap.to('.plate-text .kicker,.plate-text .actions,#obs', { opacity: 1, y: 0, duration: 0.9, stagger: 0.18, ease: 'power3.out', delay: 0.3, startAt: { y: 16 } });

    // 1в. Основные кнопки слегка тянутся за курсором
    if (matchMedia('(pointer: fine)').matches) {
      q<HTMLElement>('.btn-primary').forEach((btn) => {
        const x = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3' }), y = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3' });
        btn.addEventListener('pointermove', (e) => { const r = btn.getBoundingClientRect(); x(((e.clientX - r.left) / r.width - 0.5) * 10); y(((e.clientY - r.top) / r.height - 0.5) * 8); });
        btn.addEventListener('pointerleave', () => { x(0); y(0); });
      });
    }

    // 2. Римские цифры и заголовки: маска по строкам при входе в экран
    q('.roman > span').forEach((s) => gsap.fromTo(s, { yPercent: 110 }, { yPercent: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: s, start: 'top 90%', once: true } }));
    q<HTMLElement>('.sec-head h2').forEach((h) => {
      SplitText.create(h, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit(self) {
          gsap.set(h, { visibility: 'visible' });
          return gsap.from(self.lines, { yPercent: 110, duration: 1, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: h, start: 'top 90%', once: true } });
        },
      });
    });

    q<HTMLElement>('.sec-head .sub').forEach((p) => {
      p.classList.remove('reveal');
      SplitText.create(p, { type: 'words', autoSplit: true, onSplit: (self) => { gsap.set(p, { opacity: 1 }); return gsap.from(self.words, { opacity: 0, y: 10, duration: 0.6, stagger: 0.035, ease: 'power3.out', scrollTrigger: { trigger: p, start: 'top 92%', once: true } }); } });
    });

    // 3. Блоки секций
    gsap.set('.reveal', { y: 24 });
    ScrollTrigger.batch('.reveal', {
      start: 'top 90%', once: true,
      onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.09, overwrite: true }),
    });

    // 4. Разделители секций прорисовываются слева направо
    q<HTMLElement>('.sec:not(.plate-sec):not(.moss-sec)').forEach((s) => {
      const line = document.createElement('i');
      line.className = 'sec-line';
      line.setAttribute('aria-hidden', 'true');
      s.prepend(line);
      gsap.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: 'power3.inOut', scrollTrigger: { trigger: s, start: 'top 92%', once: true } });
    });

    // 5. Мелкие иллюстрации «вычерчиваются» при появлении
    q('.cards .spot, .team .spot').forEach((sp) => {
      const paths = q('[pathLength]', sp);
      gsap.fromTo(paths, { drawSVG: '0%' }, { drawSVG: '0% 100%', duration: 1.4, ease: 'power1.inOut', stagger: 0.08, scrollTrigger: { trigger: sp, start: 'top 92%', once: true } });
    });

    // 6. Шкала «Как проходит визит» заполняется по прокрутке
    const steps = document.querySelector<HTMLElement>('.steps');
    if (steps) {
      const fill = document.createElement('i');
      fill.className = 'steps-fill';
      fill.setAttribute('aria-hidden', 'true');
      steps.append(fill);
      q('.steps > li').forEach((li) => gsap.fromTo(li, { opacity: 0.3 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: li, start: 'top 80%', end: 'top 55%', scrub: true } }));
      gsap.fromTo(fill, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: steps, start: 'top 65%', end: 'bottom 65%', scrub: 0.4 } });
    }

    // 7. Плавный переход по якорям
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a || a.hasAttribute('data-book')) return;
      const id = a.getAttribute('href')!.slice(1);
      const el = id && document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      gsap.to(window, { duration: 1, ease: 'power3.inOut', scrollTo: { y: el, offsetY: 72 } });
      history.replaceState(null, '', `#${id}`);
    };
    document.addEventListener('click', onClick);

    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => { document.removeEventListener('click', onClick); root.classList.remove('motion'); };
  });
}

// Линии лица прорисовываются при первом показе карты, затем проявляются зоны
export function drawFace(host: HTMLElement) {
  const run = () => {
    const lines = q<SVGGeometryElement>('#face-lines path', host);
    const zones = q('g[id^="zone-"]', host);
    if (!lines.length) return;
    gsap.set(lines, { drawSVG: '0%' });
    gsap.set(zones, { opacity: 0 });
    host.classList.add('ready');
    ScrollTrigger.create({
      trigger: host, start: 'top 65%', once: true,
      onEnter: () => {
        const tl = gsap.timeline({ defaults: { ease: 'power1.inOut' } });
        lines.forEach((l, i) => tl.to(l, { drawSVG: '0% 100%', duration: 2.4 }, Math.min(i, 5) * 0.3));
        tl.to(zones, { opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power1.out' }, '>-0.6');
      },
    });
  };
  if (ready) run(); else document.addEventListener('motion-ready', run, { once: true });
}
