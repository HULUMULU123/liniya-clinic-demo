import { config } from '../config';

// «Наблюдение дня»: единственный внешний запрос сайта. Таймаут 4 с, при сбое остаётся пример.
const URL = `https://api.open-meteo.com/v1/forecast?latitude=${config.coords.lat}&longitude=${config.coords.lon}&current=temperature_2m,relative_humidity_2m&hourly=uv_index&timezone=auto&forecast_days=1`;

interface Obs { t: number; h: number; uv: number }

export function tip({ t, h, uv }: Obs): [string, string] {
  if (uv >= 3) return ['Нужна солнцезащита', 'Нанесите средство с защитой от ультрафиолета перед выходом.'];
  if (t <= -10) return ['Мороз', 'защитный крем заранее, уход за губами.'];
  if (h <= 35) return ['Сухой воздух', 'увлажнение.'];
  if (t >= 25 && h >= 70) return ['Жара и влажность', 'лёгкие текстуры, бережное очищение.'];
  return ['Спокойный день', 'привычный уход.'];
}

const fmt = (n: number) => String(Math.abs(Math.round(n)));

export async function initWeather() {
  const $ = (id: string) => document.getElementById(id)!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const show = (o: Obs, live: boolean) => {
    const set = (el: HTMLElement, v: number, sign = false) => {
      const to = Math.round(v);
      const write = (n: number) => (el.textContent = (sign && n < 0 ? '−' : '') + String(Math.abs(n)));
      if (reduced) return write(to);
      const t0 = performance.now();
      const step = (t: number) => { const k = Math.min(1, (t - t0) / 700); write(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    set($('obs-t'), o.t, true); set($('obs-h'), o.h); set($('obs-uv'), o.uv);
    const [b, rest] = tip(o);
    $('obs-tip').innerHTML = `<strong>${b}:</strong> ${rest}`;
    $('obs-tag').textContent = live ? 'сейчас' : 'пример';
    void fmt;
  };
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 4000);
  try {
    const r = await fetch(URL, { signal: ctl.signal });
    if (!r.ok) throw new Error(String(r.status));
    const j = await r.json();
    const hour = String(j.current.time).slice(0, 13);
    const i = Math.max(0, (j.hourly.time as string[]).findIndex((x) => x.startsWith(hour)));
    show({ t: j.current.temperature_2m, h: j.current.relative_humidity_2m, uv: j.hourly.uv_index[i] ?? 0 }, true);
  } catch { /* запасной вариант: статичный пример уже в разметке */ } finally { clearTimeout(timer); }
}
