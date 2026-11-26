// Draws the four frame styles (jersey, ticket, patch, card) on a canvas, from the
// team's colours, its real names, its history (founding year, home, titles,
// retired numbers, big moments) and its official logo (see logos in teams.js),
// plus the words typed in. Chinese teams and schools are printed in Chinese.
import {drawMotif, kit, trim, luminanceOf} from './art.js?v=11';
import {isZh} from './teams.js?v=11';
import {seeded, foilCanvas, holo, sparkles, shards, mix} from './foil.js?v=11';

const TAU = Math.PI * 2;
const CJK = '"PingFang SC", "HarmonyOS Sans SC", "MiSans", "Microsoft YaHei", "Noto Sans CJK SC", "Source Han Sans SC"';
const SANS = `system-ui, -apple-system, "Segoe UI", Roboto, ${CJK}, sans-serif`;
// Anton and Graduate are shipped with the page (assets/fonts), so the big type looks
// the same on iPhone, Android, HarmonyOS and computers. Both come in one weight only.
const DISPLAY = `"HOT Display", "Arial Black", Impact, ${CJK}, sans-serif`;
const VARSITY = `"HOT Varsity", Rockwell, Georgia, ${CJK}, serif`;
// Big Chinese words: the phone's own Chinese font at its heaviest, since the display
// fonts have no Chinese and would fall back to a thin weight.
const HEAVY = `${CJK}, system-ui, sans-serif`;
const HAN = /[\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef]/;
const PAPER = '#f4eee2';
const TABLE = '#141414';

export const fontFaces = ['400 20px "HOT Display"', '400 20px "HOT Varsity"'];

export const luminance = luminanceOf;

const readable = colour => luminance(colour) > .45 ? '#111111' : '#ffffff';
// The team colour that reads best on light paper.
const onPaper = team => luminance(team.c1) > .6 ? team.c2 : team.c1;
// The team colour to use as a solid field: the main one unless it is almost white.
const solid = team => luminance(team.c1) > .75 ? team.c2 : team.c1;

// Words printed on the frames, in English or, for Chinese teams and schools, Chinese.
const WORDS = {
  en: {
    admit: 'ADMIT ONE', est: 'EST.', home: 'HOME', homeGame: 'HOME GAME', titles: 'TITLES',
    gate: 'GATE', sec: 'SEC', row: 'ROW', seat: 'SEAT', holder: 'HOLDER', date: 'DATE',
    tonight: 'TONIGHT', history: 'HISTORY', season: 'SEASON', hello: 'HELLO · 我是', no: 'NO.',
    honours: 'HONOURS', since: 'SINCE',
  },
  zh: {
    admit: '入场券', est: '始于', home: '主场', homeGame: '主场之夜', titles: '冠军',
    gate: '入口', sec: '看台', row: '排', seat: '座', holder: '持票人', date: '日期',
    tonight: '今晚', history: '历史时刻', season: '赛季', hello: '你好 · 我是', no: '号',
    honours: '荣誉', since: '始于',
  },
};
const say = team => WORDS[isZh(team) ? 'zh' : 'en'];
const upper = text => String(text).toUpperCase();

// "17× NBA CHAMPIONS", or the team's own line when it has no title count.
export function titleLine(team) {
  if (!team.titles) return '';
  return team.titles.n ? `${team.titles.n}× ${team.titles.label}` : team.titles.label;
}

// Sets the font. Text with Chinese in it, set in a display face, gets the heavy
// Chinese face instead.
function font(ctx, weight, size, family, spacing = 0, text = '') {
  if (text && (family === DISPLAY || family === VARSITY) && HAN.test(text)) {
    weight = 900;
    family = HEAVY;
    spacing = Math.min(spacing, size * .04);
  }
  ctx.font = `${weight} ${Math.max(1, Math.round(size))}px ${family}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.round(spacing)}px`;
}

// Width of the text in the current font. Some browsers leave letter spacing out of
// measureText, so it is added back when they do.
let spacingMeasured = null;
function measure(ctx, text) {
  const width = ctx.measureText(text).width;
  if (!('letterSpacing' in ctx)) return width;
  const spacing = parseFloat(ctx.letterSpacing) || 0;
  if (!spacing) return width;
  if (spacingMeasured === null) {
    const kept = ctx.letterSpacing;
    ctx.letterSpacing = '0px';
    const plain = ctx.measureText('MMMM').width;
    ctx.letterSpacing = '20px';
    spacingMeasured = ctx.measureText('MMMM').width > plain + 40;
    ctx.letterSpacing = kept;
  }
  return spacingMeasured ? width : width + spacing * Array.from(text).length;
}

// Shrinks the font until the text fits in maxWidth; returns the size used.
function fit(ctx, text, maxWidth, weight, size, family, spacing = 0) {
  font(ctx, weight, size, family, spacing, text);
  let width = measure(ctx, text);
  for (let k = 0; k < 4 && width > maxWidth && width > 0 && size > 1; k++) {
    // Font sizes are whole pixels, so a scaled size can round up: take a pixel off.
    const scale = maxWidth / width;
    const next = Math.min(size * scale, size - 1);
    spacing *= next / size;
    size = next;
    font(ctx, weight, size, family, spacing, text);
    width = measure(ctx, text);
  }
  return size;
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hash(text) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
  return h >>> 0;
}

function star(ctx, x, y, r, colour) {
  ctx.beginPath();
  for (let k = 0; k < 10; k++) {
    const a = k * Math.PI / 5 - Math.PI / 2;
    const rr = k % 2 ? r * .42 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = colour;
  ctx.fill();
}

function shadow(ctx, m, on) {
  ctx.shadowColor = on ? 'rgba(0,0,0,.45)' : 'transparent';
  ctx.shadowBlur = on ? m * .18 : 0;
  ctx.shadowOffsetY = on ? m * .06 : 0;
}

// Text that runs up the page (rotated a quarter turn), centred on (x, y).
function upText(ctx, text, x, y, maxLength, weight, size, family, spacing, colour) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = colour;
  fit(ctx, text, maxLength, weight, size, family, spacing);
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

// Where the photo goes, for a photo window of pw × ph, and the size of the whole picture.
function box(style, pw, ph) {
  const m = Math.min(pw, ph) * .075;
  if (style === 'ticket') {
    // A wide ticket: the photo on the left, the team's file beside it, a stub on the right.
    const o = m * .45;
    const g = ph * .05;
    const P = ph * .84;
    const S = ph * .21;
    const x = o + g;
    const y = o + g;
    return {m, o, g, P, S, W: x + pw + g * .8 + P + g * .7 + S + o, H: y + ph + g + o, area: {x, y, w: pw, h: ph}};
  }
  if (style === 'card') {
    // A standard 63 × 88 mm card, front and back side by side. The card keeps its
    // shape whatever photo shape is chosen; the photo is cut to fit and can be dragged.
    const cw = Math.sqrt(pw * ph) * .86;
    const ch = cw * 88 / 63;
    const pad = cw * .08;
    const gap = cw * .08;
    const b = cw * .055;
    return {
      m: cw * .075, b, W: pad * 2 + cw * 2 + gap, H: ch + pad * 2,
      front: {x: pad, y: pad, w: cw, h: ch},
      back: {x: pad + cw + gap, y: pad, w: cw, h: ch},
      area: {x: pad + b, y: pad + b, w: cw - b * 2, h: ch - b * 2},
    };
  }
  if (style === 'patch') {
    const s = m * 1.45;
    return {m, W: pw + s * 2, H: ph + m * 1.7 + m * 3.3, area: {x: s, y: m * 1.7, w: pw, h: ph}};
  }
  const s = m * 1.15;
  return {m, W: pw + s * 2, H: ph + m * 1.35 + m * 4.9, area: {x: s, y: m * 1.35, w: pw, h: ph}};
}

// Sizes the picture for a photo window shaped width × height: its long edge is at
// most `edge` and it holds at most `pixels` pixels (iPhones refuse larger canvases).
export function layout(style, width, height, edge, pixels = Infinity) {
  const unit = box(style, width, height);
  const scale = Math.min(edge / Math.max(unit.W, unit.H), Math.sqrt(pixels / (unit.W * unit.H)));
  const result = box(style, width * scale, height * scale);
  result.W = Math.max(1, Math.floor(result.W));
  result.H = Math.max(1, Math.floor(result.H));
  return result;
}

// The part of the photo that fills the window: the whole photo when the shapes
// match, otherwise a cut whose position x, y (0 to 1) can be moved by dragging.
export function crop(source, area, x = .5, y = .5) {
  const sw = source.width;
  const sh = source.height;
  const want = area.w / area.h;
  let w = sw;
  let h = sh;
  if (sw / sh > want) w = sh * want;
  else h = sw / want;
  return {sx: (sw - w) * x, sy: (sh - h) * y, sw: w, sh: h};
}

// Draws the logo inside a square of `size` centred on (cx, cy), keeping its shape.
function drawLogo(ctx, logo, cx, cy, size) {
  const w = logo.naturalWidth || logo.width || 1;
  const h = logo.naturalHeight || logo.height || 1;
  const scale = size / Math.max(w, h);
  ctx.drawImage(logo, cx - w * scale / 2, cy - h * scale / 2, w * scale, h * scale);
}

// Logo copies made once and kept: the logo in one flat colour (for watermarks and
// masks), and the logo cut out like a sticker with a white edge around it.
const made = new WeakMap();
function kept(logo, key, make) {
  if (!made.has(logo)) made.set(logo, new Map());
  const box = made.get(logo);
  if (!box.has(key)) box.set(key, make());
  return box.get(key);
}

function flat(logo, colour) {
  return kept(logo, `flat ${colour}`, () => {
    const w = logo.naturalWidth || logo.width || 1;
    const h = logo.naturalHeight || logo.height || 1;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const x = c.getContext('2d');
    x.drawImage(logo, 0, 0, w, h);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = colour;
    x.fillRect(0, 0, w, h);
    return c;
  });
}

// The sticker: the flat white logo drawn in a ring of small steps (that makes the
// edge), then the logo itself on top.
function cutOut(logo, edge) {
  return kept(logo, `sticker ${edge}`, () => {
    const w = logo.naturalWidth || logo.width || 1;
    const h = logo.naturalHeight || logo.height || 1;
    const t = Math.max(w, h) * .05;
    const pad = Math.ceil(t + 2);
    const c = document.createElement('canvas');
    c.width = w + pad * 2;
    c.height = h + pad * 2;
    const x = c.getContext('2d');
    const white = flat(logo, edge);
    for (let k = 0; k < 24; k++) {
      const a = k / 24 * TAU;
      x.drawImage(white, pad + Math.cos(a) * t, pad + Math.sin(a) * t, w, h);
    }
    x.drawImage(white, pad, pad, w, h);
    x.drawImage(logo, pad, pad, w, h);
    return c;
  });
}

// The logo as a die-cut sticker, size being its long side, tilted by `turn`.
function sticker(ctx, logo, cx, cy, size, m, turn = 0, edge = '#ffffff') {
  const art = cutOut(logo, edge);
  const scale = size / Math.max(art.width, art.height);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(turn);
  shadow(ctx, m, true);
  ctx.drawImage(art, -art.width * scale / 2, -art.height * scale / 2, art.width * scale, art.height * scale);
  ctx.restore();
}

// The logo in one colour, faint, as a watermark.
function watermark(ctx, logo, cx, cy, size, colour, alpha, turn = 0) {
  const art = flat(logo, colour);
  const scale = size / Math.max(art.width, art.height);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.rotate(turn);
  ctx.drawImage(art, -art.width * scale / 2, -art.height * scale / 2, art.width * scale, art.height * scale);
  ctx.restore();
}

// The logo repeated in rows over an area, like a monogram print.
function monogram(ctx, logo, x, y, w, h, cell, colour, alpha) {
  const art = flat(logo, colour);
  const size = cell * .5;
  const scale = size / Math.max(art.width, art.height);
  const dw = art.width * scale;
  const dh = art.height * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.globalAlpha = alpha;
  let row = 0;
  for (let py = y - cell / 2; py < y + h + cell; py += cell * .8, row++) {
    for (let px = x - cell + (row % 2) * cell / 2; px < x + w + cell; px += cell) {
      ctx.drawImage(art, px - dw / 2, py - dh / 2, dw, dh);
    }
  }
  ctx.restore();
}

// On the photo itself: a huge, faint logo running off one corner (like a mask over
// the picture) and the full-colour logo as a sticker on the opposite side.
// corner: 'br' bottom right, 'tr' top right, 'bl', 'tl'. island: where the sticker goes.
function photoMarks(ctx, logo, area, m, mask, island) {
  if (!logo) return;
  if (mask) {
    const size = Math.max(area.w, area.h) * .72;
    const right = mask[1] === 'r';
    const bottom = mask[0] === 'b';
    ctx.save();
    ctx.beginPath();
    ctx.rect(area.x, area.y, area.w, area.h);
    ctx.clip();
    const cx = right ? area.x + area.w - size * .16 : area.x + size * .16;
    const cy = bottom ? area.y + area.h - size * .14 : area.y + size * .14;
    watermark(ctx, logo, cx, cy, size, '#ffffff', .26, right ? -.18 : .18);
    ctx.restore();
  }
  if (island) {
    const size = Math.min(area.w, area.h) * .3;
    const right = island[1] === 'r';
    const bottom = island[0] === 'b';
    const cx = right ? area.x + area.w - size * .62 : area.x + size * .62;
    const cy = bottom ? area.y + area.h - size * .62 : area.y + size * .62;
    sticker(ctx, logo, cx, cy, size, m, right ? .1 : -.1);
  }
}

// The team's emblem in a round badge: the logo as a sticker when there is one, else
// the drawn motif. ring is the badge colour, ink the emblem colour.
function badge(ctx, team, logo, cx, cy, r, ring, ink, m) {
  if (logo) {
    sticker(ctx, logo, cx, cy, r * 2.3, m);
    return;
  }
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.globalAlpha = .55;
  ctx.lineWidth = Math.max(1, m * .025);
  ctx.setLineDash([m * .06, m * .05]);
  ctx.beginPath();
  ctx.arc(cx, cy, r * .86, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  drawMotif(ctx, team.motif, cx, cy, r * 1.3, ink, ring, team.accent);
}

export function retiredLine(team) {
  if (!team.retired || !team.retired.length) return '';
  const word = team.retiredWord || 'RETIRED';
  return `${word} · ${team.retired.map(item => Array.isArray(item) ? `${item[0]} ${item[1]}` : item).join(' · ')}`;
}

// ---------- Style A: jersey ----------

function collar(ctx, team, W, m) {
  const c2 = team.c2 === team.c1 ? team.c3 : team.c2;
  ctx.lineJoin = 'miter';
  if (team.collar === 'crew' || team.collar === 'polo') {
    // A round football neck, with a button placket for the polo.
    ctx.fillStyle = c2;
    ctx.beginPath();
    ctx.ellipse(W / 2, -m * .1, m * 1.7, m * .95, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = team.c1;
    ctx.beginPath();
    ctx.ellipse(W / 2, -m * .1, m * 1.4, m * .7, 0, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = team.c3;
    ctx.lineWidth = m * .05;
    ctx.beginPath();
    ctx.ellipse(W / 2, -m * .1, m * 1.55, m * .82, 0, 0, Math.PI);
    ctx.stroke();
    if (team.collar === 'polo') {
      ctx.fillStyle = c2;
      ctx.fillRect(W / 2 - m * .2, m * .55, m * .4, m * .7);
      for (const y of [.75, 1.05]) {
        ctx.beginPath();
        ctx.arc(W / 2, m * y, m * .06, 0, TAU);
        ctx.fillStyle = team.c3;
        ctx.fill();
      }
    }
    return;
  }
  ctx.strokeStyle = c2;
  ctx.lineWidth = m * .3;
  ctx.beginPath();
  ctx.moveTo(W / 2 - m * 1.4, -m * .2);
  ctx.lineTo(W / 2, m * 1.05);
  ctx.lineTo(W / 2 + m * 1.4, -m * .2);
  ctx.stroke();
  ctx.strokeStyle = team.c3;
  ctx.lineWidth = m * .07;
  ctx.stroke();
}

function jersey(ctx, team, text, L) {
  const {m, W, H, area} = L;
  const say_ = say(team);
  const logo = text.logo;
  kit(ctx, team, 0, 0, W, H, m);

  // Side panels with the team's trim (argyle, houndstooth, fiesta stripes, bars).
  const panel = m * .5;
  for (const side of [0, 1]) {
    ctx.save();
    ctx.translate(side ? W : 0, 0);
    ctx.rotate(Math.PI / 2);
    trim(ctx, team, 0, side ? 0 : -panel, H, panel);
    ctx.restore();
  }
  const ink = team.ink;
  const gap = area.x - panel;
  // Small print up the sides: founding year and city on the left, home on the right.
  const sideLength = area.h * .9;
  upText(ctx, `${say_.est} ${team.est} · ${upper(team.city)}`, panel + gap / 2, area.y + area.h / 2, sideLength, 800, m * .24, SANS, m * .08, ink);
  upText(ctx, `${say_.home} · ${team.home}`, W - panel - gap / 2, area.y + area.h / 2, sideLength, 800, m * .24, SANS, m * .08, ink);

  // Photo with a two-colour trim.
  const edge = team.c2 === team.c1 ? team.c3 : team.c2;
  ctx.fillStyle = team.c3;
  ctx.fillRect(area.x - m * .16, area.y - m * .16, area.w + m * .32, area.h + m * .32);
  ctx.fillStyle = edge;
  ctx.fillRect(area.x - m * .1, area.y - m * .1, area.w + m * .2, area.h + m * .2);
  text.drawPhoto(area);
  if (text.mark) photoMarks(ctx, logo, area, m, 'br', 'bl');
  collar(ctx, team, W, m);

  // Striped kits get a solid chest panel and an emblem disc, so the print stays readable.
  const striped = team.kit === 'stripes' || team.kit === 'hechter';
  const topY = area.y / 2 + m * .04;
  if (striped) {
    const plate = luminance(team.c1) < .5 ? team.c1 : team.c2;
    ctx.fillStyle = plate;
    roundRect(ctx, area.x, area.y + area.h + m * .3, area.w, H - m * .82 - (area.y + area.h + m * .3), m * .25);
    ctx.fill();
    ctx.strokeStyle = team.c3;
    ctx.lineWidth = m * .05;
    ctx.stroke();
    if (!logo) {
      ctx.beginPath();
      ctx.arc(area.x + m * .55, topY, m * .58, 0, TAU);
      ctx.fill();
    }
  }

  // The logo, big and faint, printed across the lower shirt behind the number.
  const y0 = area.y + area.h;
  if (logo) watermark(ctx, logo, W / 2, (y0 + H - m * .8) / 2, (H - m * .8 - y0) * 1.15, ink, .16);

  // Top corners: the logo on the left, stars or the title count on the right.
  if (logo) sticker(ctx, logo, area.x + m * .62, topY, m * 1.75, m, -.08);
  else drawMotif(ctx, team.motif, area.x + m * .55, topY, m * .95, ink, team.c1, team.accent);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'right';
  ctx.fillStyle = ink;
  if (team.stars) {
    const r = m * .22;
    for (let k = 0; k < team.stars; k++) star(ctx, area.x + area.w - r - k * r * 2.5, topY, r, team.starColour || ink);
  } else if (team.titles && team.titles.n) {
    fit(ctx, `${team.titles.n}×`, m * 1.4, 400, m * .62, DISPLAY);
    ctx.fillText(`${team.titles.n}×`, area.x + area.w, topY + m * .04);
  }
  ctx.textBaseline = 'alphabetic';

  ctx.textAlign = 'center';
  // Name across the shoulders, number underneath in tackle twill.
  ctx.fillStyle = ink;
  fit(ctx, text.name, W * .52, 400, m * .7, DISPLAY, m * .14);
  ctx.fillText(text.name, W / 2, y0 + m * 1.02);

  const outer = team.c3 === ink ? team.c2 : team.c3;
  const middle = edge === ink ? team.c1 : edge;
  fit(ctx, text.number, W * .34, 400, m * 1.95, DISPLAY, m * .03);
  ctx.lineJoin = 'round';
  const ny = y0 + m * 3.02;
  ctx.strokeStyle = outer;
  ctx.lineWidth = m * .34;
  ctx.strokeText(text.number, W / 2, ny);
  ctx.strokeStyle = middle;
  ctx.lineWidth = m * .18;
  ctx.strokeText(text.number, W / 2, ny);
  ctx.fillStyle = ink;
  ctx.fillText(text.number, W / 2, ny);
  // Stitching just inside the edge of the twill.
  ctx.strokeStyle = luminance(ink) > .5 ? 'rgba(0,0,0,.35)' : 'rgba(255,255,255,.45)';
  ctx.lineWidth = Math.max(1, m * .02);
  ctx.setLineDash([m * .05, m * .05]);
  ctx.strokeText(text.number, W / 2, ny);
  ctx.setLineDash([]);
  const numberHalf = Math.max(ctx.measureText(text.number).width / 2, m * .5) + m * .5;

  // Left: the badge, team and nickname. Right: slogan, titles and date.
  const left = area.x - m * .1;
  const side = W / 2 - numberHalf - left;
  const r = Math.min(m * .72, side * .24);
  badge(ctx, team, text.logo, left + r, y0 + m * 2.2, r, edge, team.c1, m);
  const tx = left + r * 2 + m * .22;
  const tw = W / 2 - numberHalf - tx;
  ctx.textAlign = 'left';
  ctx.fillStyle = ink;
  fit(ctx, team.short, tw, 400, m * .58, DISPLAY, m * .02);
  ctx.fillText(team.short, tx, y0 + m * 2.2);
  ctx.globalAlpha = .82;
  fit(ctx, team.nick.toUpperCase(), tw, 800, m * .22, SANS, m * .06);
  ctx.fillText(team.nick.toUpperCase(), tx, y0 + m * 2.58);
  ctx.globalAlpha = 1;

  ctx.textAlign = 'right';
  const right = area.x + area.w + m * .1;
  const rw = right - W / 2 - numberHalf;
  fit(ctx, text.slogan, rw, 400, m * .5, DISPLAY, m * .02);
  ctx.fillText(text.slogan, right, y0 + m * 2.12);
  ctx.globalAlpha = .82;
  const titles = titleLine(team);
  fit(ctx, titles, rw, 800, m * .22, SANS, m * .06);
  ctx.fillText(titles, right, y0 + m * 2.5);
  if (text.date) {
    fit(ctx, text.date, rw, 800, m * .26, SANS, m * .04);
    ctx.fillText(text.date, right, y0 + m * 1.66);
  }
  ctx.globalAlpha = 1;

  // Hem: the trim band and a woven label with the retired numbers.
  const hemY = H - m * .78;
  trim(ctx, team, 0, hemY, W, m * .42);
  const label = retiredLine(team);
  if (label) {
    ctx.textAlign = 'center';
    ctx.fillStyle = ink;
    ctx.globalAlpha = .9;
    fit(ctx, label, area.w, 800, m * .2, SANS, m * .1);
    ctx.fillText(label, W / 2, hemY - m * .2);
    ctx.globalAlpha = 1;
  }
}

// ---------- Style B: ticket ----------

function guilloche(ctx, x, y, w, h, m, colour) {
  // Overlapping sine waves, like the security print on a real ticket.
  ctx.strokeStyle = colour;
  ctx.lineWidth = Math.max(1, m * .018);
  for (let k = 0; k < 14; k++) {
    ctx.beginPath();
    const phase = k * .45;
    for (let px = x; px <= x + w; px += m * .12) {
      const t = (px - x) / (m * 1.6);
      ctx.lineTo(px, y + h * (k + .5) / 14 + Math.sin(t + phase) * m * .55 + Math.sin(t * 2.3 - phase) * m * .18);
    }
    ctx.stroke();
  }
}

// A round holographic sticker with the title count, like the foil on real tickets.
function foil(ctx, team, cx, cy, r, m, words = WORDS.en) {
  shadow(ctx, m, true);
  const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  ['#c8f7ff', '#f9d5ff', '#fff3b0', '#c7ffd8', '#bcd4ff', '#ffd1e0'].forEach((colour, k, all) => grad.addColorStop(k / (all.length - 1), colour));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.fill();
  shadow(ctx, m, false);
  ctx.strokeStyle = 'rgba(255,255,255,.75)';
  ctx.lineWidth = Math.max(1, m * .025);
  for (let k = 0; k < 6; k++) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * (.35 + k * .1), k, k + 2.2);
    ctx.stroke();
  }
  ctx.fillStyle = '#26203a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const big = team.titles && team.titles.n ? `${team.titles.n}×` : `${team.est}`;
  fit(ctx, big, r * 1.3, 400, r * .78, DISPLAY);
  ctx.fillText(big, cx, cy - r * .08);
  const small = team.titles && team.titles.n ? (team.titles.short || words.titles) : words.est;
  fit(ctx, small, r * 1.3, 900, r * .2, SANS, r * .04);
  ctx.fillText(small, cx, cy + r * .46);
  ctx.textBaseline = 'alphabetic';
}

function stamp(ctx, text1, text2, cx, cy, r, m) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-.24);
  ctx.globalAlpha = .82;
  ctx.strokeStyle = '#c0262d';
  ctx.fillStyle = '#c0262d';
  ctx.lineWidth = m * .06;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = m * .025;
  ctx.beginPath();
  ctx.arc(0, 0, r * .8, 0, TAU);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  fit(ctx, text1, r * 1.4, 400, r * .42, DISPLAY, r * .04);
  ctx.fillText(text1, 0, -r * .1);
  fit(ctx, text2, r * 1.3, 900, r * .18, SANS, r * .04);
  ctx.fillText(text2, 0, r * .36);
  ctx.restore();
}

