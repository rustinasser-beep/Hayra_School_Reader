import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const sw = await readFile(resolve(root, 'sw.js'), 'utf8');

function extractAssetPattern(source, variableName) {
  const pattern = new RegExp(
    `const ${variableName}=Array\\.from\\(\\{length:34\\},\\(_,i\\)=>'([^']*)'\\+String\\(i\\+1\\)\\.padStart\\(2,'0'\\)\\+'([^']*)'\\);`
  );
  const match = source.match(pattern);
  assert.ok(match, `Could not find the 34-item ${variableName} asset pattern`);
  return { prefix: match[1], suffix: match[2] };
}

const pagesStart = html.indexOf('const pages=');
assert.notEqual(pagesStart, -1, 'Could not find the page data');
const pagesEnd = html.indexOf('];let idx', pagesStart);
assert.notEqual(pagesEnd, -1, 'Could not find the end of the page data');
const pages = JSON.parse(html.slice(pagesStart + 'const pages='.length, pagesEnd + 1));
assert.equal(pages.length, 34, 'Expected exactly 34 book pages');

for (const [index, page] of pages.entries()) {
  assert.ok(page.image, `Page ${index + 1} has no image path`);
  await access(resolve(root, page.image));
}

const audioSource = html.match(
  /function audioSrc\(i\)\{return pages\[i\]\.audio\|\|\('([^']*)'\+String\(i\+1\)\.padStart\(2,'0'\)\+'([^']*)'\)\}/
);
assert.ok(audioSource, 'Could not find the audio source path pattern');
for (let index = 0; index < pages.length; index += 1) {
  const number = String(index + 1).padStart(2, '0');
  const audioPath = `${audioSource[1]}${number}${audioSource[2]}`;
  await access(resolve(root, audioPath));
}

const cachedImages = extractAssetPattern(sw, 'pages');
const cachedAudio = extractAssetPattern(sw, 'audio');
for (let index = 0; index < 34; index += 1) {
  const number = String(index + 1).padStart(2, '0');
  await access(resolve(root, `${cachedImages.prefix}${number}${cachedImages.suffix}`));
  await access(resolve(root, `${cachedAudio.prefix}${number}${cachedAudio.suffix}`));
}

assert.match(sw, /const ASSETS=\['\.\/'\s*,?\s*'\.\/index\.html'\]/);
assert.match(sw, /const CACHE='hayra-reader-v4'/, 'Service-worker cache version must be bumped after fixing cached paths');
console.log('assets: PASS — all 34 page images, all 34 audio files, and all service-worker cache paths exist');
