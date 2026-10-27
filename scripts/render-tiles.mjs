// Рендерит плитки галереи в src/assets/gallery/*.jpg. Нужен запущенный `npm run dev` (порт 5173).
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
mkdirSync('src/assets/gallery', { recursive: true });
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pg = await b.newPage();
pg.on('console', (m) => m.type() === 'error' && console.log('console:', m.text()));
pg.on('pageerror', (e) => console.log('pageerror:', e.message));
await pg.goto('http://localhost:5173/tiles.html');
await pg.waitForFunction(() => document.title === 'done', null, { timeout: 240000 });
const tiles = await pg.evaluate(() => window.__tiles);
for (const [name, url] of Object.entries(tiles)) { writeFileSync(`src/assets/gallery/${name}.jpg`, Buffer.from(url.split(',')[1], 'base64')); console.log(name); }
await b.close();
