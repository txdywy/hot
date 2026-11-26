// Walks the whole flow as a person would, on each kind of phone and on a computer:
// open, choose a photo, pick a team and a style, type, make the photo, save it,
// close with the Back button. Run: node tools/smoke.mjs (SHOT_DIR=dir for pictures).
import {serve} from './serve.mjs';
import {launch, engine} from './browser.mjs';
import {phones, report, shots, open, ready, until, photo, choosePhoto, previewPixels} from './kit.mjs';

const r = report(`smoke (${engine})`);
const shot = await shots();
const server = await serve();
const browser = await launch();

// iPhone Safari's share sheet, which no desktop browser has: record what was shared.
const fakeShare = () => {
  window.shared = [];
  navigator.canShare = data => Boolean(data && data.files && data.files.length);
  navigator.share = data => {
    window.shared.push(data.files.map(file => `${file.name} ${file.type} ${file.size}`));
    return Promise.resolve();
  };
};

// How each one saves: android saves at the first tap, iPhone shares, WeChat holds.
const runs = [
  ['android', 'download'],
  ['harmony', 'download'],
  ['iphone', 'share'],
  ['wechatIphone', 'hold'],
  ['wechatAndroid', 'hold'],
  ['small', 'share'],
  ['desktop', 'dialog'],
].filter(([name]) => engine === 'chromium' || !/android|harmony|wechatAndroid/i.test(name));
// WebKit plays the iPhone (Safari and WeChat), the small iPhone and the computer;
// Android phones run on Chromium as they do in real life.

async function layoutOk(page, label) {
  const facts = await page.evaluate(() => {
    const view = document.documentElement.clientWidth;
    const box = id => document.getElementById(id).getBoundingClientRect();
    return {
      overflow: document.documentElement.scrollWidth - view,
      view,
      height: window.innerHeight,
      bar: box('bar'),
      stage: box('stage'),
      main: box('bar-main'),
    };
  });
  r.check(facts.overflow <= 1, `${label}: page is ${facts.overflow}px wider than the screen`);
  r.check(facts.main.bottom <= facts.height + 1 && facts.main.top >= 0, `${label}: main button is off screen`);
  r.check(facts.main.height >= 44, `${label}: main button is ${facts.main.height}px tall, under 44`);
  r.check(facts.stage.height >= 160 && facts.stage.top < facts.bar.top, `${label}: preview is not visible (${Math.round(facts.stage.height)}px)`);
}