function ticket(ctx, team, text, L) {
  const {m, o, W, H, area, P, S} = L;
  const words = say(team);
  const logo = text.logo;
  const u = area.h / 16;
  const ink = onPaper(team);
  const strip = solid(team);
  const stripInk = readable(strip);
  const cut = W - o - S;
  ctx.fillStyle = TABLE;
  ctx.fillRect(0, 0, W, H);

  // Paper with security print, team-colour bands top and bottom, and a stub in the
  // team colour printed all over with the logo.
  ctx.save();
  roundRect(ctx, o, o, W - o * 2, H - o * 2, u * .5);
  ctx.clip();
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = .1;
  guilloche(ctx, o, o, W, H, m, ink);
  ctx.globalAlpha = 1;
  ctx.fillStyle = strip;
  ctx.fillRect(0, 0, W, o + u * .36);
  ctx.fillRect(0, H - o - u * .36, W, u * .36 + o);
  ctx.fillRect(cut, 0, W - cut, H);
  if (logo) monogram(ctx, logo, cut, 0, W - cut, H, S * .62, stripInk, .14);
  ctx.restore();

  // The team's file beside the photo.
  const px = area.x + area.w + (area.x - o) * .8;
  const top = area.y;
  if (logo) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(px - u * .4, top, P + u * .8, area.h);
    ctx.clip();
    watermark(ctx, logo, px + P * .86, top + area.h * .78, area.h * .7, ink, .07, -.12);
    ctx.restore();
  }
  const serial = String(hash(team.id + text.number) % 1000000).padStart(6, '0');
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = ink;
  ctx.textAlign = 'left';
  const admit = `${words.admit} · ${text.season}`;
  fit(ctx, admit, P * .7, 400, u * .9, DISPLAY, u * .08);
  ctx.fillText(admit, px, top + u * .85);
  ctx.textAlign = 'right';
  font(ctx, 800, u * .34, SANS, u * .08);
  ctx.fillText(`No. ${serial}`, px + P, top + u * .78);
  ctx.fillRect(px, top + u * 1.25, P, Math.max(1, u * .07));

  // Hero: the logo big, the team name beside it.
  const hero = u * 4.7;
  const hx = px + hero / 2;
  const hy = top + u * 1.55 + hero / 2;
  if (logo) sticker(ctx, logo, hx, hy, hero, u * .8, -.04);
  else drawMotif(ctx, team.motif, hx, hy, hero * .95, ink, PAPER, team.accent);
  const tx = px + hero + u * .5;
  const tw = P - hero - u * .5;
  ctx.textAlign = 'left';
  ctx.fillStyle = ink;
  fit(ctx, team.short, tw, 400, u * 1.9, DISPLAY, u * .03);
  ctx.fillText(team.short, tx, top + u * 3.55);
  ctx.fillStyle = '#1b1b1b';
  fit(ctx, upper(team.name), tw, 800, u * .44, SANS, u * .06);
  ctx.fillText(upper(team.name), tx, top + u * 4.3);
  ctx.globalAlpha = .62;
  const where = `${upper(team.nick)} · ${upper(team.city)}`;
  fit(ctx, where, tw, 800, u * .4, SANS, u * .06);
  ctx.fillText(where, tx, top + u * 4.9);
  ctx.globalAlpha = 1;
  const call = team.chant || team.motto || text.slogan;
  if (call) {
    ctx.fillStyle = ink;
    const said = isZh(team) ? `「${call}」` : `“${call}”`;
    fit(ctx, said, tw, 400, u * .7, DISPLAY, u * .02);
    ctx.fillText(said, tx, top + u * 5.85);
  }

  // Three facts in boxes: founded, home, titles.
  const factTop = top + u * 6.75;
  const factH = u * 1.8;
  const titled = team.titles && team.titles.n;
  const facts = [
    [words.est, String(team.est)],
    [words.home, team.homeNick || team.home],
    [titled ? (team.titles.short || words.titles) : words.honours, titled ? `${team.titles.n}×` : (team.titles ? team.titles.label : '')],
  ];
  const widths = [.26, .4, .34];
  let fx = px;
  ctx.strokeStyle = ink;
  ctx.lineWidth = Math.max(1, u * .05);
  facts.forEach(([label, value], k) => {
    const fw = P * widths[k];
    ctx.strokeRect(fx + u * .03, factTop, fw - u * .16, factH);
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    fit(ctx, label, fw - u * .5, 800, u * .3, SANS, u * .06);
    ctx.fillText(label, fx + u * .25, factTop + u * .52);
    ctx.fillStyle = ink;
    fit(ctx, value || '—', fw - u * .5, 400, u * .82, DISPLAY, u * .02);
    ctx.fillText(value || '—', fx + u * .25, factTop + u * 1.45);
    fx += fw;
  });

  // History: the team's big moments, one line each.
  const hTop = top + u * 9.25;
  ctx.fillStyle = ink;
  font(ctx, 900, u * .34, SANS, u * .14, words.history);
  ctx.textAlign = 'left';
  ctx.fillText(words.history, px, hTop);
  const headW = ctx.measureText(words.history).width;
  ctx.fillRect(px + headW + u * .3, hTop - u * .13, P - headW - u * .3, Math.max(1, u * .05));
  (team.moments || []).slice(0, 3).forEach(([year, line, note], k) => {
    const y = hTop + u * .98 + k * u * 1.1;
    ctx.fillStyle = strip === PAPER ? ink : solid(team);
    fit(ctx, String(year), u * 2.2, 400, u * .82, DISPLAY);
    ctx.fillText(String(year), px, y + u * .1);
    ctx.fillStyle = '#1b1b1b';
    fit(ctx, upper(line), P - u * 2.5, 800, u * .42, SANS, u * .04);
    ctx.fillText(upper(line), px + u * 2.45, y - u * .18);
    if (note) {
      ctx.globalAlpha = .62;
      fit(ctx, note, P - u * 2.5, 600, u * .34, SANS, u * .02);
      ctx.fillText(note, px + u * 2.45, y + u * .3);
      ctx.globalAlpha = 1;
    }
  });
  const legends = retiredLine(team);
  if (legends) {
    ctx.fillStyle = ink;
    ctx.globalAlpha = .8;
    fit(ctx, legends, P, 800, u * .32, SANS, u * .06);
    ctx.fillText(legends, px, top + u * 13.5);
    ctx.globalAlpha = 1;
  }

  // Holder, seat and date along the bottom of the file.
  const fTop = top + u * 13.85;
  ctx.fillStyle = ink;
  ctx.fillRect(px, fTop, P, Math.max(1, u * .05));
  const cols = [[words.holder, text.name, .46], [words.seat, text.number, .2], [words.date, text.date || words.tonight, .34]];
  let cx = px;
  for (const [label, value, share] of cols) {
    const cw = P * share;
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    fit(ctx, label, cw - u * .3, 800, u * .28, SANS, u * .06);
    ctx.fillText(label, cx, fTop + u * .6);
    ctx.fillStyle = ink;
    fit(ctx, value, cw - u * .3, 400, u * .98, DISPLAY, u * .02);
    ctx.fillText(value, cx, fTop + u * 1.85);
    cx += cw;
  }

  // The photo, with the slogan on a band across its foot, a rubber stamp and the logo.
  ctx.fillStyle = ink;
  ctx.fillRect(area.x - u * .1, area.y - u * .1, area.w + u * .2, area.h + u * .2);
  text.drawPhoto(area);
  if (text.mark) photoMarks(ctx, logo, area, m, 'tr', null);
  const band = u * 1.55;
  ctx.save();
  ctx.globalAlpha = .92;
  ctx.fillStyle = strip;
  ctx.fillRect(area.x, area.y + area.h - band, area.w, band);
  ctx.restore();
  trim(ctx, team, area.x, area.y + area.h - band - u * .14, area.w, u * .14);
  ctx.fillStyle = stripInk;
  ctx.textAlign = 'left';
  fit(ctx, text.slogan, area.w - u * 1.1, 400, u * .95, DISPLAY, u * .03);
  ctx.fillText(text.slogan, area.x + u * .5, area.y + area.h - band * .3);
  stamp(ctx, words.homeGame, text.date || upper(team.city), area.x + m * 1.05, area.y + m * 1.05, m * .82, m);
  if (text.mark && logo) {
    const size = Math.min(area.w, area.h) * .3;
    sticker(ctx, logo, area.x + area.w - size * .62, area.y + area.h - band - size * .55, size, m, .1);
  }

  // Tear line between the ticket and the stub, with the two half-moon notches.
  ctx.strokeStyle = 'rgba(0,0,0,.4)';
  ctx.lineWidth = Math.max(1, u * .06);
  ctx.setLineDash([u * .2, u * .16]);
  ctx.beginPath();
  ctx.moveTo(cut, o + u * .5);
  ctx.lineTo(cut, H - o - u * .5);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = TABLE;
  for (const y of [o, H - o]) {
    ctx.beginPath();
    ctx.arc(cut, y, u * .42, 0, TAU);
    ctx.fill();
  }

  // Stub: the foil sticker, the game up the middle, the seat and a barcode.
  const sx = cut + S / 2;
  foil(ctx, team, sx, area.y + S * .42, S * .34, m, words);
  upText(ctx, `${words.homeGame} · ${team.short}`, sx, area.y + area.h * .44, area.h * .4, 400, S * .26, DISPLAY, S * .02, stripInk);
  ctx.fillStyle = stripInk;
  ctx.textAlign = 'center';
  ctx.globalAlpha = .8;
  fit(ctx, words.seat, S * .7, 800, S * .1, SANS, S * .02);
  ctx.fillText(words.seat, sx, area.y + area.h * .68);
  ctx.globalAlpha = 1;
  fit(ctx, text.number, S * .8, 400, S * .4, DISPLAY);
  ctx.fillText(text.number, sx, area.y + area.h * .8);
  const bx = cut + S * .14;
  const bw = S * .72;
  const by = area.y + area.h * .84;
  const bh = area.h * .16 - u * .1;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(bx - S * .04, by - S * .04, bw + S * .08, bh + S * .08);
  let seed = hash(team.id + text.name + text.number);
  ctx.fillStyle = '#1b1b1b';
  for (let y = by; y < by + bh;) {
    seed = Math.imul(seed ^ (seed >>> 13), 1274126177) >>> 0;
    const h = u * (.03 + (seed % 4) * .03);
    if (y + h > by + bh) break;
    ctx.fillRect(bx, y, bw, h);
    y += h + u * (.04 + ((seed >>> 4) % 3) * .03);
  }
  ctx.textAlign = 'left';
}

// ---------- Style C: patch (letterman jacket) ----------

// Wool: the felt colour with a soft speckle.
function wool(ctx, colour, W, H, m) {
  ctx.fillStyle = colour;
  ctx.fillRect(0, 0, W, H);
  const light = luminance(colour) < .35;
  let seed = 11;
  const size = Math.max(1, m * .03);
  ctx.fillStyle = light ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.08)';
  const count = Math.min(4000, Math.round(W * H / (m * m) * 26));
  for (let k = 0; k < count; k++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const x = (seed % 10000) / 10000 * W;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const y = (seed % 10000) / 10000 * H;
    ctx.fillRect(x, y, size * (1 + seed % 3), size);
  }
}

function patch(ctx, team, text, L) {
  const {m, W, H, area} = L;
  const felt = luminance(team.c1) < .04 ? team.c2 : team.c1;
  const trimColour = luminance(team.c2) < .04 || team.c2 === felt ? team.c3 : team.c2;
  const cream = '#f1e7d0';
  const words = readable(felt);
  const say_ = say(team);
  const logo = text.logo;
  wool(ctx, felt, W, H, m);
  if (logo) monogram(ctx, logo, 0, 0, W, H, m * 1.7, words, .09);
  // Leather sleeves down both sides, with a seam line.
  const sleeve = m * .62;
  for (const x of [0, W - sleeve]) {
    const grad = ctx.createLinearGradient(x, 0, x + sleeve, 0);
    grad.addColorStop(0, x ? '#e8dcc0' : '#d8cbac');
    grad.addColorStop(1, x ? '#d8cbac' : '#e8dcc0');
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, sleeve, H);
  }
  ctx.strokeStyle = 'rgba(0,0,0,.25)';
  ctx.lineWidth = Math.max(1, m * .025);
  ctx.setLineDash([m * .08, m * .06]);
  for (const x of [sleeve + m * .08, W - sleeve - m * .08]) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // Knit collar band at the top and waistband at the bottom.
  for (const [y, h] of [[0, m * .55], [H - m * .62, m * .62]]) {
    ctx.fillStyle = felt;
    ctx.fillRect(0, y, W, h);
    ctx.fillStyle = trimColour;
    ctx.fillRect(0, y + h * .3, W, h * .16);
    ctx.fillRect(0, y + h * .6, W, h * .16);
    ctx.fillStyle = 'rgba(0,0,0,.12)';
    for (let x = 0; x < W; x += m * .1) ctx.fillRect(x, y, Math.max(1, m * .03), h);
  }

  // Photo stuck on like a print, white edge and soft shadow.
  shadow(ctx, m, true);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(area.x - m * .16, area.y - m * .16, area.w + m * .32, area.h + m * .32);
  shadow(ctx, m, false);
  text.drawPhoto(area);
  if (text.mark) photoMarks(ctx, logo, area, m, 'tr', 'bl');

  // Felt pennant hanging over the photo's top edge, with the founding year.
  ctx.save();
  const pw = Math.min(area.w * .42, m * 4.4);
  ctx.translate(area.x + area.w * .5, area.y - m * .3);
  ctx.rotate(-.04);
  shadow(ctx, m, true);
  ctx.beginPath();
  ctx.moveTo(-pw / 2, -m * .3);
  ctx.lineTo(pw / 2, -m * .3);
  ctx.lineTo(pw / 2 - pw * .12, m * .36);
  ctx.lineTo(-pw / 2 + pw * .12, m * .36);
  ctx.closePath();
  ctx.fillStyle = trimColour;
  ctx.fill();
  shadow(ctx, m, false);
  ctx.fillStyle = readable(trimColour);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const pennant = `${say_.est} ${team.est}`;
  fit(ctx, pennant, pw * .7, 400, m * .44, VARSITY, m * .04);
  ctx.fillText(pennant, 0, m * .04);
  ctx.restore();
  ctx.textBaseline = 'alphabetic';

  // "Hello, my name is" tag on the left edge.
  ctx.save();
  const tagW = Math.min(m * 3.2, area.w * .5);
  ctx.translate(area.x + tagW * .38, area.y + area.h * .62);
  ctx.rotate(-.07);
  shadow(ctx, m, true);
  roundRect(ctx, -tagW / 2, -m * .62, tagW, m * 1.24, m * .14);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  shadow(ctx, m, false);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = felt;
  ctx.fillRect(-tagW / 2, -m * .62, tagW, m * .42);
  ctx.restore();
  ctx.textAlign = 'center';
  ctx.fillStyle = words;
  fit(ctx, say_.hello, tagW - m * .2, 900, m * .2, SANS, m * .06);
  ctx.fillText(say_.hello, 0, -m * .34);
  ctx.fillStyle = '#111111';
  fit(ctx, text.name, tagW - m * .3, 400, m * .58, DISPLAY, m * .02);
  ctx.fillText(text.name, 0, m * .44);
  ctx.restore();

  // Round embroidered number patch, top right.
  const r = m * 1.02;
  const cx = W - m * 1.2;
  const cy = m * 1.35;
  shadow(ctx, m, true);
  ctx.fillStyle = trimColour;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.fill();
  shadow(ctx, m, false);
  ctx.fillStyle = felt;
  ctx.beginPath();
  ctx.arc(cx, cy, r * .84, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = luminance(felt) > .6 ? 'rgba(0,0,0,.45)' : 'rgba(255,255,255,.7)';
  ctx.lineWidth = Math.max(1, m * .03);
  ctx.setLineDash([m * .07, m * .06]);
  ctx.beginPath();
  ctx.arc(cx, cy, r * .72, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.textAlign = 'center';
  ctx.fillStyle = words;
  font(ctx, 900, m * .17, SANS, m * .06);
  ctx.fillText(say_.no, cx, cy - r * .3);
  fit(ctx, text.number, r * 1.15, 400, m * .9, DISPLAY);
  ctx.fillText(text.number, cx, cy + r * .5);

  // Top left: the team's logo as a big die-cut sticker, or the emblem as a patch.
  if (logo) sticker(ctx, logo, m * 1.85, m * 1.85, m * 3.2, m, -.12);
  else {
  ctx.save();
  ctx.translate(m * 1.2, m * 1.35);
  ctx.rotate(-.16);
  shadow(ctx, m, true);
  ctx.fillStyle = cream;
  ctx.beginPath();
  ctx.arc(0, 0, m * 1.02, 0, TAU);
  ctx.fill();
  shadow(ctx, m, false);
  const emblemInk = words === '#ffffff' ? (team.c2 !== felt && luminance(team.c2) > .1 ? team.c2 : '#ffffff') : '#111111';
  badge(ctx, team, null, 0, 0, m * .86, felt, emblemInk, m);
  ctx.restore();
  }

  // A championship patch over the photo's right edge: titles in a shield.
  if (team.titles && team.titles.n) {
    ctx.save();
    ctx.translate(area.x + area.w - m * .15, area.y + area.h * .36);
    ctx.rotate(.1);
    const sw = m * 1.5;
    shadow(ctx, m, true);
    ctx.beginPath();
    ctx.moveTo(-sw / 2, -sw * .55);
    ctx.lineTo(sw / 2, -sw * .55);
    ctx.lineTo(sw / 2, sw * .15);
    ctx.quadraticCurveTo(sw / 2, sw * .55, 0, sw * .75);
    ctx.quadraticCurveTo(-sw / 2, sw * .55, -sw / 2, sw * .15);
    ctx.closePath();
    ctx.fillStyle = cream;
    ctx.fill();
    shadow(ctx, m, false);
    const shieldInk = luminance(felt) > .6 ? trimColour : felt;
    ctx.strokeStyle = shieldInk;
    ctx.lineWidth = m * .08;
    ctx.stroke();
    ctx.fillStyle = shieldInk;
    ctx.textAlign = 'center';
    fit(ctx, `${team.titles.n}×`, sw * .8, 400, m * .66, DISPLAY);
    ctx.fillText(`${team.titles.n}×`, 0, sw * .12);
    const won = team.titles.short || say_.titles;
    fit(ctx, won, sw * .8, 900, m * .16, SANS, m * .03);
    ctx.fillText(won, 0, sw * .38);
    ctx.restore();
  }

  // Slogan sticker over the photo's bottom-right corner.
  ctx.save();
  fit(ctx, text.slogan, Math.min(area.w * .55, m * 6), 400, m * .48, DISPLAY, m * .02);
  const sw = ctx.measureText(text.slogan).width + m * .7;
  ctx.translate(area.x + area.w - sw / 2 + m * .2, area.y + area.h - m * .1);
  ctx.rotate(.06);
  shadow(ctx, m, true);
  roundRect(ctx, -sw / 2, -m * .42, sw, m * .84, m * .42);
  ctx.fillStyle = '#ffe14d';
  ctx.fill();
  shadow(ctx, m, false);
  ctx.fillStyle = '#111111';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.slogan, 0, m * .03);
  ctx.restore();
  ctx.textBaseline = 'alphabetic';

  // Chenille varsity letter, bottom left.
  const letter = team.letter;
  font(ctx, 400, m * 2.3, VARSITY, 0, letter);
  const letterWidth = ctx.measureText(letter).width;
  const letterX = m * .9 + letterWidth / 2;
  ctx.save();
  ctx.translate(letterX, H - m * .9);
  ctx.rotate(-.12);
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  shadow(ctx, m, true);
  ctx.strokeStyle = cream;
  ctx.lineWidth = m * .62;
  ctx.strokeText(letter, 0, 0);
  shadow(ctx, m, false);
  ctx.strokeStyle = trimColour;
  ctx.lineWidth = m * .32;
  ctx.strokeText(letter, 0, 0);
  ctx.fillStyle = felt;
  ctx.fillText(letter, 0, 0);
  ctx.restore();

  // Team across the bottom.
  const y0 = area.y + area.h + m * .16;
  const textLeft = letterX + letterWidth / 2 + m * .6;
  const textWidth = W - textLeft - sleeve - m * .4;
  ctx.textAlign = 'left';
  ctx.fillStyle = words;
  fit(ctx, team.short, textWidth, 400, m * 1.02, DISPLAY, m * .02);
  ctx.fillText(team.short, textLeft, y0 + m * 1.3);
  const line1 = `${upper(team.nick)} · ${text.date || upper(team.city)}`;
  fit(ctx, line1, textWidth, 800, m * .28, SANS, m * .08);
  ctx.globalAlpha = .88;
  ctx.fillText(line1, textLeft, y0 + m * 1.84);
  fit(ctx, team.home, textWidth, 800, m * .22, SANS, m * .08);
  ctx.globalAlpha = .7;
  ctx.fillText(team.home, textLeft, y0 + m * 2.24);
  ctx.globalAlpha = 1;
}

// ---------- Style D: trading card (front and back) ----------
//
// Like a real player card, and every pull different. A seed draws, on its own:
// - the parallel: a foil finish (Prizm rays, Refractor, Hyper, Mojo, Shimmer, Cracked
//   Ice, Disco, Wave, X-Fractor, Snakeskin, Tiger, Atomic, Scope, Camo, Lava) in a
//   colour with its print run (silver, team /199, red /149 … gold /10, black 1/1),
//   or one of the chase cards (Superfractor 1/1, Black Finite 1/1, Gold Vinyl /5);
// - the front design: chrome frame, full bleed, premium patch-auto, comic burst,
//   city skyline or stained glass;
// - the memorabilia: a jersey swatch, number patch, logo patch, laundry tag,
//   sneaker leather, a piece of the game ball or two at once, in a window that can be
//   a square, a circle, a shield or the shape of the shirt number;
// - the autograph: ink on the card or a signed sticker, in one of five inks, at
//   times with an inscription;
// - how the card is shown: front and back side by side, fanned, in a graded slab or
//   in a magnetic holder.
// The back is the team's file: card number, three facts, a highlights table, legends
// and trivia, also drawn from the seed. The photo is the player.

