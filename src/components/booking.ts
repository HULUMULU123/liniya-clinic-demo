import { config } from '../config';
import { store } from '../store';
import procedures from '../data/procedures.json';
import { HOURS, isBusy, nextDays } from '../data/slots';
import { planTotal } from './plan';
import { rub } from '../format';

const CHANNELS = ['Telegram', 'WhatsApp', 'Max', 'Звонок'];
const dayLabel = (d: Date, i: number) => (i === 0 ? 'Сегодня' : i === 1 ? 'Завтра' : d.toLocaleDateString('ru-RU', { weekday: 'short' }));
const dayNum = (d: Date) => d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

export const phoneDigits = (v: string) => v.replace(/\D/g, '');
export const phoneOk = (v: string) => { const d = phoneDigits(v); return (d.length === 11 && (d[0] === '7' || d[0] === '8')) || d.length === 10; };
const phonePretty = (v: string) => { let d = phoneDigits(v); if (d.length === 11) d = d.slice(1); if (d.length !== 10) return v; return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8)}`; };

// Запись встроена в раздел «Контакты»: форма с подчёркнутыми полями, ничего не отправляется
export function initBooking() {
  const wrap = document.getElementById('book-wrap')!;
  const state = { day: -1, hour: -1, channel: '', name: '', phone: '', consent: false };
  const ds = nextDays();

  function form() {
    Object.assign(state, { day: -1, hour: -1, channel: '', name: '', phone: '', consent: false });
    wrap.innerHTML = `<form class="book" novalidate>
      <p class="book-plan" id="book-plan"></p>
      <fieldset><legend>День</legend><div class="chips" role="radiogroup">${ds.map((d, i) => `<label class="chip chip-day"><input type="radio" name="day" value="${i}" class="sr-only"><span>${dayLabel(d, i)}</span><small>${dayNum(d)}</small></label>`).join('')}</div></fieldset>
      <fieldset><legend>Время</legend><div class="slots" id="slots"><p class="muted">Сначала выберите день</p></div><p class="err" id="e-time" role="alert"></p></fieldset>
      <fieldset><legend>Как с вами связаться</legend><div class="chips" role="radiogroup">${CHANNELS.map((c) => `<label class="chip"><input type="radio" name="channel" value="${c}" class="sr-only"><span>${c}</span></label>`).join('')}</div></fieldset>
      <div class="u-field"><label class="field-l" for="b-name">Имя</label><input class="u-input" id="b-name" name="name" autocomplete="given-name" placeholder="Как к вам обращаться"><p class="err" id="e-name" role="alert"></p></div>
      <div class="u-field"><label class="field-l" for="b-phone">Телефон</label><input class="u-input" id="b-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="+7 900 000-00-00"><p class="err" id="e-phone" role="alert"></p></div>
      <label class="consent"><input type="checkbox" id="b-consent"> <span>Согласен на обработку данных. <a href="#" class="u-link">Политика обработки данных</a> (заглушка)</span></label>
      <button class="btn btn-line btn-wide" type="submit" id="b-send" disabled>Отправить заявку</button>
      <p class="muted note">В демо заявка никуда не отправляется.</p></form>`;
    const $ = <T extends HTMLElement>(s: string) => wrap.querySelector<T>(s)!;
    const send = $<HTMLButtonElement>('#b-send'), name = $<HTMLInputElement>('#b-name'), phone = $<HTMLInputElement>('#b-phone');
    const valid = () => state.day >= 0 && state.hour >= 0 && !!state.channel && state.name.trim().length > 0 && phoneOk(state.phone) && state.consent;
    const sync = () => { send.disabled = !valid(); };
    const err = (id: string, input: HTMLInputElement | null, msg: string) => { $(`#${id}`).textContent = msg; input?.setAttribute('aria-invalid', msg ? 'true' : 'false'); };
    const planLine = () => {
      const ids = store.get();
      const el = wrap.querySelector('#book-plan');
      if (el) el.textContent = ids.length ? `В плане: ${ids.length} ${ids.length === 1 ? 'процедура' : 'процедур(ы)'} · от ${rub(planTotal(ids))} · цены условные, демо` : 'План пока пуст: запишитесь на консультацию, остальное обсудите с врачом.';
    };
    planLine(); store.subscribe(planLine);

    wrap.querySelector('form')!.addEventListener('change', (e) => {
      const t = e.target as HTMLInputElement;
      if (t.name === 'day') {
        state.day = +t.value; state.hour = -1;
        $('#slots').innerHTML = HOURS.map((h) => { const busy = isBusy(ds[state.day], h); return `<label class="slot${busy ? ' busy' : ''}"><input type="radio" name="hour" value="${h}" class="sr-only"${busy ? ' disabled' : ''}><span>${h}:00</span>${busy ? '<small>занято</small>' : ''}</label>`; }).join('');
        err('e-time', null, '');
      }
      if (t.name === 'hour') { state.hour = +t.value; err('e-time', null, ''); }
      if (t.name === 'channel') state.channel = t.value;
      if (t.id === 'b-consent') state.consent = t.checked;
      sync();
    });
    name.addEventListener('input', () => { state.name = name.value; if (name.value.trim()) err('e-name', name, ''); sync(); });
    name.addEventListener('blur', () => err('e-name', name, name.value.trim() ? '' : 'Введите имя, чтобы мы знали, как к вам обращаться'));
    phone.addEventListener('input', () => { state.phone = phone.value; if (phoneOk(phone.value)) err('e-phone', phone, ''); sync(); });
    phone.addEventListener('blur', () => {
      if (!phone.value.trim()) return err('e-phone', phone, 'Введите номер телефона');
      if (!phoneOk(phone.value)) return err('e-phone', phone, 'Проверьте номер: не хватает цифр');
      phone.value = phonePretty(phone.value); err('e-phone', phone, '');
    });
    wrap.querySelector('form')!.addEventListener('submit', (e) => {
      e.preventDefault();
      if (state.hour < 0) { err('e-time', null, 'Выберите время, чтобы продолжить'); return; }
      if (valid()) done();
    });
  }

  function done() {
    const d = ds[state.day], ids = store.get();
    const items = ids.map((id) => procedures.find((p) => p.id === id)!);
    const msg = [
      `Новая заявка · ${config.name} (демо)`,
      `Дата: ${d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}, ${state.hour}:00`,
      `Связь: ${state.channel}`, `Имя: ${state.name.trim()}`, `Телефон: ${phonePretty(state.phone)}`,
      `План: консультация${items.map((p) => `, ${p.name}`).join('')}`,
      `Итого: от ${rub(planTotal(ids))} (цены условные, демо)`,
    ].join('\n');
    wrap.innerHTML = `<div class="book-done"><h3 tabindex="-1" id="done-h">Заявка собрана</h3><p role="status">Заявка собрана. В демо она никуда не уходит, в рабочей версии мы передадим её администратору в мессенджер.</p><pre class="msg" id="msg"></pre><div class="plan-actions"><button class="btn btn-grad" id="copy-msg">Скопировать</button><button class="btn btn-line" id="again">Новая заявка</button></div></div>`;
    wrap.querySelector('#msg')!.textContent = msg;
    wrap.querySelector<HTMLElement>('#done-h')!.focus();
    wrap.querySelector('#copy-msg')!.addEventListener('click', async (e) => { const b = e.currentTarget as HTMLElement; try { await navigator.clipboard.writeText(msg); b.textContent = 'Скопировано'; } catch { b.textContent = 'Выделите текст и скопируйте'; } });
    wrap.querySelector('#again')!.addEventListener('click', form);
  }

  form();
  const go = () => { document.getElementById('contacts')?.scrollIntoView({ behavior: 'smooth' }); setTimeout(() => wrap.querySelector<HTMLElement>('.chip-day')?.focus(), 700); };
  document.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest<HTMLElement>('[data-book]'); if (b && !(b as HTMLAnchorElement).hash) { e.preventDefault(); go(); } });
  document.addEventListener('open-booking', go);
}
