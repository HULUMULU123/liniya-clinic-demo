// Анимации появления. Включаются только когда html.anim (нет prefers-reduced-motion); иначе сразу конечное состояние.
export function initReveal() {
  const root = document.documentElement;
  if (!root.classList.contains('anim')) return;

  // римские цифры и первый экран: маска по строкам
  document.querySelectorAll<HTMLElement>('.roman').forEach((r) => { r.innerHTML = `<span>${r.textContent}</span>`; });
  const targets = document.querySelectorAll<HTMLElement>('.sec-head h2,.sec-head .sub,.sec-head .kicker,.cards>li,.gloss-tools,.steps>li,.team>li,.faq,.contacts-grid>*:not(:first-child),.plan-sec,.map-grid,.addr,.sample-note');
  targets.forEach((t, i) => { t.classList.add('reveal'); t.style.setProperty('--rd', `${(i % 4) * 70}ms`); });

  const io = new IntersectionObserver((en) => en.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    io.unobserve(e.target);
  }), { threshold: 0.15 });
  document.querySelectorAll('.reveal,.sec,.sec-head').forEach((e) => io.observe(e));

  // титульный лист: заголовок по строкам, натюрморт прорисовывается
  requestAnimationFrame(() => document.getElementById('plate')?.classList.add('in', 'go'));
  const still = document.getElementById('still-life');
  if (still) {
    const items = [...still.querySelectorAll<SVGElement>('.ground,.item,.leaders')];
    items.forEach((g, i) => g.style.setProperty('--d', `${i * 160}ms`));
    still.querySelectorAll<SVGElement>('[fill]:not([fill="none"])').forEach((el) => el.style.setProperty('--fo', el.getAttribute('fill-opacity') ?? '1'));
    still.classList.add('draw');
  }

  // шкала «Как проходит визит» заполняется по прогрессу прокрутки
  const steps = document.querySelector<HTMLElement>('.steps');
  if (steps) {
    const fill = document.createElement('i');
    fill.className = 'steps-fill';
    fill.setAttribute('aria-hidden', 'true');
    steps.append(fill);
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = steps.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (innerHeight * 0.65 - r.top) / r.height));
      fill.style.transform = `scaleY(${p})`;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }
}

// линии лица прорисовываются при первом показе карты
export function drawFace(svgHost: HTMLElement) {
  if (!document.documentElement.classList.contains('anim')) return;
  svgHost.classList.add('face-draw');
  const io = new IntersectionObserver((en) => {
    if (!en[0].isIntersecting) return;
    io.disconnect();
    svgHost.classList.add('face-go');
  }, { threshold: 0.35 });
  io.observe(svgHost);
}