// The colours of the parallels, rarest last. a: main, b: dark, c: light.
const COLOURS = [
  {id: 'silver', w: 34, run: 0, en: 'SILVER', zh: '银', a: '#dfe4ea', b: '#8a949f', c: '#ffffff'},
  {id: 'team', w: 18, run: 199, en: 'TEAM COLOR', zh: '队色'},
  {id: 'red', w: 11, run: 149, en: 'RED', zh: '红', a: '#d7263d', b: '#6e0b17', c: '#ff8a98'},
  {id: 'blue', w: 10, run: 99, en: 'BLUE', zh: '蓝', a: '#1f6feb', b: '#0a2559', c: '#8cc2ff'},
  {id: 'green', w: 7, run: 75, en: 'GREEN', zh: '绿', a: '#16a34a', b: '#06401c', c: '#86efac'},
  {id: 'orange', w: 5, run: 49, en: 'ORANGE', zh: '橙', a: '#ff7a1a', b: '#7a2e00', c: '#ffc48a'},
  {id: 'pink', w: 5, run: 35, en: 'PINK', zh: '粉', a: '#ff5fb0', b: '#7a1048', c: '#ffc2e2'},
  {id: 'purple', w: 4, run: 25, en: 'PURPLE', zh: '紫', a: '#8b3dff', b: '#2e0d63', c: '#d2b3ff'},
  {id: 'gold', w: 3, run: 10, en: 'GOLD', zh: '金', a: '#e9c25a', b: '#7a5a12', c: '#fff1b8'},
  {id: 'black', w: 1.2, run: 1, en: 'BLACK', zh: '黑', a: '#2a2a2a', b: '#050505', c: '#9a9a9a'},
];
const FINISHES = [
  {id: 'prizm', w: 20, en: 'PRIZM', zh: '折射'},
  {id: 'refractor', w: 10, en: 'REFRACTOR', zh: '彩虹折射'},
  {id: 'hyper', w: 8, en: 'HYPER', zh: '斜纹镭射'},
  {id: 'mojo', w: 8, en: 'MOJO', zh: '旋涡镭射'},
  {id: 'shimmer', w: 7, en: 'SHIMMER', zh: '流光'},
  {id: 'ice', w: 7, en: 'CRACKED ICE', zh: '碎冰'},
  {id: 'disco', w: 7, en: 'DISCO', zh: '迪斯科圆点'},
  {id: 'wave', w: 7, en: 'WAVE', zh: '波浪'},
  {id: 'xfractor', w: 6, en: 'X-FRACTOR', zh: '方格折射'},
  {id: 'snake', w: 5, en: 'SNAKESKIN', zh: '蛇皮纹'},
  {id: 'tiger', w: 5, en: 'TIGER STRIPE', zh: '虎纹'},
  {id: 'atomic', w: 5, en: 'ATOMIC', zh: '原子星点'},
  {id: 'scope', w: 4, en: 'SCOPE', zh: '同心圆'},
  {id: 'camo', w: 3, en: 'CAMO', zh: '迷彩'},
  {id: 'lava', w: 3, en: 'LAVA', zh: '熔岩'},
];
// The chase cards, each a whole parallel of its own; w out of 100 pulls.
const CHASE = [
  {id: 'super', w: .7, run: 1, finish: 'super', colour: 'gold', en: 'SUPERFRACTOR', zh: '超级折射'},
  {id: 'finite', w: .9, run: 1, finish: 'prizm', colour: 'black', en: 'BLACK FINITE', zh: '黑色终极'},
  {id: 'vinyl', w: 1.2, run: 5, finish: 'vinyl', colour: 'gold', en: 'GOLD VINYL', zh: '金色黑胶'},
];
// Front designs, each a set name of its own.
const DESIGNS = [
  {id: 'chrome', w: 18, en: 'HOT CHROME', zh: 'HOT 主场'},
  {id: 'full', w: 11, en: 'HOT FLUX', zh: '主场全幅'},
  {id: 'select', w: 14, en: 'HOT SELECT', zh: '主场精选'},
  {id: 'classic', w: 12, en: 'HOT CLASSIC', zh: '主场经典'},
  {id: 'rated', w: 9, en: 'HOT RATED', zh: '主场评分'},
  {id: 'obsidian', w: 9, en: 'HOT OBSIDIAN', zh: '主场黑曜'},
  {id: 'skyline', w: 8, en: 'HOT DOWNTOWN', zh: '主场城市'},
  {id: 'comic', w: 7, en: 'HOT BOOM', zh: '主场爆裂'},
  {id: 'stained', w: 7, en: 'HOT STAINED GLASS', zh: '主场彩窗'},
  {id: 'premium', w: 11, en: 'HOT TREASURES', zh: '主场珍藏'},
];
const SHOWS = [{id: 'side', w: 40}, {id: 'fan', w: 22}, {id: 'slab', w: 22}, {id: 'holder', w: 16}];
// Memorabilia: weights for ordinary and rare pulls.
const RELICS = [
  {id: 'jersey', w: 26, rare: 12, en: 'GAME-WORN JERSEY', zh: '球衣碎片', school: '校服碎片'},
  {id: 'number', w: 16, rare: 14, en: 'NUMBER PATCH', zh: '号码补丁'},
  {id: 'logo', w: 13, rare: 18, en: 'LOGO PATCH', zh: '队徽补丁', school: '校徽补丁'},
  {id: 'tag', w: 6, rare: 14, en: 'LAUNDRY TAG', zh: '球衣洗标', school: '校服洗标'},
  {id: 'sneaker', w: 14, rare: 14, en: 'SNEAKER', zh: '球鞋物料'},
  {id: 'ball', w: 10, rare: 8, en: 'GAME BALL', zh: '比赛用球'},
  {id: 'dual', w: 12, rare: 16, en: 'DUAL RELIC', zh: '双物料'},
];
const WINDOWS = ['rect', 'round', 'circle', 'shield', 'number'];
const INKS = [
  {id: 'blue', ink: '#1e4fd8', w: 34},
  {id: 'black', ink: '#111111', w: 22},
  {id: 'silver', ink: '#e8edf2', w: 18},
  {id: 'gold', ink: '#f2cf6b', w: 14},
  {id: 'red', ink: '#d11a2a', w: 12},
];
const GRADES = [['10', 'GEM MT', 30], ['9.5', 'MINT+', 18], ['9', 'MINT', 30], ['8.5', 'NM-MT+', 12], ['8', 'NM-MT', 10]];
// The rookie logo's look.
const ROOKIES = [{id: 'shield', w: 30}, {id: 'rated', w: 26}, {id: 'first', w: 22}, {id: 'banner', w: 22}];
// The three tiers of the select design, from the cheap seats to the floor, and how
// likely each is for each rarity.
const LEVELS = {
  hoop: [['CONCOURSE', '看台层'], ['PREMIER LEVEL', '包厢层'], ['COURTSIDE', '场边层']],
  soccer: [['TERRACE', '看台层'], ['CLUB LEVEL', '包厢层'], ['PITCHSIDE', '场边层']],
  gridiron: [['UPPER DECK', '看台层'], ['CLUB LEVEL', '包厢层'], ['FIELD LEVEL', '场边层']],
  school: [['BLEACHERS', '看台'], ['FRONT ROW', '前排'], ['HONOR ROLL', '光荣榜']],
};
const LEVEL_ODDS = {base: [60, 30, 10], chrome: [45, 35, 20], numbered: [30, 40, 30], rare: [10, 30, 60], one: [5, 25, 70]};
// Ratings on the rated design and the stats back.
const ATTRS = {
  hoop: {en: ['SPD', 'SHT', 'PAS', 'DRB', 'DEF', 'PHY'], zh: ['速度', '投篮', '传球', '运球', '防守', '身体']},
  soccer: {en: ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'], zh: ['速度', '射门', '传球', '盘带', '防守', '身体']},
  gridiron: {en: ['SPD', 'STR', 'AGI', 'THR', 'CAT', 'AWR'], zh: ['速度', '力量', '敏捷', '传球', '接球', '意识']},
  school: {en: ['IQ', 'GPA', 'HUSTLE', 'SPIRIT', 'STYLE', 'LEAD'], zh: ['学力', '体能', '颜值', '人缘', '才艺', '毅力']},
};
const OVR = {base: [74, 84], chrome: [80, 88], numbered: [84, 92], rare: [90, 96], one: [97, 99]};
const BACKS = [{id: 'classic', w: 28}, {id: 'profile', w: 27}, {id: 'stats', w: 25}, {id: 'vintage', w: 20}];

// Positions and insert-set names, by group.
const ROLES = {
  hoops: ['GUARD', 'FORWARD', 'CENTER', 'G-F', 'F-C'],
  college: ['GUARD', 'FORWARD', 'CENTER', 'G-F', 'F-C'],
  cba: ['控球后卫', '得分后卫', '小前锋', '大前锋', '中锋'],
  gridiron: ['QB', 'WR', 'RB', 'TE', 'LB', 'CB'],
  football: ['FORWARD', 'MIDFIELDER', 'DEFENDER', 'GOALKEEPER', 'WINGER'],
  csl: ['前锋', '中场', '后卫', '门将', '边锋'],
  campus: ['FRESHMAN', 'VARSITY', 'ALUMNI', 'CLASS ACT'],
  cnu: ['新生', '校友', '学霸', '校队'],
  hs: ['新生', '校友', '学霸', '校队', '学生会'],
};
const INSERTS = {
  hoops: ['DOWNTOWN', 'FAST BREAK', 'COURT KINGS', 'HOOP DREAMS', 'NEXT UP', 'SHOWSTOPPERS'],
  college: ['MARCH MADNESS', 'HOOP DREAMS', 'NEXT UP', 'FAST BREAK', 'CAMPUS KINGS'],
  cba: ['主场英雄', '新秀登场', '篮下之王', '三分雨', '冠军基因'],
  gridiron: ['GRIDIRON GLORY', 'END ZONE', 'GAME CHANGERS', 'SATURDAY HEROES', 'KICKOFF'],
  football: ['MATCHDAY', 'GOLAZO', 'EUROPEAN NIGHTS', 'KICKOFF', 'CREST LEGENDS'],
  csl: ['主场之夜', '绿茵新星', '冠军基因', '进球时刻', '新秀登场'],
  campus: ['CAMPUS LEGENDS', 'HALL OF FAME', 'CLASS OF CHAMPIONS', 'NEXT UP'],
  cnu: ['校园传奇', '新生登场', '学霸系列', '荣誉校友'],
  hs: ['校园传奇', '新生登场', '学霸系列', '百年名校'],
};
// The big word on the comic design.
const BURSTS = {
  hoops: ['BOOM!', 'SLAM!', 'SWISH!', 'CLUTCH!', 'WHAM!'],
  college: ['BOOM!', 'SLAM!', 'SWISH!', 'BUZZER!'],
  cba: ['暴扣！', '绝杀！', '燃！', '砰！', '三分！'],
  gridiron: ['TOUCHDOWN!', 'BOOM!', 'SACK!', 'POW!'],
  football: ['GOAL!', 'GOLAZO!', 'BOOM!', 'WHAM!'],
  csl: ['进球！', '世界波！', '燃！', '砰！'],
  campus: ['BOOM!', 'A+!', 'WOW!', 'POW!'],
  cnu: ['燃！', '冲！', '满分！', '学霸！'],
  hs: ['燃！', '冲！', '满分！', '学霸！', '砰！'],
};
const SPORT = {hoops: 'hoop', college: 'hoop', cba: 'hoop', gridiron: 'gridiron', football: 'soccer', csl: 'soccer'};
const SCHOOLS = ['campus', 'cnu', 'hs'];

const CARD_WORDS = {
  en: {
    rookie: 'ROOKIE', card: 'CARD', highlights: 'HIGHLIGHTS', year: 'YEAR',
    total: 'ALL-TIME', legends: 'LEGENDS', trivia: 'DID YOU KNOW?', oneOfOne: 'ONE OF ONE',
    auto: 'CERTIFIED AUTOGRAPH', parallel: 'PARALLEL', signed: 'AUTO', grading: 'HOT GRADING',
    motto: 'MOTTO', mascot: 'MASCOT', aka: 'A.K.A.', chant: 'CHANT', home: 'HOME', story: 'STORY · 故事',
    authentic: 'AUTHENTIC', size: 'SIZE', fabric: '100% POLYESTER', care: 'MACHINE WASH COLD',
  },
  zh: {
    rookie: '新秀', card: '卡号', highlights: '历史时刻', year: '年份',
    total: '荣誉', legends: '传奇', trivia: '你知道吗？', oneOfOne: '全球唯一',
    auto: '亲笔签名', parallel: '版本', signed: '签字', grading: 'HOT 评级',
    motto: '校训', mascot: '吉祥物', aka: '别称', chant: '助威', home: '主场', story: '一句话',
    authentic: '正品', size: '尺码', fabric: '100% 聚酯纤维', care: '冷水机洗',
  },
};

function weighted(rand, list, key = 'w') {
  let total = 0;
  list.forEach(item => {
    total += item[key];
  });
  let roll = rand() * total;
  for (const item of list) {
    if (roll < item[key]) return item;
    roll -= item[key];
  }
  return list[list.length - 1];
}

// What a given pull holds. app.js shows its label beside the reroll button.
export function cardInfo(team, seed) {
  const rand = seeded(hash(team.id) ^ Math.imul((seed >>> 0) || 1, 2654435761));
  const pick = list => list[Math.floor(rand() * list.length) % list.length];
  const zh = isZh(team);
  const school = SCHOOLS.indexOf(team.group) >= 0;

  // The parallel.
  let finish = null;
  let colour = null;
  let chase = null;
  const roll = rand() * 100;
  if (roll < 2.8) chase = weighted(rand, CHASE);
  else if (roll >= 26) {
    finish = weighted(rand, FINISHES);
    colour = weighted(rand, COLOURS);
  }
  if (chase) {
    finish = {id: chase.finish};
    colour = COLOURS.find(item => item.id === chase.colour);
  }
  const run = chase ? chase.run : colour ? colour.run : 0;
  const rarity = !finish ? 'base' : run === 1 ? 'one' : run && run <= 10 ? 'rare' : run ? 'numbered' : 'chrome';
  const gold = chase || (colour && (colour.id === 'gold' || colour.id === 'black'));
  let name;
  let nameZh;
  if (chase) {
    name = chase.en;
    nameZh = chase.zh;
  } else if (!finish) {
    name = 'BASE';
    nameZh = '普卡';
  } else {
    name = `${colour.id === 'silver' ? '' : `${colour.en} `}${finish.en}`;
    nameZh = colour.id === 'team' ? `队色${finish.zh}` : `${colour.zh}色${finish.zh}`;
  }
  const serial = run > 1 ? Math.floor(rand() * run) + 1 : run;
  const serialText = run ? `${String(serial).padStart(String(run).length, '0')}/${run}` : '';

  // Hits: an autograph and a piece of memorabilia, likelier on the rarer pulls.
  const odds = {base: [.12, .12], chrome: [.22, .25], numbered: [.42, .48], rare: [.85, .85], one: [1, 1]}[rarity];
  const auto = rand() < odds[0] ? {
    style: rand() < .45 ? 'sticker' : 'ink',
    ink: weighted(rand, INKS).ink,
    inscription: rand() < .4 ? pick(zh ? ['加油！', '#{n}', '冠军', `${team.short}永远`] : ['#{n}', 'RC', `GO ${upper(team.short)}!`, `EST. ${team.est}`]) : '',
  } : null;
  let mem = null;
  if (rand() < odds[1]) {
    const choices = RELICS.filter(item => item.id !== 'ball' || SPORT[team.group]);
    const kind = weighted(rand, choices, rarity === 'rare' || rarity === 'one' ? 'rare' : 'w');
    const shapes = kind.id === 'jersey' || kind.id === 'number' ? WINDOWS : WINDOWS.slice(0, 4);
    mem = {
      id: kind.id,
      en: kind.en,
      zh: school && kind.school ? kind.school : kind.zh,
      window: kind.id === 'tag' || kind.id === 'dual' ? 'rect' : pick(shapes),
    };
  }

  // The design and how the card is shown.
  const showcase = rand() < .75 ? 'premium' : 'obsidian';
  const design = auto && mem && rand() < .5 ? DESIGNS.find(item => item.id === showcase) : weighted(rand, DESIGNS);
  const show = weighted(rand, SHOWS).id;
  const grade = weighted(rand, GRADES.map(([n, word, w]) => ({n, word, w})));

  const sport = SPORT[team.group] || 'school';
  const rookie = weighted(rand, ROOKIES).id;
  const levelN = weighted(rand, LEVEL_ODDS[rarity].map((w, n) => ({w, n}))).n;
  const levelNames = LEVELS[sport === 'school' ? 'school' : sport][levelN];
  const level = {n: levelN, name: levelNames[zh ? 1 : 0]};
  // Four facts for the front: the number and three others.
  const pool = ['est', 'titles', 'legends', 'home', 'city', 'season'];
  const stats = ['no'];
  while (stats.length < 5 && pool.length) stats.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  const [lo, hi] = OVR[rarity];
  const ovr = lo + Math.floor(rand() * (hi - lo + 1));
  const attrs = ATTRS[sport][zh ? 'zh' : 'en'].map(label => [label, Math.max(55, Math.min(99, ovr - 13 + Math.floor(rand() * 20)))]);
  const back = (auto || mem) && rand() < .45 ? 'certificate' : weighted(rand, BACKS).id;
  const cardNo = Math.floor(rand() * 300) + 1;
  const role = pick(ROLES[team.group] || ROLES.hoops);
  const insert = pick(INSERTS[team.group] || INSERTS.hoops);
  const burst = pick(BURSTS[team.group] || BURSTS.hoops);
  // Two of the big moments, kept in year order.
  const moments = (team.moments || []).slice();
  while (moments.length > 2) moments.splice(Math.floor(rand() * moments.length), 1);
  // Up to three legends, in the team's own order.
  const legends = (team.retired || []).slice();
  while (legends.length > 3) legends.splice(Math.floor(rand() * legends.length), 1);
  // Two pieces of trivia.
  const w = CARD_WORDS[zh ? 'zh' : 'en'];
  const school2 = team.group === 'cnu' || team.group === 'hs';
  const trivia = [
    team.motto ? [zh && !school2 ? '格言' : w.motto, team.motto] : null,
    team.mascot ? [w.mascot, team.mascot] : null,
    team.nicknames && team.nicknames.length > 1 ? [w.aka, team.nicknames.join(' · ')] : null,
    team.chant ? [w.chant, team.chant] : null,
    team.homeNick ? [w.home, `${team.home} · ${team.homeNick}`] : null,
    team.story ? [w.story, team.story] : null,
  ].filter(Boolean);
  const facts = [];
  while (trivia.length && facts.length < 2) facts.push(trivia.splice(Math.floor(rand() * trivia.length), 1)[0]);
  const designZh = design.id === 'chrome' ? '' : {
    full: '全幅', skyline: '城市', comic: '漫画', stained: '彩窗', premium: '珍藏',
    select: `精选${levelNames[1]}`, classic: '经典', rated: '评分', obsidian: '黑曜',
  }[design.id];
  const label = [
    nameZh, serialText, designZh ? `${designZh}版式` : '', auto ? '签字' : '', mem ? mem.zh : '',
    show === 'slab' ? `评级 ${grade.n}` : '',
  ].filter(Boolean).join(' · ');
  return {
    tier: {id: rarity}, rarity, gold: Boolean(gold), finish: finish ? finish.id : '', colour: colour ? colour.id : '',
    name: zh ? nameZh : name, run, serial: serialText, auto, mem, design: design.id,
    set: zh ? design.zh : design.en, show, grade, cardNo, role, insert, burst, moments, legends, facts, label,
    rookie, level, stats, rating: {ovr, attrs}, back,
    seed: hash(`${team.id} ${seed}`),
  };
}

// The foil colours of a pull: the parallel's own, or the team's.
function palette(team, info) {
  if (info.colour === 'team') {
    const a = solid(team);
    const other = [team.c2, team.c3, team.accent].find(c => c && c !== a && Math.abs(luminance(c) - luminance(a)) > .1) || '#ffffff';
    return {a, b: mix(a, '#000000', .55), c: mix(other, '#ffffff', .35)};
  }
  const colour = COLOURS.find(item => item.id === info.colour) || COLOURS[0];
  return {a: colour.a, b: colour.b, c: colour.c};
}

// The finish over a rectangle, painted once and kept.
function foilFill(ctx, team, info, x, y, w, h, salt = 0) {
  if (!info.finish) return;
  const scale = Math.min(1, 900 / Math.max(w, h));
  const art = foilCanvas(info.finish, w * scale, h * scale, info.seed + salt, palette(team, info));
  ctx.drawImage(art, x, y, w, h);
}

// The foil over a photo: strong at the edges, clear in the middle where the
// player is, as on a real parallel where the player is cut out.
function foilOnPhoto(ctx, team, info, area, strength = .5) {
  if (!info.finish) return;
  const scale = Math.min(1, 520 / Math.max(area.w, area.h));
  const w = Math.max(1, Math.round(area.w * scale));
  const h = Math.max(1, Math.round(area.h * scale));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  x.drawImage(foilCanvas(info.finish, w, h, info.seed + 7, palette(team, info)), 0, 0, w, h);
  x.globalCompositeOperation = 'destination-out';
  const g = x.createRadialGradient(w / 2, h * .46, 0, w / 2, h * .46, Math.max(w, h) * .6);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(.55, 'rgba(0,0,0,1)');
  g.addColorStop(1, 'rgba(0,0,0,.1)');
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
  ctx.save();
  ctx.globalAlpha = strength;
  ctx.globalCompositeOperation = info.colour === 'black' ? 'screen' : 'overlay';
  ctx.drawImage(c, area.x, area.y, area.w, area.h);
  ctx.globalAlpha = strength * .5;
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(c, area.x, area.y, area.w, area.h);
  ctx.restore();
}

// Light on the chrome: a rainbow sheen, a streak and glints on the rarer pulls.
// over: how much of it falls on the photo, less where the photo is under it.
function lightUp(ctx, info, rand, x, y, w, h, u, over = 1) {
  if (info.rarity === 'base') return;
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  holo(ctx, x, y, w, h, (info.finish === 'refractor' || info.colour === 'silver' ? .5 : .28) * over, .9 + rand() * .6);
  ctx.globalCompositeOperation = 'source-over';
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  const at = .2 + rand() * .5;
  g.addColorStop(at - .08, 'rgba(255,255,255,0)');
  g.addColorStop(at, `rgba(255,255,255,${.22 * over})`);
  g.addColorStop(at + .08, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  const count = {chrome: 4, numbered: 7, rare: 12, one: 18}[info.rarity] || 0;
  sparkles(ctx, rand, x, y, w, h, count, u * .55, info.gold ? '#fff1b8' : '#ffffff');
}

// Splits text into at most maxLines lines of maxWidth, Chinese character by
// character and other text word by word, with … when it runs out of room. The first
// line can be shorter (firstWidth), for text that starts after a label.
function wrapLines(ctx, text, maxWidth, maxLines, firstWidth = maxWidth) {
  const tokens = String(text).match(/[⺀-鿿豈-﫿＀-￯]|[^\s⺀-鿿豈-﫿＀-￯]+|\s+/g) || [];
  const lines = [];
  let line = '';
  let k = 0;
  for (; k < tokens.length; k++) {
    const next = line + tokens[k];
    if (line.trim() && measure(ctx, next.trim()) > (lines.length ? maxWidth : firstWidth)) {
      lines.push(line.trim());
      line = /\s/.test(tokens[k]) ? '' : tokens[k];
      if (lines.length === maxLines) break;
    } else line = next;
  }
  if (lines.length < maxLines) {
    if (line.trim()) lines.push(line.trim());
  } else if (k < tokens.length) {
    let last = lines[maxLines - 1];
    const room = maxLines === 1 ? firstWidth : maxWidth;
    while (last.length > 1 && measure(ctx, `${last}…`) > room) last = last.slice(0, -1);
    lines[maxLines - 1] = `${last}…`;
  }
  return lines;
}

// The RC shield.
function rookieBadge(ctx, cx, cy, s, colour, ink, word) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.moveTo(-s / 2, -s * .5);
  ctx.lineTo(s / 2, -s * .5);
  ctx.lineTo(s / 2, s * .12);
  ctx.quadraticCurveTo(s / 2, s * .45, 0, s * .62);
  ctx.quadraticCurveTo(-s / 2, s * .45, -s / 2, s * .12);
  ctx.closePath();
  ctx.fillStyle = colour;
  ctx.fill();
  ctx.lineWidth = s * .07;
  ctx.strokeStyle = ink;
  ctx.stroke();
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  fit(ctx, 'RC', s * .8, 400, s * .52, DISPLAY, s * .02);
  ctx.fillText('RC', 0, s * .2);
  fit(ctx, word, s * .78, 900, s * .14, SANS, s * .03);
  ctx.fillText(word, 0, s * .42);
  ctx.restore();
}

// The crest: the logo as a sticker, or the drawn emblem in a disc.
function crestMark(ctx, team, logo, cx, cy, size, u, turn = .06) {
  if (logo) {
    sticker(ctx, logo, cx, cy, size, u * 1.2, turn);
    return;
  }
  shadow(ctx, u, true);
  ctx.fillStyle = team.c1;
  ctx.beginPath();
  ctx.arc(cx, cy, size * .42, 0, TAU);
  ctx.fill();
  shadow(ctx, u, false);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1, size * .04);
  ctx.stroke();
  drawMotif(ctx, team.motif, cx, cy, size * .7, team.ink, team.c1, team.accent);
}

// The set's name and the season (or the photo's date) on a slanted tab.
function setTag(ctx, x, y, u, set, line, gold) {
  const tagW = u * 5.8;
  ctx.save();
  ctx.translate(x, y);
  ctx.transform(1, 0, -.18, 1, 0, 0);
  ctx.fillStyle = 'rgba(0,0,0,.78)';
  ctx.fillRect(0, 0, tagW, u * 1.75);
  ctx.fillStyle = gold ? '#f2cf6b' : '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  fit(ctx, set, tagW - u * .6, 400, u * .9, DISPLAY, u * .06);
  ctx.fillText(set, u * .35, u * 1.02);
  fit(ctx, line, tagW - u * .6, 800, u * .44, SANS, u * .1);
  ctx.globalAlpha = .8;
  ctx.fillText(line, u * .35, u * 1.52);
  ctx.restore();
}

// The serial number on a foil stamp; returns its height.
function serialStamp(ctx, info, x, y, u, words, align = 'left') {
  if (!info.run) return 0;
  const text = info.run === 1 ? `${info.serial} · ${words.oneOfOne}` : info.serial;
  font(ctx, 400, u * 1.05, DISPLAY, u * .06, text);
  const sw = measure(ctx, text) + u;
  const sx = align === 'right' ? x - sw : x;
  ctx.fillStyle = info.colour === 'black' ? '#0b0b0b' : 'rgba(0,0,0,.72)';
  roundRect(ctx, sx, y, sw, u * 1.4, u * .25);
  ctx.fill();
  const g = ctx.createLinearGradient(sx, y, sx + sw, y + u * 1.4);
  g.addColorStop(0, '#b8891f');
  g.addColorStop(.5, '#fff1b8');
  g.addColorStop(1, '#c99b2c');
  ctx.fillStyle = info.gold || info.rarity === 'rare' ? g : '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText(text, sx + u * .5, y + u * 1.08);
  return u * 1.4;
}

// ----- Memorabilia -----

// Each material fills x, y, w, h on ctx.
const materials = {
  jersey(ctx, team, x, y, w, h) {
    const u = Math.min(w, h) / 6;
    kit(ctx, team, x - w * .5, y - h * .5, w * 2, h * 2, u * 1.4);
    trim(ctx, team, x, y + h * .66, w, h * .14);
    // The mesh: rows of little holes.
    ctx.fillStyle = luminance(team.c1) > .5 ? 'rgba(0,0,0,.18)' : 'rgba(0,0,0,.3)';
    const s = Math.max(2, u * .32);
    for (let py = y, row = 0; py < y + h; py += s, row++) {
      for (let px = x + (row % 2) * s / 2; px < x + w; px += s) {
        ctx.beginPath();
        ctx.arc(px, py, s * .18, 0, TAU);
        ctx.fill();
      }
    }
  },
  number(ctx, team, x, y, w, h, number) {
    materials.jersey(ctx, team, x, y, w, h);
    const n = number || '0';
    // Part of the number, as if cut from the shirt: big, but kept in the window.
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    fit(ctx, n, w * .92, 400, h * 1.15, DISPLAY);
    const nx = x + w / 2;
    const ny = y + h * .96;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = team.c3 === team.c1 ? team.c2 : team.c3;
    ctx.lineWidth = h * .08;
    ctx.strokeText(n, nx, ny);
    ctx.fillStyle = team.ink === team.c1 ? team.c2 : team.ink;
    ctx.fillText(n, nx, ny);
    // Tackle-twill stitching along the number's edge.
    ctx.setLineDash([h * .03, h * .03]);
    ctx.lineWidth = Math.max(1, h * .012);
    ctx.strokeStyle = 'rgba(255,255,255,.7)';
    ctx.strokeText(n, nx, ny);
    ctx.setLineDash([]);
  },
  logo(ctx, team, x, y, w, h, number, logo) {
    ctx.fillStyle = team.c1;
    ctx.fillRect(x, y, w, h);
    const s = Math.min(w, h) * .82;
    if (logo) {
      const scale = s / Math.max(logo.width, logo.height);
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.5)';
      ctx.shadowBlur = s * .04;
      ctx.shadowOffsetY = s * .02;
      ctx.drawImage(logo, x + w / 2 - logo.width * scale / 2, y + h / 2 - logo.height * scale / 2, logo.width * scale, logo.height * scale);
      ctx.restore();
    } else drawMotif(ctx, team.motif, x + w / 2, y + h / 2, s, team.ink, team.c1, team.accent);
    // Embroidery: fine diagonal thread lines over the patch.
    ctx.strokeStyle = 'rgba(255,255,255,.12)';
    ctx.lineWidth = Math.max(1, s * .006);
    for (let k = -h; k < w; k += Math.max(2, s * .02)) {
      ctx.beginPath();
      ctx.moveTo(x + k, y + h);
      ctx.lineTo(x + k + h, y);
      ctx.stroke();
    }
  },
  tag(ctx, team, x, y, w, h, number, logo, words) {
    ctx.fillStyle = '#f6f4ee';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(0,0,0,.05)';
    for (let k = 0; k < w; k += Math.max(2, w / 90)) ctx.fillRect(x + k, y, 1, h);
    const u = h / 10;
    ctx.fillStyle = '#1b1b1b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const lines = [
      [words.authentic, 900, u * 1.3],
      [upper(team.short), 800, u * .95],
      [`${words.size} ${40 + ((number || '').length * 4) % 16}`, 700, u * .9],
      [words.fabric, 600, u * .7],
      [words.care, 600, u * .62],
    ];
    let ly = y + u * 1.8;
    lines.forEach(([line, weight, size]) => {
      fit(ctx, line, w * .86, weight, size, SANS, size * .08);
      ctx.fillText(line, x + w / 2, ly);
      ly += size * 1.45;
    });
    // Care symbols: tub, triangle, square with circle, iron.
    const s = u * .9;
    const sy = y + h - u * 1.7;
    ctx.strokeStyle = '#1b1b1b';
    ctx.lineWidth = Math.max(1, u * .1);
    [0, 1, 2, 3].forEach(k => {
      const sx = x + w / 2 + (k - 1.5) * s * 1.6;
      ctx.beginPath();
      if (k === 0) {
        ctx.moveTo(sx - s / 2, sy - s / 3);
        ctx.lineTo(sx - s * .35, sy + s / 3);
        ctx.lineTo(sx + s * .35, sy + s / 3);
        ctx.lineTo(sx + s / 2, sy - s / 3);
      } else if (k === 1) {
        ctx.moveTo(sx, sy - s / 2.4);
        ctx.lineTo(sx + s / 2, sy + s / 3);
        ctx.lineTo(sx - s / 2, sy + s / 3);
        ctx.closePath();
      } else if (k === 2) {
        ctx.rect(sx - s / 2.5, sy - s / 2.5, s / 1.25, s / 1.25);
        ctx.moveTo(sx + s / 4, sy);
        ctx.arc(sx, sy, s / 4, 0, TAU);
      } else {
        ctx.moveTo(sx - s / 2, sy + s / 3);
        ctx.lineTo(sx + s / 2, sy + s / 3);
        ctx.lineTo(sx + s / 3, sy - s / 4);
        ctx.lineTo(sx - s / 4, sy - s / 4);
        ctx.closePath();
      }
      ctx.stroke();
    });
  },
  sneaker(ctx, team, x, y, w, h) {
    const white = luminance(team.c1) < .5;
    const base = white ? '#f2f0ea' : team.c1;
    const panel = white ? solid(team) : '#f2f0ea';
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, mix(base, '#ffffff', .25));
    g.addColorStop(1, mix(base, '#000000', .18));
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    // A curved overlay panel, stitched along its edge.
    ctx.fillStyle = panel;
    ctx.beginPath();
    ctx.moveTo(x - w * .1, y + h * .8);
    ctx.quadraticCurveTo(x + w * .45, y + h * .25, x + w * 1.1, y + h * .3);
    ctx.lineTo(x + w * 1.1, y + h * .52);
    ctx.quadraticCurveTo(x + w * .5, y + h * .5, x - w * .1, y + h * 1.05);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = luminance(panel) > .5 ? 'rgba(0,0,0,.45)' : 'rgba(255,255,255,.6)';
    ctx.lineWidth = Math.max(1, h * .012);
    ctx.setLineDash([h * .035, h * .025]);
    ctx.beginPath();
    ctx.moveTo(x - w * .1, y + h * .84);
    ctx.quadraticCurveTo(x + w * .45, y + h * .3, x + w * 1.1, y + h * .35);
    ctx.stroke();
    ctx.setLineDash([]);
    // Perforations on the toe box.
    ctx.fillStyle = 'rgba(0,0,0,.32)';
    const s = Math.max(3, h * .07);
    for (let py = y + s; py < y + h * .42; py += s) {
      for (let px = x + s + ((py / s) % 2) * s / 2; px < x + w * .62; px += s) {
        ctx.beginPath();
        ctx.arc(px, py, s * .16, 0, TAU);
        ctx.fill();
      }
    }
    // Leather grain.
    ctx.fillStyle = 'rgba(0,0,0,.06)';
    for (let k = 0; k < 160; k++) {
      ctx.fillRect(x + ((k * 97) % 100) / 100 * w, y + ((k * 61) % 100) / 100 * h, Math.max(1, h * .012), Math.max(1, h * .012));
    }
  },
  ball(ctx, team, x, y, w, h) {
    const sport = SPORT[team.group] || 'hoop';
    const u = Math.min(w, h);
    if (sport === 'soccer') {
      ctx.fillStyle = '#f5f5f2';
      ctx.fillRect(x, y, w, h);
      const r = u * .22;
      ctx.lineWidth = Math.max(1, u * .02);
      for (let py = y, row = 0; py < y + h + r; py += r * 1.5, row++) {
        for (let px = x + (row % 2) * r * .87; px < x + w + r; px += r * 1.74) {
          ctx.beginPath();
          for (let k = 0; k < 6; k++) ctx.lineTo(px + Math.cos(k * TAU / 6 + Math.PI / 6) * r, py + Math.sin(k * TAU / 6 + Math.PI / 6) * r);
          ctx.closePath();
          ctx.fillStyle = (row + Math.round(px / r)) % 3 ? '#f5f5f2' : '#1b1b1b';
          ctx.fill();
          ctx.strokeStyle = '#9a9a9a';
          ctx.stroke();
        }
      }
      return;
    }
    ctx.fillStyle = sport === 'gridiron' ? '#7b3f1d' : '#d9692b';
    ctx.fillRect(x, y, w, h);
    // Pebbled leather.
    ctx.fillStyle = 'rgba(0,0,0,.16)';
    const s = Math.max(2, u * .035);
    for (let py = y, row = 0; py < y + h; py += s, row++) {
      for (let px = x + (row % 2) * s / 2; px < x + w; px += s) ctx.fillRect(px, py, s * .4, s * .4);
    }
    if (sport === 'gridiron') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + w * .46, y, w * .08, h);
      for (let py = y + h * .08; py < y + h; py += h * .14) ctx.fillRect(x + w * .36, py, w * .28, h * .045);
    } else {
      ctx.strokeStyle = '#1b1b1b';
      ctx.lineWidth = Math.max(1, u * .045);
      ctx.beginPath();
      ctx.moveTo(x + w * .5, y);
      ctx.lineTo(x + w * .5, y + h);
      ctx.moveTo(x, y + h * .5);
      ctx.lineTo(x + w, y + h * .5);
      ctx.moveTo(x - w * .1, y + h * .1);
      ctx.quadraticCurveTo(x + w * .45, y + h * .5, x - w * .1, y + h * .9);
      ctx.moveTo(x + w * 1.1, y + h * .1);
      ctx.quadraticCurveTo(x + w * .55, y + h * .5, x + w * 1.1, y + h * .9);
      ctx.stroke();
    }
  },
};

function windowPath(ctx, shape, x, y, w, h) {
  if (shape === 'circle') {
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, Math.min(w, h) / 2, Math.min(w, h) / 2, 0, 0, TAU);
  } else if (shape === 'round') roundRect(ctx, x, y, w, h, Math.min(w, h) * .28);
  else if (shape === 'shield') {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h * .55);
    ctx.quadraticCurveTo(x + w, y + h * .88, x + w / 2, y + h);
    ctx.quadraticCurveTo(x, y + h * .88, x, y + h * .55);
    ctx.closePath();
  } else roundRect(ctx, x, y, w, h, Math.min(w, h) * .06);
}

// One relic in its window, on a white mount, with its name under it.
function relicWindow(ctx, team, kind, shape, x, y, w, h, u, text, words) {
  const draw = (c, X, Y, W, H) => materials[kind](c, team, X, Y, W, H, text.number, text.logo, words);
  if (shape === 'number') {
    // A window cut in the shape of the shirt number.
    const number = text.number || '0';
    const scale = Math.min(1, 600 / Math.max(w, h));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * scale));
    c.height = Math.max(1, Math.round(h * scale));
    const t = c.getContext('2d');
    draw(t, 0, 0, c.width, c.height);
    t.globalCompositeOperation = 'destination-in';
    t.textAlign = 'center';
    t.textBaseline = 'alphabetic';
    fit(t, number, c.width * .96, 400, c.height * 1.12, DISPLAY);
    t.fillText(number, c.width / 2, c.height * .95);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.6)';
    ctx.shadowBlur = u * .3;
    ctx.drawImage(c, x, y, w, h);
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    fit(ctx, number, w * .96, 400, h * 1.12, DISPLAY);
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(1, u * .14);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeText(number, x + w / 2, y + h * .95);
    return;
  }
  ctx.save();
  windowPath(ctx, shape, x, y, w, h);
  ctx.clip();
  draw(ctx, x, y, w, h);
  // The window's bevel: a shadow along the top-left inner edge.
  const g = ctx.createLinearGradient(x, y, x + w * .2, y + h * .2);
  g.addColorStop(0, 'rgba(0,0,0,.35)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  windowPath(ctx, shape, x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,.95)';
  ctx.lineWidth = Math.max(1, u * .16);
  ctx.stroke();
  windowPath(ctx, shape, x, y, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,.35)';
  ctx.lineWidth = Math.max(1, u * .05);
  ctx.stroke();
}

