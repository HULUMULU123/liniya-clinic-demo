// Отладка: линии + контуры зон на светлом фоне. node scripts/debug-zones.mjs
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const svg = readFileSync('src/assets/face-base.svg', 'utf8');
const html = `<style>body{margin:0;background:#F6F1EA;color:#1F1A17}svg{width:100%;height:100vh}
.zone-hit{fill:rgba(164,84,60,.10)!important;stroke:#A4543C;stroke-width:1}.zone-pin{fill:#A4543C}</style>${svg}`;
const b = await chromium.launch();
for (const [w, h, n] of [[390, 500, 'm'], [1440, 900, 'd']]) {
  const pg = await b.newPage({ viewport: { width: w, height: h } });
  await pg.setContent(html.replace('class="zone-pin"', 'class="zone-pin"'));
  await pg.screenshot({ path: `screenshots/f-${n}-zones.png` });
  await pg.addStyleTag({ content: '.zone-hit,.zone-pin{display:none}' });
  await pg.screenshot({ path: `screenshots/f-${n}-lines.png` });
}
await b.close();
