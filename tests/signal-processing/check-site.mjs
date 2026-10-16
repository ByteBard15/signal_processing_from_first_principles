// Post-build route/reference/asset checks. No browser or third-party dependency.
import { readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import assert from 'node:assert/strict';
const site = resolve('_site');
const base = (await readFile('_config.yml', 'utf8')).match(/^baseurl:\s*"([^"]*)"/m)[1];
const routes = ['/', '/articles/harmonics-to-spectra/', '/articles/continuous-to-discrete/', '/articles/samples-to-spectra/'];
let links = 0, figures = 0;
for (const route of routes) {
  const filename = resolve(site, `.${route}`, 'index.html');
  const html = await readFile(filename, 'utf8');
  assert.ok(!html.includes('{%') && !html.includes('{{'), `Unexpanded Liquid in ${route}`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, new Set(ids).size, `Duplicate IDs in ${route}`);
  // GFM can misread unescaped absolute-value bars in prose as table cells.
  // Every intended publication table has column headings.
  if (route.startsWith('/articles/')) {
    for (const table of html.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/g)) {
      assert.ok(table[0].includes('<thead>'), `Unheaded table or misparsed inline math in ${route}`);
    }
  }
  figures += [...html.matchAll(/data-experiment="/g)].length;
  for (const match of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const href = match[1];
    if (!href.startsWith('/') && !href.startsWith('#')) continue;
    const [path, hash] = href.split('#');
    let target = filename;
    if (path) {
      assert.ok(path.startsWith(`${base}/`), `Wrong baseurl: ${href}`);
      const relative = path.slice(base.length);
      target = resolve(site, `.${relative}`, ...(relative.endsWith('/') ? ['index.html'] : []));
    }
    await access(target); links++;
    if (hash) {
      const targetHtml = target === filename ? html : await readFile(target, 'utf8');
      assert.ok(targetHtml.includes(`id="${hash}"`), `Missing anchor: ${href}`);
    }
  }
}
assert.equal(figures, 23, 'Expected all 23 independent demonstrations');
// Check the complete static ES-module import graph, including boot's lazy imports.
const visited = new Set();
async function modules(filename) {
  if (visited.has(filename)) return; visited.add(filename);
  const source = await readFile(filename, 'utf8');
  const imports = [...source.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g)].map((m) => m[1]);
  if (filename.endsWith('/boot.mjs')) imports.push(...[...source.matchAll(/\['(\.\/[^']+\.mjs)'/g)].map((m) => m[1]));
  for (const path of imports) if (path.startsWith('.')) await modules(resolve(dirname(filename), path));
}
await modules(resolve(site, 'assets/js/signal-processing/boot.mjs'));
console.log(`Validated ${routes.length} pages, ${links} local links/assets, ${figures} figures, ${visited.size} ES modules.`);