// The memorabilia of a pull, mounted at x, y, w × h (the label below it).
function relic(ctx, team, info, x, y, w, h, u, text, words, mount = true) {
  const mem = info.mem;
  if (!mem) return;
  if (mount) {
    shadow(ctx, u, true);
    roundRect(ctx, x - u * .3, y - u * .3, w + u * .6, h + u * 1.3, u * .35);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    shadow(ctx, u, false);
  }
  if (mem.id === 'dual') {
    const gap = u * .3;
    const half = (w - gap) / 2;
    relicWindow(ctx, team, 'jersey', 'rect', x, y, half, h, u, text, words);
    relicWindow(ctx, team, 'sneaker', 'rect', x + half + gap, y, half, h, u, text, words);
  } else relicWindow(ctx, team, mem.id, mem.window, x, y, w, h, u, text, words);
  const zh = isZh(team);
  ctx.fillStyle = mount ? '#111111' : '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const word = zh ? mem.zh : mem.en;
  fit(ctx, word, w, 900, u * .4, SANS, u * .06);
  ctx.fillText(word, x + w / 2, y + h + u * .7);
}

// The autograph: the name as a quick signature with a flourish under it.
function signature(ctx, name, x, y, maxWidth, u, ink) {
  const signed = HAN.test(name) ? name : name.toLowerCase().replace(/(^|\s)\S/g, s => s.toUpperCase());
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-.12);
  ctx.transform(1, 0, -.22, 1, 0, 0);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  fit(ctx, signed, maxWidth, 400, u * 1.6, `"Snell Roundhand", "Segoe Script", "Brush Script MT", "Kaiti SC", "STKaiti", KaiTi, cursive`);
  const width = measure(ctx, signed);
  ctx.shadowColor = luminance(ink) > .5 ? 'rgba(0,0,0,.6)' : 'rgba(255,255,255,.85)';
  ctx.shadowBlur = u * .25;
  ctx.fillStyle = ink;
  ctx.fillText(signed, 0, 0);
  ctx.strokeStyle = ink;
  ctx.lineWidth = Math.max(1, u * .12);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-u * .2, u * .45);
  ctx.bezierCurveTo(width * .3, u * .95, width * .7, -u * .1, width + u * .5, u * .25);
  ctx.stroke();
  ctx.restore();
  return width;
}

// The pull's autograph across x, y (the baseline), as ink or on a sticker.
function autograph(ctx, info, text, words, x, y, maxWidth, u) {
  const auto = info.auto;
  if (!auto) return;
  const inscription = auto.inscription.replace('{n}', text.number || '');
  if (auto.style === 'sticker') {
    const w = Math.min(maxWidth, u * 11);
    const h = u * 3.2;
    const sy = y - h * .75;
    shadow(ctx, u, true);
    roundRect(ctx, x, sy, w, h, u * .3);
    ctx.fillStyle = '#fbfbf8';
    ctx.fill();
    shadow(ctx, u, false);
    const g = ctx.createLinearGradient(x, sy, x + w, sy + h);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(.5, 'rgba(200,215,235,.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.25)';
    ctx.lineWidth = Math.max(1, u * .05);
    ctx.beginPath();
    ctx.moveTo(x + u * .5, sy + h * .72);
    ctx.lineTo(x + w - u * .5, sy + h * .72);
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    ctx.textAlign = 'left';
    fit(ctx, words.auto, w - u, 800, u * .3, SANS, u * .06);
    ctx.fillText(words.auto, x + u * .5, sy + h - u * .3);
    const ink = luminance(auto.ink) > .6 ? '#1e4fd8' : auto.ink;
    signature(ctx, text.name, x + u * .7, sy + h * .62, w - u * 1.8, u * .85, ink);
    if (inscription) {
      ctx.fillStyle = ink;
      ctx.textAlign = 'right';
      fit(ctx, inscription, w * .4, 400, u * .7, `"Snell Roundhand", "Segoe Script", "Kaiti SC", KaiTi, cursive`);
      ctx.fillText(inscription, x + w - u * .4, sy + h * .38);
    }
    ctx.textAlign = 'left';
    return;
  }
  const width = signature(ctx, text.name, x, y, maxWidth * .8, u, auto.ink);
  if (inscription) {
    ctx.save();
    ctx.translate(x + Math.min(width, maxWidth * .8) * .55, y + u * 1.2);
    ctx.rotate(-.12);
    ctx.fillStyle = auto.ink;
    ctx.shadowColor = luminance(auto.ink) > .5 ? 'rgba(0,0,0,.6)' : 'rgba(255,255,255,.85)';
    ctx.shadowBlur = u * .2;
    ctx.textAlign = 'left';
    fit(ctx, inscription, maxWidth * .45, 400, u * .9, `"Snell Roundhand", "Segoe Script", "Kaiti SC", KaiTi, cursive`);
    ctx.fillText(inscription, 0, 0);
    ctx.restore();
  }
}

// The colour that stands out on the team colour.
function second(team, fill) {
  return [team.c2, team.c3, team.accent].find(c => c && c !== fill && Math.abs(luminance(c) - luminance(fill)) > .12) || '#ffffff';
}

// The slanted nameplate across the foot of the card, with the insert's name and
// the number in a disc.
function nameplate(ctx, team, info, text, F, area, u) {
  const plateH = u * 4.6;
  const plateY = area.y + area.h - plateH - u * .3;
  const plateX = F.x;
  const plateW = F.w * .8;
  const fill = solid(team);
  const ink = readable(fill);
  const two = second(team, fill);
  shadow(ctx, u, true);
  ctx.beginPath();
  ctx.moveTo(plateX, plateY);
  ctx.lineTo(plateX + plateW, plateY);
  ctx.lineTo(plateX + plateW - plateH * .45, plateY + plateH);
  ctx.lineTo(plateX, plateY + plateH);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  shadow(ctx, u, false);
  // The foil runs through the plate on the parallels.
  if (info.finish) {
    ctx.save();
    ctx.clip();
    ctx.globalAlpha = .35;
    ctx.globalCompositeOperation = 'overlay';
    foilFill(ctx, team, info, plateX, plateY, plateW, plateH, 3);
    ctx.restore();
  }
  ctx.fillStyle = two;
  ctx.beginPath();
  ctx.moveTo(plateX, plateY - u * .78);
  ctx.lineTo(plateX + plateW * .66, plateY - u * .78);
  ctx.lineTo(plateX + plateW * .66 - u * .7, plateY);
  ctx.lineTo(plateX, plateY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = readable(two);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  fit(ctx, info.insert, plateW * .54, 900, u * .52, SANS, u * .12);
  ctx.fillText(info.insert, area.x + u * .3, plateY - u * .2);
  ctx.fillStyle = ink;
  const nameW = plateW - plateH * .45 - (area.x - F.x) - u * .9;
  nameBlock(ctx, text.name, area.x + u * .3, plateY + u * 2.55, nameW, u * 2.1, {ink, sub: ink});
  ctx.textAlign = 'left';
  ctx.fillStyle = ink;
  const line = `${isZh(team) ? team.name : upper(team.name)} · ${info.role}`;
  fit(ctx, line, nameW, 800, u * .62, SANS, u * .1);
  ctx.globalAlpha = .9;
  ctx.fillText(line, area.x + u * .3, plateY + u * 3.6);
  ctx.globalAlpha = 1;
  numberDisc(ctx, team, text, area.x + area.w - u * 2.45, plateY + plateH / 2, u * 2.05, u);
  return plateY;
}

function numberDisc(ctx, team, text, dx, dy, dr, u) {
  const fill = solid(team);
  shadow(ctx, u, true);
  ctx.fillStyle = second(team, fill);
  ctx.beginPath();
  ctx.arc(dx, dy, dr, 0, TAU);
  ctx.fill();
  shadow(ctx, u, false);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(dx, dy, dr * .84, 0, TAU);
  ctx.fill();
  ctx.fillStyle = readable(fill);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  fit(ctx, text.number, dr * 1.3, 400, dr * 1.05, DISPLAY);
  ctx.fillText(text.number, dx, dy + dr * .36);
}

// The card's body, its shadow and a clip to its shape.
function cardBody(ctx, F, r, u, paint) {
  shadow(ctx, u * 2, true);
  roundRect(ctx, F.x, F.y, F.w, F.h, r);
  ctx.fillStyle = '#000000';
  ctx.fill();
  shadow(ctx, u, false);
  ctx.save();
  roundRect(ctx, F.x, F.y, F.w, F.h, r);
  ctx.clip();
  paint();
  ctx.restore();
}

// The photo in area, the foil around the player, a darker foot.
function photo(ctx, team, info, text, area, u, r, corner = 'tr', clipPath = null) {
  ctx.save();
  if (clipPath) clipPath();
  else roundRect(ctx, area.x, area.y, area.w, area.h, r);
  ctx.clip();
  text.drawPhoto(area);
  foilOnPhoto(ctx, team, info, area);
  if (text.mark) photoMarks(ctx, text.logo, area, u * 1.5, corner, null);
  const foot = ctx.createLinearGradient(0, area.y + area.h * .55, 0, area.y + area.h);
  foot.addColorStop(0, 'rgba(0,0,0,0)');
  foot.addColorStop(1, 'rgba(0,0,0,.55)');
  ctx.fillStyle = foot;
  ctx.fillRect(area.x, area.y + area.h * .55, area.w, area.h * .45);
  ctx.restore();
}

// The paper or foil a card is printed on.
function stock(ctx, team, info, x, y, w, h) {
  if (!info.finish) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#fbfaf6');
    g.addColorStop(.5, '#efede6');
    g.addColorStop(1, '#fbfaf6');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    return;
  }
  foilFill(ctx, team, info, x, y, w, h);
}

// ----- Front furniture: the small print that makes a card look real -----

// The season as a card prints it: "2026-27" or "2026".
function seasonYear(text) {
  const m = String(text.season || '').match(/\d{4}(-\d{2})?/);
  return m ? m[0] : String(new Date().getFullYear());
}

// Metal ink for text and rules: a bright top, a dark line through the middle and
// a lighter foot, like foil stamping catching the light. y0 to y1 is its height.
function metal(ctx, y0, y1, kind, base = '#888888') {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  const stops = {
    gold: ['#fff3c4', '#e8bf55', '#7a5810', '#f7d774', '#b8891f'],
    silver: ['#ffffff', '#d3dae1', '#4f5a64', '#eef2f5', '#9aa4ae'],
    rose: ['#ffe6ea', '#f0a0b0', '#7a2a3a', '#ffc6d0', '#c0607a'],
  }[kind] || [mix(base, '#ffffff', .78), mix(base, '#ffffff', .35), mix(base, '#000000', .5), mix(base, '#ffffff', .55), base];
  [0, .44, .52, .6, 1].forEach((at, k) => g.addColorStop(at, stops[k]));
  return g;
}

// The metal that suits a pull: gold on the gold and black chase cards, silver
// otherwise, or the team's own.
function inkOf(info) {
  return info.gold || info.rarity === 'one' ? 'gold' : 'silver';
}

// Text stamped in metal foil: a dark keyline, a soft drop and the metal fill. The font
// must be set already.
function foilText(ctx, str, x, y, size, kind, base, line = 'rgba(0,0,0,.85)', weight = .07) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,0,0,.5)';
  ctx.shadowBlur = size * .14;
  ctx.shadowOffsetY = size * .05;
  if (weight) {
    ctx.lineWidth = size * weight * 2;
    ctx.strokeStyle = line;
    ctx.strokeText(str, x, y);
    ctx.shadowColor = 'transparent';
  }
  ctx.fillStyle = metal(ctx, y - size * .8, y + size * .06, kind, base);
  ctx.fillText(str, x, y);
  ctx.restore();
}

// The maker's mark: HOT on a little chrome hexagon, the season under it.
function brandBug(ctx, cx, cy, s, year, kind = 'silver', under = '#ffffff') {
  const w = s * 1.7;
  ctx.save();
  ctx.translate(cx, cy);
  const hex = () => {
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(-w / 2 + s * .28, -s / 2);
    ctx.lineTo(w / 2 - s * .28, -s / 2);
    ctx.lineTo(w / 2, 0);
    ctx.lineTo(w / 2 - s * .28, s / 2);
    ctx.lineTo(-w / 2 + s * .28, s / 2);
    ctx.closePath();
  };
  ctx.shadowColor = 'rgba(0,0,0,.5)';
  ctx.shadowBlur = s * .2;
  ctx.shadowOffsetY = s * .06;
  hex();
  ctx.fillStyle = metal(ctx, -s / 2, s / 2, kind);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.scale(.86, .82);
  hex();
  ctx.fillStyle = '#101114';
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  fit(ctx, 'HOT', w * .62, 400, s * .66, DISPLAY, s * .04);
  ctx.fillStyle = metal(ctx, cy - s * .3, cy + s * .26, kind);
  ctx.fillText('HOT', cx, cy + s * .25);
  if (year) {
    fit(ctx, year, w * 1.1, 900, s * .3, SANS, s * .05);
    ctx.fillStyle = under;
    ctx.shadowColor = 'rgba(0,0,0,.6)';
    ctx.shadowBlur = s * .12;
    ctx.fillText(year, cx, cy + s * .5 + s * .38);
  }
  ctx.restore();
}

// The rookie logo, in one of four looks.
function rookieMark(ctx, kind, cx, cy, s, team, words) {
  const fill = solid(team);
  const ink = readable(fill);
  const zh = HAN.test(words.rookie);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (kind === 'rated') {
    // A round seal: rings of metal and team colour, a star, RATED over ROOKIE.
    const r = s / 2;
    ctx.shadowColor = 'rgba(0,0,0,.5)';
    ctx.shadowBlur = r * .2;
    ctx.shadowOffsetY = r * .06;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.fillStyle = metal(ctx, cy - r, cy + r, 'silver');
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.beginPath();
    ctx.arc(cx, cy, r * .86, 0, TAU);
    ctx.fillStyle = '#d11a2a';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, r * .66, 0, TAU);
    ctx.fillStyle = fill === '#d11a2a' ? '#111111' : fill;
    ctx.fill();
    ctx.lineWidth = r * .05;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    star(ctx, cx, cy - r * .3, r * .2, '#ffffff');
    ctx.fillStyle = '#ffffff';
    fit(ctx, zh ? '评级' : 'RATED', r * 1.1, 900, r * .26, SANS, r * .04);
    ctx.fillText(zh ? '评级' : 'RATED', cx, cy + r * .1);
    fit(ctx, words.rookie, r * 1.2, 400, r * .42, DISPLAY, r * .02);
    ctx.fillStyle = readable(fill === '#d11a2a' ? '#111111' : fill) === '#111111' ? '#111111' : '#ffe14d';
    ctx.fillText(words.rookie, cx, cy + r * .5);
    // Little stars round the red ring.
    for (let k = 0; k < 10; k++) {
      const a = k / 10 * TAU + TAU / 20;
      if (Math.abs(Math.sin(a)) < .3) continue;
      star(ctx, cx + Math.cos(a) * r * .76, cy + Math.sin(a) * r * .76, r * .06, '#ffffff');
    }
  } else if (kind === 'first') {
    // A slanted tab: 1ST in big type, the maker under it.
    const w = s * 1.15;
    const h = s * .78;
    ctx.translate(cx, cy);
    ctx.transform(1, 0, -.2, 1, 0, 0);
    ctx.shadowColor = 'rgba(0,0,0,.5)';
    ctx.shadowBlur = s * .1;
    ctx.fillStyle = '#d11a2a';
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = metal(ctx, -h / 2, h / 2, 'silver');
    ctx.fillRect(-w / 2, h / 2 - h * .26, w, h * .26);
    ctx.fillStyle = '#ffffff';
    fit(ctx, '1ST', w * .86, 400, h * .62, DISPLAY, s * .01);
    ctx.fillText('1ST', 0, h * .14);
    ctx.fillStyle = '#111111';
    fit(ctx, zh ? '首张新秀卡' : 'HOT ROOKIE', w * .9, 900, h * .17, SANS, s * .02);
    ctx.fillText(zh ? '首张新秀卡' : 'HOT ROOKIE', 0, h / 2 - h * .06);
  } else if (kind === 'banner') {
    // A ribbon with swallowtail ends.
    const w = s * 1.6;
    const h = s * .46;
    ctx.translate(cx, cy);
    ctx.rotate(-.08);
    ctx.shadowColor = 'rgba(0,0,0,.45)';
    ctx.shadowBlur = s * .1;
    ctx.fillStyle = mix(fill, '#000000', .35);
    [-1, 1].forEach(side => {
      ctx.beginPath();
      ctx.moveTo(side * w * .38, -h * .32);
      ctx.lineTo(side * w * .6, -h * .32);
      ctx.lineTo(side * w * .52, h * .1);
      ctx.lineTo(side * w * .6, h * .5);
      ctx.lineTo(side * w * .38, h * .5);
      ctx.closePath();
      ctx.fill();
    });
    ctx.fillStyle = metal(ctx, -h / 2, h / 2, 'gold');
    ctx.fillRect(-w * .45, -h / 2, w * .9, h);
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#111111';
    const word = zh ? `${words.rookie}卡` : `${words.rookie} CARD`;
    fit(ctx, word, w * .8, 400, h * .66, DISPLAY, s * .02);
    ctx.fillText(word, 0, h * .26);
  } else rookieBadge(ctx, cx, cy, s * .82, fill, ink, words.rookie);
  ctx.restore();
}

// The facts printed on a front, by id.
function statCells(team, text, info) {
  const zh = isZh(team);
  const words = say(team);
  const titled = team.titles && team.titles.n;
  const short = titled && team.titles.short && Array.from(team.titles.short).length <= 11 ? team.titles.short : zh ? '冠军' : 'TITLES';
  const cells = {
    no: [zh ? '号码' : 'NO.', text.number || '—'],
    est: [zh ? '始于' : 'EST.', String(team.est)],
    titles: titled ? [short, `${team.titles.n}×`] : null,
    legends: team.retired && team.retired.length ? [zh ? '传奇' : 'LEGENDS', String(team.retired.length)] : null,
    home: [words.home, team.homeNick || team.home],
    city: [zh ? '城市' : 'CITY', zh ? team.city : upper(team.city)],
    season: [zh ? '赛季' : 'SEASON', seasonYear(text)],
  };
  return info.stats.map(id => cells[id]).filter(Boolean).slice(0, 4);
}

// A row of facts, each a small label over a big value, split by fine rules.
// look: bg, ink, label, line.
function statStrip(ctx, cells, x, y, w, h, look) {
  if (!cells.length) return;
  if (look.bg) {
    ctx.fillStyle = look.bg;
    ctx.fillRect(x, y, w, h);
  }
  const cw = w / cells.length;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  cells.forEach(([label, value], k) => {
    const mx = x + cw * k + cw / 2;
    ctx.fillStyle = look.label;
    fit(ctx, label, cw * .86, 900, h * .22, SANS, h * .03);
    ctx.fillText(label, mx, y + h * .34);
    ctx.fillStyle = look.ink;
    fit(ctx, value, cw * .86, 400, h * .46, DISPLAY, h * .01);
    ctx.fillText(value, mx, y + h * .84);
    if (k) {
      ctx.fillStyle = look.line;
      ctx.fillRect(x + cw * k - Math.max(1, h * .02) / 2, y + h * .16, Math.max(1, h * .02), h * .68);
    }
  });
  ctx.textAlign = 'left';
}

// The name as cards print it: a first name in small caps over a big last name,
// or one big line. y is the big line's baseline; returns the top of the block.
// paint(str, x, y, size) draws one line in the design's ink.
function nameBlock(ctx, name, x, y, w, size, o = {}) {
  const align = o.align || 'left';
  const parts = HAN.test(name) ? [name] : String(name).trim().split(/\s+/);
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  const last = parts.length > 1 ? parts[parts.length - 1] : parts[0];
  const big = fit(ctx, last, w, 400, size, DISPLAY, size * .02);
  if (o.metal) foilText(ctx, last, x, y, big, o.metal, o.base, o.line, o.weight === undefined ? .05 : o.weight);
  else {
    ctx.fillStyle = o.ink || '#ffffff';
    ctx.fillText(last, x, y);
  }
  if (parts.length < 2) return y - big * .8;
  const first = parts.slice(0, -1).join(' ');
  const small = fit(ctx, first, w, 800, Math.max(size * .34, big * .34), SANS, size * .08);
  ctx.fillStyle = o.sub || o.ink || '#ffffff';
  ctx.fillText(first, x, y - big * .84);
  return y - big * .84 - small * .8;
}

// The holographic sticker that comes with a signed or relic card.
function authSeal(ctx, cx, cy, r, zh, seed) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.4)';
  ctx.shadowBlur = r * .25;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  if (ctx.createConicGradient) {
    const g = ctx.createConicGradient((seed % 628) / 100, cx, cy);
    ['#ff6fd8', '#ffd36f', '#7dff8a', '#6fe7ff', '#a17dff', '#ff6fd8'].forEach((c, k) => g.addColorStop(k / 5, c));
    ctx.fillStyle = g;
  } else {
    const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    ['#ff6fd8', '#ffd36f', '#7dff8a', '#6fe7ff', '#a17dff'].forEach((c, k) => g.addColorStop(k / 4, c));
    ctx.fillStyle = g;
  }
  ctx.fill();
  ctx.shadowColor = 'transparent';
  // Silver over the rainbow, so it reads as a hologram and not a sweet.
  ctx.globalAlpha = .55;
  ctx.fillStyle = metal(ctx, cy - r, cy + r, 'silver');
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.lineWidth = r * .08;
  ctx.strokeStyle = 'rgba(255,255,255,.9)';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * .74, 0, TAU);
  ctx.lineWidth = r * .04;
  ctx.strokeStyle = 'rgba(0,0,0,.35)';
  ctx.stroke();
  star(ctx, cx, cy - r * .3, r * .2, 'rgba(0,0,0,.55)');
  ctx.fillStyle = 'rgba(0,0,0,.7)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  fit(ctx, 'HOT', r * 1.1, 400, r * .44, DISPLAY, r * .03);
  ctx.fillText('HOT', cx, cy + r * .26);
  fit(ctx, zh ? '正品认证' : 'AUTHENTIC', r * 1.3, 900, r * .2, SANS, r * .03);
  ctx.fillText(zh ? '正品认证' : 'AUTHENTIC', cx, cy + r * .54);
  ctx.restore();
}

// A line of tiny print along an edge, as cards carry their code and copyright.
function microPrint(ctx, str, x, y, maxW, size, colour, turn = 0, align = 'left') {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(turn);
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = colour;
  fit(ctx, str, maxW, 800, size, SANS, size * .12);
  ctx.fillText(str, 0, 0);
  ctx.restore();
}

function microLine(team, text, info) {
  return `HOT · ${info.set} · ${seasonYear(text)} · ${upper(team.short)} · NO. ${String(info.cardNo).padStart(3, '0')} · ${(info.seed >>> 0).toString(16).toUpperCase().slice(0, 6)}`;
}

// Paper grain, painted once into a small tile and repeated.
let grainTile = null;
function grain(ctx, x, y, w, h, alpha) {
  if (!grainTile) {
    grainTile = document.createElement('canvas');
    grainTile.width = 96;
    grainTile.height = 96;
    const g = grainTile.getContext('2d');
    const data = g.createImageData(96, 96);
    const rand = seeded(91);
    for (let i = 0; i < data.data.length; i += 4) {
      const v = rand() < .5 ? 0 : 255;
      data.data[i] = v;
      data.data[i + 1] = v;
      data.data[i + 2] = v;
      data.data[i + 3] = Math.floor(rand() * 70);
    }
    g.putImageData(data, 0, 0);
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = ctx.createPattern(grainTile, 'repeat');
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

// The cut edge of the card: light along the top left, shade along the foot.
function cardEdge(ctx, F, u) {
  ctx.save();
  roundRect(ctx, F.x + u * .07, F.y + u * .07, F.w - u * .14, F.h - u * .14, u * .64);
  const g = ctx.createLinearGradient(F.x, F.y, F.x + F.w * .6, F.y + F.h);
  g.addColorStop(0, 'rgba(255,255,255,.6)');
  g.addColorStop(.45, 'rgba(255,255,255,.1)');
  g.addColorStop(1, 'rgba(0,0,0,.4)');
  ctx.strokeStyle = g;
  ctx.lineWidth = Math.max(1, u * .14);
  ctx.stroke();
  ctx.restore();
}

// Fine laser-etched lines across a rectangle.
function etch(ctx, x, y, w, h, u, colour, gap = .32, turn = .5) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = colour;
  ctx.lineWidth = Math.max(1, u * .03);
  const reach = w + h;
  ctx.beginPath();
  for (let d = -reach; d < reach; d += u * gap) {
    ctx.moveTo(x + d, y);
    ctx.lineTo(x + d + h * turn, y + h);
  }
  ctx.stroke();
  ctx.restore();
}

// What the hits add up to, for the line under a premium set's name.
function hitTitle(info, zh) {
  if (info.auto && info.mem) return zh ? '新秀物料亲笔签名' : 'ROOKIE PATCH AUTOGRAPHS';
  if (info.auto) return zh ? '新秀亲笔签名' : 'ROOKIE SIGNATURES';
  if (info.mem) return zh ? '新秀实物物料' : 'ROOKIE MATERIALS';
  return info.insert;
}

// A cut gem set into the card, for the rarest premium pulls.
function gem(ctx, cx, cy, r, colour) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.shadowColor = colour;
  ctx.shadowBlur = r * .9;
  const pts = [];
  for (let k = 0; k < 8; k++) pts.push([Math.cos(k / 8 * TAU + TAU / 16) * r, Math.sin(k / 8 * TAU + TAU / 16) * r]);
  ctx.beginPath();
  pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = mix(colour, '#000000', .35);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  // Facets: each wedge a shade lighter or darker.
  pts.forEach(([x, y], k) => {
    const [x2, y2] = pts[(k + 1) % 8];
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.fillStyle = mix(colour, k % 2 ? '#ffffff' : '#000000', k % 2 ? .25 + (k % 3) * .12 : .15);
    ctx.fill();
  });
  ctx.beginPath();
  pts.forEach(([x, y], k) => (k ? ctx.lineTo(x * .5, y * .5) : ctx.moveTo(x * .5, y * .5)));
  ctx.closePath();
  ctx.fillStyle = mix(colour, '#ffffff', .45);
  ctx.fill();
  ctx.lineWidth = r * .1;
  ctx.strokeStyle = metal(ctx, -r, r, 'gold');
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.08, 0, TAU);
  ctx.stroke();
  star(ctx, -r * .35, -r * .4, r * .18, '#ffffff');
  ctx.restore();
}

// ----- Front designs -----
// Each draws the front in L.front, with the photo in L.area.

