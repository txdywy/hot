// Temporary: finds why WebKit reports a CSP style error.
import {serve, site} from './serve.mjs';
import {launch} from './browser.mjs';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';

const server = await serve();
const browser = await launch();
const css = await readFile(join(site, 'assets', 'style.css'), 'utf8');
let detail = '';
async function errors(body, type = 'text/css') {
  const context = await browser.newContext({viewport: {width: 390, height: 844}});
  const page = await context.newPage();
  let n = 0;
  page.on('console', m => {
    if (m.type() === 'error') { n++; detail = `${m.text()} @ ${JSON.stringify(m.location())}`; }
  });
  if (body !== null) await page.route('**/style.css*', route => route.fulfill({contentType: type, body}));
  await page.goto(server.url);
  await page.waitForTimeout(1200);
  const sheets = await page.evaluate(() => [...document.styleSheets].map(s => (s.href || 'inline:' + (s.ownerNode && s.ownerNode.nodeName)).slice(-40)).join(','));
  await context.close();
  return `${n}[${sheets}]`;
}
const out = [];
out.push(`server=${await errors(null)}`);
out.push(`routedOriginal=${await errors(css)}`);
out.push(`routedCharset=${await errors(css, 'text/css; charset=utf-8')}`);
out.push(`noComments=${await errors(css.replace(/\/\*[\s\S]*?\*\//g, ''))}`);
out.push(`ascii=${await errors(css.replace(/[^\x00-\x7f]/g, 'x'))}`);
out.push(`detail=${detail.slice(0, 300)}`);
console.log(`::warning title=diag css::${out.join(' ; ')}`);
await browser.close();
server.close();
