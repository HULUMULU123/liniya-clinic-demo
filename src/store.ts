import procedures from './data/procedures.json';

type Listener = (plan: string[]) => void;

const KEY = 'liniya-plan';
const valid = new Set(procedures.map((p) => p.id));
const clean = (ids: string[]) => [...new Set(ids)].filter((id) => valid.has(id));

const fromHash = () => {
  const m = location.hash.match(/^#plan=(.*)$/);
  return m ? clean(decodeURIComponent(m[1]).split(',')) : null;
};
const fromStorage = () => {
  try { return clean(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { return []; }
};

let plan: string[] = fromHash() ?? fromStorage();
const listeners = new Set<Listener>();

const persist = () => {
  try { localStorage.setItem(KEY, JSON.stringify(plan)); } catch { /* страница работает без хранилища */ }
  try {
    if (plan.length) history.replaceState(null, '', `#plan=${plan.join(',')}`);
    else if (location.hash.startsWith('#plan=')) history.replaceState(null, '', location.pathname + location.search);
  } catch { /* file:// и т.п. */ }
};
const emit = () => { persist(); listeners.forEach((l) => l([...plan])); };
const same = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

export const store = {
  get: () => [...plan],
  has: (id: string) => plan.includes(id),
  add(id: string) { if (valid.has(id) && !plan.includes(id)) { plan = [...plan, id]; emit(); } },
  remove(id: string) { if (plan.includes(id)) { plan = plan.filter((x) => x !== id); emit(); } },
  clear() { if (plan.length) { plan = []; emit(); } },
  subscribe(fn: Listener) { listeners.add(fn); fn([...plan]); return () => listeners.delete(fn); },
};

// ссылка с планом, открытая в уже загруженной вкладке
addEventListener('hashchange', () => {
  const h = fromHash();
  if (h && !same(h, plan)) { plan = h; emit(); }
});