const fronts = {
  // Chrome: the foil as a frame round the photo, a slanted nameplate.
  chrome(ctx, team, text, L, info, words, rand) {
    const F = L.front;
    const area = L.area;
    const u = F.w / 20;
    cardBody(ctx, F, u * .7, u, () => {
      stock(ctx, team, info, F.x, F.y, F.w, F.h);
      lightUp(ctx, info, rand, F.x, F.y, F.w, F.h, u);
    });
    photo(ctx, team, info, text, area, u, u * .35);
    ctx.strokeStyle = !info.finish ? solid(team) : info.gold ? '#d9b45a' : 'rgba(255,255,255,.85)';
    ctx.lineWidth = Math.max(1, u * .14);
    roundRect(ctx, area.x, area.y, area.w, area.h, u * .35);
    ctx.stroke();
    brandBug(ctx, area.x + u * 1.9, area.y + u * 1.3, u * 1.45, '', inkOf(info));
    setTag(ctx, area.x + u * .5, area.y + u * 2.5, u, info.set, text.date || text.season, info.gold);
    const plateY = nameplate(ctx, team, info, text, F, area, u);
    // The facts on the foil under the photo, the card's code up the side.
    const sy = area.y + area.h + u * .35;
    statStrip(ctx, statCells(team, text, info), area.x, sy, area.w, F.y + F.h - u * .5 - sy,
      {bg: 'rgba(0,0,0,.62)', ink: '#ffffff', label: info.gold ? '#f2cf6b' : second(team, solid(team)), line: 'rgba(255,255,255,.25)'});
    microPrint(ctx, microLine(team, text, info), F.x + L.b * .5, area.y + area.h * .5, area.h * .9, u * .3, info.finish ? 'rgba(255,255,255,.75)' : 'rgba(0,0,0,.55)', -Math.PI / 2, 'center');
    if (info.mem) {
      const pw = u * 4.6;
      const ph = info.mem.id === 'tag' ? u * 5 : u * 3.4;
      relic(ctx, team, info, area.x + area.w - pw - u * .55, plateY - ph - u * 2.1, pw, ph, u, text, words);
    }
    autograph(ctx, info, text, words, area.x + u * 1.2, plateY - u * 1.6, area.w * (info.mem ? .52 : .7), u);
    serialStamp(ctx, info, area.x + u * .4, info.auto ? plateY - u * 5.9 : plateY - u * 2.2, u, words);
    const crest = u * 5.2;
    const ccx = area.x + area.w - crest * .5 - u * .2;
    const ccy = area.y + crest * .5 + u * .2;
    crestMark(ctx, team, text.logo, ccx, ccy, crest, u);
    rookieMark(ctx, info.rookie, ccx, ccy + crest * .5 + u * 1.7, u * 2.7, team, words);
  },

  // Full bleed: the photo to the edges, a thin foil line inside, the name running
  // up the side.
  full(ctx, team, text, L, info, words, rand) {
    const F = L.front;
    const area = L.area;
    const u = F.w / 20;
    const fill = solid(team);
    cardBody(ctx, F, u * .7, u, () => {
      text.drawPhoto(area);
      foilOnPhoto(ctx, team, info, area, .55);
      if (text.mark) photoMarks(ctx, text.logo, area, u * 1.5, 'br', null);
      // Team colour rising from the foot and down the left side.
      const g = ctx.createLinearGradient(0, F.y + F.h * .5, 0, F.y + F.h);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,.7)');
      ctx.fillStyle = g;
      ctx.fillRect(F.x, F.y, F.w, F.h);
      ctx.fillStyle = fill;
      ctx.globalAlpha = .88;
      ctx.beginPath();
      ctx.moveTo(F.x, F.y);
      ctx.lineTo(F.x + u * 4.2, F.y);
      ctx.lineTo(F.x + u * 3, F.y + F.h);
      ctx.lineTo(F.x, F.y + F.h);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      // The inner foil line.
      ctx.save();
      ctx.beginPath();
      ctx.rect(F.x + u * .45, F.y + u * .45, F.w - u * .9, F.h - u * .9);
      ctx.rect(F.x + u * .75, F.y + u * .75, F.w - u * 1.5, F.h - u * 1.5);
      ctx.clip('evenodd');
      if (info.finish) foilFill(ctx, team, info, F.x, F.y, F.w, F.h, 5);
      else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(F.x, F.y, F.w, F.h);
      }
      ctx.restore();
      lightUp(ctx, info, rand, F.x, F.y, F.w, F.h, u, .3);
    });
    // The name up the left side.
    ctx.save();
    ctx.translate(F.x + u * 2.35, F.y + F.h - u * 1.4);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = readable(fill);
    fit(ctx, text.name, F.h * .62, 400, u * 2.6, DISPLAY, u * .08);
    ctx.fillText(text.name, 0, 0);
    const nameW = measure(ctx, text.name);
    fit(ctx, `${team.short} · ${info.role}`, F.h - nameW - u * 4, 800, u * .6, SANS, u * .12);
    ctx.globalAlpha = .85;
    ctx.fillText(`${team.short} · ${info.role}`, nameW + u * .6, u * .2);
    ctx.restore();
    // The number, huge and outlined, at the top.
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    fit(ctx, text.number, F.w * .5, 400, u * 6, DISPLAY);
    ctx.lineJoin = 'round';
    ctx.lineWidth = u * .22;
    ctx.strokeStyle = second(team, fill);
    ctx.strokeText(text.number, F.x + u * 4.6, F.y + u * 6.4);
    ctx.globalAlpha = .3;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text.number, F.x + u * 4.6, F.y + u * 6.4);
    ctx.restore();
    // A glass panel across the foot: the insert, the set and season, the facts.
    const gx = F.x + u * 4.1;
    const gw = F.w - u * 4.1 - u * 1;
    const gy = F.y + F.h - u * 5.4;
    const gh = u * 4.5;
    ctx.save();
    roundRect(ctx, gx, gy, gw, gh, u * .3);
    ctx.fillStyle = 'rgba(8,10,14,.62)';
    ctx.fill();
    ctx.lineWidth = Math.max(1, u * .06);
    ctx.strokeStyle = info.gold ? '#f2cf6b' : 'rgba(255,255,255,.45)';
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    fit(ctx, info.insert, gw - u * .8, 900, u * .58, SANS, u * .18);
    ctx.fillText(info.insert, gx + u * .4, gy + u * .9);
    ctx.globalAlpha = .75;
    fit(ctx, `${info.set} · ${isZh(team) ? team.name : upper(team.name)} · ${text.date || seasonYear(text)}`, gw - u * .8, 800, u * .38, SANS, u * .08);
    ctx.fillText(`${info.set} · ${isZh(team) ? team.name : upper(team.name)} · ${text.date || seasonYear(text)}`, gx + u * .4, gy + u * 1.55);
    ctx.globalAlpha = 1;
    statStrip(ctx, statCells(team, text, info), gx + u * .2, gy + u * 1.85, gw - u * .4, gh - u * 2.05,
      {ink: '#ffffff', label: info.gold ? '#f2cf6b' : second(team, fill), line: 'rgba(255,255,255,.25)'});
    brandBug(ctx, F.x + u * 2.1, F.y + u * 1.6, u * 1.3, seasonYear(text), inkOf(info), readable(fill));
    const footY = gy;
    if (info.mem) {
      const pw = u * 5;
      const ph = info.mem.id === 'tag' ? u * 5.4 : u * 3.6;
      relic(ctx, team, info, F.x + F.w - pw - u * 1.2, footY - ph - u * 2.6, pw, ph, u, text, words);
    }
    autograph(ctx, info, text, words, F.x + u * 4.6, footY - u * .9, F.w * .6, u);
    serialStamp(ctx, info, F.x + F.w - u * 1, F.y + u * 9.9, u, words, 'right');
    const crest = u * 4.8;
    crestMark(ctx, team, text.logo, F.x + F.w - crest * .5 - u * .9, F.y + crest * .5 + u * .9, crest, u);
    rookieMark(ctx, info.rookie, F.x + F.w - crest * .5 - u * .9, F.y + u * 7.8, u * 2.6, team, words);
  },

  // City skyline: the photo above the team's city at night, its name in lights.
  skyline(ctx, team, text, L, info, words, rand) {
    const F = L.front;
    const area = L.area;
    const u = F.w / 20;
    const fill = solid(team);
    const two = second(team, fill);
    cardBody(ctx, F, u * .7, u, () => {
      const sky = ctx.createLinearGradient(0, F.y, 0, F.y + F.h);
      sky.addColorStop(0, mix(fill, '#000000', .5));
      sky.addColorStop(.6, mix(fill, '#1a0d2e', .35));
      sky.addColorStop(1, '#07070c');
      ctx.fillStyle = sky;
      ctx.fillRect(F.x, F.y, F.w, F.h);
      if (info.finish) {
        ctx.globalAlpha = .55;
        ctx.globalCompositeOperation = 'overlay';
        foilFill(ctx, team, info, F.x, F.y, F.w, F.h);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
    });
    photo(ctx, team, info, text, area, u, u * .35);
    // Buildings, each with lit windows.
    ctx.save();
    roundRect(ctx, F.x, F.y, F.w, F.h, u * .7);
    ctx.clip();
    const ground = F.y + F.h - u * 4.4;
    let bx = F.x - u * .5;
    while (bx < F.x + F.w) {
      const bw = u * (1.2 + rand() * 2.2);
      const bh = u * (1.5 + rand() * rand() * 7);
      ctx.fillStyle = mix(fill, '#000000', .78);
      ctx.fillRect(bx, ground - bh, bw - u * .12, bh + u * 5);
      if (rand() < .3) ctx.fillRect(bx + bw * .4, ground - bh - u * 1.1, u * .12, u * 1.1);
      ctx.fillStyle = rand() < .5 ? '#ffe6a3' : two;
      for (let wy = ground - bh + u * .45; wy < ground - u * .3; wy += u * .6) {
        for (let wx = bx + u * .3; wx < bx + bw - u * .4; wx += u * .5) {
          ctx.globalAlpha = rand() < .55 ? .85 : .12;
          ctx.fillRect(wx, wy, u * .2, u * .28);
        }
      }
      ctx.globalAlpha = 1;
      bx += bw;
    }
    ctx.fillStyle = '#07070c';
    ctx.fillRect(F.x, ground, F.w, F.h);
    ctx.restore();
    // The city's name as a neon sign across the rooftops.
    const city = isZh(team) ? team.city : upper(team.city);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    fit(ctx, city, F.w - u * 2, 400, u * 3.4, DISPLAY, u * .12);
    ctx.shadowColor = two;
    ctx.shadowBlur = u * .9;
    ctx.lineWidth = u * .16;
    ctx.strokeStyle = two;
    ctx.strokeText(city, F.x + F.w / 2, ground - u * .35);
    ctx.shadowBlur = u * .3;
    ctx.fillStyle = 'rgba(255,255,255,.88)';
    ctx.fillText(city, F.x + F.w / 2, ground - u * .35);
    ctx.restore();
    lightUp(ctx, info, rand, F.x, F.y, F.w, F.h * .5, u, .4);
    // Name and team under the city.
    nameBlock(ctx, text.name, F.x + u * 1, F.y + F.h - u * 1.9, F.w * .62, u * 2.1, {ink: '#ffffff', sub: two});
    ctx.textAlign = 'left';
    ctx.fillStyle = two;
    fit(ctx, `${info.insert} · ${team.short} · ${info.role}`, F.w * .66, 800, u * .5, SANS, u * .1);
    ctx.fillText(`${info.insert} · ${team.short} · ${info.role}`, F.x + u * 1, F.y + F.h - u * .95);
    numberDisc(ctx, team, text, F.x + F.w - u * 2.5, F.y + F.h - u * 2.3, u * 1.75, u);
    brandBug(ctx, area.x + u * 1.9, area.y + u * 1.3, u * 1.45, '', inkOf(info));
    setTag(ctx, area.x + u * .5, area.y + u * 2.5, u, info.set, text.date || text.season, info.gold);
    if (info.mem) {
      const pw = u * 4.4;
      const ph = info.mem.id === 'tag' ? u * 4.8 : u * 3.2;
      relic(ctx, team, info, area.x + area.w - pw - u * .5, area.y + area.h - ph - u * 4.6, pw, ph, u, text, words);
    }
    autograph(ctx, info, text, words, area.x + u * 1, area.y + area.h - u * 4.4, area.w * (info.mem ? .52 : .7), u);
    serialStamp(ctx, info, area.x + u * .5, area.y + u * 4.6, u, words);
    const crest = u * 4.6;
    crestMark(ctx, team, text.logo, area.x + area.w - crest * .5 - u * .2, area.y + crest * .5 + u * .2, crest, u);
    rookieMark(ctx, info.rookie, area.x + area.w - crest * .5 - u * .2, area.y + crest + u * 1.7, u * 2.5, team, words);
    microPrint(ctx, microLine(team, text, info), F.x + F.w - u * .5, F.y + F.h * .4, F.h * .5, u * .28, 'rgba(255,255,255,.5)', Math.PI / 2, 'center');
  },

  // Comic: the photo bursts out of a starburst over halftone dots, with a big word.
  comic(ctx, team, text, L, info, words, rand) {
    const F = L.front;
    const area = L.area;
    const u = F.w / 20;
    const fill = solid(team);
    const two = second(team, fill);
    const cx = area.x + area.w / 2;
    const cy = area.y + area.h / 2;
    const points = 18;
    const spikes = [];
    for (let k = 0; k < points * 2; k++) {
      const a = k / (points * 2) * TAU;
      const r = k % 2 ? .5 : .62 + rand() * .1;
      spikes.push([cx + Math.cos(a) * area.w * r, cy + Math.sin(a) * area.h * r]);
    }
    const burst = () => {
      ctx.beginPath();
      spikes.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
    };
    cardBody(ctx, F, u * .7, u, () => {
      ctx.fillStyle = two;
      ctx.fillRect(F.x, F.y, F.w, F.h);
      if (info.finish) {
        ctx.globalAlpha = .7;
        foilFill(ctx, team, info, F.x, F.y, F.w, F.h);
        ctx.globalAlpha = 1;
      }
      // Speed lines from the middle.
      ctx.fillStyle = 'rgba(0,0,0,.22)';
      for (let k = 0; k < 40; k++) {
        const a = k / 40 * TAU + rand() * .05;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * F.h * 1.5, cy + Math.sin(a) * F.h * 1.5);
        ctx.lineTo(cx + Math.cos(a + .03) * F.h * 1.5, cy + Math.sin(a + .03) * F.h * 1.5);
        ctx.closePath();
        ctx.fill();
      }
      // Halftone dots, bigger toward the foot.
      ctx.fillStyle = fill;
      const s = u * .7;
      for (let py = F.y, row = 0; py < F.y + F.h; py += s, row++) {
        for (let px = F.x + (row % 2) * s / 2; px < F.x + F.w; px += s) {
          const r = s * .38 * Math.max(0, (py - F.y) / F.h - .15);
          if (r < .5) continue;
          ctx.beginPath();
          ctx.arc(px, py, r, 0, TAU);
          ctx.fill();
        }
      }
      // The burst's thick black edge, then the photo inside it.
      burst();
      ctx.lineJoin = 'miter';
      ctx.lineWidth = u * .9;
      ctx.strokeStyle = '#111111';
      ctx.stroke();
      ctx.lineWidth = u * .35;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      photo(ctx, team, info, text, area, u, 0, 'bl', burst);
      lightUp(ctx, info, rand, F.x, F.y, F.w, F.h, u, .45);
    });
    // The big word.
    ctx.save();
    ctx.translate(F.x + u * 1.2, F.y + u * 4);
    ctx.rotate(-.16);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    fit(ctx, info.burst, F.w * .7, 400, u * 3.6, DISPLAY, u * .06);
    ctx.lineJoin = 'round';
    ctx.lineWidth = u * .9;
    ctx.strokeStyle = '#111111';
    ctx.strokeText(info.burst, 0, 0);
    ctx.fillStyle = '#ffe14d';
    ctx.fillText(info.burst, 0, 0);
    ctx.lineWidth = u * .12;
    ctx.strokeStyle = '#d11a2a';
    ctx.strokeText(info.burst, u * .08, -u * .08);
    ctx.restore();
    // The name in a caption box.
    const boxY = F.y + F.h - u * 4.4;
    ctx.save();
    ctx.translate(F.x + u * .9, boxY);
    ctx.rotate(-.04);
    ctx.fillStyle = '#111111';
    ctx.fillRect(u * .25, u * .25, F.w * .7, u * 3.2);
    ctx.fillStyle = '#fffbe8';
    ctx.fillRect(0, 0, F.w * .7, u * 3.2);
    ctx.lineWidth = u * .2;
    ctx.strokeStyle = '#111111';
    ctx.strokeRect(0, 0, F.w * .7, u * 3.2);
    ctx.fillStyle = '#111111';
    ctx.textAlign = 'left';
    fit(ctx, text.name, F.w * .64, 400, u * 1.9, DISPLAY, u * .05);
    ctx.fillText(text.name, u * .5, u * 1.95);
    fit(ctx, `${team.short} · ${info.role} · ${info.set}`, F.w * .64, 800, u * .46, SANS, u * .08);
    ctx.fillText(`${team.short} · ${info.role} · ${info.set}`, u * .5, u * 2.75);
    ctx.restore();
    // The number in a star.
    const sx = F.x + F.w - u * 3;
    const sy = F.y + F.h - u * 3.2;
    star(ctx, sx + u * .2, sy + u * .2, u * 2.8, '#111111');
    star(ctx, sx, sy, u * 2.8, fill);
    ctx.fillStyle = readable(fill);
    ctx.textAlign = 'center';
    fit(ctx, text.number, u * 2.2, 400, u * 1.6, DISPLAY);
    ctx.fillText(text.number, sx, sy + u * .6);
    if (info.mem) {
      const pw = u * 4.4;
      const ph = info.mem.id === 'tag' ? u * 4.8 : u * 3.2;
      relic(ctx, team, info, F.x + F.w - pw - u * 1.1, boxY - ph - u * 4.2, pw, ph, u, text, words);
    }
    autograph(ctx, info, text, words, F.x + u * 1.6, boxY - u * 1.2, F.w * (info.mem ? .5 : .66), u);
    serialStamp(ctx, info, F.x + u * 1.2, F.y + u * 5.2, u, words);
    const crest = u * 4.4;
    crestMark(ctx, team, text.logo, F.x + F.w - crest * .5 - u * .8, F.y + crest * .5 + u * .8, crest, u, -.08);
    rookieMark(ctx, info.rookie, F.x + F.w - crest * .5 - u * .8, F.y + crest + u * 2.4, u * 2.5, team, words);
  },

  // Stained glass: shards of coloured glass round an arched window.
  stained(ctx, team, text, L, info, words, rand) {
    const F = L.front;
    const area = L.area;
    const u = F.w / 20;
    const fill = solid(team);
    const p = info.finish ? palette(team, info) : {a: fill, b: mix(fill, '#000000', .5), c: second(team, fill)};
    const glass = [p.a, p.b, p.c, team.c1, team.c2, team.c3, team.accent].filter(Boolean);
    const arch = () => {
      const r = area.w / 2;
      ctx.beginPath();
      ctx.moveTo(area.x, area.y + area.h);
      ctx.lineTo(area.x, area.y + r);
      ctx.arc(area.x + r, area.y + r, r, Math.PI, 0);
      ctx.lineTo(area.x + area.w, area.y + area.h);
      ctx.closePath();
    };
    cardBody(ctx, F, u * .7, u, () => {
      ctx.fillStyle = '#16120e';
      ctx.fillRect(F.x, F.y, F.w, F.h);
      shards(F.x, F.y, F.w, F.h, rand, 64).forEach((poly, k) => {
        const g = ctx.createLinearGradient(poly[0][0], poly[0][1], poly[poly.length >> 1][0], poly[poly.length >> 1][1]);
        const colour = glass[k % glass.length];
        g.addColorStop(0, mix(colour, '#ffffff', .35));
        g.addColorStop(1, colour);
        ctx.fillStyle = g;
        ctx.beginPath();
        poly.forEach((q, n) => (n ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = u * .28;
        ctx.strokeStyle = '#16120e';
        ctx.stroke();
      });
      if (info.finish) {
        ctx.globalAlpha = .4;
        ctx.globalCompositeOperation = 'overlay';
        foilFill(ctx, team, info, F.x, F.y, F.w, F.h);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
      lightUp(ctx, info, rand, F.x, F.y, F.w, F.h, u);
    });
    // The window: the photo in an arch with a heavy lead and gold frame.
    photo(ctx, team, info, text, area, u, 0, 'tr', arch);
    arch();
    ctx.lineWidth = u * .7;
    ctx.strokeStyle = '#16120e';
    ctx.stroke();
    arch();
    ctx.lineWidth = u * .22;
    ctx.strokeStyle = '#e2bf5d';
    ctx.stroke();
    // A banner under the arch with the name.
    const by = area.y + area.h + u * .3;
    ctx.fillStyle = '#16120e';
    ctx.fillRect(F.x + u * .6, by, F.w - u * 1.2, F.y + F.h - by - u * .6);
    ctx.strokeStyle = '#e2bf5d';
    ctx.lineWidth = u * .12;
    ctx.strokeRect(F.x + u * .9, by + u * .3, F.w - u * 1.8, F.y + F.h - by - u * 1.2);
    ctx.fillStyle = '#f6e7b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const mid = F.x + F.w / 2;
    nameBlock(ctx, text.name, mid, by + u * 2.5, F.w - u * 7.4, u * 1.7, {metal: 'gold', weight: .03});
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f6e7b8';
    fit(ctx, `${info.set} · ${isZh(team) ? team.name : upper(team.name)} · ${info.role}`, F.w - u * 7.4, 800, u * .4, SANS, u * .1);
    ctx.globalAlpha = .85;
    ctx.fillText(`${info.set} · ${isZh(team) ? team.name : upper(team.name)} · ${info.role}`, mid, by + u * 3.2);
    ctx.globalAlpha = 1;
    statStrip(ctx, statCells(team, text, info), F.x + u * 1.3, by + u * 3.55, F.w - u * 2.6, F.y + F.h - u * 1.05 - (by + u * 3.55),
      {ink: '#f6e7b8', label: '#e2bf5d', line: 'rgba(226,191,93,.35)'});
    numberDisc(ctx, team, text, F.x + F.w - u * 2.6, by + u * 1.8, u * 1.45, u);
    if (info.mem) {
      const pw = u * 4.2;
      const ph = info.mem.id === 'tag' ? u * 4.6 : u * 3;
      relic(ctx, team, info, area.x + area.w - pw - u * .4, area.y + area.h - ph - u * 1.6, pw, ph, u, text, words);
    }
    autograph(ctx, info, text, words, area.x + u * .9, area.y + area.h - u * 1.2, area.w * (info.mem ? .5 : .7), u);
    serialStamp(ctx, info, area.x + u * .3, area.y + area.w * .5 + u * 1, u, words);
    const crest = u * 4.2;
    crestMark(ctx, team, text.logo, mid, area.y - u * .1, crest, u, 0);
    setTag(ctx, F.x + u * .8, F.y + u * .8, u * .8, info.set, text.date || text.season, true);
    brandBug(ctx, F.x + F.w - u * 2.3, F.y + u * 1.5, u * 1.3, seasonYear(text), 'gold', '#f6e7b8');
    rookieMark(ctx, info.rookie, area.x + area.w - u * 2, area.y + area.w * .5 + u * 1.8, u * 2.4, team, words);
  },

  // Premium: a thick dark board with gold stamping, a small photo window and a big
  // window for the memorabilia beside the signature.
  premium(ctx, team, text, L, info, words, rand) {
    const F = L.front;
    const area = L.area;
    const u = F.w / 20;
    const fill = solid(team);
    const dark = mix(fill, '#000000', .72);
    const goldInk = ctx.createLinearGradient(F.x, F.y, F.x + F.w, F.y + F.h);
    ['#8f6a14', '#f7d774', '#b8891f', '#fff1b8', '#8f6a14'].forEach((c, k) => goldInk.addColorStop(k / 4, c));
    cardBody(ctx, F, u * .7, u, () => {
      const g = ctx.createRadialGradient(F.x + F.w / 2, F.y + F.h * .4, 0, F.x + F.w / 2, F.y + F.h * .4, F.h * .8);
      g.addColorStop(0, mix(dark, '#ffffff', .08));
      g.addColorStop(1, mix(dark, '#000000', .5));
      ctx.fillStyle = g;
      ctx.fillRect(F.x, F.y, F.w, F.h);
      // Leather grain.
      ctx.fillStyle = 'rgba(255,255,255,.035)';
      for (let k = 0; k < 900; k++) ctx.fillRect(F.x + rand() * F.w, F.y + rand() * F.h, u * .08, u * .08);
      if (text.logo) watermark(ctx, text.logo, F.x + F.w * .5, F.y + F.h * .72, F.w * .9, '#ffffff', .05, -.1);
      // The parallel's foil as a thick frame.
      ctx.save();
      ctx.beginPath();
      ctx.rect(F.x, F.y, F.w, F.h);
      ctx.rect(F.x + u * .7, F.y + u * .7, F.w - u * 1.4, F.h - u * 1.4);
      ctx.clip('evenodd');
      if (info.finish) foilFill(ctx, team, info, F.x, F.y, F.w, F.h);
      else {
        ctx.fillStyle = goldInk;
        ctx.fillRect(F.x, F.y, F.w, F.h);
      }
      ctx.restore();
      ctx.strokeStyle = goldInk;
      ctx.lineWidth = Math.max(1, u * .08);
      ctx.strokeRect(F.x + u * .95, F.y + u * .95, F.w - u * 1.9, F.h - u * 1.9);
      lightUp(ctx, info, rand, F.x, F.y, F.w, F.h, u);
    });
    // Gold-stamped set name and serial.
    ctx.fillStyle = goldInk;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    fit(ctx, info.set, F.w * .55, 400, u * 1.05, DISPLAY, u * .14);
    ctx.fillText(info.set, F.x + u * 1.5, F.y + u * 2.4);
    fit(ctx, `${hitTitle(info, isZh(team))} · ${seasonYear(text)}`, F.w * .6, 900, u * .42, SANS, u * .16);
    ctx.fillText(`${hitTitle(info, isZh(team))} · ${seasonYear(text)}`, F.x + u * 1.5, F.y + u * 3.1);
    if (info.run) {
      ctx.textAlign = 'right';
      fit(ctx, info.serial, F.w * .3, 400, u * 1.05, DISPLAY, u * .06);
      ctx.fillText(info.serial, F.x + F.w - u * 1.5, F.y + u * 2.4);
    }
    photo(ctx, team, info, text, area, u, u * .3, 'tr');
    ctx.strokeStyle = goldInk;
    ctx.lineWidth = u * .18;
    roundRect(ctx, area.x, area.y, area.w, area.h, u * .3);
    ctx.stroke();
    const crest = u * 3.8;
    crestMark(ctx, team, text.logo, area.x + area.w - crest * .45, area.y + area.h - crest * .3, crest, u, .08);
    rookieMark(ctx, info.rookie, area.x + u * 1.9, area.y + u * 1.9, u * 2.4, team, words);
    // The rarest pulls have a gem set into the frame.
    if (info.rarity === 'one' || info.rarity === 'rare') gem(ctx, F.x + F.w / 2, area.y, u * .95, info.colour === 'black' ? '#3a3a46' : palette(team, info).a);
    // Below the photo: the relic on the left, the signature on the right.
    const lowY = area.y + area.h + u * 1;
    const lowH = F.y + F.h - u * 3.7 - lowY;
    if (info.mem) {
      const pw = u * 6.6;
      relic(ctx, team, info, F.x + u * 1.6, lowY, pw, lowH - u * 1, u, text, words, false);
      ctx.strokeStyle = goldInk;
      ctx.lineWidth = u * .1;
      ctx.strokeRect(F.x + u * 1.35, lowY - u * .25, pw + u * .5, lowH - u * .5);
    } else {
      ctx.fillStyle = goldInk;
      ctx.textAlign = 'center';
      fit(ctx, text.number, u * 6, 400, lowH * .8, DISPLAY);
      ctx.fillText(text.number, F.x + u * 4.9, lowY + lowH * .78);
    }
    const sx = F.x + u * 9;
    if (info.auto || info.mem) authSeal(ctx, F.x + F.w - u * 2.5, lowY + u * 1.1, u * .85, isZh(team), info.seed);
    if (info.auto) {
      ctx.strokeStyle = 'rgba(255,255,255,.35)';
      ctx.lineWidth = Math.max(1, u * .05);
      ctx.beginPath();
      ctx.moveTo(sx, lowY + lowH * .72);
      ctx.lineTo(F.x + F.w - u * 1.5, lowY + lowH * .72);
      ctx.stroke();
      autograph(ctx, info, text, words, sx + u * .2, lowY + lowH * .62, F.w - u * 10.5, u * .95);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      ctx.textAlign = 'left';
      fit(ctx, info.insert, F.w - u * 10.5, 900, u * .55, SANS, u * .14);
      ctx.fillText(info.insert, sx, lowY + lowH * .5);
    }
    // Name across the foot, in gold.
    ctx.fillStyle = goldInk;
    ctx.textAlign = 'center';
    const mid = F.x + F.w / 2;
    fit(ctx, text.name, F.w - u * 4, 400, u * 1.7, DISPLAY, u * .12);
    ctx.fillText(text.name, mid, F.y + F.h - u * 1.85);
    ctx.globalAlpha = .8;
    fit(ctx, `${team.short} · ${info.role} · #${text.number} · ${text.date || text.season}`, F.w - u * 4, 800, u * .42, SANS, u * .12);
    ctx.fillText(`${team.short} · ${info.role} · #${text.number} · ${text.date || text.season}`, mid, F.y + F.h - u * 1.1);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  },

  // Select: a three-tier set. An angular frame in the tier's metal, the set and
  // tier across the top, a slab nameplate and a row of facts at the foot.
  select(ctx, team, text, L, info, words, rand) {
    const F = L.front;
    const area = L.area;
    const u = F.w / 20;
    const fill = solid(team);
    const zh = isZh(team);
    const tier = info.level.n;
    const tierInk = tier === 2 ? second(team, fill) : tier === 1 ? '#e8bf55' : '#a9c1d9';
    const tierMetal = tier === 1 ? 'gold' : tier === 2 ? '' : 'silver';
    const cut = u * 1.6;
    const window_ = () => {
      ctx.beginPath();
      ctx.moveTo(area.x + cut, area.y);
      ctx.lineTo(area.x + area.w, area.y);
      ctx.lineTo(area.x + area.w, area.y + area.h - cut);
      ctx.lineTo(area.x + area.w - cut, area.y + area.h);
      ctx.lineTo(area.x, area.y + area.h);
      ctx.lineTo(area.x, area.y + cut);
      ctx.closePath();
    };
    cardBody(ctx, F, u * .7, u, () => {
      const g = ctx.createLinearGradient(F.x, F.y, F.x + F.w, F.y + F.h);
      g.addColorStop(0, mix(fill, '#000000', .55));
      g.addColorStop(.5, '#0c0e13');
      g.addColorStop(1, mix(fill, '#000000', .7));
      ctx.fillStyle = g;
      ctx.fillRect(F.x, F.y, F.w, F.h);
      if (info.finish) {
        ctx.globalAlpha = .6;
        foilFill(ctx, team, info, F.x, F.y, F.w, F.h);
        ctx.globalAlpha = 1;
      }
      // Angular panels in the team colours behind the frame.
      [[0, .1, .55, .0, .32], [1, .55, 1, .7, 1]].forEach(([k, a, b, c, d]) => {
        ctx.fillStyle = k ? mix(fill, '#000000', .2) : second(team, fill);
        ctx.globalAlpha = .55;
        ctx.beginPath();
        ctx.moveTo(F.x + F.w * a, F.y + F.h * c);
        ctx.lineTo(F.x + F.w * b, F.y + F.h * c);
        ctx.lineTo(F.x + F.w * (b - .2), F.y + F.h * d);
        ctx.lineTo(F.x + F.w * (a - .2), F.y + F.h * d);
        ctx.closePath();
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      etch(ctx, F.x, F.y, F.w, F.h, u, 'rgba(255,255,255,.07)', .34, -.35);
      grain(ctx, F.x, F.y, F.w, F.h, .25);
      lightUp(ctx, info, rand, F.x, F.y, F.w, F.h, u, .7);
    });
    // The frame: a thick tier-metal bevel round the cut-corner window.
    photo(ctx, team, info, text, area, u, 0, 'tr', window_);
    window_();
    ctx.lineJoin = 'miter';
    ctx.lineWidth = u * .5;
    ctx.strokeStyle = tierMetal ? metal(ctx, area.y, area.y + area.h, tierMetal) : tierInk;
    ctx.stroke();
    window_();
    ctx.lineWidth = u * .1;
    ctx.strokeStyle = 'rgba(0,0,0,.6)';
    ctx.stroke();
    // Tick marks on the frame's corners.
    ctx.fillStyle = tierInk;
    [[area.x + area.w - u * 2.2, area.y - u * .55], [area.x + u * .2, area.y + area.h + u * .3]].forEach(([x, y]) => {
      for (let k = 0; k < 4; k++) ctx.fillRect(x + k * u * .5, y, u * .3, u * .22);
    });

    // Top: the maker, the set in metal, the tier, the season.
    brandBug(ctx, F.x + u * 2.2, F.y + u * 1.55, u * 1.35, '', tierMetal || 'silver');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const mid = F.x + F.w / 2 + u * .4;
    const setSize = fit(ctx, info.set, F.w * .52, 400, u * 1.45, DISPLAY, u * .1);
    foilText(ctx, info.set, mid, F.y + u * 2.05, setSize, tierMetal || 'silver', tierInk);
    fit(ctx, info.level.name, F.w * .5, 900, u * .5, SANS, u * .3);
    ctx.fillStyle = tierInk;
    ctx.fillText(info.level.name, mid, F.y + u * 2.85);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    fit(ctx, seasonYear(text), u * 3.4, 400, u * .78, DISPLAY, u * .04);
    ctx.fillText(seasonYear(text), F.x + F.w - u * 1.1, F.y + u * 1.9);
    ctx.textAlign = 'left';

    // In the window: the rookie logo, the serial, the hits.
    rookieMark(ctx, info.rookie, area.x + area.w - u * 2, area.y + u * 2.1, u * 2.4, team, words);
    serialStamp(ctx, info, area.x + u * .6, area.y + cut + u * .4, u, words);
    if (info.mem) {
      const pw = u * 4.4;
      const ph = info.mem.id === 'tag' ? u * 4.8 : u * 3.2;
      relic(ctx, team, info, area.x + area.w - pw - u * .7, area.y + area.h - ph - u * 2.1, pw, ph, u, text, words);
    }
    autograph(ctx, info, text, words, area.x + u * 4.6, area.y + area.h - u * 1.3, area.w * (info.mem ? .44 : .66), u);

    // The nameplate: a slab in the team colour, the crest in a hexagon on its corner,
    // the number in a tier-coloured box.
    const py = area.y + area.h + u * .35;
    const ph = u * 4.5;
    const nx = F.w - u * 4.2;
    shadow(ctx, u, true);
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(F.x, py);
    ctx.lineTo(F.x + nx, py);
    ctx.lineTo(F.x + nx - u * 1.1, py + ph);
    ctx.lineTo(F.x, py + ph);
    ctx.closePath();
    ctx.fill();
    shadow(ctx, u, false);
    if (info.finish) {
      ctx.save();
      ctx.clip();
      ctx.globalAlpha = .3;
      ctx.globalCompositeOperation = 'overlay';
      foilFill(ctx, team, info, F.x, py, nx, ph, 3);
      ctx.restore();
    }
    ctx.fillStyle = tierInk;
    ctx.beginPath();
    ctx.moveTo(F.x + nx + u * .25, py);
    ctx.lineTo(F.x + F.w, py);
    ctx.lineTo(F.x + F.w, py + ph);
    ctx.lineTo(F.x + nx - u * .85, py + ph);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = readable(tierInk);
    ctx.textAlign = 'center';
    fit(ctx, text.number, u * 2.6, 400, u * 2.6, DISPLAY);
    ctx.fillText(text.number, F.x + nx + u * 1.6, py + ph * .72);
    fit(ctx, zh ? '号' : 'NO.', u * 2, 900, u * .4, SANS, u * .1);
    ctx.fillText(zh ? '号' : 'NO.', F.x + nx + u * 1.6, py + ph * .2);
    // The crest in a hexagon over the window's corner.
    const hx = F.x + u * 2.5;
    const hy = py + u * .2;
    const hr = u * 1.95;
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * TAU + TAU / 12;
      ctx.lineTo(hx + Math.cos(a) * hr, hy + Math.sin(a) * hr);
    }
    ctx.closePath();
    shadow(ctx, u, true);
    ctx.fillStyle = '#0c0e13';
    ctx.fill();
    shadow(ctx, u, false);
    ctx.lineWidth = u * .22;
    ctx.strokeStyle = tierMetal ? metal(ctx, hy - hr, hy + hr, tierMetal) : tierInk;
    ctx.stroke();
    crestMark(ctx, team, text.logo, hx, hy, hr * 1.45, u * .6, 0);
    const ink = readable(fill);
    const tx = F.x + u * 5;
    const tw = nx - u * 6.4;
    nameBlock(ctx, text.name, tx, py + u * 2.65, tw, u * 2, {ink, sub: ink});
    ctx.textAlign = 'left';
    ctx.fillStyle = ink;
    ctx.globalAlpha = .9;
    fit(ctx, `${zh ? team.name : upper(team.name)} · ${info.role}`, tw, 800, u * .5, SANS, u * .08);
    ctx.fillText(`${zh ? team.name : upper(team.name)} · ${info.role}`, tx, py + u * 3.55);
    ctx.globalAlpha = 1;
    // Facts along the foot.
    const sy = py + ph + u * .25;
    statStrip(ctx, statCells(team, text, info), F.x + u * .9, sy, F.w - u * 1.8, F.y + F.h - u * .55 - sy,
      {bg: 'rgba(0,0,0,.55)', ink: '#ffffff', label: tierInk, line: 'rgba(255,255,255,.25)'});
    microPrint(ctx, microLine(team, text, info), F.x + F.w - u * .42, F.y + F.h * .5, F.h * .62, u * .3, 'rgba(255,255,255,.55)', Math.PI / 2, 'center');
  },

  // Classic: a bordered card with a bevelled photo, a big name banner, a round
  // RATED ROOKIE seal and a line of facts under the banner.
  classic(ctx, team, text, L, info, words, rand) {
    const F = L.front;
    const area = L.area;
    const u = F.w / 20;
    const fill = solid(team);
    const two = second(team, fill);
    const zh = isZh(team);
    cardBody(ctx, F, u * .7, u, () => {
      if (info.finish) foilFill(ctx, team, info, F.x, F.y, F.w, F.h);
      else {
        const g = ctx.createLinearGradient(F.x, F.y, F.x, F.y + F.h);
        g.addColorStop(0, mix(fill, '#ffffff', .15));
        g.addColorStop(1, mix(fill, '#000000', .35));
        ctx.fillStyle = g;
        ctx.fillRect(F.x, F.y, F.w, F.h);
        // Pinstripes in the second colour, like a printed border.
        ctx.fillStyle = two;
        ctx.globalAlpha = .18;
        for (let x = F.x; x < F.x + F.w; x += u * .9) ctx.fillRect(x, F.y, u * .16, F.h);
        ctx.globalAlpha = 1;
      }
      grain(ctx, F.x, F.y, F.w, F.h, .3);
      lightUp(ctx, info, rand, F.x, F.y, F.w, F.h, u, .8);
    });
    // The photo's bevel: light on the top and left, dark on the foot and right.
    const bv = u * .45;
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    ctx.beginPath();
    ctx.moveTo(area.x - bv, area.y - bv);
    ctx.lineTo(area.x + area.w + bv, area.y - bv);
    ctx.lineTo(area.x + area.w, area.y);
    ctx.lineTo(area.x, area.y);
    ctx.lineTo(area.x, area.y + area.h);
    ctx.lineTo(area.x - bv, area.y + area.h + bv);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.beginPath();
    ctx.moveTo(area.x + area.w + bv, area.y - bv);
    ctx.lineTo(area.x + area.w + bv, area.y + area.h + bv);
    ctx.lineTo(area.x - bv, area.y + area.h + bv);
    ctx.lineTo(area.x, area.y + area.h);
    ctx.lineTo(area.x + area.w, area.y + area.h);
    ctx.lineTo(area.x + area.w, area.y);
    ctx.closePath();
    ctx.fill();
    photo(ctx, team, info, text, area, u, 0, 'bl');
    ctx.strokeStyle = two;
    ctx.lineWidth = u * .16;
    ctx.strokeRect(area.x + u * .35, area.y + u * .35, area.w - u * .7, area.h - u * .7);
    brandBug(ctx, area.x + u * 2, area.y + u * 1.5, u * 1.5, seasonYear(text), inkOf(info));
    const crest = u * 4;
    crestMark(ctx, team, text.logo, area.x + area.w - crest * .5 - u * .4, area.y + crest * .5 + u * .4, crest, u, .04);
    serialStamp(ctx, info, area.x + area.w - u * .6, area.y + crest + u * 1.1, u, words, 'right');
    if (info.mem) {
      const pw = u * 4.4;
      const ph = info.mem.id === 'tag' ? u * 4.8 : u * 3.2;
      relic(ctx, team, info, area.x + area.w - pw - u * .7, area.y + area.h - ph - u * 2.4, pw, ph, u, text, words);
    }
    autograph(ctx, info, text, words, area.x + u * 1, area.y + area.h - u * 4.6, area.w * (info.mem ? .5 : .7), u);

    // The banner: folded ends behind, a stripe of the second colour on each edge.
    const by = area.y + area.h - u * .9;
    const bh = u * 3.7;
    ctx.fillStyle = mix(fill, '#000000', .5);
    ctx.beginPath();
    ctx.moveTo(F.x + u * .3, by + u * .5);
    ctx.lineTo(F.x + u * 1.3, by + u * .5);
    ctx.lineTo(F.x + u * 1.3, by + bh + u * .5);
    ctx.lineTo(F.x + u * .3, by + bh + u * .5);
    ctx.lineTo(F.x + u * .9, by + bh * .5 + u * .5);
    ctx.closePath();
    ctx.moveTo(F.x + F.w - u * .3, by + u * .5);
    ctx.lineTo(F.x + F.w - u * 1.3, by + u * .5);
    ctx.lineTo(F.x + F.w - u * 1.3, by + bh + u * .5);
    ctx.lineTo(F.x + F.w - u * .3, by + bh + u * .5);
    ctx.lineTo(F.x + F.w - u * .9, by + bh * .5 + u * .5);
    ctx.closePath();
    ctx.fill();
    shadow(ctx, u, true);
    ctx.fillStyle = fill;
    ctx.fillRect(F.x + u * 1.1, by, F.w - u * 2.2, bh);
    shadow(ctx, u, false);
    if (info.finish) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(F.x + u * 1.1, by, F.w - u * 2.2, bh);
      ctx.clip();
      ctx.globalAlpha = .3;
      ctx.globalCompositeOperation = 'overlay';
      foilFill(ctx, team, info, F.x, by, F.w, bh, 9);
      ctx.restore();
    }
    ctx.fillStyle = metal(ctx, by, by + bh, inkOf(info));
    ctx.fillRect(F.x + u * 1.1, by, F.w - u * 2.2, u * .22);
    ctx.fillRect(F.x + u * 1.1, by + bh - u * .22, F.w - u * 2.2, u * .22);
    const ink = readable(fill);
    // The number in its own box at the right of the banner.
    const nw = u * 3;
    ctx.fillStyle = two;
    ctx.fillRect(F.x + F.w - u * 1.1 - nw, by + u * .22, nw, bh - u * .44);
    ctx.fillStyle = readable(two);
    ctx.textAlign = 'center';
    fit(ctx, text.number, nw * .84, 400, bh * .62, DISPLAY);
    ctx.fillText(text.number, F.x + F.w - u * 1.1 - nw / 2, by + bh * .72);
    const tx = F.x + u * 5.4;
    const tw = F.w - u * 5.4 - u * 1.4 - nw;
    nameBlock(ctx, text.name, tx, by + bh * .68, tw, u * 2, {ink, sub: ink});
    ctx.textAlign = 'left';
    ctx.fillStyle = ink;
    ctx.globalAlpha = .85;
    fit(ctx, info.set, tw, 900, u * .42, SANS, u * .14);
    ctx.fillText(info.set, tx, by + bh - u * .45);
    ctx.globalAlpha = 1;
    rookieMark(ctx, info.rookie === 'shield' ? 'rated' : info.rookie, F.x + u * 3, by + bh * .45, u * 3.7, team, words);
    // Under the banner: the team and position, then the facts.
    const ly = by + bh + u * .95;
    ctx.textAlign = 'center';
    const lightStock = !info.finish && luminance(fill) > .45;
    const onStock = info.finish ? '#ffffff' : lightStock ? '#111111' : '#ffffff';
    ctx.fillStyle = onStock;
    ctx.shadowColor = 'rgba(0,0,0,.6)';
    ctx.shadowBlur = u * .2;
    const teamLine = `${zh ? team.name : upper(team.name)} · ${info.role}`;
    fit(ctx, teamLine, F.w - u * 3, 900, u * .55, SANS, u * .12);
    ctx.fillText(teamLine, F.x + F.w / 2, ly);
    ctx.shadowColor = 'transparent';
    statStrip(ctx, statCells(team, text, info), F.x + u * 1.2, ly + u * .3, F.w - u * 2.4, F.y + F.h - u * .6 - (ly + u * .3),
      {bg: 'rgba(255,255,255,.88)', ink: '#111111', label: onPaper(team), line: 'rgba(0,0,0,.2)'});
  },

  // Rated: a game-style rating card. The overall score, position and crest down
  // the left, six ratings with bars under the name.
  rated(ctx, team, text, L, info, words, rand) {
    const F = L.front;
    const area = L.area;
    const u = F.w / 20;
    const fill = solid(team);
    const two = second(team, fill);
    const zh = isZh(team);
    const kind = info.gold ? 'gold' : info.rarity === 'base' ? '' : 'silver';
    cardBody(ctx, F, u * .7, u, () => {
      if (info.finish) foilFill(ctx, team, info, F.x, F.y, F.w, F.h);
      else {
        const g = ctx.createLinearGradient(F.x, F.y, F.x + F.w, F.y + F.h);
        g.addColorStop(0, mix(fill, '#ffffff', .2));
        g.addColorStop(1, mix(fill, '#000000', .55));
        ctx.fillStyle = g;
        ctx.fillRect(F.x, F.y, F.w, F.h);
      }
      // Rays from behind the score.
      ctx.fillStyle = 'rgba(255,255,255,.07)';
      const ox = F.x + u * 3;
      const oy = F.y + u * 4;
      for (let k = 0; k < 16; k++) {
        const a = k / 16 * TAU;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox + Math.cos(a) * F.h * 1.4, oy + Math.sin(a) * F.h * 1.4);
        ctx.lineTo(ox + Math.cos(a + .1) * F.h * 1.4, oy + Math.sin(a + .1) * F.h * 1.4);
        ctx.closePath();
        ctx.fill();
      }
      // The lower panel the ratings sit on.
      ctx.fillStyle = 'rgba(0,0,0,.55)';
      ctx.fillRect(F.x, area.y + area.h, F.w, F.h);
      if (text.logo) watermark(ctx, text.logo, F.x + F.w * .5, F.y + F.h * .8, F.w * .7, '#ffffff', .06, -.1);
      grain(ctx, F.x, F.y, F.w, F.h, .25);
      lightUp(ctx, info, rand, F.x, F.y, F.w, F.h, u, .6);
    });
    const ink = kind || '';
    photo(ctx, team, info, text, area, u, u * .5, 'tr');
    roundRect(ctx, area.x, area.y, area.w, area.h, u * .5);
    ctx.lineWidth = u * .2;
    ctx.strokeStyle = kind ? metal(ctx, area.y, area.y + area.h, kind) : two;
    ctx.stroke();
    // The left column.
    const cx = F.x + (area.x - F.x) / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const ovr = String(info.rating.ovr);
    const os = fit(ctx, ovr, area.x - F.x - u * .6, 400, u * 3.3, DISPLAY);
    foilText(ctx, ovr, cx, F.y + u * 4.1, os, ink || 'team', two);
    ctx.fillStyle = '#ffffff';
    fit(ctx, info.role, area.x - F.x - u * .8, 900, u * .6, SANS, u * .06);
    ctx.fillText(info.role, cx, F.y + u * 5);
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.fillRect(cx - u * 1.4, F.y + u * 5.55, u * 2.8, Math.max(1, u * .06));
    crestMark(ctx, team, text.logo, cx, F.y + u * 7.6, u * 3.2, u * .8, 0);
    ctx.fillStyle = '#ffffff';
    fit(ctx, `#${text.number}`, area.x - F.x - u * .6, 400, u * 1.3, DISPLAY);
    ctx.fillText(`#${text.number}`, cx, F.y + u * 11);
    rookieMark(ctx, info.rookie, cx, F.y + u * 13.2, u * 2.6, team, words);
    // The name over the ratings.
    const ny = area.y + area.h + u * 2.55;
    nameBlock(ctx, text.name, F.x + F.w / 2, ny, F.w - u * 3, u * 2.1, kind ? {metal: kind} : {ink: '#ffffff'});
    ctx.textAlign = 'center';
    ctx.fillStyle = two;
    const teamLine = `${zh ? team.name : upper(team.name)} · ${info.insert}`;
    fit(ctx, teamLine, F.w - u * 3, 800, u * .48, SANS, u * .1);
    ctx.fillText(teamLine, F.x + F.w / 2, ny + u * .8);
    // Six ratings in two columns, each with a bar.
    const top = ny + u * 1.35;
    const rowH = (F.y + F.h - u * 2.2 - top) / 3;
    const colW = (F.w - u * 3) / 2;
    info.rating.attrs.forEach(([label, value], k) => {
      const col = k % 2;
      const row = Math.floor(k / 2);
      const x = F.x + u * 1.5 + col * colW + (col ? u * .4 : 0);
      const y = top + row * rowH;
      ctx.textAlign = 'left';
      ctx.fillStyle = value >= 90 ? '#7dff8a' : value >= 80 ? '#ffe14d' : '#ffffff';
      fit(ctx, String(value), u * 2, 400, rowH * .6, DISPLAY);
      ctx.fillText(String(value), x, y + rowH * .62);
      ctx.fillStyle = '#ffffff';
      fit(ctx, label, colW - u * 2.8, 900, rowH * .32, SANS, u * .06);
      ctx.fillText(label, x + u * 2.1, y + rowH * .52);
      const bw = colW - u * 2.8;
      ctx.fillStyle = 'rgba(255,255,255,.18)';
      ctx.fillRect(x + u * 2.1, y + rowH * .66, bw, rowH * .1);
      ctx.fillStyle = value >= 90 ? '#7dff8a' : value >= 80 ? '#ffe14d' : two;
      ctx.fillRect(x + u * 2.1, y + rowH * .66, bw * Math.max(.05, (value - 50) / 49), rowH * .1);
    });
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.fillRect(F.x + F.w / 2, top + rowH * .15, Math.max(1, u * .05), rowH * 2.7);
    // The foot: the maker, the set and season, the serial.
    const fy = F.y + F.h - u * 1.25;
    brandBug(ctx, F.x + u * 2.1, fy, u * 1.1, '', kind || 'silver');
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,.8)';
    fit(ctx, `${info.set} · ${seasonYear(text)}`, F.w * .45, 900, u * .44, SANS, u * .12);
    ctx.fillText(`${info.set} · ${seasonYear(text)}`, F.x + u * 3.4, fy + u * .16);
    serialStamp(ctx, info, F.x + F.w - u * 1.1, fy - u * .7, u * .85, words, 'right');
    if (info.mem) {
      const pw = u * 4;
      const ph = info.mem.id === 'tag' ? u * 4.4 : u * 2.9;
      relic(ctx, team, info, area.x + area.w - pw - u * .6, area.y + area.h - ph - u * 1.6, pw, ph, u, text, words);
    }
    autograph(ctx, info, text, words, area.x + u * .8, area.y + area.h - u * 1, area.w * (info.mem ? .5 : .75), u);
  },

  // Obsidian: black glass stock with electric etching in the team colour, the
  // photo in a jagged crystal window, the name in metal up the side.
  obsidian(ctx, team, text, L, info, words, rand) {
    const F = L.front;
    const area = L.area;
    const u = F.w / 20;
    const fill = solid(team);
    const zh = isZh(team);
    const p = info.finish ? palette(team, info) : {a: fill, b: mix(fill, '#000000', .5), c: second(team, fill)};
    const volt = luminance(p.a) < .08 ? p.c : p.a;
    // The window's jagged edge, fixed for this pull.
    const edgePts = [];
    const steps = 7;
    const jag = () => (rand() - .5) * u * 1.1;
    for (let k = 0; k <= steps; k++) edgePts.push([area.x + area.w * k / steps + (k && k < steps ? jag() : 0), area.y + (k % 2 ? u * .5 : 0) + Math.abs(jag())]);
    for (let k = 1; k <= steps; k++) edgePts.push([area.x + area.w - Math.abs(jag()) * (k % 2), area.y + area.h * k / steps]);
    for (let k = steps - 1; k >= 0; k--) edgePts.push([area.x + area.w * k / steps + (k ? jag() : 0), area.y + area.h - (k % 2 ? u * .5 : 0) - Math.abs(jag())]);
    for (let k = steps - 1; k >= 1; k--) edgePts.push([area.x + Math.abs(jag()) * (k % 2), area.y + area.h * k / steps]);
    const crystal = () => {
      ctx.beginPath();
      edgePts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
    };
    cardBody(ctx, F, u * .7, u, () => {
      const g = ctx.createRadialGradient(F.x + F.w * .5, F.y + F.h * .35, 0, F.x + F.w * .5, F.y + F.h * .35, F.h * .8);
      g.addColorStop(0, '#22232a');
      g.addColorStop(1, '#030304');
      ctx.fillStyle = g;
      ctx.fillRect(F.x, F.y, F.w, F.h);
      // Volcanic glass: faint facets.
      shards(F.x, F.y, F.w, F.h, rand, 26).forEach(poly => {
        ctx.beginPath();
        poly.forEach((q, n) => (n ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
        ctx.closePath();
        ctx.fillStyle = `rgba(255,255,255,${(rand() * .05).toFixed(3)})`;
        ctx.fill();
      });
      // Electric etching: glowing bolts, then a white-hot core.
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const bolts = [];
      for (let k = 0; k < 7; k++) bolts.push([F.x + rand() * F.w, F.y + rand() * F.h, F.w * (.4 + rand() * .5), rand() * TAU]);
      ctx.shadowColor = volt;
      ctx.shadowBlur = u * .8;
      ctx.strokeStyle = volt;
      bolts.forEach(([x, y, len, a], k) => {
        const step = seeded(info.seed + k);
        ctx.beginPath();
        ctx.moveTo(x, y);
        let px = x;
        let py = y;
        let aa = a;
        for (let n = 0; n < 9; n++) {
          aa += (step() - .5) * 1.1;
          px += Math.cos(aa) * len / 9;
          py += Math.sin(aa) * len / 9;
          ctx.lineTo(px, py);
        }
        ctx.lineWidth = u * .2;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,255,255,.8)';
        ctx.lineWidth = u * .06;
        ctx.stroke();
        ctx.shadowBlur = u * .8;
        ctx.strokeStyle = volt;
      });
      ctx.restore();
      if (info.finish) {
        ctx.globalAlpha = .35;
        ctx.globalCompositeOperation = 'screen';
        foilFill(ctx, team, info, F.x, F.y, F.w, F.h);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
      grain(ctx, F.x, F.y, F.w, F.h, .3);
      lightUp(ctx, info, rand, F.x, F.y, F.w, F.h, u, .5);
    });
    photo(ctx, team, info, text, area, u, 0, 'tr', crystal);
    crystal();
    ctx.lineJoin = 'miter';
    ctx.save();
    ctx.shadowColor = volt;
    ctx.shadowBlur = u * .7;
    ctx.lineWidth = u * .18;
    ctx.strokeStyle = volt;
    ctx.stroke();
    ctx.restore();
    crystal();
    ctx.lineWidth = u * .06;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    // The set and the maker at the top.
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const setSize = fit(ctx, info.set, F.w * .5, 400, u * 1.05, DISPLAY, u * .12);
    foilText(ctx, info.set, F.x + u * 2.6, F.y + u * 1.85, setSize, inkOf(info));
    brandBug(ctx, F.x + F.w - u * 2.2, F.y + u * 1.4, u * 1.25, '', inkOf(info));
    // The name in metal up the left side.
    ctx.save();
    ctx.translate(F.x + u * 2.15, area.y + area.h - u * .3);
    ctx.rotate(-Math.PI / 2);
    const nsize = fit(ctx, text.name, area.h - u * 1, 400, u * 2.1, DISPLAY, u * .08);
    ctx.textAlign = 'left';
    foilText(ctx, text.name, 0, 0, nsize, info.gold ? 'gold' : 'team', mix(volt, '#ffffff', .2));
    ctx.restore();
    rookieMark(ctx, info.rookie, area.x + u * 2.2, area.y + u * 2.4, u * 2.3, team, words);
    serialStamp(ctx, info, area.x + area.w - u * .6, area.y + u * 1, u, words, 'right');
    if (info.mem) {
      const pw = u * 4.2;
      const ph = info.mem.id === 'tag' ? u * 4.6 : u * 3.1;
      relic(ctx, team, info, area.x + area.w - pw - u * .9, area.y + area.h - ph - u * 2, pw, ph, u, text, words);
    }
    autograph(ctx, info, text, words, area.x + u * 1, area.y + area.h - u * 1.4, area.w * (info.mem ? .5 : .72), u);
    // The foot: the crest, team and position, the facts, the number in neon.
    const fy = area.y + area.h + u * .6;
    crestMark(ctx, team, text.logo, F.x + u * 2.7, fy + u * 2.1, u * 3.6, u * .8, -.05);
    const tx = F.x + u * 5;
    const tw = F.w - u * 5 - u * 4.6;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    const teamLine = zh ? team.name : upper(team.name);
    fit(ctx, teamLine, tw, 900, u * .62, SANS, u * .1);
    ctx.fillText(teamLine, tx, fy + u * .95);
    ctx.fillStyle = volt;
    fit(ctx, `${info.role} · ${info.insert}`, tw, 800, u * .46, SANS, u * .1);
    ctx.fillText(`${info.role} · ${info.insert}`, tx, fy + u * 1.65);
    statStrip(ctx, statCells(team, text, info).slice(0, 3), tx, fy + u * 2.05, tw, F.y + F.h - u * .6 - (fy + u * 2.05),
      {bg: 'rgba(255,255,255,.06)', ink: '#ffffff', label: volt, line: 'rgba(255,255,255,.2)'});
    ctx.save();
    ctx.textAlign = 'center';
    fit(ctx, text.number, u * 3.6, 400, u * 3.4, DISPLAY);
    ctx.shadowColor = volt;
    ctx.shadowBlur = u * .9;
    ctx.lineWidth = u * .16;
    ctx.strokeStyle = volt;
    const nxp = F.x + F.w - u * 2.5;
    const nyp = F.y + F.h - u * 1.1;
    ctx.strokeText(text.number, nxp, nyp);
    ctx.shadowBlur = u * .25;
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    ctx.fillText(text.number, nxp, nyp);
    ctx.restore();
    microPrint(ctx, microLine(team, text, info), F.x + F.w - u * .45, area.y + area.h * .5, area.h * .9, u * .28, 'rgba(255,255,255,.45)', Math.PI / 2, 'center');
  },
};

// Where the photo sits on each design.
function frontArea(L, design) {
  const F = L.front;
  const u = F.w / 20;
  const b = L.b;
  if (design === 'full') return {x: F.x, y: F.y, w: F.w, h: F.h};
  if (design === 'skyline') return {x: F.x + b, y: F.y + b, w: F.w - b * 2, h: F.h * .7};
  if (design === 'comic') return {x: F.x + u * 2, y: F.y + u * 3.2, w: F.w - u * 4, h: F.h * .62};
  if (design === 'stained') return {x: F.x + u * 2.6, y: F.y + u * 3, w: F.w - u * 5.2, h: F.h * .66};
  if (design === 'premium') return {x: F.x + u * 1.6, y: F.y + u * 3.6, w: F.w - u * 3.2, h: F.h * .48};
  if (design === 'select') return {x: F.x + u * 1.3, y: F.y + u * 3.5, w: F.w - u * 2.6, h: F.h * .6};
  if (design === 'classic') return {x: F.x + u * 1.4, y: F.y + u * 1.4, w: F.w - u * 2.8, h: F.h - u * 1.4 - u * 7.6};
  if (design === 'rated') return {x: F.x + u * 5.4, y: F.y + u * 1.1, w: F.w - u * 6.5, h: F.h * .55};
  if (design === 'obsidian') return {x: F.x + u * 3.4, y: F.y + u * 2.8, w: F.w - u * 5.4, h: F.h * .66};
  if (design === 'chrome') return {x: F.x + b, y: F.y + b, w: F.w - b * 2, h: F.h - b - u * 3.4};
  return {x: F.x + b, y: F.y + b, w: F.w - b * 2, h: F.h - b * 2};
}

function backClassic(ctx, team, text, L, info) {
  const {back: B} = L;
  const u = B.w / 20;
  const zh = isZh(team);
  const words = CARD_WORDS[zh ? 'zh' : 'en'];
  const say_ = say(team);
  const logo = text.logo;
  const fill = solid(team);
  const fillInk = readable(fill);
  const ink = onPaper(team);
  const r = u * .7;
  const pad = u * .9;
  const x0 = B.x + pad;
  const wIn = B.w - pad * 2;

  shadow(ctx, u * 2, true);
  roundRect(ctx, B.x, B.y, B.w, B.h, r);
  ctx.fillStyle = PAPER;
  ctx.fill();
  shadow(ctx, u, false);
  ctx.save();
  roundRect(ctx, B.x, B.y, B.w, B.h, r);
  ctx.clip();
  ctx.globalAlpha = .08;
  guilloche(ctx, B.x, B.y, B.w, B.h, u * 1.4, ink);
  ctx.globalAlpha = 1;
  if (logo) watermark(ctx, logo, B.x + B.w * .62, B.y + B.h * .56, B.w * .9, ink, .06, -.1);

  // Header in the team colour, the parallel's foil running through it.
  const headH = u * 6.2;
  ctx.fillStyle = fill;
  ctx.fillRect(B.x, B.y, B.w, headH);
  if (info.finish) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(B.x, B.y, B.w, headH);
    ctx.clip();
    ctx.globalAlpha = .4;
    ctx.globalCompositeOperation = 'overlay';
    foilFill(ctx, team, info, B.x, B.y, B.w, headH, 11);
    ctx.restore();
  }
  trim(ctx, team, B.x, B.y + headH, B.w, u * .32);
  ctx.restore();
  ctx.strokeStyle = fill;
  ctx.lineWidth = Math.max(1, u * .2);
  roundRect(ctx, B.x + u * .1, B.y + u * .1, B.w - u * .2, B.h - u * .2, r * .9);
  ctx.stroke();

  const boxW = u * 3.4;
  ctx.fillStyle = fillInk;
  roundRect(ctx, x0, B.y + pad, boxW, u * 3.3, u * .3);
  ctx.fill();
  ctx.fillStyle = fill;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  fit(ctx, words.card, boxW * .8, 900, u * .44, SANS, u * .08);
  ctx.fillText(words.card, x0 + boxW / 2, B.y + pad + u * .8);
  const no = String(info.cardNo).padStart(3, '0');
  fit(ctx, no, boxW * .84, 400, u * 1.5, DISPLAY);
  ctx.fillText(no, x0 + boxW / 2, B.y + pad + u * 2.3);
  fit(ctx, 'RC', boxW * .8, 900, u * .5, SANS, u * .1);
  ctx.fillText('RC', x0 + boxW / 2, B.y + pad + u * 3);
  const crest = u * 4.4;
  const tx = x0 + boxW + u * .6;
  const tw = B.x + B.w - pad - crest - u * .4 - tx;
  if (logo) sticker(ctx, logo, B.x + B.w - pad - crest / 2, B.y + headH / 2, crest, u, .05);
  else drawMotif(ctx, team.motif, B.x + B.w - pad - crest / 2, B.y + headH / 2, crest * .9, team.ink, fill, team.accent);
  ctx.textAlign = 'left';
  ctx.fillStyle = fillInk;
  fit(ctx, text.name, tw, 400, u * 1.9, DISPLAY, u * .04);
  ctx.fillText(text.name, tx, B.y + pad + u * 1.75);
  fit(ctx, `${team.short} · ${info.role}`, tw, 800, u * .56, SANS, u * .06);
  ctx.fillText(`${team.short} · ${info.role}`, tx, B.y + pad + u * 2.65);
  ctx.globalAlpha = .8;
  const where = zh ? `${team.city} · ${team.nick}` : `${upper(team.city)} · ${upper(team.nick)}`;
  fit(ctx, where, tw, 700, u * .46, SANS, u * .06);
  ctx.fillText(where, tx, B.y + pad + u * 3.4);
  ctx.globalAlpha = 1;
  const no2 = `#${text.number}`;
  fit(ctx, no2, tw, 400, u * .9, DISPLAY, u * .04);
  ctx.fillText(no2, tx, B.y + pad + u * 4.6);

  // Three facts: founded, home, titles.
  let y = B.y + headH + u * 1.1;
  const titled = team.titles && team.titles.n;
  const facts = [
    [say_.est, String(team.est), .26],
    [say_.home, team.homeNick || team.home, .4],
    [titled ? (team.titles.short || say_.titles) : say_.honours, titled ? `${team.titles.n}×` : (team.titles ? team.titles.label : '—'), .34],
  ];
  let fx = x0;
  ctx.lineWidth = Math.max(1, u * .07);
  ctx.strokeStyle = ink;
  for (const [label, value, share] of facts) {
    const fw = wIn * share;
    ctx.strokeRect(fx + u * .05, y, fw - u * .25, u * 2.3);
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    fit(ctx, label, fw - u * .7, 800, u * .4, SANS, u * .06);
    ctx.fillText(label, fx + u * .35, y + u * .7);
    ctx.fillStyle = ink;
    fit(ctx, value, fw - u * .7, 400, u * 1.05, DISPLAY, u * .02);
    ctx.fillText(value, fx + u * .35, y + u * 1.85);
    fx += fw;
  }

  // Highlights table, like the stats lines on a card back.
  y += u * 3.1;
  const rowH = u * 1.95;
  ctx.fillStyle = fill;
  ctx.fillRect(x0, y, wIn, u * 1);
  ctx.fillStyle = fillInk;
  fit(ctx, words.year, u * 2.6, 900, u * .42, SANS, u * .1);
  ctx.fillText(words.year, x0 + u * .3, y + u * .7);
  fit(ctx, words.highlights, wIn - u * 3.4, 900, u * .42, SANS, u * .1);
  ctx.fillText(words.highlights, x0 + u * 3.2, y + u * .7);
  y += u * 1;
  const rows = info.moments.map(([year, line, note]) => [String(year), zh ? line : upper(line), note]);
  rows.push([words.total, titleLine(team) || (team.titles ? team.titles.label : ''), '']);
  rows.forEach(([year, line, note], k) => {
    const last = k === rows.length - 1;
    const h = last ? u * 1.3 : rowH;
    ctx.fillStyle = k % 2 ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.55)';
    if (last) ctx.fillStyle = 'rgba(0,0,0,.1)';
    ctx.fillRect(x0, y, wIn, h);
    ctx.fillStyle = ink;
    fit(ctx, year, u * 2.7, last ? 900 : 400, last ? u * .42 : u * .95, last ? SANS : DISPLAY, last ? u * .08 : 0);
    ctx.fillText(year, x0 + u * .3, y + (last ? u * .88 : u * 1.2));
    ctx.fillStyle = '#1b1b1b';
    fit(ctx, line, wIn - u * 3.5, 800, u * .52, SANS, u * .03);
    ctx.fillText(line, x0 + u * 3.2, y + (last || !note ? u * .88 : u * .85));
    if (note && !last) {
      ctx.globalAlpha = .62;
      fit(ctx, note, wIn - u * 3.5, 600, u * .44, SANS, u * .02);
      ctx.fillText(note, x0 + u * 3.2, y + u * 1.55);
      ctx.globalAlpha = 1;
    }
    y += h;
  });
  ctx.fillStyle = ink;
  ctx.fillRect(x0, y, wIn, Math.max(1, u * .07));

  // Legends.
  y += u * 1.25;
  ctx.fillStyle = ink;
  font(ctx, 900, u * .44, SANS, u * .12, words.legends);
  ctx.fillText(words.legends, x0, y);
  const legendW = measure(ctx, words.legends) + u * .4;
  const legends = info.legends.map(item => Array.isArray(item) ? `${item[0]} ${item[1]}` : item).join(' · ');
  ctx.fillStyle = '#1b1b1b';
  fit(ctx, legends, wIn - legendW, 800, u * .5, SANS, u * .04);
  ctx.fillText(legends, x0 + legendW, y);

  // Trivia box.
  y += u * .8;
  const footH = u * 2.6;
  const boxH = Math.max(u * 3, B.y + B.h - footH - u * 1.9 - y);
  if (info.facts.length) {
    roundRect(ctx, x0, y, wIn, boxH, u * .35);
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    ctx.fill();
    ctx.strokeStyle = fill === PAPER ? ink : fill;
    ctx.lineWidth = Math.max(1, u * .1);
    ctx.stroke();
    ctx.fillStyle = ink;
    fit(ctx, words.trivia, wIn - u * 1, 900, u * .44, SANS, u * .12);
    ctx.fillText(words.trivia, x0 + u * .5, y + u * .9);
    // Each fact: its label in the team colour, then the words, wrapped to fit.
    let line = 0;
    const room = Math.max(1, Math.floor((boxH - u * 1.3) / (u * .82)));
    info.facts.forEach(([label, value], k) => {
      const left = room - line;
      if (left < 1) return;
      const lines = k === info.facts.length - 1 ? Math.min(3, left) : Math.min(2, Math.max(1, left - 1));
      ctx.fillStyle = ink;
      font(ctx, 900, u * .46, SANS, u * .06, label);
      const lw = measure(ctx, label) + u * .35;
      const ty = y + u * 1.8 + line * u * .82;
      ctx.fillText(label, x0 + u * .5, ty);
      ctx.fillStyle = '#1b1b1b';
      font(ctx, 700, u * .58, SANS, u * .02);
      // The words start after the label and run on under it.
      wrapLines(ctx, value, wIn - u * 1, lines, wIn - u * 1 - lw).forEach((part, n) => {
        ctx.fillText(part, x0 + u * .5 + (n ? 0 : lw), ty + n * u * .82);
        line += 1;
      });
    });
  }

  // Slogan.
  y = B.y + B.h - footH - u * .75;
  ctx.fillStyle = fill === PAPER ? ink : fill;
  ctx.textAlign = 'center';
  const call = zh ? `「${text.slogan}」` : `“${text.slogan}”`;
  fit(ctx, call, wIn, 400, u * .95, DISPLAY, u * .03);
  ctx.fillText(call, B.x + B.w / 2, y);

  // Footer: fine print, the parallel and the serial number.
  const fy = B.y + B.h - footH;
  ctx.save();
  roundRect(ctx, B.x, B.y, B.w, B.h, r);
  ctx.clip();
  ctx.fillStyle = '#151515';
  ctx.fillRect(B.x, fy, B.w, footH);
  ctx.restore();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  const hits = [info.auto ? words.signed : '', info.mem ? (zh ? info.mem.zh : info.mem.en) : ''].filter(Boolean);
  const tierLine = [`${words.parallel} · ${info.name}`].concat(hits).join(' · ');
  fit(ctx, tierLine, wIn * .68, 800, u * .42, SANS, u * .06);
  ctx.fillText(tierLine, x0, fy + u * 1.05);
  ctx.globalAlpha = .6;
  const fine = `© ${new Date().getFullYear()} HOT 主场相框 · ${info.set} · ${info.insert} · ${text.season}${text.date ? ` · ${text.date}` : ''}`;
  fit(ctx, fine, wIn * .68, 600, u * .36, SANS, u * .03);
  ctx.fillText(fine, x0, fy + u * 1.75);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'right';
  const serial = info.serial || 'RC';
  const g = ctx.createLinearGradient(0, fy, 0, fy + footH);
  g.addColorStop(0, '#fff1b8');
  g.addColorStop(1, '#c99b2c');
  ctx.fillStyle = info.serial ? g : '#ffffff';
  fit(ctx, serial, wIn * .3, 400, u * 1.25, DISPLAY, u * .04);
  ctx.fillText(serial, x0 + wIn, fy + u * 1.75);
  ctx.textAlign = 'left';
}

