import {groups, teams, styles, slogans, byId, logos, logoVersion, isZh} from './teams.js?v=25';
import {layout, paint, crop, demoPhoto, luminance, fontFaces, titleLine, retiredLine, cardInfo, wordsFor} from './render.js?v=25';
import {venue, kit, trim, drawMotif} from './art.js?v=25';
import {photoDate, photoTurn, readStart} from './photo-date.js?v=25';
import {openDialog, closeDialog, isOpen} from './dialog.js?v=25';

const $ = id => document.getElementById(id);
const root = document.documentElement;
// Flex gap arrived in Safari 14.1 and Chrome 84; older phones get margins instead.
(function checkFlexGap() {
  const box = document.createElement('div');
  box.style.display = 'flex';
  box.style.flexDirection = 'column';
  box.style.rowGap = '1px';
  box.appendChild(document.createElement('div'));
  box.appendChild(document.createElement('div'));
  document.body.appendChild(box);
  const works = box.scrollHeight === 1;
  box.parentNode.removeChild(box);
  if (!works) root.classList.add('no-flex-gap');
})();
const stage = $('stage');
const stagePanel = $('stage-panel');
const preview = $('preview');
const fileInput = $('file');
const bar = $('bar');
const barMain = $('bar-main');
const barPick = $('bar-pick');
const resultDialog = $('result');
const download = $('download');
const share = $('share');
const nameInput = $('name');
const numberInput = $('number');
const sloganInput = $('slogan');
const dateInput = $('date');
const markInput = $('mark');

const ratios = [['original', '原图'], ['3:4', '3:4'], ['1:1', '1:1'], ['9:16', '9:16']];
const maxImportSize = 50 * 1024 * 1024;
// A small file can still hold an enormous picture; decoding it could run a phone
// out of memory. 250 million pixels leaves room for 200-megapixel camera photos.
const maxImportPixels = 250000000;
// iPhones refuse canvases over about 16.7 million pixels, so the finished picture
// stays under that, and its long edge under 4096.
const exportEdge = 4096;
const exportPixels = 16000000;
const previewEdge = 1400;
const thumbEdge = 400;

const ua = navigator.userAgent;
const isApple = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
// WeChat's own browser cannot download files; a long press on the picture saves it.
// QQ, Weibo, DingTalk and Alipay open links in similar built-in browsers.
const isWeChat = /MicroMessenger/i.test(ua);
const longPressSave = isWeChat || /\bQQ\/|Weibo|DingTalk|AlipayClient/i.test(ua);
const isAndroid = /Android|HarmonyOS|OpenHarmony/i.test(ua);
const coarsePointer = window.matchMedia('(pointer: coarse)');
const wide = window.matchMedia('(min-width: 900px)');
const calmMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const storeKey = 'hot-choices-v1';
const state = {
  group: 'hoops',
  team: byId.get('lakers'),
  style: 'jersey',
  ratio: 'original',
  x: .5,
  y: .5,
  name: '',
  number: '',
  slogan: '',
  date: false,
  mark: true,
  // Which trading card comes out of the pack; 再抽一张 picks a new one.
  seed: newSeed(),
};

function newSeed() {
  return Math.floor(Math.random() * 4294967296) >>> 0;
}
// image is full size for saving; the smaller copies keep redraws fast.
let image = null;
let previewSource = null;
let thumbSource = null;
let own = false;
let taken = null;
let importVersion = 0;
let reading = false;
let exporting = false;
let unsaved = false;
let savedNote = false;
// A finished photo was made but not saved yet (the window was closed first).
let madeNotSaved = false;
let problem = '';
let exportNumber = 0;
let resultUrl = '';
let resultFile = null;
// On iPhone (iOS 15 and 16, WebKit bug 231995), choosing 存储图像 in the share
// sheet saves the photo but the share never finishes, and every later share fails
// until the page is reloaded. Once that happens the page stops offering the share
// sheet and asks for a long press on the photo instead.
let sharePending = false;
let shareBroken = false;
let fontsReady = false;

// ---------- Choices kept between visits ----------

function loadChoices() {
  try {
    const saved = JSON.parse(localStorage.getItem(storeKey) || 'null');
    if (!saved || typeof saved !== 'object') {
      cardLink();
      return;
    }
    if (byId.has(saved.team)) {
      state.team = byId.get(saved.team);
      state.group = state.team.group;
    }
    if (styles.some(item => item[0] === saved.style)) state.style = saved.style;
    if (ratios.some(item => item[0] === saved.ratio)) state.ratio = saved.ratio;
    if (typeof saved.name === 'string') state.name = saved.name.slice(0, 14);
    if (typeof saved.number === 'string' && /^\d{0,2}$/.test(saved.number)) state.number = saved.number;
    if (typeof saved.slogan === 'string') state.slogan = saved.slogan.slice(0, 24);
    state.date = saved.date === true;
    state.mark = saved.mark !== false;
    if (typeof saved.seed === 'number' && saved.seed >= 0 && saved.seed < 4294967296) state.seed = Math.floor(saved.seed);
  } catch (error) {
    // Private browsing or blocked storage: start fresh.
  }
  cardLink();
}

// A link to one card: #card=<number>, with &team=<id> for another team. It opens
// that exact pull, so a card can be shown again or checked.
function cardLink() {
  const link = /^#card=(\d{1,10})(?:&team=([\w-]+))?$/.exec(location.hash || '');
  if (link && Number(link[1]) < 4294967296) {
    state.seed = Number(link[1]);
    state.style = 'card';
    if (link[2] && byId.has(link[2])) {
      state.team = byId.get(link[2]);
      state.group = state.team.group;
    }
  }
}

let storeTimer = 0;
function storeChoices() {
  clearTimeout(storeTimer);
  storeTimer = setTimeout(() => {
    try {
      localStorage.setItem(storeKey, JSON.stringify({
        team: state.team.id, style: state.style, ratio: state.ratio,
        name: state.name, number: state.number, slogan: state.slogan, date: state.date, mark: state.mark, seed: state.seed,
      }));
    } catch (error) {
      // Nothing to do: the choices simply are not remembered.
    }
  }, 300);
}

// ---------- Words on the frame ----------

function dateText() {
  if (!state.date) return '';
  const now = new Date();
  const d = taken || {year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate()};
  return `${d.year}.${d.month}.${d.day}`;
}

function words() {
  return {
    name: (state.name.trim() || 'HOME').toUpperCase(),
    number: state.number || state.team.number,
    slogan: state.slogan.trim() || state.team.slogan,
    date: dateText(),
    seed: state.seed,
  };
}

// ---------- Logos ----------

