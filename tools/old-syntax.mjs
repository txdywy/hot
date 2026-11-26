// Older phones still in use: iOS 12 Safari (iPhone 5s/6), Android 8 phones whose
// built-in browser or WeChat runs an older Chromium. Their JavaScript stops at
// ES2019, so optional chaining (?.), ?? and 1_000 separators would make the whole
// page fail to start. This parses every script as ES2019 to catch that early.
// Needs: npm install acorn. Run with: node tools/old-syntax.mjs
import {readFileSync, readdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parse} from 'acorn';

const assets = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets');
const problems = [];
const newer = [
  [/\.replaceChildren\(/, 'replaceChildren (Safari 14, Chrome 86)'],
  [/\.replaceAll\(/, 'String replaceAll (Safari 13.1, Chrome 85)'],
  [/\.at\(-?\d/, 'Array at (Safari 15.4, Chrome 92)'],
  [/structuredClone\(/, 'structuredClone (Safari 15.4, Chrome 98)'],
  [/Object\.hasOwn\(/, 'Object.hasOwn (Safari 15.4, Chrome 93)'],
  [/Promise\.(allSettled|any)\(/, 'Promise.allSettled/any (Safari 13/14, Chrome 76/85)'],
  [/\.arrayBuffer\(\)/, 'Blob arrayBuffer (Safari 14, Chrome 76)'],
  [/\.text\(\)/, 'Blob text (Safari 14, Chrome 76)'],
  [/\binset:/, 'CSS inset'],
  [/\.toggleAttribute\(/, 'toggleAttribute (Safari 12.1)'],
];
const names = readdirSync(assets).filter(name => name.endsWith('.js'));
names.push('../sw.js');
for (const name of names) {
  const source = readFileSync(join(assets, name), 'utf8');
  // old.js runs as a classic script so it can speak up when the modules cannot start.
  const sourceType = name === 'old.js' || name === '../sw.js' ? 'script' : 'module';
  const ecmaVersion = name === 'old.js' ? 5 : 2019;
  try {
    parse(source, {ecmaVersion, sourceType});
  } catch (error) {
    problems.push(`${name}: ${error.message} (not supported by older phones)`);
  }
  // Newer browser features that parse fine but throw on iOS 12-13 and older Android.
  // A use guarded by a feature check can say so with a trailing comment: // old-ok
  source.split('\n').forEach((line, index) => {
    if (/\/\/ old-ok\b/.test(line)) return;
    for (const [pattern, what] of newer) {
      if (pattern.test(line)) problems.push(`${name}:${index + 1}: ${what} is missing on older phones`);
    }
  });
}
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`OK: ${names.length} scripts use only syntax that iOS 12 and older Android browsers understand`);
