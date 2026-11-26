// Opens the browser for the tests. ENGINE=webkit uses WebKit (the engine behind
// iPhone Safari and iPhone WeChat); CHROME_PATH points at another Chromium build.
import {chromium, webkit} from 'playwright';

export const engine = process.env.ENGINE === 'webkit' ? 'webkit' : 'chromium';

export function launch() {
  if (engine === 'webkit') return webkit.launch();
  const options = {};
  if (process.env.CHROME_PATH) {
    options.executablePath = process.env.CHROME_PATH;
    options.args = ['--no-sandbox', '--disable-gpu', '--use-gl=swiftshader', '--disable-dev-shm-usage'];
  }
  return chromium.launch(options);
}
