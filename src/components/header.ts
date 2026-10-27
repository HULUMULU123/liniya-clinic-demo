// Меню без плашки: белый текст с режимом difference читается на тёмных и светлых секциях; прячется при прокрутке вниз
export function initHeader() {
  const header = document.querySelector('.site-header');
  let last = scrollY;
  const onScroll = () => {
    const y = scrollY;
    header?.classList.toggle('scrolled', y > 24);
    header?.classList.toggle('hide', y > 240 && y > last + 4);
    if (y < last - 4) header?.classList.remove('hide');
    last = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('focusin', (e) => { if ((e.target as HTMLElement).closest('.site-header')) header?.classList.remove('hide'); });
  onScroll();
}
