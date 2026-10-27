// GSAP-анимации: отдельный чанк после загрузки страницы. Плагины GSAP бесплатны (npm-пакет gsap).
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, SplitText, DrawSVGPlugin);

const root = document.documentElement;
const q = <T extends Element>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];

export function initMotion() {
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    root.classList.add('motion');

    // 1. Hero: слово ЛИНИЯ уходит вверх медленнее прокрутки, девочка и буквы «дышат» за курсором
    const hero = document.getElementById('top')!;
    gsap.to('.hero-word', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-girl', { yPercent: -4, scale: 1.04, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    if (matchMedia('(pointer: fine)').matches) {
      const gx = gsap.quickTo('.hero-girl', 'x', { duration: 0.9, ease: 'power3' }), gy = gsap.quickTo('.hero-girl', 'y', { duration: 0.9, ease: 'power3' });
      const wx = gsap.quickTo('.hero-word', 'x', { duration: 1.2, ease: 'power3' });
      const glow = gsap.quickTo('.hero-glow', 'x', { duration: 1.4, ease: 'power3' });
      hero.addEventListener('pointermove', (e) => {
        const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
        gx(nx * -24); gy(ny * -14); wx(nx * 36); glow(nx * 60);
      });
      // кнопки слегка тянутся за курсором
      q<HTMLElement>('.btn-grad,.btn-ghost').forEach((btn) => {
        const x = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3' }), y = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3' });
        btn.addEventListener('pointermove', (e) => { const r = btn.getBoundingClientRect(); x(((e as PointerEvent).clientX - r.left - r.width / 2) * 0.18); y(((e as PointerEvent).clientY - r.top - r.height / 2) * 0.3); });
        btn.addEventListener('pointerleave', () => { x(0); y(0); });
      });
    }
    gsap.from('.hero-left > *,.hero-right > *', { opacity: 0, y: 24, duration: 1, stagger: 0.12, delay: 0.7, ease: 'power3.out' });

    // 2. Бегущая строка: бесконечный цикл, ускоряется от скорости прокрутки
    const track = document.querySelector<HTMLElement>('#m-words .marquee-track');
    if (track) {
      const loop = gsap.to(track, { xPercent: -50, duration: 38, ease: 'none', repeat: -1 });
      ScrollTrigger.create({ onUpdate: (self) => { gsap.to(loop, { timeScale: 1 + Math.min(Math.abs(self.getVelocity()) / 350, 8) * (self.direction), duration: 0.3, overwrite: true }); gsap.to(loop, { timeScale: 1, duration: 1.2, delay: 0.3, overwrite: 'auto' }); } });
    }

    // 3. Галерея: плитки всплывают и плывут каждая со своей скоростью
    q<HTMLElement>('.tile').forEach((t) => {
      const sp = Number(t.dataset.speed || 0);
      gsap.from(t, { opacity: 0, scale: 0.8, rotate: (i: number) => i, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: t, start: 'top 92%', once: true } });
      gsap.fromTo(t, { y: sp * -260 }, { y: sp * 260, ease: 'none', scrollTrigger: { trigger: '#scatter', start: 'top bottom', end: 'bottom top', scrub: 0.8 } });
    });

    // 4. Заголовки: маска по строкам
    q<HTMLElement>('.display').forEach((h) => {
      SplitText.create(h, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit(self) {
          gsap.set(h, { visibility: 'visible' });
          return gsap.from(self.lines, { yPercent: 115, duration: 1.1, ease: 'power4.out', stagger: 0.1, scrollTrigger: { trigger: h, start: 'top 90%', once: true } });
        },
      });
    });

    // 5. «О клинике»: слова проявляются по прокрутке
    const about = document.querySelector<HTMLElement>('.about-text');
    if (about) {
      about.classList.remove('reveal');
      SplitText.create(about, { type: 'words', aria: 'none', autoSplit: true, onSplit(self) { gsap.set(about, { opacity: 1 }); return gsap.from(self.words, { opacity: 0, y: 24, duration: 0.8, stagger: 0.045, ease: 'power3.out', scrollTrigger: { trigger: about, start: 'top 85%', once: true } }); } });
    }

    // 6. Блоки секций пачками
    gsap.set('.reveal', { y: 30 });
    ScrollTrigger.batch('.reveal', { start: 'top 92%', once: true, onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.09, overwrite: true }) });

    // 7. Курсы: на широком экране секция закрепляется и слайды плывут по горизонтали
    const hmm = gsap.matchMedia();
    hmm.add('(min-width: 900px)', () => {
      const pin = document.getElementById('hpin'), track = document.getElementById('stack');
      if (!pin || !track) return;
      const dist = () => track.scrollWidth - pin.clientWidth;
      gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: pin, start: 'top 12%', end: () => `+=${dist()}`, pin: true, scrub: 0.7, invalidateOnRefresh: true, anticipatePin: 1 } });
      q('.slide-art figure').forEach((f, i) => gsap.to(f, { y: i % 2 ? 14 : -14, duration: 3 + i * 0.4, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
      gsap.utils.toArray<HTMLElement>('.pno').forEach((n) => gsap.to(n, { x: 60, ease: 'none', scrollTrigger: { trigger: pin, start: 'top 12%', end: () => `+=${dist()}`, scrub: true } }));
    });

    // 8. Услуги: строки проявляются из размытия по мере прокрутки, затем уходят вверх
    q<HTMLElement>('.svc-row').forEach((row) => {
      gsap.fromTo(row, { opacity: 0.15, filter: 'blur(10px)', y: 40 }, { opacity: 1, filter: 'blur(0px)', y: 0, ease: 'none', scrollTrigger: { trigger: row, start: 'top 96%', end: 'top 62%', scrub: true } });
      gsap.to(row, { opacity: 0.2, filter: 'blur(6px)', ease: 'none', scrollTrigger: { trigger: row, start: 'bottom 28%', end: 'bottom 6%', scrub: true } });
    });

    // 9. Журнал: карточки выплывают и дрейфуют с разной скоростью
    q<HTMLElement>('.c-item').forEach((c) => {
      const sp = Number(c.dataset.speed || 0);
      gsap.from(c, { opacity: 0, y: 80, rotate: 6, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: c, start: 'top 94%', once: true } });
      gsap.to(c, { y: sp * -220, ease: 'none', scrollTrigger: { trigger: '#journal-rows', start: 'top bottom', end: 'bottom top', scrub: 0.8 } });
    });

    // 9б. Карта лица: линии рисуются, подписи выпрыгивают, портрет медленно дрейфует
    const portrait = document.getElementById('portrait');
    if (portrait) {
      const lines = q<SVGLineElement>('.leaders line', portrait), labels = q('.callout', portrait), dots = q('.dot', portrait);
      gsap.set(lines, { drawSVG: '0%' }); gsap.set(labels, { opacity: 0, scale: 0.7 }); gsap.set(dots, { scale: 0 });
      gsap.timeline({ scrollTrigger: { trigger: portrait, start: 'top 70%', once: true }, defaults: { ease: 'power3.out' } })
        .to(dots, { scale: 1, duration: 0.5, stagger: 0.12, ease: 'back.out(3)' })
        .to(lines, { drawSVG: '0% 100%', duration: 0.9, stagger: 0.12 }, '<0.1')
        .to(labels, { opacity: 1, scale: 1, duration: 0.7, stagger: 0.12, ease: 'back.out(1.8)' }, '<0.5');
      gsap.to('#portrait > img', { y: -36, ease: 'none', scrollTrigger: { trigger: portrait, start: 'top bottom', end: 'bottom top', scrub: true } });
    }

    // 10. Подвал: контурное слово ЛИНИЯ вырастает
    gsap.from('.foot-grid > *', { yPercent: 25, opacity: 0, duration: 1.1, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '.site-footer', start: 'top 92%', once: true } });

    // 11. Плавный переход по якорям
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a || a.hasAttribute('data-book')) return;
      const id = a.getAttribute('href')!.slice(1);
      const el = id && document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      gsap.to(window, { duration: 1.1, ease: 'power3.inOut', scrollTo: { y: el, offsetY: 64 } });
      history.replaceState(null, '', `#${id}`);
    };
    document.addEventListener('click', onClick);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => { document.removeEventListener('click', onClick); root.classList.remove('motion'); };
  });
}
