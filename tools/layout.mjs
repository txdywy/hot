// Checks the page fits every common screen, also with large text: nothing wider
// than the screen, the preview and the main button in view, every control reachable
// and big enough to tap. Run: node tools/layout.mjs (SHOT_DIR=dir for pictures).
import {serve} from './serve.mjs';
import {launch, engine} from './browser.mjs';
import {phones, report, shots, open, photo, choosePhoto} from './kit.mjs';

const r = report(`layout (${engine})`);
const shot = await shots();
const server = await serve();
const browser = await launch();

const touch = {isMobile: true, hasTouch: true, userAgent: phones.android.userAgent};
const screens = [
  ['320x568', {viewport: {width: 320, height: 568}, deviceScaleFactor: 2, ...touch}],
  ['360x640', {viewport: {width: 360, height: 640}, deviceScaleFactor: 3, ...touch}],
  ['375x667', {viewport: {width: 375, height: 667}, deviceScaleFactor: 2, ...touch}],
  ['390x844', {viewport: {width: 390, height: 844}, deviceScaleFactor: 3, ...touch}],
  ['412x915', {viewport: {width: 412, height: 915}, deviceScaleFactor: 2.6, ...touch}],
  ['430x932', {viewport: {width: 430, height: 932}, deviceScaleFactor: 3, ...touch}],
  ['landscape 844x390', {viewport: {width: 844, height: 390}, deviceScaleFactor: 3, ...touch}],
  ['768x1024', {viewport: {width: 768, height: 1024}, deviceScaleFactor: 2, ...touch}],
  ['900x700', {viewport: {width: 900, height: 700}, deviceScaleFactor: 1}],
  ['1024x768', {viewport: {width: 1024, height: 768}, deviceScaleFactor: 1}],
  ['1440x900', {viewport: {width: 1440, height: 900}, deviceScaleFactor: 1}],
  ['1920x1080', {viewport: {width: 1920, height: 1080}, deviceScaleFactor: 1}],
];

async function inspect(page, label) {
  const facts = await page.evaluate(() => {
    const height = window.innerHeight;
    const width = document.documentElement.clientWidth;
    const bar = document.getElementById('bar').getBoundingClientRect();
    const stage = document.getElementById('stage').getBoundingClientRect();
    const main = document.getElementById('bar-main').getBoundingClientRect();
    const small = [];
    const wide = [];
    for (const el of document.querySelectorAll('button, input, a.button, label.toggle')) {
      if (el.closest('dialog') || el.hidden || el.type === 'file' || el.type === 'checkbox') continue;
      const box = el.getBoundingClientRect();
      if (!box.width) continue;
      if (box.height < 40 || box.width < 40) small.push(`${el.id || el.dataset.team || el.dataset.group || el.dataset.ratio || el.dataset.slogan || el.dataset.style || el.tagName} ${Math.round(box.width)}x${Math.round(box.height)}`);
      // The group chips scroll sideways on purpose.
      if (!el.closest('.groups') && (box.right > width + 1 || box.left < -1)) wide.push(el.id || el.textContent.trim().slice(0, 20));
    }
    // Text cut off inside its own box.
    const cut = [];
    for (const el of document.querySelectorAll('.chip, .team, .style, .button, .button span, .label, h1, .kicker')) {
      if (el.closest('dialog') || el.hidden) continue;
      if (el.scrollWidth > el.clientWidth + 2) cut.push(el.textContent.trim().slice(0, 24));
    }
    const sticky = getComputedStyle(document.getElementById('stage-panel')).position === 'sticky';
    // On a computer the bar floats beside the preview; on a phone it spans the bottom.
    const floating = bar.left > 1;
    return {height, width, overflow: document.documentElement.scrollWidth - width, bar, stage, main, small, wide, cut, sticky, floating,
      // Space left between the sticky preview and the bar for the controls.
      room: sticky && !floating ? bar.top - stage.bottom : height};
  });
  r.check(facts.overflow <= 1, `${label}: page is ${facts.overflow}px wider than the screen`);
  r.check(facts.main.top >= 0 && facts.main.bottom <= facts.height + 1, `${label}: main button is off screen`);
  r.check(facts.stage.height >= 150, `${label}: preview is only ${Math.round(facts.stage.height)}px tall`);
  if (facts.floating) r.check(facts.bar.left >= facts.stage.right, `${label}: the bar covers the preview`);
  r.check(facts.room >= 120, `${label}: only ${Math.round(facts.room)}px left between the preview and the bar`);
  r.check(!facts.small.length, `${label}: too small to tap: ${facts.small.join(', ')}`);
  r.check(!facts.wide.length, `${label}: off the side: ${facts.wide.join(', ')}`);
  r.check(!facts.cut.length, `${label}: text cut off: ${facts.cut.join(' | ')}`);

  // Every group's names fit their cards.
  for (const group of await page.$$eval('[data-group]', chips => chips.map(chip => chip.dataset.group))) {
    await page.click(`[data-group="${group}"]`);
    const cut = await page.$$eval('.team b, .team small', els => els.filter(el => el.scrollWidth > el.clientWidth + 1).map(el => el.textContent));
    r.check(!cut.length, `${label}: ${group} names cut off: ${cut.join(', ')}`);
  }

  // The last control can be scrolled clear of the bar.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(100);
  const last = await page.evaluate(() => {
    const toggle = document.querySelector('.toggle').getBoundingClientRect();
    const bar = document.getElementById('bar').getBoundingClientRect();
    const floating = bar.left > 0;
    return {clear: floating ? toggle.bottom <= window.innerHeight : toggle.bottom <= bar.top + 1};
  });
  r.check(last.clear, `${label}: the date switch stays under the bar`);
  await page.evaluate(() => window.scrollTo(0, 0));
}

for (const [name, device] of screens) {
  for (const big of [false, true]) {
    const label = `${name}${big ? ' large text' : ''}`;
    const {context, page} = await open(browser, server.url, device, r.problems, label);
    if (big) {
      // Large text set on the phone: about 130%.
      await page.evaluate(() => { document.documentElement.style.fontSize = '130%'; window.dispatchEvent(new Event('resize')); });
      await page.waitForTimeout(200);
    }
    await choosePhoto(page, await photo(page, 1200, 1600));
    await inspect(page, label);
    await shot(page, `layout-${name.replace(/\W+/g, '-')}${big ? '-big' : ''}`);
    await context.close();
  }
}

await browser.close();
server.close();
r.finish();