const logoImages = new Map();
const logoWaits = new Map();
function logoUrl(id) {
  return logos[id] ? `./assets/logos/${logos[id]}?v=${logoVersion}` : '';
}
// The small copy the team cards show (tools/thumbs.py makes them). If a picture
// has no small copy yet, the card falls back to the full picture.
function thumbUrl(id) {
  return logos[id] && /\.(png|jpe?g)$/i.test(logos[id]) ? `./assets/logos/thumbs/${logos[id]}?v=${logoVersion}` : logoUrl(id);
}
function fallBackToFull(img, id) {
  if (!img) return;
  img.onerror = () => {
    img.onerror = null;
    if (img.getAttribute('src') !== logoUrl(id)) img.src = logoUrl(id);
  };
}
// The loaded logo for a team, or null; starts loading it the first time.
function logoFor(team) {
  if (!logos[team.id]) return playGroup(team.group) ? nameBadge(team) : null;
  if (!logoImages.has(team.id)) {
    const logo = new Image();
    logoImages.set(team.id, null);
    logoWaits.set(team.id, new Promise(resolve => {
      logo.onload = () => {
        logo.photoStill = /\.jpe?g$/i.test(logos[team.id]);
        logoImages.set(team.id, logo);
        requestRender(true);
        resolve();
      };
      logo.onerror = resolve;
    }));
    logo.src = logoUrl(team.id);
  }
  return logoImages.get(team.id);
}
// A character with no artwork of its own gets a round name badge in its colours
// instead: the series emblem, the Chinese name big and the English name under it,
// so the photo still carries a big, bright mark. Kept once the page's fonts are in.
const nameBadges = new Map();
const BADGE_CJK = '"PingFang SC", "HarmonyOS Sans SC", "MiSans", "Microsoft YaHei", "Noto Sans CJK SC", "Source Han Sans SC", system-ui, sans-serif';
function nameBadge(team) {
  if (nameBadges.has(team.id)) return nameBadges.get(team.id);
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  c.nameBadge = true;
  const x = c.getContext('2d');
  const ring = luminance(team.c2) > .85 && luminance(team.c1) > .85 ? team.ink : (team.c2 === team.c1 ? team.accent : team.c2);
  const ink = team.ink || '#ffffff';
  x.fillStyle = ring;
  x.beginPath();
  x.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = team.c1;
  x.beginPath();
  x.arc(S / 2, S / 2, S * .44, 0, Math.PI * 2);
  x.fill();
  x.strokeStyle = team.accent || ink;
  x.lineWidth = S * .014;
  x.beginPath();
  x.arc(S / 2, S / 2, S * .405, 0, Math.PI * 2);
  x.stroke();
  // The series emblem, faint and large behind, then small and bright on top.
  x.save();
  x.globalAlpha = .14;
  drawMotif(x, team.motif, S / 2, S / 2, S * .7, ink, team.c1, team.accent);
  x.restore();
  drawMotif(x, team.motif, S / 2, S * .25, S * .15, ink, team.c1, team.accent);
  const fitText = (text, max, size, family, weight, spacing) => {
    let px = size;
    for (;;) {
      x.font = `${weight} ${Math.round(px)}px ${family}`;
      if ('letterSpacing' in x) x.letterSpacing = `${Math.round(px * spacing)}px`;
      if (x.measureText(text).width <= max || px < 12) return px;
      px *= .92;
    }
  };
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillStyle = ink;
  // A long name like 卡尔·海因茨·施奈德 goes by its last part on the badge.
  const full = team.cn || team.short;
  const cn = Array.from(full).length > 5 && full.indexOf('·') >= 0 ? full.split('·').pop() : full;
  fitText(cn, S * .72, S * (Array.from(cn).length <= 2 ? .27 : .2), BADGE_CJK, 900, .02);
  x.fillText(cn, S / 2, S * .52);
  fitText(team.short, S * .56, S * .085, '"HOT Display", "Arial Black", Impact, sans-serif', 400, .12);
  x.fillText(team.short, S / 2, S * .73);
  if ('letterSpacing' in x) x.letterSpacing = '0px';
  const fontsIn = !document.fonts || document.fonts.status === 'loaded';
  if (fontsIn) nameBadges.set(team.id, c);
  else if (!nameBadges.has('wait')) {
    nameBadges.set('wait', true);
    document.fonts.ready.then(() => {
      for (const key of Array.from(nameBadges.keys())) if (nameBadges.get(key) !== true) nameBadges.delete(key);
      nameBadges.delete('wait');
      requestRender(true);
    });
  }
  return c;
}
// Waits (a few seconds at most) for the team's logo, so a saved picture has it.
function logoReady(team) {
  logoFor(team);
  const wait = logoWaits.get(team.id);
  if (!wait) return Promise.resolve();
  return Promise.race([wait, new Promise(resolve => setTimeout(resolve, 4000))]);
}

// ---------- Drawing ----------

function windowShape(source) {
  if (state.ratio === 'original') return [source.width, source.height];
  const [a, b] = state.ratio.split(':').map(Number);
  return [a, b];
}

function look() {
  return {x: state.x, y: state.y, logo: logoFor(state.team), mark: state.mark};
}

let frame = 0;
let thumbsDirty = true;
let lastLayout = null;
function requestRender(thumbs = false) {
  if (thumbs) thumbsDirty = true;
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    render();
  });
}

function render() {
  if (!previewSource || !fontsReady) return;
  const [w, h] = windowShape(previewSource);
  const box = stage.getBoundingClientRect();
  const style = getComputedStyle(stage);
  const room = [
    box.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
    box.height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom),
  ];
  const scale = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  const edge = Math.min(previewEdge, Math.max(320, Math.max(room[0], room[1]) * scale));
  const L = layout(state.style, w, h, edge);
  paint(preview, previewSource, state.team, state.style, words(), L, look());
  lastLayout = L;
  const fit = Math.max(0, Math.min(room[0] / L.W, room[1] / L.H));
  preview.style.width = `${Math.floor(L.W * fit)}px`;
  preview.style.height = `${Math.floor(L.H * fit)}px`;
  const styleName = styles.find(item => item[0] === state.style)[1];
  preview.setAttribute('aria-label', `${own ? '你的照片' : '示例照片'}，${state.team.name}，${styleName}款式`);
  updateDrag();
  updateCardNote();
  drawVenue();
  paintSwatches();
  if (thumbsDirty) drawThumbs();
}

// ---------- The home floor behind the preview ----------

