// Плитки галереи: 3D-иллюстрации, отрендеренные scripts/render-tiles.mjs
const files = import.meta.glob('./assets/gallery/*.jpg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
export const tileUrl = (name: string) => files[`./assets/gallery/${name}.jpg`];
export const tileSize = (name: string): [number, number] => (['t2', 't4', 't6', 't8', 't10'].includes(name) ? [1000, 720] : [720, 900]);
