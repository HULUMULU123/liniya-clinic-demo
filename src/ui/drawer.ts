// Выдвижная панель с захватом фокуса, закрытием по Esc и возвратом фокуса на кнопку-источник.
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

export interface Drawer { open(html: string, opener?: HTMLElement | null): HTMLElement; close(): void; el: HTMLElement; isOpen(): boolean }

export function createDrawer(label: string, cls = ''): Drawer {
  const root = document.createElement('div');
  root.className = `drawer-root ${cls}`;
  root.hidden = true;
  root.innerHTML = `<div class="drawer-backdrop"></div><aside class="drawer" role="dialog" aria-modal="true" aria-label="${label}"><button class="drawer-close" aria-label="Закрыть">×</button><div class="drawer-body"></div></aside>`;
  document.body.append(root);
  const panel = root.querySelector<HTMLElement>('.drawer')!;
  const body = root.querySelector<HTMLElement>('.drawer-body')!;
  let opener: HTMLElement | null = null;
  let open = false;

  const keys = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
    if (e.key !== 'Tab') return;
    const f = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  function close() {
    if (!open) return;
    open = false;
    root.classList.remove('open');
    document.body.classList.remove('drawer-open');
    document.removeEventListener('keydown', keys, true);
    setTimeout(() => { if (!open) root.hidden = true; }, 380);
    opener?.focus();
  }
  root.querySelector('.drawer-close')!.addEventListener('click', close);
  root.querySelector('.drawer-backdrop')!.addEventListener('click', close);
  return {
    el: body,
    isOpen: () => open,
    close,
    open(html, from) {
      opener = from ?? (document.activeElement as HTMLElement | null);
      body.innerHTML = html;
      root.hidden = false;
      open = true;
      requestAnimationFrame(() => root.classList.add('open'));
      document.body.classList.add('drawer-open');
      document.addEventListener('keydown', keys, true);
      panel.scrollTop = 0;
      setTimeout(() => (body.querySelector<HTMLElement>('[data-autofocus]') ?? panel.querySelector<HTMLElement>('.drawer-close')!).focus(), 60);
      return body;
    },
  };
}
