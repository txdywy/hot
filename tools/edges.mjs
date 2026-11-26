// The less common paths: files that are not photos, an iPhone HEIC in a browser that
// cannot read it, moving the photo inside a cropped frame, iPhone's share sheet getting
// stuck, the big view and help windows, and the Back button.
// Run: node tools/edges.mjs (SHOT_DIR=dir for pictures).
import {serve} from './serve.mjs';
import {launch, engine} from './browser.mjs';
import {phones, report, shots, open, ready, until, photo, choosePhoto, previewPixels} from './kit.mjs';

const r = report(`edges (${engine})`);
const shot = await shots();
const server = await serve();
const browser = await launch();
const frame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

async function problemShown(page) {
  await until(page, () => !document.querySelector('#problem').hidden, null, 8000, 'the problem note').catch(() => {});
  return page.evaluate(() => ({
    shown: !document.querySelector('#problem').hidden,
    text: document.querySelector('#problem-text').textContent,
    bar: document.querySelector('#bar-main-text').textContent,
  }));
}

// 1. Files that are not photos, and HEIC, on Android.
{
  const label = 'bad files';
  const {context, page} = await open(browser, server.url, phones.android, r.problems, label);
  await page.setInputFiles('#file', {name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello')});
  let seen = await problemShown(page);
  r.check(seen.shown && /不是照片/.test(seen.text), `${label}: a text file gave "${seen.text}"`);
  r.check(seen.bar === '选一张照片', `${label}: bar says ${seen.bar} after a bad file`);
  await shot(page, 'edges-1-not-photo');

  // HEIC header: ftyp heic. Chromium cannot open it, so the note must name HEIC.
  const heic = Buffer.alloc(64);
  heic.write('\0\0\0\x18ftypheic\0\0\0\0mif1heic', 0, 'binary');
  await page.setInputFiles('#file', {name: 'IMG_0420.HEIC', mimeType: 'image/heic', buffer: heic});
  await page.waitForTimeout(200);
  seen = await problemShown(page);
  r.check(seen.shown && /打不开/.test(seen.text), `${label}: HEIC gave "${seen.text}"`);
  r.check(/HEIC/.test(await page.textContent('#problem-help-text')), `${label}: HEIC help does not mention HEIC`);

  // A broken JPEG.
  await page.setInputFiles('#file', {name: 'broken.jpg', mimeType: 'image/jpeg', buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])});
  await page.waitForTimeout(200);
  seen = await problemShown(page);
  r.check(seen.shown && /打不开/.test(seen.text), `${label}: broken JPEG gave "${seen.text}"`);

  // A good photo clears the note, and a bad one after it keeps the good photo.
  await choosePhoto(page, await photo(page));
  r.check(await page.evaluate(() => document.querySelector('#problem').hidden), `${label}: problem note stays after a good photo`);
  const good = await previewPixels(page);
  await page.setInputFiles('#file', {name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello')});
  seen = await problemShown(page);
  r.check(/上一张照片还在/.test(await page.textContent('#problem-help-text')), `${label}: does not say the last photo is kept`);
  r.check(await previewPixels(page) === good, `${label}: a bad file replaced the good photo`);
  r.check(seen.bar !== '选一张照片', `${label}: bar forgot the good photo`);

  // A PNG with transparency opens too.
  await choosePhoto(page, await photo(page, 900, 900, 'image/png'));
  r.check(await page.evaluate(() => document.querySelector('#problem').hidden), `${label}: PNG gave a problem`);
  await context.close();
}

// 2. Cropping to 1:1 and 9:16, and dragging the photo inside the frame.
{
  const label = 'drag';
  const {context, page} = await open(browser, server.url, phones.iphone, r.problems, label);
  await choosePhoto(page, await photo(page, 2000, 1000));
  r.check(await page.evaluate(() => document.querySelector('#drag-hint').hidden), `${label}: drag hint shows for the whole photo`);
  await page.click('[data-ratio="1:1"]');
  await page.evaluate(frame);
  const hint = await page.evaluate(() => !document.querySelector('#drag-hint').hidden && document.querySelector('#stage').classList.contains('drag-x'));
  r.check(hint, `${label}: a wide photo in 1:1 does not offer a sideways drag`);
  const before = await previewPixels(page);
  const box = await page.locator('#preview').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 90, box.y + box.height / 2, {steps: 6});
  await page.mouse.up();
  await page.evaluate(frame);
  r.check(await previewPixels(page) !== before, `${label}: dragging did not move the photo`);
  const x = await page.evaluate(() => JSON.parse(localStorage.getItem('hot-choices-v1') || '{}').x);
  r.check(typeof x === 'number' ? x < .5 : true, `${label}: dragging right should show more of the left (x=${x})`);
  await shot(page, 'edges-2-drag');

  // A tall frame on a wide photo, then back to the whole photo.
  await page.click('[data-ratio="9:16"]');
  await page.evaluate(frame);
  const tall = await page.evaluate(() => {
    const c = document.querySelector('#preview');
    return c.height / c.width;
  });
  r.check(tall > 1.5, `${label}: 9:16 preview is ${tall.toFixed(2)} tall`);
  await page.click('[data-ratio="original"]');
  await page.evaluate(frame);
  r.check(await page.evaluate(() => document.querySelector('#drag-hint').hidden), `${label}: drag hint stays for the whole photo`);
  await context.close();
}

// 3. iPhone: the share sheet never answers the second time (WebKit bug 231995).
{
  const label = 'stuck share';
  const {context, page} = await open(browser, server.url, phones.iphone, r.problems, label);
  await context.addInitScript(() => {
    navigator.canShare = () => true;
    // The first share never settles, as on a stuck iPhone.
    navigator.share = () => new Promise(() => {});
  });
  await page.reload();
  await ready(page);
  await choosePhoto(page, await photo(page));
  await page.click('#bar-main');
  await until(page, () => document.querySelector('#result').open && !document.querySelector('#share').hidden, null, 15000, 'the result window');
  await page.click('#share');
  await page.waitForTimeout(150);
  await page.click('#share');
  await until(page, () => document.querySelector('#share').hidden, null, 3000).catch(() => {});
  const after = await page.evaluate(() => ({
    share: document.querySelector('#share').hidden,
    title: document.querySelector('#result-title').textContent,
  }));
  r.check(after.share && /按住/.test(after.title), `${label}: no fallback to a long press (${after.title})`);
  await until(page, () => document.querySelector('#result-image').src.startsWith('data:'), null, 5000).catch(() => {});
  r.check(await page.evaluate(() => document.querySelector('#result-image').src.startsWith('data:')), `${label}: picture is not ready for a long press`);
  await shot(page, 'edges-3-stuck-share');
  await context.close();
}

// 4. Big view, help, and the Back button on each.
{
  const label = 'windows';
  const {context, page} = await open(browser, server.url, phones.harmony, r.problems, label);
  await page.click('#help-open');
  r.check(await page.evaluate(() => document.querySelector('#help').open), `${label}: help did not open`);
  r.check(/下载/.test(await page.textContent('#help-save')), `${label}: help on Android does not say where the photo goes`);
  await page.goBack();
  await page.waitForTimeout(200);
  r.check(!(await page.evaluate(() => document.querySelector('#help').open)), `${label}: Back did not close help`);

  await choosePhoto(page, await photo(page));
  r.check(await page.isVisible('#view-open'), `${label}: 看大图 is missing`);
  await page.click('#view-open');
  await page.evaluate(frame);
  const view = await page.evaluate(() => ({open: document.querySelector('#view').open, w: document.querySelector('#view-canvas').width}));
  r.check(view.open && view.w >= 1000, `${label}: big view opened ${view.open} at ${view.w}px`);
  await page.click('#view-zoom');
  await page.evaluate(frame);
  r.check(await page.evaluate(() => document.querySelector('#view-scroll').scrollWidth > document.querySelector('#view-scroll').clientWidth), `${label}: zoom did not enlarge`);
  await shot(page, 'edges-4-view');
  await page.goBack();
  await page.waitForTimeout(200);
  r.check(!(await page.evaluate(() => document.querySelector('#view').open)), `${label}: Back did not close the big view`);
  r.check(await page.evaluate(() => document.querySelector('#view-canvas').width) <= 1, `${label}: big view kept its memory after closing`);

  // Escape also closes, and focus goes back to the button.
  await page.click('#help-open');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  r.check(!(await page.evaluate(() => document.querySelector('#help').open)), `${label}: Escape did not close help`);
  await context.close();
}

// 5. A photo dropped on the page on a computer, and leaving with an unsaved photo.
{
  const label = 'drop';
  const {context, page} = await open(browser, server.url, phones.desktop, r.problems, label);
  const file = await photo(page, 1200, 900);
  await page.evaluate(async base64 => {
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const data = new DataTransfer();
    data.items.add(new File([bytes], 'drop.jpg', {type: 'image/jpeg'}));
    document.body.dispatchEvent(new DragEvent('dragover', {dataTransfer: data, bubbles: true, cancelable: true}));
    document.body.dispatchEvent(new DragEvent('drop', {dataTransfer: data, bubbles: true, cancelable: true}));
  }, file.buffer.toString('base64'));
  await until(page, () => !document.querySelector('#bar-pick').hidden, null, 8000).catch(() => {});
  r.check(await page.isVisible('#bar-pick'), `${label}: a dropped photo was not opened`);
  r.check(!(await page.evaluate(() => document.body.classList.contains('dragging-file'))), `${label}: drop overlay stays up`);
  await context.close();
}

// 6. Team logos: when a file is listed in teams.js, it shows on the card and in all three styles.
{
  const label = 'logos';
  const context = await browser.newContext(Object.assign({}, phones.iphone, engine === 'webkit' ? {isMobile: undefined} : {}));
  const page = await context.newPage();
  page.on('pageerror', error => r.problems.push(`${label}: script error: ${error.message}`));
  await page.route('**/assets/teams.js*', async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace('export const logos = {};', "export const logos = {lakers: 'lakers.svg'};");
    await route.fulfill({response, body});
  });
  await page.route('**/assets/logos/lakers.svg*', route => route.fulfill({contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" width="200" height="200"><circle cx="5" cy="5" r="5" fill="#00ff00"/></svg>'}));
  await page.goto(server.url);
  await ready(page);
  await until(page, () => {
    const img = document.querySelector('[data-team="lakers"] .swatch img');
    return img && img.complete && img.naturalWidth > 0;
  }, null, 5000).catch(() => {});
  r.check(await page.evaluate(() => {
    const img = document.querySelector('[data-team="lakers"] .swatch img');
    return Boolean(img && img.naturalWidth);
  }), `${label}: logo does not show on the Lakers card`);
  for (const style of ['jersey', 'ticket', 'patch']) {
    await page.click(`[data-style="${style}"]`);
    await page.waitForTimeout(250);
    await page.evaluate(frame);
    // The test logo is pure green, a colour no frame uses.
    const green = await page.evaluate(() => {
      const c = document.querySelector('#preview');
      const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 0; i < data.length; i += 4) if (data[i] < 40 && data[i + 1] > 215 && data[i + 2] < 40) n++;
      return n;
    });
    r.check(green > 50, `${label}: logo is missing from the ${style} style`);
    await shot(page, `edges-6-logo-${style}`);
  }
  await context.close();
}

await browser.close();
server.close();
r.finish();
