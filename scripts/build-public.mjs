import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const outDir = 'public';
const staticFiles = [
  'index.html',
  'test.html',
  'privacy.html',
  'robots.txt',
  'sitemap.xml',
  'yandex_c2786c979ae1d624.html',
  'styles.min.css',
  'script.min.js',
  'favicon.ico',
  'favicon.svg',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'apple-touch-icon.png',
];

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

for (const file of staticFiles){
  if (existsSync(file)){
    await cp(file, `${outDir}/${file}`);
  }
}

await cp('assets', `${outDir}/assets`, { recursive: true });
