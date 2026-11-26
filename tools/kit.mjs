// Shared helpers for the browser tests: phones to pretend to be, a photo to choose,
// and a way to collect problems and report them so GitHub shows each one.
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';

export const phones = {
  android: {
    viewport: {width: 412, height: 915}, deviceScaleFactor: 2.6, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
  },
  harmony: {
    viewport: {width: 360, height: 780}, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (Phone; OpenHarmony 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 ArkWeb/4.1.6.1 Mobile HuaweiBrowser/5.0.4.300',
  },
  iphone: {
    viewport: {width: 390, height: 844}, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  },
  wechatIphone: {
    viewport: {width: 375, height: 667}, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.49(0x18003129) NetType/WIFI Language/zh_CN',
  },
  wechatAndroid: {
    viewport: {width: 393, height: 851}, deviceScaleFactor: 2.75, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; V2219A Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/116.0.0.0 Mobile Safari/537.36 XWEB/1160065 MMWEBSDK/20231202 MMWEBID/2247 MicroMessenger/8.0.47.2560(0x28002F30) WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64',
  },
  small: {
    viewport: {width: 320, height: 568}, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1',
  },
  ipad: {
    viewport: {width: 820, height: 1180}, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  },
  desktop: {viewport: {width: 1366, height: 860}, deviceScaleFactor: 1},
};

// Collects problems; at the end prints them as GitHub error lines and sets the exit code.
export function report(name) {
  const problems = [];
  return {
    problems,
    check(ok, message) {
      if (!ok) problems.push(message);
      return ok;
    },
    finish() {
      if (problems.length) {
        for (const problem of problems) console.log(`::error title=${name}::${problem.replace(/\n/g, ' ')}`);
        console.error(`${name}: ${problems.length} problem(s)`);
        process.exitCode = 1;
      } else {
        console.log(`${name}: OK`);
      }
    },
  };
}

export async function shots() {
  const dir = process.env.SHOT_DIR;
  if (dir) await mkdir(dir, {recursive: true});
  return async (page, name) => {
    if (dir) await page.screenshot({path: join(dir, `${name}.png`)});
  };
}

export async function ready(page) {
  await until(page, () => window.hotAppReady === true, null, 10000, 'the page to start');
  await settle(page);
}

// Opens a page and records every script error, failed request and console error.
export async function open(browser, url, device, problems, label) {
  const options = Object.assign({acceptDownloads: true}, device);
  // WebKit does not take isMobile.
  if (process.env.ENGINE === 'webkit') delete options.isMobile;
  const context = await browser.newContext(options);
  const page = await context.newPage();
  page.on('pageerror', error => problems.push(`${label}: script error: ${error.message}`));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const where = message.location();
    problems.push(`${label}: console error: ${message.text()} (at ${where.url || 'no url'}:${where.lineNumber})`);
  });
  page.on('response', response => {
    if (response.status() >= 400) problems.push(`${label}: ${response.status()} ${response.url()}`);
  });
  await page.goto(url);
  await ready(page);
  return {context, page};
}

// page.waitForFunction needs eval, which the page's security policy forbids, so poll instead.
export async function until(page, test, arg, timeout = 8000, what = 'condition') {
  const end = Date.now() + timeout;
  for (;;) {
    if (await page.evaluate(test, arg)) return;
    if (Date.now() > end) throw new Error(`timed out waiting for ${what}`);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

// Waits until the preview has been drawn and nothing is pending.
export async function settle(page) {
  await until(page, () => {
    const canvas = document.querySelector('#preview');
    return canvas && canvas.width > 10 && canvas.getBoundingClientRect().width > 10;
  }, null, 8000, 'the preview');
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

// A photo made in the page itself: a sunset with people-sized shapes, as a JPEG.
export async function photo(page, width = 1600, height = 1200, type = 'image/jpeg') {
  const data = await page.evaluate(([w, h, kind]) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#ff7a45');
    sky.addColorStop(1, '#3b2a6b');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(w * .7, h * .35, Math.min(w, h) * .12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1b1b2f';
    for (let i = 0; i < 5; i++) {
      const x = w * (.15 + i * .17);
      ctx.beginPath();
      ctx.arc(x, h * .55, Math.min(w, h) * .06, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - Math.min(w, h) * .07, h * .62, Math.min(w, h) * .14, h * .4);
    }
    return canvas.toDataURL(kind, .9).split(',')[1];
  }, [width, height, type]);
  return {name: type === 'image/png' ? 'photo.png' : 'IMG_0001.JPG', mimeType: type, buffer: Buffer.from(data, 'base64')};
}

export async function choosePhoto(page, file) {
  await page.setInputFiles('#file', file);
  await until(page, () => !document.querySelector('#bar-pick').hidden, null, 10000, 'the photo to open');
  await settle(page);
}

// The preview's pixels, to tell whether a change reached the picture.
export function previewPixels(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('#preview');
    const copy = document.createElement('canvas');
    copy.width = 48;
    copy.height = 48;
    copy.getContext('2d').drawImage(canvas, 0, 0, 48, 48);
    return Array.from(copy.getContext('2d').getImageData(0, 0, 48, 48).data).join(',');
  });
}
