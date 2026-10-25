export function initHeader() {
  const header = document.querySelector('.site-header');
  const onScroll = () => header?.classList.toggle('scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const links = [...document.querySelectorAll<HTMLAnchorElement>('.side-index a')];
  const secs = links.map((l) => document.getElementById(l.dataset.sec!)!).filter(Boolean);
  const io = new IntersectionObserver((en) => {
    en.forEach((e) => { if (e.isIntersecting) links.forEach((l) => l.classList.toggle('active', l.dataset.sec === e.target.id)); });
  }, { rootMargin: '-45% 0px -50% 0px' });
  secs.forEach((s) => io.observe(s));
}
