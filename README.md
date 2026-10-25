# ЛИНИЯ — демо сайта клиники («Атлас кожи»)

Демонстрационный сайт вымышленной клиники эстетической косметологии. Одна страница, статическая сборка, без бэкенда.
Клиника, врачи, цены и тексты вымышлены. В `<head>` стоит `noindex,nofollow`.

## Запуск

```bash
npm install
npm run dev        # разработка, http://localhost:5173
npm run build      # проверка типов и сборка в dist/
npm run preview    # просмотр сборки
node scripts/shoot.mjs http://localhost:5173/ метка   # скриншоты 390, 768, 1440 px (Playwright, нужен npx playwright install chromium)
```

## Что заменить под реальную клинику

| Что | Где |
|---|---|
| Название, адрес, часы, мессенджеры, координаты, консультация | `src/config.ts` |
| Процедуры, цены, длительность, курсы | `src/data/procedures.json` |
| Статьи журнала | `src/data/journal.json` |
| Указатель терминов | `src/data/glossary.json` |
| Тексты FAQ, шаги визита, подписи | `index.html` |
| Палитра, шрифты, отступы | `src/styles/tokens.css` |
| Иллюстрации (натюрморт, споты) | `src/assets/plates/`, `src/assets/spots/` |

Все тексты журнала и указателя помечены `"demo": true` и предназначены к замене текстом клиники и проверке врачом.

## Лицо

Лицо строится скриптами из модели MediaPipe (`scripts/data/canonical_face_model.obj`, Apache 2.0):

```bash
node scripts/build-face.mjs   # src/assets/face-base.svg: линии лица и зоны (запасной вариант без WebGL)
node scripts/build-mesh.mjs   # src/data/face-mesh.json: 3D-сетка для Three.js
```

Чтобы использовать свою иллюстрацию, положите SVG по контракту в `src/assets/face-base.svg`: `viewBox="0 0 400 500"`, группа `#face-lines` с путями (`pathLength="1"`), группы `#zone-forehead`, `#zone-eyes`, `#zone-cheeks`, `#zone-lips`, `#zone-jawline` с `path.zone-hit` и `circle.zone-pin`.

## Внешние запросы

Единственный внешний запрос: погода для карточки «Наблюдение дня» (Open-Meteo, таймаут 4 с, при сбое показывается пример). Open-Meteo бесплатен для некоммерческого использования; для рабочего сайта нужен платный тариф или другой источник.

## Отличия от ТЗ

3D-голова на Three.js добавлена по просьбе заказчика, хотя ТЗ v2 Three.js запрещает. Чанк `face3d` весит около 139 КБ gzip и грузится только когда карта близко к экрану. Файлов шрифтов пять вместо четырёх (римские цифры и цены набираются латиницей).
