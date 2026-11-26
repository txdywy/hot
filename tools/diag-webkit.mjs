// Temporary: finds which CSS rule makes WebKit report a CSP style error.
import {serve, site} from './serve.mjs';
import {launch} from './browser.mjs';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';

const server = await serve();
const browser = await launch();
const css = await readFile(join(site, 'assets', 'style.css'), 'utf8');
// Top-level blocks by brace matching (comments stripped).
const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
const rules = [];
let depth = 0, start = 0;
for (let i = 0; i < text.length; i++) {
  if (text[i] === '{') depth++;
  if (text[i] === '}' && --depth === 0) { rules.push(text.slice(start, i + 1).trim()); start = i + 1; }
}
async function errors(body, width) {
  const context = await browser.newContext({viewport: {width, height: 844}});
  const page = await context.newPage();
  let n = 0;
  page.on('console', m => { if (m.type() === 'error' && /stylesheet/.test(m.text())) n++; });
  await page.route('**/style.css*', route => route.fulfill({contentType: 'text/css', body}));
  await page.goto(server.url);
  await page.waitForTimeout(800);
  await context.close();
  return n;
}
const out = [`rules=${rules.length}`, `all390=${await errors(rules.join('\n'), 390)}`, `all1366=${await errors(rules.join('\n'), 1366)}`];
let lo = 0, hi = rules.length;
while (lo < hi) {
  const mid = (lo + hi) >> 1;
  if (await errors(rules.slice(0, mid + 1).join('\n'), 390)) hi = mid; else lo = mid + 1;
}
out.push(`first=${lo}`);
if (rules[lo]) {
  out.push(`alone=${await errors(rules[lo], 390)}`);
  out.push(`rule=${rules[lo].replace(/\s+/g, ' ').slice(0, 300)}`);
}
console.log(`::warning title=diag css::${out.join(' ; ')}`);
await browser.close();
server.close();
