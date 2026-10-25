import { writeFileSync } from 'node:fs';
import { loadPoints } from './face-lib.mjs';
const P = loadPoints();
const S = 5;
const body = P.map(([x, y], i) => `<circle cx="${x * S}" cy="${y * S}" r="1.6" fill="#a4543c"/><text x="${x * S + 3}" y="${y * S - 2}" font-size="9" font-family="monospace" fill="#222">${i}</text>`).join('');
writeFileSync('screenshots/debug-points.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${400 * S} ${500 * S}" width="${400 * S}" height="${500 * S}"><rect width="100%" height="100%" fill="#fff"/>${body}</svg>`);