// ----- Backs -----
// Each pull's back comes in one of five layouts, chosen with the pull.

function cardBack(ctx, team, text, L, info) {
  (backs[info.back] || backs.classic)(ctx, team, text, L, info);
}

// The black foot every back shares: the parallel and the hits, fine print, serial.
function backFoot(ctx, team, text, B, info, r, u, words, light = false) {
  const footH = u * 2.6;
  const fy = B.y + B.h - footH;
  const x0 = B.x + u * .9;
  const wIn = B.w - u * 1.8;
  ctx.save();
  roundRect(ctx, B.x, B.y, B.w, B.h, r);
  ctx.clip();
  ctx.fillStyle = light ? 'rgba(0,0,0,.08)' : '#151515';
  ctx.fillRect(B.x, fy, B.w, footH);
  ctx.restore();
  const zh = isZh(team);
  const ink = light ? '#2a2118' : '#ffffff';
  ctx.fillStyle = ink;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const hits = [info.auto ? words.signed : '', info.mem ? (zh ? info.mem.zh : info.mem.en) : ''].filter(Boolean);
  const tierLine = [`${words.parallel} · ${info.name}`].concat(hits).join(' · ');
  fit(ctx, tierLine, wIn * .68, 800, u * .42, SANS, u * .06);
  ctx.fillText(tierLine, x0, fy + u * 1.05);
  ctx.globalAlpha = .6;
  const fine = `© ${new Date().getFullYear()} HOT 主场相框 · ${info.set} · ${info.insert} · ${text.season}${text.date ? ` · ${text.date}` : ''}`;
  fit(ctx, fine, wIn * .68, 600, u * .36, SANS, u * .03);
  ctx.fillText(fine, x0, fy + u * 1.75);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'right';
  const serial = info.serial || 'RC';
  const g = ctx.createLinearGradient(0, fy, 0, fy + footH);
  g.addColorStop(0, light ? '#b8891f' : '#fff1b8');
  g.addColorStop(1, light ? '#6e5010' : '#c99b2c');
  ctx.fillStyle = info.serial ? g : ink;
  fit(ctx, serial, wIn * .3, 400, u * 1.25, DISPLAY, u * .04);
  ctx.fillText(serial, x0 + wIn, fy + u * 1.75);
  ctx.textAlign = 'left';
  return fy;
}

