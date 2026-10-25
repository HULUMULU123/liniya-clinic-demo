// Скриншоты Playwright: node scripts/shoot.mjs [url] [метка]
import { chromium } from 'playwright';
const url = process.argv[2] || 'http://localhost:5173/';
const tag = process.argv[3] || 'p';
const sizes = [[390, 844, 'm'], [768, 1024, 't'], [1440, 900, 'd']];
const b = await chromium.launch();
const ext = new Set();
for (const [w, h, n] of sizes) {
  const pg = await b.newPage({ viewport: { width: w, height: h } });
  const errs = [];
  pg.on('pageerror', (e) => errs.push(e.message));
  pg.on('request', (r) => { if (!r.url().startsWith(new URL(url).origin) && !r.url().startsWith('data:')) ext.add(r.url()); });
  await pg.goto(url); await pg.waitForTimeout(1200);
  await pg.screenshot({ path: `screenshots/${tag}-${n}-full.png`, fullPage: true });
  await pg.screenshot({ path: `screenshots/${tag}-${n}-top.png` });
  const ov = await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log(n, w, 'overflow px:', ov, 'errors:', errs);
}
console.log('external requests:', [...ext]);
await b.close();