const venueCanvas = $('venue');
let venueKey = '';
function drawVenue() {
  const team = state.team;
  const w = stage.clientWidth;
  const h = stage.clientHeight;
  if (!w || !h) return;
  const scale = Math.min(1.5, Math.max(1, window.devicePixelRatio || 1));
  const key = `${team.id} ${w} ${h} ${scale} ${document.fonts ? document.fonts.status : ''}`;
  if (key === venueKey) return;
  venueKey = key;
  const W = Math.round(w * scale);
  const H = Math.round(h * scale);
  venueCanvas.width = W;
  venueCanvas.height = H;
  const ctx = venueCanvas.getContext('2d');
  // The floor fills the whole stage, seen from above, with the lights dimmed.
  venue(ctx, team, W, H);
  const shade = ctx.createRadialGradient(W / 2, H * .45, Math.min(W, H) * .2, W / 2, H * .5, Math.max(W, H) * .75);
  shade.addColorStop(0, 'rgba(8,8,8,.42)');
  shade.addColorStop(1, 'rgba(8,8,8,.86)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);
  // A wash of the team colour from the top, like arena lights on the floor.
  const wash = ctx.createLinearGradient(0, 0, 0, H);
  const glow = luminance(team.c1) < .02 ? team.c2 : team.c1;
  const n = parseInt(glow.slice(1), 16);
  wash.addColorStop(0, `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},.5)`);
  wash.addColorStop(.6, `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},0)`);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);
  // The team's name painted huge across the floor, and its emblem at centre court.
  const u = Math.min(W, H) / 100;
  ctx.save();
  ctx.globalAlpha = .1;
  drawMotif(ctx, team.motif, W / 2, H / 2, Math.min(W, H) * .9, '#ffffff', 'rgba(0,0,0,0)', '#ffffff');
  ctx.restore();
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,.07)';
  ctx.font = `400 ${Math.round(Math.min(H * .34, W * 1.5 / Math.max(4, team.short.length)))}px "HOT Display", Impact, sans-serif`;
  ctx.fillText(team.short, W / 2, H * .5);
  ctx.restore();
  // Small print down both sides: founding year and home on the left, titles on the right.
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,.5)';
  ctx.font = `800 ${Math.round(Math.max(10 * scale, u * 3.2))}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  const side = (text, x, turn) => {
    ctx.save();
    ctx.translate(x, H / 2);
    ctx.rotate(turn);
    ctx.fillText(text, 0, 0);
    ctx.restore();
  };
  side(`${playGroup(team.group) ? wordsFor(team).est : 'EST.'} ${team.est} · ${team.home}`, u * 5, -Math.PI / 2);
  side(titleLine(team), W - u * 5, Math.PI / 2);
  ctx.restore();
}

function drawThumbs() {
  thumbsDirty = false;
  if (!thumbSource) return;
  const [w, h] = windowShape(thumbSource);
  const scale = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  for (const card of $('styles').children) {
    const canvas = card.querySelector('canvas');
    const holder = canvas.parentElement;
    const edge = Math.max(holder.clientWidth, holder.clientHeight, 96) * scale;
    const L = layout(card.dataset.style, w, h, edge);
    paint(canvas, thumbSource, state.team, card.dataset.style, words(), L, look());
    const fit = Math.min(holder.clientWidth / L.W, holder.clientHeight / L.H) || 0;
    canvas.style.width = `${Math.floor(L.W * fit)}px`;
    canvas.style.height = `${Math.floor(L.H * fit)}px`;
  }
}

// The page wears the team's colours.
function theme() {
  const {c1, c2, c3} = state.team;
  const style = root.style;
  style.setProperty('--c1', luminance(c1) < .02 ? c2 : c1);
  // The brightest team colour that still stands out on the dark page.
  const hl = [c2, c3, c1].find(colour => luminance(colour) > .2) || '#ffffff';
  style.setProperty('--hl', hl);
  style.setProperty('--hl-ink', luminance(hl) > .45 ? '#111111' : '#ffffff');
  const glow = luminance(c1) < .02 ? c2 : c1;
  const n = parseInt(glow.slice(1), 16);
  style.setProperty('--glow', `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, .42)`);
}

// ---------- Choice buttons ----------

function makeButton(className, html, label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.innerHTML = html;
  if (label) button.setAttribute('aria-label', label);
  return button;
}

const escape = text => String(text).replace(/[&<>"]/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[ch]);

// Two rows of groups: sports and schools, then anime, cards and games. Each row
// scrolls sideways on its own.
function drawGroups() {
  const box = $('groups');
  box.textContent = '';
  for (const [kind, title, short] of [['', '体育和名校', '体育名校'], ['play', '动漫、卡牌和游戏', '动漫游戏']]) {
    const row = document.createElement('div');
    row.className = 'groups';
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', title);
    const head = document.createElement('span');
    head.className = 'group-head';
    head.textContent = short;
    head.setAttribute('aria-hidden', 'true');
    row.append(head);
    for (const [id, label, note, own] of groups) {
      if ((own || '') !== kind) continue;
      const chip = makeButton('chip', `${escape(label)}<small>${escape(note)}</small>`);
      chip.dataset.group = id;
      chip.setAttribute('aria-pressed', String(id === state.group));
      row.append(chip);
    }
    box.append(row);
  }
}

// Whether a group is one of the anime, card and game series.
const playGroup = id => groups.some(item => item[0] === id && item[3] === 'play');

function drawTeams() {
  const box = $('teams');
  box.classList.toggle('dragonball-roster', state.group === 'dragonball');
  box.setAttribute('aria-label', playGroup(state.group) ? '角色' : '主队');
  const cards = document.createDocumentFragment();
  for (const team of teams.filter(item => item.group === state.group)) {
    const label = isZh(team) ? team.nick : team.cn;
    const cardLabel = team.variant ? label + " · " + team.variant : label;
    const logo = logos[team.id] ? `<img src="${escape(thumbUrl(team.id))}" alt="" loading="lazy" decoding="async">` : '';
    const description = team.variant || team.name === team.cn ? cardLabel : team.cn;
    const card = makeButton('team', `<span class="swatch"><canvas aria-hidden="true"></canvas>${logo}</span><b>${escape(team.short)}</b><small>${escape(cardLabel)}</small>`,
      description === team.name ? team.name : `${team.name}，${description}`);
    card.dataset.team = team.id;
    fallBackToFull(card.querySelector('.swatch img'), team.id);
    card.title = team.variant ? `${team.name} · ${team.variant}` : team.name;
    card.setAttribute('aria-pressed', String(team === state.team));
    const swatch = card.firstElementChild;
    swatch.style.setProperty('--a', team.c1);
    swatch.style.setProperty('--b', team.c2);
    swatch.style.setProperty('--c', team.c3);
    cards.append(card);
  }
  box.textContent = '';
  box.append(cards);
  box.scrollTop = 0;
  paintSwatches();
}

// Each team card shows a piece of its shirt: the kit pattern, trim and emblem.
function paintSwatches() {
  const scale = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  for (const card of $('teams').children) {
    const team = byId.get(card.dataset.team);
    const canvas = card.querySelector('canvas');
    const w = Math.round((canvas.parentElement.clientWidth || 100) * scale);
    const h = Math.round((canvas.parentElement.clientHeight || 48) * scale);
    if (canvas.width === w && canvas.height === h && canvas.dataset.team === team.id) continue;
    canvas.width = w;
    canvas.height = h;
    canvas.dataset.team = team.id;
    const ctx = canvas.getContext('2d');
    const m = h / 5;
    kit(ctx, team, 0, 0, w, h, m);
    trim(ctx, team, 0, h - m * .9, w, m * .9);
    if (team.stars) {
      ctx.fillStyle = team.starColour || team.ink;
      for (let k = 0; k < team.stars; k++) {
        const x = w - m * .7 - k * m * .9;
        const y = m * .75;
        ctx.beginPath();
        for (let p = 0; p < 10; p++) {
          const a = p * Math.PI / 5 - Math.PI / 2;
          const r = p % 2 ? m * .16 : m * .38;
          ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        }
        ctx.fill();
      }
    }
    if (!logos[team.id]) drawMotif(ctx, team.motif, w / 2, h * .44, h * .7, team.ink, team.c1, team.accent);
  }
}

// The team's file: founding year, home, titles, legends, chant and big moments.
function drawDossier() {
  const team = state.team;
  // A character is printed as itself, not as a crest.
  const crest = $('mark-text');
  if (crest) crest.innerHTML = playGroup(team.group) ? '照片上加角色 <small>角色贴纸和水印</small>' : '照片上加队徽 <small>队徽贴纸和水印</small>';
  const box = $('dossier');
  const fact = (label, value) => value ? `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>` : '';
  const home = team.homeNick ? `${team.home} · ${team.homeNick}` : team.home;
  const moments = (team.moments || []).map(([year, en, cn]) =>
    `<li><b>${escape(year)}</b><span>${escape(en)}<small>${escape(cn)}</small></span></li>`).join('');
  const zh = isZh(team);
  const extra = [team.motto ? `${zh ? '校训' : 'MOTTO'} · ${team.motto}` : '', team.mascot ? `${zh ? '吉祥物' : 'MASCOT'} · ${team.mascot}` : '']
    .concat((team.facts || []).map(([label, value]) => `${label} · ${value}`))
    .filter(Boolean).map(line => `<p class="d-line">${escape(line)}</p>`).join('');
  const said = wordsFor(team);
  box.innerHTML = `<header><span class="d-badge${logos[team.id] ? ' has-logo' : ''}"><canvas aria-hidden="true"></canvas>${logos[team.id] ? `<img src="${escape(thumbUrl(team.id))}" alt="">` : ''}</span><div><b>${escape(team.name)}</b><small>${escape(zh ? team.city : team.cn)} · ${escape(team.nick)}</small></div></header>`
    + `<dl class="d-facts">${fact(said.est, String(team.est))}${fact(said.home, home)}${fact(zh ? '荣誉' : said.titles, titleLine(team))}</dl>`
    + (team.chant ? `<p class="d-chant">${escape(team.chant)}</p>` : '')
    + (moments ? `<ol class="d-moments">${moments}</ol>` : '')
    + `<p class="d-line">${escape(retiredLine(team))}</p>${extra}`
    + (team.story ? `<p class="d-story">${escape(team.story)}</p>` : '');
  fallBackToFull(box.querySelector('.d-badge img'), team.id);
  box.style.setProperty('--d1', team.c1);
  box.style.setProperty('--d2', team.c2);
  const canvas = box.querySelector('canvas');
  const scale = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  const size = Math.round(52 * scale);
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  kit(ctx, team, 0, 0, size, size, size / 6);
  if (!logos[team.id]) drawMotif(ctx, team.motif, size / 2, size / 2, size * .74, team.ink, team.c1, team.accent);
}

function drawStyles() {
  const box = $('styles');
  box.textContent = '';
  for (const [id, label, note] of styles) {
    const card = makeButton('style', `<span class="thumb"><canvas aria-hidden="true"></canvas></span><b>${escape(label)}</b><small>${escape(note)}</small>`);
    card.dataset.style = id;
    card.setAttribute('aria-pressed', String(id === state.style));
    box.append(card);
  }
}

function drawRatios() {
  const box = $('ratios');
  box.textContent = '';
  for (const [id, label] of ratios) {
    const chip = makeButton('chip', escape(label), id === 'original' ? '原图比例' : `${label} 比例`);
    chip.dataset.ratio = id;
    chip.setAttribute('aria-pressed', String(id === state.ratio));
    box.append(chip);
  }
}

function drawSlogans() {
  const box = $('slogans');
  box.textContent = '';
  const current = state.slogan.trim() || state.team.slogan;
  for (const text of [state.team.slogan].concat(slogans.filter(item => item !== state.team.slogan))) {
    const chip = makeButton(/[一-鿿]/.test(text) ? 'chip cn' : 'chip', escape(text));
    chip.dataset.slogan = text;
    chip.setAttribute('aria-pressed', String(text === current));
    box.append(chip);
  }
}

function syncPressed(box, key, value) {
  for (const item of box.children) {
    if (item.dataset[key] !== undefined) item.setAttribute('aria-pressed', String(item.dataset[key] === value));
  }
}

function pickTeam(team) {
  if (team === state.team) return;
  state.team = team;
  // The team's own number and chant come along, unless the user typed their own.
  numberInput.placeholder = team.number;
  sloganInput.placeholder = team.slogan;
  syncPressed($('teams'), 'team', team.id);
  theme();
  drawDossier();
  drawSlogans();
  changed();
}

$('groups').addEventListener('click', event => {
  const chip = event.target.closest('[data-group]');
  if (!chip || chip.dataset.group === state.group) return;
  state.group = chip.dataset.group;
  for (const row of $('groups').children) syncPressed(row, 'group', state.group);
  drawTeams();
  // Show the group's first team straight away.
  if (state.team.group !== state.group) pickTeam(teams.find(team => team.group === state.group));
  chip.scrollIntoView && chip.scrollIntoView({block: 'nearest', inline: 'nearest'});
});

$('teams').addEventListener('click', event => {
  const card = event.target.closest('[data-team]');
  if (card) pickTeam(byId.get(card.dataset.team));
});

$('styles').addEventListener('click', event => {
  const card = event.target.closest('[data-style]');
  if (!card || card.dataset.style === state.style) return;
  state.style = card.dataset.style;
  syncPressed($('styles'), 'style', state.style);
  showCardTools();
  changed(false);
});

// ---------- Trading card: the pull and 再抽一张 ----------

// The trading card has its own shape, so the photo-shape chips give way to the
// reroll button and a line saying what came out of the pack.
function showCardTools() {
  const isCard = state.style === 'card';
  $('draw-row').hidden = !isCard;
  $('ratio-row').hidden = isCard;
  updateCardNote();
}

let cardNoteKey = '';
function updateCardNote() {
  if (state.style !== 'card') return;
  const key = `${state.team.id} ${state.seed}`;
  if (key === cardNoteKey) return;
  cardNoteKey = key;
  const info = cardInfo(state.team, state.seed);
  $('draw-note').textContent = `这张：${info.label}`;
  $('draw-note').dataset.tier = info.tier.id;
}

$('draw').addEventListener('click', () => {
  state.seed = newSeed();
  changed();
  if (!calmMotion.matches) {
    stage.classList.remove('pulled');
    // Restart the little flip animation.
    void stage.offsetWidth;
    stage.classList.add('pulled');
  }
});
stage.addEventListener('animationend', () => stage.classList.remove('pulled'));

$('ratios').addEventListener('click', event => {
  const chip = event.target.closest('[data-ratio]');
  if (!chip || chip.dataset.ratio === state.ratio) return;
  state.ratio = chip.dataset.ratio;
  state.x = .5;
  state.y = .5;
  syncPressed($('ratios'), 'ratio', state.ratio);
  changed();
});

$('slogans').addEventListener('click', event => {
  const chip = event.target.closest('[data-slogan]');
  if (!chip) return;
  const text = chip.dataset.slogan;
  state.slogan = text === state.team.slogan ? '' : text;
  sloganInput.value = state.slogan;
  syncPressed($('slogans'), 'slogan', text);
  changed();
});

// Something on the frame changed: redraw, remember, and note that it needs saving.
function changed(thumbs = true) {
  markEdited();
  storeChoices();
  requestRender(thumbs);
}

nameInput.addEventListener('input', () => {
  state.name = nameInput.value;
  changed();
});
numberInput.addEventListener('input', () => {
  const digits = numberInput.value.replace(/\D/g, '').slice(0, 2);
  if (digits !== numberInput.value) numberInput.value = digits;
  state.number = digits;
  changed();
});
sloganInput.addEventListener('input', () => {
  state.slogan = sloganInput.value;
  syncPressed($('slogans'), 'slogan', state.slogan.trim() || state.team.slogan);
  changed();
});
markInput.addEventListener('change', () => {
  state.mark = markInput.checked;
  changed();
});
dateInput.addEventListener('change', () => {
  state.date = dateInput.checked;
  updateDateNote();
  changed();
});
// The keyboard's 完成 key puts the keyboard away.
for (const field of [nameInput, numberInput, sloganInput]) {
  field.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.isComposing) {
      event.preventDefault();
      field.blur();
    }
  });
}

function updateDateNote() {
  const note = $('date-note');
  if (!own) note.textContent = '印上拍照那天，没有就印今天';
  else if (taken) note.textContent = `照片是 ${taken.year}.${taken.month}.${taken.day} 拍的`;
  else note.textContent = '照片里没有拍摄日期，印今天';
}

// ---------- Messages ----------

function showProblem(message, help = '') {
  problem = message;
  $('problem').hidden = !message;
  $('problem-text').textContent = message;
  $('problem-help').hidden = !help;
  $('problem-help').open = false;
  $('problem-help-text').textContent = help + (message && own ? ' 上一张照片还在，可以接着用。' : '');
  updateBar();
  scheduleLayout();
}

// Android phones save at the first tap. Elsewhere the first tap makes the photo
// and a second one saves it, so the button says so instead of promising a save.
function savesDirectly() {
  return coarsePointer.matches && !wide.matches && !isApple && !longPressSave;
}

function updateBar() {
  const busy = reading || exporting;
  barMain.disabled = busy;
  barPick.disabled = busy;
  barPick.hidden = !own;
  barMain.classList.toggle('busy', busy);
  const make = savesDirectly() ? '保存照片' : '做好照片';
  $('bar-main-text').textContent = exporting ? '正在制作…' : reading ? '正在打开…' : own ? make : '选一张照片';
  $('bar-icon').firstElementChild.setAttribute('href', own ? '#i-save' : '#i-photo');
  const hint = $('bar-hint');
  const pending = madeNotSaved && !isOpen(resultDialog);
  hint.textContent = problem || (savedNote ? '✓ 已保存，换个主队再来一张'
    : pending ? `还没存好，再点「${make}」`
    : own ? '换主队、换款式，随时看效果'
    : '照片只在本机处理，不上传');
  hint.classList.toggle('error', Boolean(problem));
  hint.classList.toggle('pending', !problem && pending);
  hint.classList.toggle('saved', !problem && savedNote);
  // The everyday hints can give way on short screens; news about saving cannot.
  hint.classList.toggle('quiet', !problem && !savedNote && !pending);
}

// Any change to the user's photo after saving it needs saving again.
function markEdited() {
  if (!own) return;
  unsaved = true;
  if (savedNote || madeNotSaved) {
    savedNote = false;
    madeNotSaved = false;
    updateBar();
  }
}

// ---------- Opening a photo ----------

function downscale(source, longest) {
  const scale = Math.min(1, longest / Math.max(source.width, source.height));
  if (scale === 1) return source;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

// iPhones cap the memory all canvases may use together, and a dropped canvas keeps
// its share until the browser frees it, so each new photo frees the old copies at once.
function release(source, keep) {
  if (!source || keep.indexOf(source) >= 0) return;
  if (source.close) source.close();
  else if (source instanceof HTMLCanvasElement) {
    source.width = 1;
    source.height = 1;
  }
}

function setImage(photo) {
  const old = [image, previewSource, thumbSource];
  image = photo;
  previewSource = downscale(photo, previewEdge);
  thumbSource = downscale(previewSource, thumbEdge);
  const keep = [image, previewSource, thumbSource];
  for (const source of new Set(old)) release(source, keep);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const photo = new Image();
    photo.onload = () => photo.naturalWidth && photo.naturalHeight ? resolve(photo) : reject(new Error('Empty image'));
    photo.onerror = () => reject(new Error('Unsupported image'));
    photo.src = src;
  });
}

// Chrome 81 and iOS 13.4 on turn photos upright by their EXIF orientation; older
// phones draw them as the sensor saw them. A two-by-one JPEG marked "turn a quarter"
// tells which: upright-turning browsers report it one pixel wide.
let turnsByItself = null;
function browserTurnsPhotos() {
  if (!turnsByItself) {
    turnsByItself = new Promise(resolve => {
      const canvas = document.createElement('canvas');
      canvas.width = 2;
      canvas.height = 1;
      const jpeg = atob(canvas.toDataURL('image/jpeg').split(',')[1]);
      if (jpeg.charCodeAt(0) !== 0xff || jpeg.charCodeAt(1) !== 0xd8) {
        resolve(true);
        return;
      }
      // APP1 "Exif" with one entry: Orientation (0x0112), SHORT, 6.
      const exif = '\xff\xe1\x00\x22Exif\x00\x00MM\x00\x2a\x00\x00\x00\x08\x00\x01'
        + '\x01\x12\x00\x03\x00\x00\x00\x01\x00\x06\x00\x00\x00\x00\x00\x00';
      const marked = jpeg.slice(0, 2) + exif + jpeg.slice(2);
      const bytes = new Uint8Array(marked.length);
      for (let i = 0; i < marked.length; i++) bytes[i] = marked.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([bytes], {type: 'image/jpeg'}));
      const test = new Image();
      test.onload = () => {
        URL.revokeObjectURL(url);
        resolve(test.naturalWidth === 1);
      };
      test.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(true);
      };
      test.src = url;
    });
  }
  return turnsByItself;
}

// Draws the photo upright on an older phone, by its EXIF orientation.
function turnCanvas(ctx, turn, w, h) {
  const [a, b, c, d, e, f] = {
    2: [-1, 0, 0, 1, w, 0], 3: [-1, 0, 0, -1, w, h], 4: [1, 0, 0, -1, 0, h],
    5: [0, 1, 1, 0, 0, 0], 6: [0, 1, -1, 0, w, 0], 7: [0, -1, -1, 0, w, h], 8: [0, -1, 1, 0, 0, h],
  }[turn];
  ctx.transform(a, b, c, d, e, f);
}

async function readPhoto(file) {
  const url = URL.createObjectURL(file);
  try {
    const [photo, upright] = await Promise.all([loadImage(url), browserTurnsPhotos()]);
    const turn = upright ? 1 : await photoTurn(file);
    if (photo.naturalWidth * photo.naturalHeight > maxImportPixels) {
      const error = new Error('Too many pixels');
      error.name = 'TooManyPixels';
      throw error;
    }
    const scale = Math.min(1, exportEdge / Math.max(photo.naturalWidth, photo.naturalHeight),
      Math.sqrt(exportPixels / (photo.naturalWidth * photo.naturalHeight)));
    const width = Math.max(1, Math.round(photo.naturalWidth * scale));
    const height = Math.max(1, Math.round(photo.naturalHeight * scale));
    if (scale < 1 && turn === 1 && typeof createImageBitmap === 'function') {
      try {
        return await createImageBitmap(photo, {
          imageOrientation: 'from-image', resizeWidth: width, resizeHeight: height, resizeQuality: 'high',
        });
      } catch (error) {
        // Older browsers reject these options; the canvas copy below keeps the photo upright.
      }
    }
    // Copy into a canvas so the photo stays drawable after its URL is revoked.
    const canvas = document.createElement('canvas');
    const sideways = turn >= 5;
    canvas.width = sideways ? height : width;
    canvas.height = sideways ? width : height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    if (turn > 1) turnCanvas(ctx, turn, canvas.width, canvas.height);
    ctx.drawImage(photo, 0, 0, width, height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// HEIC and HEIF photos start with an ISO media box whose brand names the format.
async function isHeic(file) {
  if (/\.(heic|heif)$/i.test(file.name || '') || /image\/hei[cf]/.test(file.type)) return true;
  try {
    const bytes = new Uint8Array(await readStart(file, 12));
    const text = String.fromCharCode.apply(null, bytes);
    return text.slice(4, 8) === 'ftyp' && /^(heic|heix|hevc|hevx|heim|heis|mif1|msf1)$/.test(text.slice(8, 12));
  } catch (error) {
    return false;
  }
}

async function importPhoto(file) {
  if (!file) return;
  // Checked before taking over, so a photo still opening keeps going.
  if (file.size > maxImportSize) {
    showProblem('这张照片太大，换一张试试。', '可以在相册里把照片另存一份小一点的，或者截个屏，再选截屏。');
    return;
  }
  const version = ++importVersion;
  reading = true;
  updateBar();
  try {
    const [photo, day] = await Promise.all([readPhoto(file), photoDate(file)]);
    if (version !== importVersion) {
      release(photo, []);
      return;
    }
    const first = !own;
    setImage(photo);
    taken = day;
    own = true;
    unsaved = true;
    savedNote = false;
    madeNotSaved = false;
    state.x = .5;
    state.y = .5;
    showProblem('');
    updateDateNote();
    $('view-open').hidden = false;
    requestRender(true);
    scheduleLayout();
    if (first) showChoices();
  } catch (error) {
    if (version !== importVersion) return;
    const heic = await isHeic(file);
    if (version !== importVersion) return;
    if (error && error.name === 'TooManyPixels') {
      showProblem('这张图太大，换一张试试。', '这张图片的像素太多，手机打不开。可以先把它缩小，或者截个屏，再选截屏。');
    } else if (heic) {
      showProblem('这张打不开，换一张试试。', '这是苹果手机的 HEIC 格式，这个浏览器打不开。可以在相册里另存一份，或者截个屏再选。用 iPhone 的 Safari 打开本页，也能直接选。');
    } else if (file.type && !/^image\//.test(file.type)) {
      showProblem('这不是照片，换一张试试。', '这里只能选照片，请从相册里选一张。');
    } else {
      showProblem('这张打不开，换一张试试。', '可以截个屏，或者在相册里另存为 JPG，再选一次。');
    }
  } finally {
    if (version === importVersion) {
      reading = false;
      updateBar();
    }
  }
}

// Android phones, and WeChat or QQ there, open the photo album only for a plain
// "image/*"; adding .heic to the list makes many of them open a file manager instead.
if (isAndroid || (longPressSave && !isApple)) fileInput.accept = 'image/*';

function pickPhoto() {
  if (reading || exporting) return;
  fileInput.click();
}
barPick.addEventListener('click', pickPhoto);
barMain.addEventListener('click', () => {
  if (barMain.disabled) return;
  if (own) void exportPhoto();
  else pickPhoto();
});
fileInput.addEventListener('change', () => {
  const file = fileInput.files && fileInput.files[0];
  fileInput.value = '';
  void importPhoto(file);
});

// A photo can also be dropped anywhere on the page, or pasted.
let dragDepth = 0;
const isFileDrag = event => Array.prototype.indexOf.call((event.dataTransfer && event.dataTransfer.types) || [], 'Files') >= 0;
function endDrag() {
  dragDepth = 0;
  document.body.classList.remove('dragging-file');
}
document.addEventListener('dragenter', event => {
  if (!isFileDrag(event)) return;
  event.preventDefault();
  dragDepth++;
  document.body.classList.add('dragging-file');
});
document.addEventListener('dragover', event => {
  if (!isFileDrag(event)) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
});
document.addEventListener('dragleave', event => {
  if (!isFileDrag(event)) return;
  dragDepth = Math.max(0, dragDepth - 1);
  if (!dragDepth) endDrag();
});
document.addEventListener('drop', event => {
  if (!isFileDrag(event)) return;
  event.preventDefault();
  endDrag();
  void importPhoto(event.dataTransfer.files[0]);
});
document.addEventListener('paste', event => {
  const files = Array.prototype.slice.call((event.clipboardData && event.clipboardData.files) || []);
  const file = files.find(item => /^image\//.test(item.type));
  if (!file) return;
  event.preventDefault();
  void importPhoto(file);
});

// ---------- Moving the photo inside a cropped window ----------

let drag = null;
let dragAxis = '';

function updateDrag() {
  dragAxis = '';
  if (own && (state.ratio !== 'original' || state.style === 'card') && lastLayout && previewSource) {
    const want = lastLayout.area.w / lastLayout.area.h;
    const have = previewSource.width / previewSource.height;
    if (Math.abs(Math.log(have / want)) > .01) dragAxis = have > want ? 'x' : 'y';
  }
  // iOS 12 has no pointer events, so the photo cannot be dragged there.
  if (!window.PointerEvent) dragAxis = '';
  stage.classList.toggle('can-drag', Boolean(dragAxis));
  stage.classList.toggle('drag-x', dragAxis === 'x');
  stage.classList.toggle('drag-y', dragAxis === 'y');
  $('drag-hint').hidden = !dragAxis;
}

preview.addEventListener('pointerdown', event => {
  if (!dragAxis || event.button > 0 || drag) return;
  const area = lastLayout.area;
  const cut = crop(previewSource, area, state.x, state.y);
  // Screen pixels per photo pixel, then how far the hidden part reaches on screen.
  const perPixel = preview.getBoundingClientRect().width / preview.width * area.w / cut.sw;
  const spare = dragAxis === 'x' ? (previewSource.width - cut.sw) * perPixel : (previewSource.height - cut.sh) * perPixel;
  if (spare < 1) return;
  drag = {id: event.pointerId, x: event.clientX, y: event.clientY, start: dragAxis === 'x' ? state.x : state.y, spare, axis: dragAxis};
  if (preview.setPointerCapture) {
    try {
      preview.setPointerCapture(event.pointerId);
    } catch (error) {
      // Capture is optional.
    }
  }
  stage.classList.add('dragging');
  if (event.pointerType !== 'touch') event.preventDefault();
});
preview.addEventListener('pointermove', event => {
  if (!drag || event.pointerId !== drag.id) return;
  const moved = drag.axis === 'x' ? event.clientX - drag.x : event.clientY - drag.y;
  const value = Math.max(0, Math.min(1, drag.start - moved / drag.spare));
  if (drag.axis === 'x') state.x = value;
  else state.y = value;
  requestRender();
});
function endDragPhoto(event) {
  if (!drag || event.pointerId !== drag.id) return;
  const moved = (drag.axis === 'x' ? state.x : state.y) !== drag.start;
  drag = null;
  stage.classList.remove('dragging');
  // Once they have moved the photo, the hint has done its job.
  if (moved) stage.classList.add('dragged');
  if (moved) changed();
}
preview.addEventListener('pointerup', endDragPhoto);
preview.addEventListener('pointercancel', endDragPhoto);
// A long press would otherwise open the image menu on phones.
preview.addEventListener('contextmenu', event => {
  if (dragAxis) event.preventDefault();
});

// ---------- Saving ----------

function nextPaint() {
  return new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve)));
}

function dataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function encode(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Empty output')), 'image/jpeg', .93);
  });
}

function clearResult() {
  if (resultUrl) URL.revokeObjectURL(resultUrl);
  $('result-image').removeAttribute('src');
  download.removeAttribute('href');
  $('share-status').textContent = '';
  resultUrl = '';
  resultFile = null;
}

// Team, style, local date and a number, so the file is easy to find in Downloads.
function exportName() {
  const now = new Date();
  const pad = value => String(value).padStart(2, '0');
  const day = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const team = state.team.short.replace(/[^A-Za-z0-9]+/g, '') || state.team.id.toUpperCase();
  // Plain letters only: some download managers and WeChat mangle other characters.
  return `HOT-${team}-${state.style.toUpperCase()}-${day}-${++exportNumber}.jpg`;
}

// Saving by a long press on the photo: WeChat and similar apps always, and
// iPhone Safari once its share sheet has stopped working.
function holdToSave() {
  return longPressSave || (isApple && (shareBroken || !canShareFiles()));
}

// iOS 15 and later can hand a file to the share sheet; older iPhones cannot, and
// their download goes to the Files app (iOS 13-14) or nowhere useful (iOS 12).
let fileShare = null;
function canShareFiles() {
  if (fileShare === null) {
    try {
      fileShare = Boolean(navigator.canShare && typeof File === 'function'
        && navigator.canShare({files: [new File(['x'], 'x.jpg', {type: 'image/jpeg'})]}));
    } catch (error) {
      fileShare = false;
    }
  }
  return fileShare;
}

// What a long press offers is called differently on each phone and iOS version.
function holdLead() {
  if (isWeChat) return '按住下面的照片，选「保存图片」存进相册，或选「发送给朋友」直接发出去。';
  return longPressSave
    ? '按住下面的照片，选「保存图片」，就存进相册了。'
    : '按住下面的照片，选「存储到“照片”」或「存储图像」，就存进相册了。也可以点「下载到文件」。';
}

function showResult() {
  // A share that never finished means the next one would fail (see sharePending).
  if (sharePending) shareBroken = true;
  const hold = holdToSave();
  const canShare = !shareBroken && !isWeChat && Boolean(resultFile && navigator.canShare && navigator.canShare({files: [resultFile]}));
  // On iPhone and iPad, the share sheet is the direct way into Photos.
  const shareFirst = canShare && isApple && !longPressSave;
  share.hidden = !canShare;
  // WeChat and the like cannot download, and the page cannot tell when a download
  // fails there, so they get one way only: the long press.
  download.hidden = longPressSave;
  share.className = `button ${shareFirst ? 'primary' : 'secondary'}`;
  download.className = `button ${shareFirst || hold ? 'secondary' : 'primary'}`;
  $('result-close').className = 'button ghost';
  $('share-text').textContent = shareFirst ? '保存到相册' : '分享给朋友';
  $('download-text').textContent = shareFirst || (hold && isApple) ? '下载到文件' : '下载照片';
  $('share-status').textContent = '';
  const lead = $('result-lead');
  lead.classList.remove('saved');
  $('result-title').textContent = isWeChat ? '按住照片，保存或发给朋友'
    : hold ? '还差一步：按住照片保存' : '还差一步：把照片存好';
  lead.textContent = hold ? holdLead()
    : shareFirst ? '点「保存到相册」，在弹出的菜单里选「存储图像」。'
    : '点「下载照片」，存到这台设备。';
  // After a long press nothing tells the page whether the photo was saved, so it never claims either.
  madeNotSaved = !hold;
  $('result-close').textContent = madeNotSaved ? '先不存，返回' : '返回';
  if (shareFirst) download.before(share);
  else download.after(share);
  showResultHelp(hold, shareFirst);
  if (!isOpen(resultDialog)) openDialog(resultDialog, barMain);
  updateBar();
}

function showResultHelp(hold, shareFirst) {
  const [title, text] = longPressSave
    ? ['按住照片没反应？', '点右上角的「···」，选「在浏览器打开」（iPhone 上是「在 Safari 中打开」），再做一次。']
    : hold ? ['按住照片没反应？', '点「下载到文件」，照片会存进「文件」App 的「下载项」。']
    : shareFirst ? ['找不到照片？', '选了「存储图像」的在「照片」App 里；点「下载到文件」的在「文件」App 的「下载项」里，名字以 HOT 开头。']
    : isApple ? ['找不到照片？', '在「文件」App 的「下载项」里，名字以 HOT 开头。']
    : ['找不到照片？', '在浏览器的「下载」里，或手机「文件管理」的「下载」文件夹里，名字以 HOT 开头。手机相册里一般也能看到。'];
  $('result-help').open = false;
  $('result-help-title').textContent = title;
  $('result-help-text').textContent = text;
}

// Saved: say so in the window and keep saying it on the page after it closes.
function markSaved(message, title = '✓ 照片已保存') {
  unsaved = false;
  savedNote = true;
  madeNotSaved = false;
  $('result-title').textContent = title;
  $('result-close').textContent = '返回，再做一张';
  $('result-close').className = 'button primary';
  download.className = 'button secondary';
  share.className = 'button secondary';
  const lead = $('result-lead');
  lead.textContent = message;
  lead.classList.add('saved');
  updateBar();
}

resultDialog.addEventListener('close', updateBar);
$('result-close').addEventListener('click', () => closeDialog(resultDialog));

async function exportPhoto() {
  if (!own || reading || exporting || !image) return;
  exporting = true;
  updateBar();
  const version = importVersion;
  const canvas = document.createElement('canvas');
  try {
    await Promise.all([fontsForSaving(), logoReady(state.team)]);
    // Painting the full-size photo blocks the page for a moment, so show 正在制作… first.
    await nextPaint();
    if (version !== importVersion) return;
    const [w, h] = windowShape(image);
    paint(canvas, image, state.team, state.style, words(), layout(state.style, w, h, exportEdge, exportPixels), look());
    const blob = await encode(canvas);
    if (version !== importVersion) return;
    clearResult();
    resultUrl = URL.createObjectURL(blob);
    const filename = exportName();
    if (sharePending) shareBroken = true;
    // WeChat's long-press menu cannot save a blob: picture, so it gets the image data itself.
    $('result-image').src = holdToSave() ? await dataUrl(blob) : resultUrl;
    if (version !== importVersion) return;
    download.href = resultUrl;
    download.download = filename;
    if (typeof File === 'function') {
      try {
        resultFile = new File([blob], filename, {type: 'image/jpeg'});
      } catch (error) {
        resultFile = null;
      }
    }
    if (problem) showProblem('');
    showResult();
    if (savesDirectly()) download.click();
  } catch (error) {
    if (version === importVersion) showProblem('这次没做好，再点一次试试。', '照片可能太大了。可以换一张小一点的，或者截个屏再选。');
  } finally {
    canvas.width = 1;
    canvas.height = 1;
    exporting = false;
    updateBar();
  }
}

download.addEventListener('click', () => {
  $('share-status').textContent = '';
  markSaved(isApple ? '已存进「文件」App 的「下载项」。'
    : isAndroid ? '在手机的「下载」里，相册里一般也能看到。没找到的话，按住上面的照片保存。'
    : '已存进这台设备的「下载」文件夹。');
  $('download-text').textContent = '再存一次';
});

// The share sheet stopped working (see sharePending): switch this window to a
// long press on the photo, and say that the last 存储图像 most likely worked.
async function shareStuck() {
  shareBroken = true;
  share.hidden = true;
  madeNotSaved = false;
  const file = resultFile;
  $('result-close').textContent = '返回';
  $('share-status').textContent = '';
  $('result-title').textContent = '换个方法：按住照片保存';
  $('result-lead').textContent = `${sharePending ? '刚才如果选了「存储图像」，那张已经存进相册了。' : ''}${holdLead()}`;
  $('result-lead').classList.remove('saved');
  download.className = 'button primary';
  $('download-text').textContent = '下载到文件';
  showResultHelp(true, false);
  updateBar();
  try {
    const data = await dataUrl(file);
    if (file === resultFile) $('result-image').src = data;
  } catch (error) {
    // The blob: picture stays; Safari can usually save that too.
  }
}

let shareStarted = 0;
share.addEventListener('click', async () => {
  // A quick second tap while the share sheet is still opening is a double tap, not
  // a sign that the sheet is stuck.
  if (sharePending && (!isApple || Date.now() - shareStarted < 1500)) return;
  if (isApple && sharePending) {
    void shareStuck();
    return;
  }
  sharePending = true;
  shareStarted = Date.now();
  try {
    await navigator.share({files: [resultFile]});
    sharePending = false;
    $('share-status').textContent = '';
    if (isApple) markSaved('如果选了「存储图像」，照片就在相册里了。', '✓ 好了');
    else {
      unsaved = false;
      madeNotSaved = false;
      updateBar();
    }
  } catch (error) {
    sharePending = false;
    if (error && error.name === 'AbortError') return;
    if (isApple) {
      void shareStuck();
      return;
    }
    shareBroken = true;
    share.hidden = true;
    $('share-status').textContent = '分享菜单打不开。请点「下载照片」，或按住照片保存。';
  }
});

// ---------- Big view ----------

let zoomed = false;
function drawView(zoom) {
  const canvas = $('view-canvas');
  const scroll = $('view-scroll');
  const [w, h] = windowShape(image);
  const L = layout(state.style, w, h, zoom ? 3200 : 1600, zoom ? 9000000 : Infinity);
  paint(canvas, zoom ? image : previewSource, state.team, state.style, words(), L, look());
  zoomed = zoom;
  scroll.classList.toggle('zoomed', zoom);
  canvas.style.width = zoom ? `${Math.round(scroll.clientWidth * 2)}px` : '';
  scroll.scrollTo(0, 0);
  if (zoom) scroll.scrollTo((scroll.scrollWidth - scroll.clientWidth) / 2, (scroll.scrollHeight - scroll.clientHeight) / 2);
  $('view-zoom').setAttribute('aria-pressed', String(zoom));
  $('view-zoom').textContent = zoom ? '看整张' : '放大看清楚';
}
$('view-open').addEventListener('click', () => {
  if (!image) return;
  openDialog($('view'), $('view-open'));
  drawView(false);
});
$('view-zoom').addEventListener('click', () => drawView(!zoomed));
$('view-canvas').addEventListener('click', () => drawView(!zoomed));
$('view-close').addEventListener('click', () => closeDialog($('view')));
// The enlarged picture can take 30 MB; iPhones cap all canvases together, so let it go on close.
$('view').addEventListener('close', () => {
  const canvas = $('view-canvas');
  canvas.width = 1;
  canvas.height = 1;
  zoomed = false;
});

// ---------- Help ----------

function helpSave() {
  const make = savesDirectly() ? '保存照片' : '做好照片';
  $('help-save').innerHTML = '<b>保存</b>：' + escape(savesDirectly() ? `点「${make}」，照片会存进手机的「下载」。`
    : isWeChat ? `点「${make}」，再按住照片，选「保存图片」或「发送给朋友」。`
    : longPressSave ? `点「${make}」，再按住照片，选「保存图片」。`
    : isApple ? `点「${make}」，再点「保存到相册」。`
    : `点「${make}」，再点「下载照片」。`);
}
$('help-open').addEventListener('click', () => {
  helpSave();
  openDialog($('help'), $('help-open'));
});
$('help-close').addEventListener('click', () => closeDialog($('help')));

// Leaving with a finished but unsaved photo asks first.
window.addEventListener('beforeunload', event => {
  if (!own || !unsaved) return;
  event.preventDefault();
  event.returnValue = '';
});

// ---------- Page layout ----------

// The preview's height follows the window's height only when the phone is turned
// (a new width) or the window really changes size, not when the address bar slides
// away or the keyboard opens. Right after a turn the browser may report the height
// in steps, so for a moment every new value counts.
let steadyWidth = 0;
let steadyHeight = 0;
let steadySince = 0;
let layoutFrame = 0;

function steadyViewHeight() {
  const width = root.clientWidth || window.innerWidth;
  const height = window.innerHeight || root.clientHeight;
  const now = Date.now();
  const field = document.activeElement;
  const typing = field && field.tagName === 'INPUT';
  if (width !== steadyWidth) {
    steadySince = now;
    setTimeout(scheduleLayout, 300);
    setTimeout(scheduleLayout, 900);
  }
  if (!steadyHeight || now - steadySince < 1000 || (!typing && Math.abs(height - steadyHeight) > steadyHeight * .3)) {
    steadyWidth = width;
    steadyHeight = height;
  }
  return steadyHeight;
}

function scheduleLayout() {
  if (layoutFrame) return;
  layoutFrame = requestAnimationFrame(() => {
    layoutFrame = 0;
    layoutPage();
  });
}

let stageHeight = 0;
function layoutPage() {
  const view = steadyViewHeight();
  root.style.setProperty('--bar-h', `${bar.offsetHeight}px`);
  const phone = !wide.matches;
  const rem = parseFloat(getComputedStyle(root).fontSize) || 16;
  // Short screens (a phone on its side, or very large text) let the preview scroll away.
  root.classList.toggle('short-phone', phone && view < 34 * rem);
  let height = 0;
  if (phone) {
    const typing = root.classList.contains('typing');
    // Below half the screen, so the middle of the page (where a tapped control scrolls to) stays clear.
    const portion = root.classList.contains('short-phone') ? .6 : typing ? .3 : view < 700 ? .4 : .44;
    height = Math.round(Math.max(170, Math.min(view * portion, 560)));
  }
  if (height !== stageHeight) {
    stageHeight = height;
    if (height) root.style.setProperty('--stage-h', `${height}px`);
    else root.style.removeProperty('--stage-h');
    requestRender(true);
  }
}

// On phones, a smaller preview while typing leaves room for the field and the keyboard.
function fieldFocus(event) {
  if (wide.matches || !event.target.matches('.field input')) return;
  root.classList.add('typing');
  scheduleLayout();
  const field = event.target;
  setTimeout(() => {
    if (document.activeElement !== field) return;
    const top = stagePanel.getBoundingClientRect().bottom + 8;
    const viewport = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const rect = field.getBoundingClientRect();
    if (rect.top < top) glideBy(rect.top - top);
    else if (rect.bottom > viewport - 12) glideBy(Math.min(rect.bottom - viewport + 12, rect.top - top));
  }, 350);
}
document.addEventListener('focusin', fieldFocus);
document.addEventListener('focusout', event => {
  if (!event.target.matches || !event.target.matches('.field input')) return;
  setTimeout(() => {
    const active = document.activeElement;
    if (active && active.matches && active.matches('.field input')) return;
    root.classList.remove('typing');
    scheduleLayout();
  }, 50);
});

function glideBy(top) {
  if (Math.abs(top) < 1) return;
  if ('scrollBehavior' in root.style && !calmMotion.matches) window.scrollBy({top, behavior: 'smooth'});
  else window.scrollBy(0, top);
}

// After the first photo on a phone, bring the team choices right under the preview.
function showChoices() {
  if (wide.matches || root.classList.contains('short-phone')) return;
  requestAnimationFrame(() => {
    const top = $('step-team').getBoundingClientRect().top - stagePanel.getBoundingClientRect().bottom - 8;
    if (top > 0) glideBy(top);
  });
}

window.addEventListener('resize', scheduleLayout);
function onMediaChange(query, run) {
  if (query.addEventListener) query.addEventListener('change', run);
  else if (query.addListener) query.addListener(run);
}
onMediaChange(wide, () => {
  scheduleLayout();
  updateBar();
});
onMediaChange(coarsePointer, updateBar);
if ('ResizeObserver' in window) {
  new ResizeObserver(() => requestRender(true)).observe(stage);
  new ResizeObserver(scheduleLayout).observe(bar);
}
// iPhone Safari shows the pressed look of buttons (:active) only when the page listens to touches.
document.addEventListener('touchstart', () => {}, {passive: true});

// ---------- Fonts ----------

let fontsWaiting = null;
let fontsLoad = null;
function loadFonts() {
  if (!fontsLoad) {
    fontsLoad = document.fonts && document.fonts.load
      ? Promise.all(fontFaces.map(face => document.fonts.load(face))).catch(() => {})
      : Promise.resolve();
  }
  return fontsLoad;
}

// The saved photo waits longer than the preview for the real fonts, so it never
// goes out in a stand-in font on a slow first visit.
function fontsForSaving() {
  return Promise.race([loadFonts(), new Promise(resolve => setTimeout(resolve, 8000))]);
}

function whenFontsReady() {
  if (!fontsWaiting) {
    const load = loadFonts();
    // A slow connection should not hold the page back: after a moment the frame is
    // drawn with the fallback fonts and redrawn when the real ones arrive.
    const timeout = new Promise(resolve => setTimeout(resolve, 1800));
    fontsWaiting = Promise.race([load, timeout]).then(() => {
      fontsReady = true;
      requestRender(true);
      load.then(() => requestRender(true));
    });
  }
  return fontsWaiting;
}

// ---------- Start ----------

loadChoices();
nameInput.value = state.name;
numberInput.value = state.number;
sloganInput.value = state.slogan;
numberInput.placeholder = state.team.number;
sloganInput.placeholder = state.team.slogan;
dateInput.checked = state.date;
markInput.checked = state.mark;
drawGroups();
drawTeams();
drawStyles();
drawRatios();
showCardTools();
drawSlogans();
theme();
drawDossier();
updateDateNote();
updateBar();
setImage(demoPhoto());
layoutPage();
void whenFontsReady();
// Tells old.js that the page started; very old browsers never get here and see its note.
window.hotAppReady = true;

// Keep the page's files on the phone so the next visit opens without downloading
// them again (see sw.js). WeChat on iPhone has no service workers and skips this.
if ('serviceWorker' in navigator && window.isSecureContext) {
  const register = () => navigator.serviceWorker.register('./sw.js').catch(() => {});
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register);
}