for (const [name, way] of runs) {
  const label = `${name}`;
  const {context, page} = await open(browser, server.url, phones[name], r.problems, label);
  if (way === 'share') await context.addInitScript(fakeShare);
  if (way === 'share') {
    await page.reload();
    await ready(page);
  }
  await layoutOk(page, `${label} start`);
  r.check(await page.textContent('#bar-main-text') === '选一张照片', `${label}: first button does not say 选一张照片`);
  await shot(page, `${name}-1-start`);

  // A photo.
  const before = await previewPixels(page);
  await choosePhoto(page, await photo(page));
  r.check(await previewPixels(page) !== before, `${label}: the chosen photo did not reach the preview`);
  const make = await page.textContent('#bar-main-text');
  r.check(make === (way === 'download' ? '保存照片' : '做好照片'), `${label}: main button says ${make}`);

  // Another group, team and style.
  await page.click('[data-group="football"]');
  await page.click('[data-team]:not([aria-pressed="true"])');
  let pixels = await previewPixels(page);
  await page.click('[data-style="ticket"]');
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  r.check(await previewPixels(page) !== pixels, `${label}: style change did not reach the preview`);
  r.check(await page.getAttribute('[data-style="ticket"]', 'aria-pressed') === 'true', `${label}: ticket is not marked chosen`);

  // Words.
  await page.fill('#name', 'Mia');
  await page.fill('#number', '7a');
  r.check(await page.inputValue('#number') === '7', `${label}: number field kept a letter`);
  pixels = await previewPixels(page);
  await page.click('[data-slogan]:last-child');
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  r.check(await previewPixels(page) !== pixels, `${label}: slogan did not reach the preview`);
  await page.click('[data-style="jersey"]');
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await layoutOk(page, `${label} edited`);
  await shot(page, `${name}-2-edited`);

  // Make and save.
  const downloads = [];
  page.on('download', download => downloads.push(download.suggestedFilename()));
  await page.click('#bar-main');
  await until(page, () => document.querySelector('#result').open, null, 15000, 'the result window');
  await until(page, () => document.querySelector('#result-image').naturalWidth > 0, null, 10000, 'the result picture');
  const result = await page.evaluate(() => {
    const img = document.querySelector('#result-image');
    const visible = id => {
      const el = document.getElementById(id);
      return !el.hidden && el.getBoundingClientRect().height > 0;
    };
    return {
      w: img.naturalWidth, h: img.naturalHeight, src: img.src.slice(0, 5),
      share: visible('share'), download: visible('download'),
      title: document.querySelector('#result-title').textContent,
      first: document.querySelector('.actions .button.primary') && document.querySelector('.actions .button.primary').id,
      // The main button must be in view without scrolling the window.
      fits: (() => {
        const main = document.querySelector('#result .actions .button.primary') || document.querySelector('#result-close');
        const box = main.getBoundingClientRect();
        return box.top >= 0 && box.bottom <= window.innerHeight + 1;
      })(),
    };
  });
  r.check(Math.max(result.w, result.h) >= 1500, `${label}: saved photo is only ${result.w}x${result.h}`);
  r.check(result.fits, `${label}: the result window's main button is below the screen`);
  await shot(page, `${name}-3-result`);

  if (way === 'download') {
    await page.waitForTimeout(300);
    r.check(downloads.length === 1 && /^HOT-[A-Z0-9]+-(JERSEY|TICKET|PATCH)-\d{8}-1\.jpg$/.test(downloads[0]), `${label}: first tap did not download (got ${downloads.join(', ') || 'nothing'})`);
    r.check(/已保存/.test(result.title), `${label}: result window does not say saved (${result.title})`);
  }
  if (way === 'hold') {
    r.check(result.src === 'data:', `${label}: WeChat needs the picture as data, got ${result.src}`);
    r.check(!result.download && !result.share, `${label}: WeChat shows a download or share button`);
    r.check(downloads.length === 0, `${label}: WeChat downloaded`);
  }
  if (way === 'share') {
    r.check(result.share && result.first === 'share', `${label}: 保存到相册 is not the first button`);
    await page.click('#share');
    await until(page, () => window.shared.length === 1, null, 3000, 'the share');
    const shared = await page.evaluate(() => window.shared[0][0]);
    r.check(/^HOT-.+\.jpg image\/jpeg \d{5,}$/.test(shared), `${label}: shared ${shared}`);
    r.check(/好了/.test(await page.textContent('#result-title')), `${label}: no done note after sharing`);
  }
  if (way === 'dialog') {
    r.check(result.download && result.first === 'download', `${label}: 下载照片 is not the main button`);
    await page.click('#download');
    await page.waitForTimeout(300);
    r.check(downloads.length === 1, `${label}: download did not start`);
  }

  // The Back button closes the window instead of leaving the page.
  const url = page.url();
  await page.goBack();
  await until(page, () => !document.querySelector('#result').open, null, 3000).catch(() => {});
  r.check(!(await page.evaluate(() => document.querySelector('#result').open)), `${label}: Back did not close the result window`);
  r.check(page.url() === url, `${label}: Back left the page`);
  if (way !== 'hold') r.check(/已保存/.test(await page.textContent('#bar-hint')), `${label}: bar does not say saved`);
  await shot(page, `${name}-4-after`);

  // Choices are kept for next time.
  if (name === 'android') {
    await page.reload();
    await ready(page);
    const kept = await page.evaluate(() => ({
      name: document.querySelector('#name').value,
      group: document.querySelector('[data-group][aria-pressed="true"]').dataset.group,
    }));
    r.check(kept.name === 'MIA' || kept.name === 'Mia', `${label}: name not kept (${kept.name})`);
    r.check(kept.group === 'football', `${label}: group not kept (${kept.group})`);
  }
  await context.close();
}

await browser.close();
server.close();
r.finish();