// The card stock and its outline; paint() draws inside the clip.
function backShell(ctx, B, r, u, stockFill, line, paint) {
  shadow(ctx, u * 2, true);
  roundRect(ctx, B.x, B.y, B.w, B.h, r);
  ctx.fillStyle = stockFill;
  ctx.fill();
  shadow(ctx, u, false);
  ctx.save();
  roundRect(ctx, B.x, B.y, B.w, B.h, r);
  ctx.clip();
  paint();
  ctx.restore();
  if (line) {
    ctx.strokeStyle = line;
    ctx.lineWidth = Math.max(1, u * .2);
    roundRect(ctx, B.x + u * .1, B.y + u * .1, B.w - u * .2, B.h - u * .2, r * .9);
    ctx.stroke();
  }
}

// The card number in a box: CARD over the number, RC under it.
function numberBox(ctx, info, x, y, w, h, fill, ink, words, u) {
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, h, u * .3);
  ctx.fill();
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  fit(ctx, words.card, w * .8, 900, h * .13, SANS, u * .08);
  ctx.fillText(words.card, x + w / 2, y + h * .24);
  const no = String(info.cardNo).padStart(3, '0');
  fit(ctx, no, w * .84, 400, h * .45, DISPLAY);
  ctx.fillText(no, x + w / 2, y + h * .7);
  fit(ctx, 'RC', w * .8, 900, h * .15, SANS, u * .1);
  ctx.fillText('RC', x + w / 2, y + h * .91);
  ctx.textAlign = 'left';
}

// Label and value rows with dotted leaders, as on a player profile.
function profileRows(ctx, rows, x, y, w, rowH, ink, soft, u) {
  rows.forEach(([label, value], k) => {
    const ty = y + k * rowH + rowH * .68;
    ctx.textAlign = 'left';
    ctx.fillStyle = soft;
    fit(ctx, label, w * .4, 900, rowH * .4, SANS, u * .06);
    ctx.fillText(label, x, ty);
    const lw = measure(ctx, label);
    ctx.textAlign = 'right';
    ctx.fillStyle = ink;
    fit(ctx, value, w - lw - u * 1.2, 800, rowH * .46, SANS, u * .02);
    const vw = measure(ctx, value);
    ctx.fillText(value, x + w, ty);
    ctx.fillStyle = soft;
    for (let dx = x + lw + u * .3; dx < x + w - vw - u * .3; dx += u * .3) ctx.fillRect(dx, ty - u * .08, u * .08, u * .08);
  });
  ctx.textAlign = 'left';
}

// The team's facts as rows for a profile or a grid.
function backFacts(team, text, zh) {
  const words = say(team);
  const titled = team.titles && team.titles.n;
  return [
    [words.est.replace(/\.$/, ''), String(team.est)],
    [words.home, team.homeNick ? `${team.home} · ${team.homeNick}` : team.home],
    [zh ? '城市' : 'CITY', zh ? team.city : upper(team.city)],
    [zh ? '别称' : 'NICKNAME', zh ? team.nick : upper(team.nick)],
    [titled ? (zh ? '冠军' : 'TITLES') : words.honours, titled ? titleLine(team) : (team.titles ? team.titles.label : '—')],
    [zh ? '号码' : 'NUMBER', `#${text.number}`],
  ];
}

