// Temporary: finds which part of the page makes WebKit with touch report a CSP style error.
import {serve} from './serve.mjs';
import {launch} from './browser.mjs';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {site} from './serve.mjs';

const server = await serve();
const browser = await launch();
const html = await readFile(join(site, 'index.html'), 'utf8');
const csp = html.match(/<meta http-equiv="Content-Security-Policy"[^>]+>/)[0];
const variants = {
  full: html,
  blank: `<!doctype html><html><head>${csp}</head><body><p>hi</p></body></html>`,
  blankNoCsp: '<!doctype html><html><head></head><body><p>hi</p></body></html>',
  noDetails: html.replace(/<details[\s\S]*?<\/details>/g, ''),
  noCheckbox: html.replace(/<input type="checkbox"[^>]*>/, ''),
  noDialogs: html.replace(/<dialog[\s\S]*?<\/dialog>/g, ''),
  noSprite: html.replace(/<svg class="sprite"[\s\S]*?<\/svg>/, ''),
  noInputs: html.replace(/<input [^>]*>/g, ''),
  noScripts: html.replace(/<script[^>]*><\/script>/g, ''),
  noCss: html.replace(/<link rel="stylesheet"[^>]*>/, ''),
  noFile: html.replace(/<input type="file"[^>]*>/, ''),
  noViewport: html.replace(/<meta name="viewport"[^>]*>/, ''),
};
for (const touch of [true, false]) {
  const lines = [];
  for (const [name, body] of Object.entries(variants)) {
    const context = await browser.newContext({viewport: {width: 390, height: 844}, hasTouch: touch});
    const page = await context.newPage();
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 40)); });
    await page.route('**/', route => route.fulfill({contentType: 'text/html', body}));
    await page.goto(server.url);
    await page.waitForTimeout(1500);
    lines.push(`${name}=${errors.length}`);
    await context.close();
  }
  console.log(`::warning title=diag touch=${touch}::${lines.join(' ')}`);
}
await browser.close();
server.close();
