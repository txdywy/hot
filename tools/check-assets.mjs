// Checks that every script and stylesheet the page loads carries the same ?v=
// cache version, that each local import points at a file that exists, and that
// every script parses. Run with: node tools/check-assets.mjs
import {readFileSync, readdirSync, existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname, join, relative} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const docs = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const assets = join(docs, 'assets');
const problems = [];
const versions = new Map();

function collect(file, pattern) {
  const text = readFileSync(file, 'utf8');
  for (const match of text.matchAll(pattern)) {
    const [, path, version] = match;
    const where = `${relative(docs, file)} -> ${path}`;
    if (!existsSync(join(dirname(file), path))) problems.push(`${where}: file not found`);
    if (!version) problems.push(`${where}: missing ?v=`);
    else versions.set(where, version);
  }
}

collect(join(docs, 'index.html'), /(?:src|href)="(\.\/assets\/[^"?]+\.(?:js|css))(?:\?v=(\d+))?"/g);
for (const name of readdirSync(assets).filter(name => name.endsWith('.js'))) {
  const file = join(assets, name);
  collect(file, /\bfrom\s+'(\.\/[^'?]+\.js)(?:\?v=(\d+))?'/g);
  collect(file, /\bimport\(\s*'(\.\/[^'?]+\.js)(?:\?v=(\d+))?'\s*\)/g);
  try {
    execFileSync(process.execPath, ['--check', file], {stdio: 'pipe'});
  } catch (error) {
    problems.push(`${relative(docs, file)}: ${String(error.stderr).trim()}`);
  }
}

// Every picture listed in `logos` in teams.js must exist. Each should also have a
// small copy under logos/thumbs/ (python3 tools/thumbs.py) with the same shape;
// a missing or outdated one is only a warning, since the cards then fall back
// to the full picture.
const {logos} = await import(pathToFileURL(join(assets, 'teams.js')).href);
const warnings = [];
function size(file) {
  const b = readFileSync(file);
  if (b.readUInt32BE(0) === 0x89504e47) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (b[0] === 0xff && b[1] === 0xd8) {
    for (let i = 2; i + 9 < b.length;) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return null;
}
for (const [id, path] of Object.entries(logos)) {
  const file = join(assets, 'logos', path);
  if (!existsSync(file)) {
    problems.push(`teams.js logos.${id} -> logos/${path}: file not found`);
    continue;
  }
  if (!/\.(png|jpe?g)$/i.test(path)) continue;
  const thumb = join(assets, 'logos', 'thumbs', path);
  if (!existsSync(thumb)) {
    warnings.push(`logos/thumbs/${path} is missing (run: python3 tools/thumbs.py)`);
    continue;
  }
  const [a, b] = [size(file), size(thumb)];
  if (a && b && Math.abs(a[0] / a[1] - b[0] / b[1]) > .06 * (a[0] / a[1])) {
    warnings.push(`logos/thumbs/${path} has another shape than the picture, so it looks outdated (run: python3 tools/thumbs.py)`);
  }
}
for (const warning of warnings) console.log(process.env.GITHUB_ACTIONS ? `::warning::${warning}` : `Warning: ${warning}`);

const distinct = new Set(versions.values());
if (distinct.size > 1) {
  problems.push('?v= versions differ:\n' + [...versions].map(([where, v]) => `  ${where}?v=${v}`).join('\n'));
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`OK: ${versions.size} asset references, all ?v=${[...distinct][0]}`);