const backs = {
  classic: backClassic,

  // Profile: a team-colour side bar with a small photo, crest and number; a
  // player profile with dotted leaders, the big moments and the legends.
  profile(ctx, team, text, L, info) {
    const B = L.back;
    const u = B.w / 20;
    const zh = isZh(team);
    const words = CARD_WORDS[zh ? 'zh' : 'en'];
    const fill = solid(team);
    const fillInk = readable(fill);
    const ink = onPaper(team);
    const r = u * .7;
    const barW = u * 6.2;
    const right = info.seed % 2 === 0;
    const bx = right ? B.x + B.w - barW : B.x;
    backShell(ctx, B, r, u, PAPER, fill, () => {
      ctx.globalAlpha = .07;
      guilloche(ctx, B.x, B.y, B.w, B.h, u * 1.4, ink);
      ctx.globalAlpha = 1;
      if (text.logo) watermark(ctx, text.logo, B.x + B.w * (right ? .4 : .6), B.y + B.h * .55, B.w * .8, ink, .05, -.1);
      ctx.fillStyle = fill;
      ctx.fillRect(bx, B.y, barW, B.h);
      if (info.finish) {
        ctx.globalAlpha = .35;
        ctx.globalCompositeOperation = 'overlay';
        foilFill(ctx, team, info, bx, B.y, barW, B.h, 13);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
      trim(ctx, team, right ? bx - u * .3 : bx + barW, B.y, u * .3, B.h);
      grain(ctx, B.x, B.y, B.w, B.h, .2);
    });
    // The side bar: number box, the photo, the crest, the shirt number.
    const cx = bx + barW / 2;
    numberBox(ctx, info, bx + u * .9, B.y + u * .9, barW - u * 1.8, u * 3.2, fillInk, fill, words, u);
    const pw = barW - u * 1.4;
    const pa = {x: bx + u * .7, y: B.y + u * 4.6, w: pw, h: pw * 1.25};
    shadow(ctx, u, true);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(pa.x - u * .2, pa.y - u * .2, pa.w + u * .4, pa.h + u * .4);
    shadow(ctx, u, false);
    ctx.save();
    ctx.beginPath();
    ctx.rect(pa.x, pa.y, pa.w, pa.h);
    ctx.clip();
    text.drawPhoto(pa);
    ctx.restore();
    const crest = u * 3.6;
    const cy = pa.y + pa.h + u * 2.6;
    if (text.logo) sticker(ctx, text.logo, cx, cy, crest, u, .05);
    else drawMotif(ctx, team.motif, cx, cy, crest * .9, team.ink, fill, team.accent);
    ctx.fillStyle = fillInk;
    ctx.textAlign = 'center';
    fit(ctx, `#${text.number}`, barW - u, 400, u * 2.6, DISPLAY);
    ctx.fillText(`#${text.number}`, cx, cy + crest * .5 + u * 3);
    // The role, up the bar.
    ctx.save();
    ctx.translate(cx + u * .2, B.y + B.h - u * 3.4);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'left';
    ctx.globalAlpha = .85;
    fit(ctx, `${info.role} · ${info.insert}`, B.h * .3, 900, u * .5, SANS, u * .2);
    ctx.fillText(`${info.role} · ${info.insert}`, 0, 0);
    ctx.restore();

    // The profile.
    const x0 = right ? B.x + u * .9 : bx + barW + u * .8;
    const wIn = B.w - barW - u * 1.7;
    let y = B.y + u * 2.5;
    ctx.textAlign = 'left';
    nameBlock(ctx, text.name, x0, y, wIn, u * 1.9, {ink});
    y += u * .85;
    ctx.fillStyle = '#1b1b1b';
    fit(ctx, zh ? team.name : upper(team.name), wIn, 900, u * .56, SANS, u * .06);
    ctx.fillText(zh ? team.name : upper(team.name), x0, y);
    y += u * .45;
    ctx.fillStyle = ink;
    ctx.fillRect(x0, y, wIn, Math.max(1, u * .12));
    y += u * .2;
    ctx.fillStyle = ink;
    fit(ctx, zh ? '档案' : 'PROFILE', wIn, 900, u * .44, SANS, u * .2);
    ctx.fillText(zh ? '档案' : 'PROFILE', x0, y + u * .75);
    y += u * .9;
    const facts = backFacts(team, text, zh);
    profileRows(ctx, facts, x0, y, wIn, u * 1.05, '#1b1b1b', ink, u);
    y += facts.length * u * 1.05 + u * .6;
    // Moments: the year in a team-colour disc, the line beside it.
    ctx.fillStyle = ink;
    fit(ctx, words.highlights, wIn, 900, u * .44, SANS, u * .2);
    ctx.fillText(words.highlights, x0, y);
    y += u * .5;
    info.moments.forEach(([year, line, note]) => {
      ctx.fillStyle = fill;
      roundRect(ctx, x0, y, u * 2.6, u * 1.25, u * .6);
      ctx.fill();
      ctx.fillStyle = fillInk;
      ctx.textAlign = 'center';
      fit(ctx, String(year), u * 2.2, 400, u * .8, DISPLAY);
      ctx.fillText(String(year), x0 + u * 1.3, y + u * .95);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#1b1b1b';
      fit(ctx, zh ? line : upper(line), wIn - u * 3, 800, u * .5, SANS, u * .02);
      ctx.fillText(zh ? line : upper(line), x0 + u * 3, y + u * .6);
      if (note) {
        ctx.globalAlpha = .62;
        fit(ctx, note, wIn - u * 3, 600, u * .42, SANS, u * .02);
        ctx.fillText(note, x0 + u * 3, y + u * 1.2);
        ctx.globalAlpha = 1;
      }
      y += u * 1.65;
    });
    y += u * .2;
    if (info.legends.length) {
      ctx.fillStyle = ink;
      fit(ctx, words.legends, wIn, 900, u * .44, SANS, u * .2);
      ctx.fillText(words.legends, x0, y);
      y += u * .3;
      info.legends.forEach((item, k) => {
        const [n, who] = Array.isArray(item) ? item : ['★', item];
        const ly = y + k * u * .95;
        ctx.fillStyle = ink;
        ctx.textAlign = 'center';
        fit(ctx, n, u * 1.4, 400, u * .7, DISPLAY);
        ctx.fillText(n, x0 + u * .7, ly + u * .75);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#1b1b1b';
        fit(ctx, who, wIn - u * 1.8, 800, u * .5, SANS, u * .04);
        ctx.fillText(who, x0 + u * 1.7, ly + u * .72);
      });
    }
    backFoot(ctx, team, text, B, info, r, u, words);
  },

  // Stats: a dark header, a grid of six facts, ratings as bars and the moments
  // as a table.
  stats(ctx, team, text, L, info) {
    const B = L.back;
    const u = B.w / 20;
    const zh = isZh(team);
    const words = CARD_WORDS[zh ? 'zh' : 'en'];
    const fill = solid(team);
    const two = second(team, fill);
    const ink = onPaper(team);
    const r = u * .7;
    const x0 = B.x + u * .9;
    const wIn = B.w - u * 1.8;
    const headH = u * 5;
    backShell(ctx, B, r, u, '#f7f7f4', '#1a1a1a', () => {
      ctx.globalAlpha = .06;
      etch(ctx, B.x, B.y, B.w, B.h, u, ink, .5, .4);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#16181d';
      ctx.fillRect(B.x, B.y, B.w, headH);
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(B.x + B.w * .62, B.y);
      ctx.lineTo(B.x + B.w, B.y);
      ctx.lineTo(B.x + B.w, B.y + headH);
      ctx.lineTo(B.x + B.w * .52, B.y + headH);
      ctx.closePath();
      ctx.fill();
      if (info.finish) {
        ctx.globalAlpha = .35;
        ctx.globalCompositeOperation = 'overlay';
        foilFill(ctx, team, info, B.x, B.y, B.w, headH, 17);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = two;
      ctx.fillRect(B.x, B.y + headH, B.w, u * .25);
    });
    // Header: number disc, the name, the team.
    const nr = u * 1.6;
    ctx.fillStyle = two;
    ctx.beginPath();
    ctx.arc(x0 + nr, B.y + headH / 2, nr, 0, TAU);
    ctx.fill();
    ctx.fillStyle = readable(two);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    fit(ctx, String(info.cardNo).padStart(3, '0'), nr * 1.6, 400, nr * .9, DISPLAY);
    ctx.fillText(String(info.cardNo).padStart(3, '0'), x0 + nr, B.y + headH / 2 + nr * .32);
    const tx = x0 + nr * 2 + u * .6;
    const crest = u * 3.6;
    const tw = B.x + B.w - u * .9 - crest - u * .3 - tx;
    nameBlock(ctx, text.name, tx, B.y + headH * .55, tw, u * 1.8, {ink: '#ffffff', sub: two});
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,.8)';
    fit(ctx, `${zh ? team.name : upper(team.name)} · ${info.role}`, tw, 800, u * .48, SANS, u * .06);
    ctx.fillText(`${zh ? team.name : upper(team.name)} · ${info.role}`, tx, B.y + headH * .55 + u * .9);
    if (text.logo) sticker(ctx, text.logo, B.x + B.w - u * .9 - crest / 2, B.y + headH / 2, crest, u, .05);
    else drawMotif(ctx, team.motif, B.x + B.w - u * .9 - crest / 2, B.y + headH / 2, crest * .9, team.ink, fill, team.accent);
    // A 3 × 2 grid of facts.
    let y = B.y + headH + u * .9;
    const facts = backFacts(team, text, zh);
    const gw = wIn / 3;
    const gh = u * 2.1;
    facts.forEach(([label, value], k) => {
      const gx = x0 + (k % 3) * gw;
      const gy = y + Math.floor(k / 3) * gh;
      ctx.fillStyle = k % 2 ? 'rgba(0,0,0,.04)' : 'rgba(0,0,0,.08)';
      ctx.fillRect(gx + u * .05, gy, gw - u * .1, gh - u * .12);
      ctx.fillStyle = ink;
      ctx.textAlign = 'left';
      fit(ctx, label, gw - u * .6, 900, u * .36, SANS, u * .08);
      ctx.fillText(label, gx + u * .3, gy + u * .62);
      ctx.fillStyle = '#111111';
      fit(ctx, value, gw - u * .6, 400, u * .85, DISPLAY, u * .01);
      ctx.fillText(value, gx + u * .3, gy + u * 1.6);
    });
    y += gh * 2 + u * .5;
    // Ratings as bars.
    ctx.fillStyle = ink;
    fit(ctx, zh ? '能力值' : 'RATINGS', wIn, 900, u * .44, SANS, u * .2);
    ctx.fillText(zh ? '能力值' : 'RATINGS', x0, y);
    ctx.textAlign = 'right';
    fit(ctx, `OVR ${info.rating.ovr}`, wIn * .4, 400, u * .9, DISPLAY);
    ctx.fillText(`OVR ${info.rating.ovr}`, x0 + wIn, y + u * .05);
    ctx.textAlign = 'left';
    y += u * .45;
    const bh = u * .78;
    info.rating.attrs.forEach(([label, value], k) => {
      const col = k % 2;
      const row = Math.floor(k / 2);
      const bx = x0 + col * (wIn / 2 + u * .2);
      const bw = wIn / 2 - u * .2;
      const by = y + row * (bh + u * .25);
      ctx.fillStyle = '#1b1b1b';
      fit(ctx, label, u * 2.2, 900, bh * .55, SANS, u * .04);
      ctx.fillText(label, bx, by + bh * .72);
      ctx.fillStyle = 'rgba(0,0,0,.1)';
      ctx.fillRect(bx + u * 2.3, by + bh * .2, bw - u * 3.6, bh * .6);
      ctx.fillStyle = fill === '#ffffff' ? ink : fill;
      ctx.fillRect(bx + u * 2.3, by + bh * .2, (bw - u * 3.6) * Math.max(.05, (value - 50) / 49), bh * .6);
      ctx.fillStyle = '#111111';
      ctx.textAlign = 'right';
      fit(ctx, String(value), u * 1.2, 400, bh * .8, DISPLAY);
      ctx.fillText(String(value), bx + bw, by + bh * .8);
      ctx.textAlign = 'left';
    });
    y += 3 * (bh + u * .25) + u * .6;
    // Moments as a compact table.
    ctx.fillStyle = '#16181d';
    ctx.fillRect(x0, y, wIn, u * .9);
    ctx.fillStyle = '#ffffff';
    fit(ctx, words.year, u * 2.4, 900, u * .38, SANS, u * .1);
    ctx.fillText(words.year, x0 + u * .3, y + u * .63);
    fit(ctx, words.highlights, wIn - u * 3.4, 900, u * .38, SANS, u * .1);
    ctx.fillText(words.highlights, x0 + u * 3, y + u * .63);
    y += u * .9;
    const fy = B.y + B.h - u * 2.6;
    const rows = info.moments.map(([year, line]) => [String(year), zh ? line : upper(line)]);
    rows.push([words.legends, info.legends.map(item => Array.isArray(item) ? `${item[0]} ${item[1]}` : item).join(' · ')]);
    const rh = Math.min(u * 1.25, (fy - u * 2 - y) / Math.max(1, rows.length));
    rows.forEach(([year, line], k) => {
      ctx.fillStyle = k % 2 ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.6)';
      ctx.fillRect(x0, y, wIn, rh);
      ctx.fillStyle = ink;
      fit(ctx, year, u * 2.5, 900, rh * .42, SANS, u * .04);
      ctx.fillText(year, x0 + u * .3, y + rh * .66);
      ctx.fillStyle = '#1b1b1b';
      fit(ctx, line, wIn - u * 3.3, 800, rh * .4, SANS, u * .02);
      ctx.fillText(line, x0 + u * 3, y + rh * .66);
      y += rh;
    });
    // The slogan in a slanted bar.
    const sy = fy - u * 1.6;
    ctx.save();
    ctx.translate(x0, sy);
    ctx.transform(1, 0, -.2, 1, 0, 0);
    ctx.fillStyle = fill;
    ctx.fillRect(u * .3, 0, wIn - u * .3, u * 1.2);
    ctx.restore();
    ctx.fillStyle = readable(fill);
    ctx.textAlign = 'center';
    const call = zh ? `「${text.slogan}」` : `“${text.slogan}”`;
    fit(ctx, call, wIn - u * 1.5, 400, u * .8, DISPLAY, u * .03);
    ctx.fillText(call, B.x + B.w / 2, sy + u * .9);
    ctx.textAlign = 'left';
    backFoot(ctx, team, text, B, info, r, u, words);
  },

  // Vintage: grey-brown cardboard printed in two inks, a cartoon panel with a
  // fact, and ruled lines.
  vintage(ctx, team, text, L, info) {
    const B = L.back;
    const u = B.w / 20;
    const zh = isZh(team);
    const words = CARD_WORDS[zh ? 'zh' : 'en'];
    const fill = onPaper(team);
    const dark = '#2a2118';
    const r = u * .5;
    const x0 = B.x + u * 1;
    const wIn = B.w - u * 2;
    const rand = seeded(info.seed ^ 77);
    backShell(ctx, B, r, u, '#c9b593', null, () => {
      const g = ctx.createLinearGradient(B.x, B.y, B.x + B.w, B.y + B.h);
      g.addColorStop(0, '#d2c09e');
      g.addColorStop(1, '#b9a47f');
      ctx.fillStyle = g;
      ctx.fillRect(B.x, B.y, B.w, B.h);
      grain(ctx, B.x, B.y, B.w, B.h, .55);
      // Flecks in the board.
      ctx.fillStyle = 'rgba(60,40,20,.35)';
      for (let k = 0; k < 140; k++) ctx.fillRect(B.x + rand() * B.w, B.y + rand() * B.h, u * (.04 + rand() * .1), u * .04);
    });
    // A printed frame in the team ink.
    ctx.strokeStyle = fill;
    ctx.lineWidth = u * .14;
    ctx.strokeRect(B.x + u * .5, B.y + u * .5, B.w - u, B.h - u);
    ctx.lineWidth = u * .05;
    ctx.strokeRect(B.x + u * .7, B.y + u * .7, B.w - u * 1.4, B.h - u * 1.4);
    // Header: the number in a star, the name in the varsity face.
    let y = B.y + u * 1.1;
    const sx = x0 + u * 1.5;
    star(ctx, sx, y + u * 1.6, u * 1.7, fill);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    fit(ctx, String(info.cardNo), u * 1.6, 400, u * 1, DISPLAY);
    ctx.fillText(String(info.cardNo), sx, y + u * 1.95);
    ctx.textAlign = 'left';
    const tx = x0 + u * 3.4;
    const tw = wIn - u * 3.6;
    ctx.fillStyle = dark;
    fit(ctx, text.name, tw, 400, u * 1.7, VARSITY, u * .04);
    ctx.fillText(text.name, tx, y + u * 1.6);
    ctx.fillStyle = fill;
    fit(ctx, `${zh ? team.name : upper(team.name)} · ${info.role}`, tw, 900, u * .52, SANS, u * .06);
    ctx.fillText(`${zh ? team.name : upper(team.name)} · ${info.role}`, tx, y + u * 2.5);
    y += u * 3.3;
    ctx.fillStyle = fill;
    ctx.fillRect(x0, y, wIn, u * .12);
    y += u * .4;
    // Born / home line, like the bio line on old cards.
    const s = say(team);
    const bio = zh
      ? `${s.est} ${team.est} · ${team.city} · ${s.home} ${team.homeNick || team.home}`
      : `${s.est} ${team.est} · ${upper(team.city)} · ${s.home}: ${team.homeNick || team.home}`;
    ctx.fillStyle = dark;
    fit(ctx, bio, wIn, 800, u * .46, SANS, u * .03);
    ctx.fillText(bio, x0, y + u * .55);
    y += u * 1.1;
    // The cartoon: a fact in a speech panel beside the team's emblem.
    const panelH = u * 6.2;
    ctx.fillStyle = '#efe4c8';
    ctx.fillRect(x0, y, wIn, panelH);
    ctx.strokeStyle = dark;
    ctx.lineWidth = u * .1;
    ctx.strokeRect(x0, y, wIn, panelH);
    const ex = x0 + u * 2.4;
    const ey = y + panelH * .55;
    if (text.logo) sticker(ctx, text.logo, ex, ey, u * 3.6, u * .7, -.06);
    else drawMotif(ctx, team.motif, ex, ey, u * 3.4, team.ink, team.c1, team.accent);
    const fact = info.facts[0] || [words.story, team.story];
    const bx = x0 + u * 4.8;
    const bw = wIn - u * 5.3;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, bx, y + u * .5, bw, panelH - u * 1, u * .8);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx + u * .1, y + panelH * .5);
    ctx.lineTo(bx - u * .8, y + panelH * .62);
    ctx.lineTo(bx + u * .1, y + panelH * .7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = fill;
    fit(ctx, fact[0], bw - u, 900, u * .44, SANS, u * .12);
    ctx.fillText(fact[0], bx + u * .5, y + u * 1.3);
    ctx.fillStyle = dark;
    font(ctx, 700, u * .58, SANS, u * .02);
    wrapLines(ctx, fact[1], bw - u, 4).forEach((line, k) => ctx.fillText(line, bx + u * .5, y + u * 2.15 + k * u * .8));
    y += panelH + u * .7;
    // Ruled table of moments in the two inks.
    ctx.fillStyle = fill;
    fit(ctx, words.year, u * 2.4, 900, u * .42, SANS, u * .1);
    ctx.fillText(words.year, x0, y);
    fit(ctx, words.highlights, wIn - u * 3, 900, u * .42, SANS, u * .1);
    ctx.fillText(words.highlights, x0 + u * 2.8, y);
    y += u * .3;
    const fy = B.y + B.h - u * 3.2;
    const rows = info.moments.map(([year, line]) => [String(year), zh ? line : upper(line)]);
    rows.push([words.total, titleLine(team) || (team.titles ? team.titles.label : '')]);
    if (info.legends.length) rows.push([words.legends, info.legends.map(item => Array.isArray(item) ? `${item[0]} ${item[1]}` : item).join(' · ')]);
    const rh = Math.min(u * 1.2, (fy - u * 1.3 - y) / rows.length);
    rows.forEach(([year, line]) => {
      ctx.fillStyle = dark;
      ctx.fillRect(x0, y, wIn, Math.max(1, u * .04));
      fit(ctx, year, u * 2.6, 400, rh * .52, VARSITY, u * .02);
      ctx.fillText(year, x0, y + rh * .7);
      fit(ctx, line, wIn - u * 2.9, 700, rh * .42, SANS, u * .02);
      ctx.fillText(line, x0 + u * 2.8, y + rh * .68);
      y += rh;
    });
    ctx.fillStyle = dark;
    ctx.fillRect(x0, y, wIn, Math.max(1, u * .04));
    // The slogan and the fine print, printed in ink straight on the board.
    ctx.fillStyle = fill;
    ctx.textAlign = 'center';
    const call = zh ? `「${text.slogan}」` : `“${text.slogan}”`;
    fit(ctx, call, wIn, 400, u * .85, VARSITY, u * .03);
    ctx.fillText(call, B.x + B.w / 2, fy - u * .2);
    ctx.fillStyle = dark;
    const fine = `${words.parallel} · ${info.name}${info.serial ? ` · ${info.serial}` : ''} · © ${new Date().getFullYear()} HOT 主场相框 · ${info.set}`;
    fit(ctx, fine, wIn, 700, u * .38, SANS, u * .03);
    ctx.fillText(fine, B.x + B.w / 2, fy + u * 1);
    fit(ctx, `${text.season}${text.date ? ` · ${text.date}` : ''} · ${info.insert}`, wIn, 700, u * .34, SANS, u * .03);
    ctx.fillText(`${text.season}${text.date ? ` · ${text.date}` : ''} · ${info.insert}`, B.x + B.w / 2, fy + u * 1.7);
    ctx.textAlign = 'left';
  },

  // Certificate: for signed and relic cards, a black board with gold rules, the
  // maker's congratulations, the hits spelled out, a hologram and a window onto the
  // back of the relic.
  certificate(ctx, team, text, L, info) {
    const B = L.back;
    const u = B.w / 20;
    const zh = isZh(team);
    const words = CARD_WORDS[zh ? 'zh' : 'en'];
    const fill = solid(team);
    const r = u * .7;
    const wIn = B.w - u * 2.8;
    const gold = metal(ctx, B.y, B.y + B.h, 'gold');
    backShell(ctx, B, r, u, '#0f0f11', null, () => {
      const g = ctx.createRadialGradient(B.x + B.w / 2, B.y + B.h * .3, 0, B.x + B.w / 2, B.y + B.h * .3, B.h);
      g.addColorStop(0, mix(fill, '#0f0f11', .75));
      g.addColorStop(1, '#070708');
      ctx.fillStyle = g;
      ctx.fillRect(B.x, B.y, B.w, B.h);
      ctx.globalAlpha = .06;
      guilloche(ctx, B.x, B.y, B.w, B.h, u * 1.4, '#e8bf55');
      ctx.globalAlpha = 1;
      grain(ctx, B.x, B.y, B.w, B.h, .25);
    });
    ctx.strokeStyle = gold;
    ctx.lineWidth = u * .16;
    ctx.strokeRect(B.x + u * .6, B.y + u * .6, B.w - u * 1.2, B.h - u * 1.2);
    ctx.lineWidth = u * .05;
    ctx.strokeRect(B.x + u * .85, B.y + u * .85, B.w - u * 1.7, B.h - u * 1.7);
    // The crest and the heading.
    let y = B.y + u * 3.4;
    const mid = B.x + B.w / 2;
    crestMark(ctx, team, text.logo, mid, y, u * 3.6, u * .8, 0);
    y += u * 3.4;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const head = zh ? '恭喜您！' : 'CONGRATULATIONS!';
    const hs = fit(ctx, head, wIn, 400, u * 1.5, DISPLAY, u * .1);
    foilText(ctx, head, mid, y, hs, 'gold');
    y += u * 1;
    // What the card holds, in the maker's words.
    const what = [info.auto ? (zh ? '亲笔签名' : 'an authentic autograph') : '', info.mem ? (zh ? info.mem.zh : `a piece of ${info.mem.en.toLowerCase()}`) : ''].filter(Boolean);
    const body = zh
      ? `您获得的这张「${info.set}」卡片，收录了 ${text.name} 的${what.join('与')}。每一张均由 HOT 主场相框亲自核验，保证真实。`
      : `You have received a ${info.set} card of ${text.name} featuring ${what.join(' and ')}. Every piece is checked and certified by HOT, and guaranteed authentic.`;
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    font(ctx, 600, u * .56, SANS, u * .02);
    wrapLines(ctx, body, wIn, 4).forEach(line => {
      y += u * .8;
      ctx.fillText(line, mid, y);
    });
    y += u * 1.1;
    // A window onto the back of the relic, or the hits as a list.
    if (info.mem) {
      const ww = u * 7;
      const wh = u * 4.6;
      const wx = mid - ww / 2;
      ctx.save();
      roundRect(ctx, wx, y, ww, wh, u * .4);
      ctx.clip();
      materials[info.mem.id === 'dual' ? 'jersey' : info.mem.id === 'number' || info.mem.id === 'tag' ? 'jersey' : info.mem.id](ctx, team, wx, y, ww, wh, text.number, text.logo, words);
      ctx.fillStyle = 'rgba(0,0,0,.45)';
      ctx.fillRect(wx, y, ww, wh);
      // The plastic over the window.
      const g = ctx.createLinearGradient(wx, y, wx + ww, y + wh);
      g.addColorStop(.2, 'rgba(255,255,255,0)');
      g.addColorStop(.35, 'rgba(255,255,255,.25)');
      g.addColorStop(.5, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(wx, y, ww, wh);
      ctx.restore();
      roundRect(ctx, wx, y, ww, wh, u * .4);
      ctx.strokeStyle = gold;
      ctx.lineWidth = u * .14;
      ctx.stroke();
      authSeal(ctx, wx + ww + u * 1.7, y + wh * .5, u * 1.35, zh, info.seed);
      ctx.fillStyle = 'rgba(255,255,255,.6)';
      fit(ctx, zh ? info.mem.zh : info.mem.en, ww, 900, u * .38, SANS, u * .14);
      ctx.fillText(zh ? info.mem.zh : info.mem.en, mid, y + wh + u * .7);
      y += wh + u * 1.4;
    } else {
      authSeal(ctx, mid, y + u * 1.6, u * 1.6, zh, info.seed);
      y += u * 4;
    }
    // The certificate number and a signature line.
    const code = `HOT-${(info.seed >>> 0).toString(16).toUpperCase().padStart(8, '0').slice(0, 8)}`;
    ctx.fillStyle = gold;
    fit(ctx, code, wIn, 400, u * .9, DISPLAY, u * .12);
    ctx.fillText(code, mid, y);
    y += u * .5;
    const fy = B.y + B.h - u * 2.6;
    const lineY = Math.min(fy - u * 1.6, y + u * 2.2);
    ctx.fillStyle = 'rgba(255,255,255,.4)';
    ctx.fillRect(mid - wIn * .3, lineY, wIn * .6, Math.max(1, u * .05));
    signature(ctx, 'HOT', mid - wIn * .15, lineY - u * .2, wIn * .3, u * .8, '#e8bf55');
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.textAlign = 'center';
    fit(ctx, zh ? 'HOT 主场相框 · 认证部' : 'HOT AUTHENTICATION', wIn, 800, u * .36, SANS, u * .14);
    ctx.fillText(zh ? 'HOT 主场相框 · 认证部' : 'HOT AUTHENTICATION', mid, lineY + u * .65);
    ctx.textAlign = 'left';
    backFoot(ctx, team, text, B, info, r, u, words);
  },
};

// ----- How the card is shown -----

// Draws `paint` scaled and turned about the centre of rect R, moved by dx, dy.
function placed(ctx, R, scale, turn, dx, dy, paint) {
  ctx.save();
  ctx.translate(R.x + R.w / 2 + dx, R.y + R.h / 2 + dy);
  ctx.rotate(turn);
  ctx.scale(scale, scale);
  ctx.translate(-(R.x + R.w / 2), -(R.y + R.h / 2));
  paint();
  ctx.restore();
}

// A graded slab round the card: a clear case with a label on top.
function slab(ctx, team, text, info, F, words, paintCard) {
  const u = F.w / 20;
  const cx = F.x - u * 1;
  const cy = F.y - u * 5.6;
  const cw = F.w + u * 2;
  const ch = F.h + u * 6.6;
  // The case.
  shadow(ctx, u * 2, true);
  roundRect(ctx, cx, cy, cw, ch, u * .9);
  ctx.fillStyle = 'rgba(235,240,245,.16)';
  ctx.fill();
  shadow(ctx, u, false);
  ctx.strokeStyle = 'rgba(255,255,255,.6)';
  ctx.lineWidth = u * .2;
  ctx.stroke();
  roundRect(ctx, cx + u * .45, cy + u * .45, cw - u * .9, ch - u * .9, u * .6);
  ctx.strokeStyle = 'rgba(255,255,255,.25)';
  ctx.lineWidth = u * .1;
  ctx.stroke();
  // The label.
  const lx = cx + u * .7;
  const ly = cy + u * .7;
  const lw = cw - u * 1.4;
  const lh = u * 3.8;
  ctx.fillStyle = '#fbfbf8';
  ctx.fillRect(lx, ly, lw, lh);
  ctx.strokeStyle = '#c8102e';
  ctx.lineWidth = u * .22;
  ctx.strokeRect(lx + u * .25, ly + u * .25, lw - u * .5, lh - u * .5);
  ctx.fillStyle = '#111111';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const leftW = lw * .66;
  fit(ctx, `${new Date().getFullYear()} ${info.set}`, leftW, 900, u * .55, SANS, u * .04);
  ctx.fillText(`${new Date().getFullYear()} ${info.set}`, lx + u * .7, ly + u * 1.2);
  fit(ctx, `${text.name} #${text.number}`, leftW, 900, u * .55, SANS, u * .04);
  ctx.fillText(`${text.name} #${text.number}`, lx + u * .7, ly + u * 1.95);
  const detail = [info.name, info.serial, info.auto ? words.signed : ''].filter(Boolean).join(' · ');
  fit(ctx, detail, leftW, 700, u * .45, SANS, u * .04);
  ctx.fillText(detail, lx + u * .7, ly + u * 2.65);
  // Barcode.
  ctx.fillStyle = '#111111';
  let bx = lx + u * .7;
  for (let k = 0; k < 34; k++) {
    const bw = u * (.04 + ((k * 7 + info.cardNo) % 5) * .03);
    ctx.fillRect(bx, ly + u * 2.95, bw, u * .5);
    bx += bw + u * .06;
  }
  ctx.textAlign = 'right';
  fit(ctx, words.grading, lw * .3, 900, u * .4, SANS, u * .08);
  ctx.fillText(words.grading, lx + lw - u * .6, ly + u * 1.1);
  fit(ctx, info.grade.word, lw * .3, 900, u * .5, SANS, u * .06);
  ctx.fillText(info.grade.word, lx + lw - u * .6, ly + u * 1.8);
  ctx.fillStyle = '#c8102e';
  fit(ctx, info.grade.n, lw * .3, 400, u * 1.5, DISPLAY);
  ctx.fillText(info.grade.n, lx + lw - u * .6, ly + u * 3.3);
  ctx.textAlign = 'left';
  // The card in its well, then a glare on the plastic.
  paintCard();
  ctx.save();
  roundRect(ctx, cx, cy, cw, ch, u * .9);
  ctx.clip();
  const g = ctx.createLinearGradient(cx, cy, cx + cw, cy + ch);
  g.addColorStop(.18, 'rgba(255,255,255,0)');
  g.addColorStop(.26, 'rgba(255,255,255,.1)');
  g.addColorStop(.34, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(cx, cy, cw, ch);
  ctx.restore();
}

// A magnetic one-touch holder: thick clear edges round the card.
function holder(ctx, F, paintCard) {
  const u = F.w / 20;
  const e = u * 1.3;
  shadow(ctx, u * 2, true);
  roundRect(ctx, F.x - e, F.y - e, F.w + e * 2, F.h + e * 2, u * 1.4);
  ctx.fillStyle = 'rgba(235,240,245,.14)';
  ctx.fill();
  shadow(ctx, u, false);
  ctx.strokeStyle = 'rgba(255,255,255,.7)';
  ctx.lineWidth = u * .18;
  ctx.stroke();
  roundRect(ctx, F.x - u * .25, F.y - u * .25, F.w + u * .5, F.h + u * .5, u * .9);
  ctx.strokeStyle = 'rgba(255,255,255,.35)';
  ctx.lineWidth = u * .12;
  ctx.stroke();
  paintCard();
  // The edge catches the light.
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, F.x - e, F.y - e, F.w + e * 2, F.h + e * 2, u * 1.4);
  ctx.rect(F.x - u * .2, F.y - u * .2, F.w + u * .4, F.h + u * .4);
  ctx.clip('evenodd');
  const g = ctx.createLinearGradient(F.x - e, F.y - e, F.x + F.w + e, F.y + F.h + e);
  g.addColorStop(0, 'rgba(255,255,255,.35)');
  g.addColorStop(.5, 'rgba(255,255,255,.05)');
  g.addColorStop(1, 'rgba(255,255,255,.3)');
  ctx.fillStyle = g;
  ctx.fillRect(F.x - e, F.y - e, F.w + e * 2, F.h + e * 2);
  ctx.restore();
}

function card(ctx, team, text, L) {
  const {W, H} = L;
  const info = cardInfo(team, text.seed);
  // The photo window moves with the design; app.js reads it back for dragging.
  L.area = frontArea(L, info.design);
  const words = CARD_WORDS[isZh(team) ? 'zh' : 'en'];
  const rand = seeded(info.seed ^ 0x5bd1e995);
  // A dark table lit in the team colour.
  ctx.fillStyle = '#0c0c0e';
  ctx.fillRect(0, 0, W, H);
  const glowColour = luminance(team.c1) < .03 ? team.c2 : team.c1;
  const n = parseInt(glowColour.slice(1), 16);
  const glow = ctx.createRadialGradient(W * .3, H * .5, 0, W * .3, H * .5, W * .6);
  glow.addColorStop(0, `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, .45)`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  const F = L.front;
  const B = L.back;
  const back = () => cardBack(ctx, team, text, L, info);
  const front = () => {
    fronts[info.design](ctx, team, text, L, info, words, rand);
    cardEdge(ctx, F, F.w / 20);
  };
  if (info.show === 'fan') {
    placed(ctx, B, .9, .12, -F.w * .14, F.w * .02, back);
    placed(ctx, F, .93, -.07, F.w * .1, 0, front);
  } else if (info.show === 'slab') {
    placed(ctx, B, .9, .05, F.w * .02, 0, back);
    placed(ctx, F, .8, 0, 0, F.w * .11, () => slab(ctx, team, text, info, F, words, front));
  } else if (info.show === 'holder') {
    placed(ctx, B, .9, .04, 0, 0, back);
    placed(ctx, F, .88, -.02, 0, 0, () => holder(ctx, F, front));
  } else {
    back();
    front();
  }
}

const painters = {jersey, ticket, patch, card};

// The season printed on the ticket: "2026-27 SEASON" for winter leagues,
// "2026 SEASON" for the Chinese league and college football.
export function seasonText(team, now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const word = say(team).season;
  if (team.season === 'year') return `${year} ${word}`;
  const start = month >= 8 ? year : year - 1;
  return `${start}-${String(start + 1).slice(2)} ${word}`;
}

// Paints the whole picture into `canvas`. `text` holds name, number, slogan and
// date; `look` holds the photo position (x, y) and the logo image, if any.
export function paint(canvas, source, team, style, text, L, look = {}) {
  canvas.width = L.W;
  canvas.height = L.H;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const words = Object.assign({season: seasonText(team)}, text, {
    logo: look.logo || null,
    mark: look.mark !== false,
    drawPhoto(area) {
      if (!source) {
        ctx.fillStyle = '#2a2622';
        ctx.fillRect(area.x, area.y, area.w, area.h);
        return;
      }
      const cut = crop(source, area, look.x, look.y);
      ctx.drawImage(source, cut.sx, cut.sy, cut.sw, cut.sh, area.x, area.y, area.w, area.h);
    },
  });
  painters[style](ctx, team, words, L);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ctx.textAlign = 'left';
}

// A stand-in photo (night game, lights on) until someone picks their own.
export function demoPhoto(width = 1200, height = 1500) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#070b18');
  sky.addColorStop(.55, '#17213d');
  sky.addColorStop(1, '#2d1f2a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  for (const [x, y] of [[.18, .12], [.82, .1]]) {
    const glow = ctx.createRadialGradient(width * x, height * y, 0, width * x, height * y, width * .5);
    glow.addColorStop(0, 'rgba(255,245,220,.55)');
    glow.addColorStop(1, 'rgba(255,245,220,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fffbe8';
    for (let k = 0; k < 9; k++) {
      ctx.beginPath();
      ctx.arc(width * x + (k % 3 - 1) * 26, height * y + (Math.floor(k / 3) - 1) * 22, 8, 0, TAU);
      ctx.fill();
    }
  }
  // Crowd as rows of soft dots.
  let seed = 7;
  for (let row = 0; row < 14; row++) {
    for (let k = 0; k < 46; k++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      ctx.fillStyle = `hsla(${seed % 360}, 45%, ${30 + seed % 25}%, .55)`;
      ctx.beginPath();
      ctx.arc(k * width / 45 + (row % 2) * 12, height * .42 + row * 18, 7, 0, TAU);
      ctx.fill();
    }
  }
  // Court floor with lines.
  const floor = ctx.createLinearGradient(0, height * .68, 0, height);
  floor.addColorStop(0, '#9a6a3c');
  floor.addColorStop(1, '#c48a4f');
  ctx.fillStyle = floor;
  ctx.fillRect(0, height * .68, width, height * .32);
  ctx.strokeStyle = 'rgba(255,255,255,.75)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(width / 2, height * .86, width * .3, height * .08, 0, 0, TAU);
  ctx.moveTo(0, height * .86);
  ctx.lineTo(width, height * .86);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.88)';
  ctx.textAlign = 'center';
  const unit = Math.min(width, height);
  ctx.font = `900 ${unit * .075}px ${SANS}`;
  ctx.fillText('你的照片放这里', width / 2, height * .6);
  ctx.font = `700 ${unit * .034}px ${SANS}`;
  ctx.fillStyle = 'rgba(255,255,255,.6)';
  ctx.fillText('示意图 · 选一张自拍、合影或看球照', width / 2, height * .6 + unit * .07);
  return c;
}
