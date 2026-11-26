// Draws the four frame styles (jersey, ticket, patch, card) on a canvas, from the
// team's colours, its real names, its history (founding year, home, titles,
// retired numbers, big moments) and its official logo (see logos in teams.js),
// plus the words typed in. Chinese teams and schools are printed in Chinese.
import {drawMotif, kit, trim, luminanceOf} from './art.js?v=9';
import {isZh} from './teams.js?v=9';

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
// Like a real player card: a foil border whose finish is the card's rarity (base,
// silver, team colour /199, gold /10, black 1/1), the photo as the player, the crest
// in the corner, a nameplate, a rookie badge and, on the rarer pulls, a serial number,
// an autograph and a jersey patch. The back is the team's file: card number, three
// facts, a highlights table, legends and one piece of trivia. Which rarity, which
// facts and which highlights come out is drawn from `seed`, so a new seed is a new pull.

// A small seeded random generator (mulberry32): the same seed gives the same card.
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Rarity tiers: weight out of 100, print run (0 = not numbered), auto and patch odds.
const TIERS = [
  {id: 'base', w: 36, run: 0, en: 'BASE', zh: '普卡', auto: .15, patch: .1},
  {id: 'silver', w: 28, run: 0, en: 'SILVER', zh: '银折', auto: .25, patch: .2},
  {id: 'team', w: 20, run: 199, en: 'TEAM COLOR', zh: '队色折', auto: .45, patch: .4},
  {id: 'gold', w: 11, run: 10, en: 'GOLD', zh: '金折', auto: 1, patch: 1},
  {id: 'black', w: 5, run: 1, en: 'BLACK', zh: '黑金', auto: 1, patch: 1},
];

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

const CARD_WORDS = {
  en: {
    set: 'HOT CHROME', rookie: 'ROOKIE', card: 'CARD', highlights: 'HIGHLIGHTS', year: 'YEAR',
    total: 'ALL-TIME', legends: 'LEGENDS', trivia: 'DID YOU KNOW?', oneOfOne: 'ONE OF ONE',
    patch: 'PATCH', auto: 'CERTIFIED AUTOGRAPH', parallel: 'PARALLEL',
    motto: 'MOTTO', mascot: 'MASCOT', aka: 'A.K.A.', chant: 'CHANT', home: 'HOME', story: 'STORY · 故事',
  },
  zh: {
    set: 'HOT 主场', rookie: '新秀', card: '卡号', highlights: '历史时刻', year: '年份',
    total: '荣誉', legends: '传奇', trivia: '你知道吗？', oneOfOne: '全球唯一',
    patch: '球衣碎片', auto: '亲笔签名', parallel: '版本',
    motto: '校训', mascot: '吉祥物', aka: '别称', chant: '助威', home: '主场', story: '一句话',
  },
};

// What a given pull holds. app.js shows its label beside the reroll button.
export function cardInfo(team, seed) {
  const rand = seeded(hash(team.id) ^ Math.imul((seed >>> 0) || 1, 2654435761));
  const pick = list => list[Math.floor(rand() * list.length) % list.length];
  let roll = rand() * 100;
  let tier = TIERS[0];
  for (const item of TIERS) {
    if (roll < item.w) {
      tier = item;
      break;
    }
    roll -= item.w;
  }
  const zh = isZh(team);
  const serial = tier.run > 1 ? Math.floor(rand() * tier.run) + 1 : tier.run;
  const width = String(tier.run).length;
  const serialText = tier.run ? `${String(serial).padStart(width, '0')}/${tier.run}` : '';
  const auto = rand() < tier.auto;
  const patch = rand() < tier.patch;
  const cardNo = Math.floor(rand() * 300) + 1;
  const role = pick(ROLES[team.group] || ROLES.hoops);
  const insert = pick(INSERTS[team.group] || INSERTS.hoops);
  // Two of the big moments, kept in year order.
  const moments = (team.moments || []).slice();
  while (moments.length > 2) moments.splice(Math.floor(rand() * moments.length), 1);
  // Up to three legends, in the team's own order.
  const legends = (team.retired || []).slice();
  while (legends.length > 3) legends.splice(Math.floor(rand() * legends.length), 1);
  // One piece of trivia.
  const w = CARD_WORDS[zh ? 'zh' : 'en'];
  const school = team.group === 'cnu' || team.group === 'hs';
  const trivia = [
    team.motto ? [zh && !school ? '格言' : w.motto, team.motto] : null,
    team.mascot ? [w.mascot, team.mascot] : null,
    team.nicknames && team.nicknames.length > 1 ? [w.aka, team.nicknames.join(' · ')] : null,
    team.chant ? [w.chant, team.chant] : null,
    team.homeNick ? [w.home, `${team.home} · ${team.homeNick}`] : null,
    team.story ? [w.story, team.story] : null,
  ].filter(Boolean);
  const facts = [];
  while (trivia.length && facts.length < 2) facts.push(trivia.splice(Math.floor(rand() * trivia.length), 1)[0]);
  const name = zh ? tier.zh : tier.en;
  const label = [tier.zh, serialText, auto ? '签字' : '', patch ? '球衣碎片' : ''].filter(Boolean).join(' · ');
  return {tier, name, serial: serialText, auto, patch, cardNo, role, insert, moments, legends, facts, label};
}

// Splits text into at most maxLines lines of maxWidth, Chinese character by
// character and other text word by word, with … when it runs out of room. The first
// line can be shorter (firstWidth), for text that starts after a label.
function wrapLines(ctx, text, maxWidth, maxLines, firstWidth = maxWidth) {
  const tokens = String(text).match(/[⺀-鿿豈-﫿＀-￯]|[^\s⺀-鿿豈-﫿＀-￯]+|\s+/g) || [];
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

// The foil for the border, by rarity.
function foilFill(ctx, team, tier, x, y, w, h) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  const stops = {
    base: ['#fbfaf6', '#efede6', '#fbfaf6'],
    silver: ['#eef1f4', '#9ea7b1', '#fbfcfd', '#8a949f', '#e3e8ee', '#a9b2bc'],
    gold: ['#7a5a12', '#f7d774', '#b8891f', '#fff1b8', '#8f6a14', '#e8c35a'],
    black: ['#0b0b0b', '#2b2b2b', '#050505', '#262626', '#0b0b0b'],
  }[tier.id] || [team.c1, team.c2 === team.c1 ? team.c3 : team.c2, team.c1, team.c3, team.c1];
  stops.forEach((colour, k) => g.addColorStop(k / (stops.length - 1), colour));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

// Prism lines fanning out from below the card, and a rainbow sheen for chrome.
function prism(ctx, tier, x, y, w, h, rand) {
  if (tier.id === 'base') return;
  ctx.save();
  const cx = x + w * (.3 + rand() * .4);
  const cy = y + h * 1.15;
  const rays = 46;
  for (let k = 0; k < rays; k++) {
    const a0 = Math.PI + k / rays * Math.PI;
    const a1 = a0 + Math.PI / rays * .55;
    ctx.globalAlpha = k % 2 ? .16 : .06;
    ctx.fillStyle = tier.id === 'black' ? '#d9b45a' : '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a0) * h * 3, cy + Math.sin(a0) * h * 3);
    ctx.lineTo(cx + Math.cos(a1) * h * 3, cy + Math.sin(a1) * h * 3);
    ctx.closePath();
    ctx.fill();
  }
  if (tier.id === 'silver' || tier.id === 'team') {
    const g = ctx.createLinearGradient(x, y + h, x + w, y);
    ['#ff4d6d', '#ffb84d', '#fff04d', '#4dff88', '#4dc3ff', '#9b6bff', '#ff4dd2'].forEach((c, k, all) => g.addColorStop(k / (all.length - 1), c));
    ctx.globalAlpha = tier.id === 'silver' ? .22 : .12;
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
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

// A swatch of the team's shirt with stitching round it, in a window.
function swatch(ctx, team, x, y, w, h, u, word, number) {
  shadow(ctx, u, true);
  roundRect(ctx, x - u * .18, y - u * .18, w + u * .36, h + u * .36 + u * .7, u * .3);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  shadow(ctx, u, false);
  ctx.save();
  roundRect(ctx, x, y, w, h, u * .2);
  ctx.clip();
  kit(ctx, team, x - w * .5, y - h * .5, w * 2, h * 2, u * 1.4);
  trim(ctx, team, x, y + h * .62, w, h * .16);
  // A piece of the shirt number, cut off by the window like a real patch.
  if (number) {
    ctx.font = `400 ${Math.round(h * 1.5)}px ${DISPLAY}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = team.c3 === team.c1 ? team.c2 : team.c3;
    ctx.lineWidth = h * .08;
    ctx.strokeText(number, x + w * .42, y + h * 1.05);
    ctx.fillStyle = team.ink === team.c1 ? team.c2 : team.ink;
    ctx.fillText(number, x + w * .42, y + h * 1.05);
  }
  // Fabric weave.
  ctx.globalAlpha = .12;
  ctx.fillStyle = '#000000';
  for (let k = 0; k < w; k += Math.max(1, u * .12)) ctx.fillRect(x + k, y, Math.max(1, u * .04), h);
  ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,.35)';
  ctx.lineWidth = Math.max(1, u * .06);
  ctx.setLineDash([u * .18, u * .12]);
  roundRect(ctx, x + u * .16, y + u * .16, w - u * .32, h - u * .32, u * .12);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#111111';
  ctx.textAlign = 'center';
  fit(ctx, word, w, 900, u * .38, SANS, u * .06);
  ctx.fillText(word, x + w / 2, y + h + u * .5);
}

// The autograph: the name as a quick signature with a flourish under it.
function autograph(ctx, name, x, y, maxWidth, u, ink) {
  const signed = HAN.test(name) ? name : name.toLowerCase().replace(/(^|\s)\S/g, s => s.toUpperCase());
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-.12);
  ctx.transform(1, 0, -.22, 1, 0, 0);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  fit(ctx, signed, maxWidth, 400, u * 1.6, `"Snell Roundhand", "Segoe Script", "Brush Script MT", "Kaiti SC", "STKaiti", KaiTi, cursive`);
  const width = measure(ctx, signed);
  ctx.shadowColor = ink === '#ffffff' ? 'rgba(0,0,0,.55)' : 'rgba(255,255,255,.85)';
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
}

function cardFront(ctx, team, text, L, info) {
  const {front: F, b, area} = L;
  const u = F.w / 20;
  const tier = info.tier;
  const logo = text.logo;
  const words = CARD_WORDS[isZh(team) ? 'zh' : 'en'];
  const rand = seeded(hash(team.id + info.cardNo) ^ text.seed);
  const r = u * .7;

  // The card, its shadow and the foil border.
  shadow(ctx, u * 2, true);
  roundRect(ctx, F.x, F.y, F.w, F.h, r);
  ctx.fillStyle = '#000000';
  ctx.fill();
  shadow(ctx, u, false);
  ctx.save();
  roundRect(ctx, F.x, F.y, F.w, F.h, r);
  ctx.clip();
  foilFill(ctx, team, tier, F.x, F.y, F.w, F.h);
  prism(ctx, tier, F.x, F.y, F.w, F.h, rand);
  ctx.restore();

  // The photo, with the crest faint over one corner when marks are on.
  ctx.save();
  roundRect(ctx, area.x, area.y, area.w, area.h, u * .35);
  ctx.clip();
  text.drawPhoto(area);
  if (text.mark) photoMarks(ctx, logo, area, u * 1.5, 'tr', null);
  // A soft shine across the photo on the chrome pulls.
  if (tier.id !== 'base') {
    const g = ctx.createLinearGradient(area.x, area.y, area.x + area.w, area.y + area.h);
    g.addColorStop(.25, 'rgba(255,255,255,0)');
    g.addColorStop(.42, 'rgba(255,255,255,.16)');
    g.addColorStop(.5, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(area.x, area.y, area.w, area.h);
  }
  // Darker foot so the nameplate reads.
  const foot = ctx.createLinearGradient(0, area.y + area.h * .55, 0, area.y + area.h);
  foot.addColorStop(0, 'rgba(0,0,0,0)');
  foot.addColorStop(1, 'rgba(0,0,0,.55)');
  ctx.fillStyle = foot;
  ctx.fillRect(area.x, area.y + area.h * .55, area.w, area.h * .45);
  ctx.restore();
  const edgeLine = tier.id === 'base' ? solid(team) : tier.id === 'black' ? '#d9b45a' : 'rgba(255,255,255,.85)';
  ctx.strokeStyle = edgeLine;
  ctx.lineWidth = Math.max(1, u * .14);
  roundRect(ctx, area.x, area.y, area.w, area.h, u * .35);
  ctx.stroke();

  // Set logo, top left: HOT CHROME and the season (or the photo's date).
  const tagW = u * 5.6;
  const tagX = area.x + u * .5;
  const tagY = area.y + u * .5;
  ctx.save();
  ctx.translate(tagX, tagY);
  ctx.transform(1, 0, -.18, 1, 0, 0);
  ctx.fillStyle = 'rgba(0,0,0,.78)';
  ctx.fillRect(0, 0, tagW, u * 1.75);
  ctx.fillStyle = tier.id === 'gold' || tier.id === 'black' ? '#f2cf6b' : '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  fit(ctx, words.set, tagW - u * .6, 400, u * .9, DISPLAY, u * .06);
  ctx.fillText(words.set, u * .35, u * 1.02);
  // The photo's date, when the user turned it on, takes the season's place.
  const tagLine = text.date || text.season;
  fit(ctx, tagLine, tagW - u * .6, 800, u * .44, SANS, u * .1);
  ctx.globalAlpha = .8;
  ctx.fillText(tagLine, u * .35, u * 1.52);
  ctx.restore();

  // Crest, top right, big; the RC shield under it.
  const crest = u * 5.2;
  const ccx = area.x + area.w - crest * .5 - u * .2;
  const ccy = area.y + crest * .5 + u * .2;
  if (logo) sticker(ctx, logo, ccx, ccy, crest, u * 1.2, .06);
  else {
    ctx.fillStyle = team.c1;
    ctx.beginPath();
    ctx.arc(ccx, ccy, crest * .42, 0, TAU);
    ctx.fill();
    drawMotif(ctx, team.motif, ccx, ccy, crest * .7, team.ink, team.c1, team.accent);
  }
  rookieBadge(ctx, ccx, ccy + crest * .5 + u * 1.5, u * 2.3, solid(team), readable(solid(team)), words.rookie);

  // Nameplate across the foot of the photo.
  const plateH = u * 4.6;
  const plateY = area.y + area.h - plateH - u * .3;
  const plateX = F.x;
  const plateW = F.w * .8;
  const fill = solid(team);
  const ink = readable(fill);
  const second = [team.c2, team.c3, team.accent].find(c => c !== fill && Math.abs(luminance(c) - luminance(fill)) > .12) || '#ffffff';
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
  ctx.fillStyle = second;
  ctx.beginPath();
  ctx.moveTo(plateX, plateY - u * .78);
  ctx.lineTo(plateX + plateW * .66, plateY - u * .78);
  ctx.lineTo(plateX + plateW * .66 - u * .7, plateY);
  ctx.lineTo(plateX, plateY);
  ctx.closePath();
  ctx.fill();
  // Insert name on the accent stripe.
  ctx.fillStyle = readable(second);
  ctx.textAlign = 'left';
  fit(ctx, info.insert, plateW * .54, 900, u * .52, SANS, u * .12);
  ctx.fillText(info.insert, area.x + u * .3, plateY - u * .2);
  ctx.fillStyle = ink;
  const nameW = plateW - plateH * .45 - (area.x - F.x) - u * .9;
  fit(ctx, text.name, nameW, 400, u * 2.2, DISPLAY, u * .05);
  ctx.fillText(text.name, area.x + u * .3, plateY + u * 2.35);
  const line = `${team.short} · ${info.role}`;
  fit(ctx, line, nameW, 800, u * .62, SANS, u * .1);
  ctx.globalAlpha = .9;
  ctx.fillText(line, area.x + u * .3, plateY + u * 3.6);
  ctx.globalAlpha = 1;

  // Number disc, bottom right.
  const dr = u * 2.05;
  const dx = area.x + area.w - dr - u * .4;
  const dy = plateY + plateH / 2;
  shadow(ctx, u, true);
  ctx.fillStyle = second;
  ctx.beginPath();
  ctx.arc(dx, dy, dr, 0, TAU);
  ctx.fill();
  shadow(ctx, u, false);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(dx, dy, dr * .84, 0, TAU);
  ctx.fill();
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  fit(ctx, text.number, dr * 1.3, 400, dr * 1.05, DISPLAY);
  ctx.fillText(text.number, dx, dy + dr * .36);

  // Patch window above the number, autograph across the lower photo.
  if (info.patch) {
    const pw = u * 4.4;
    const ph = u * 3.2;
    swatch(ctx, team, area.x + area.w - pw - u * .55, plateY - ph - u * 2.1, pw, ph, u, words.patch, text.number);
  }
  if (info.auto) {
    const ink2 = tier.id === 'black' ? '#f2cf6b' : tier.id === 'gold' ? '#ffffff' : '#1e4fd8';
    autograph(ctx, text.name, area.x + u * 1.2, plateY - u * 1.2, area.w * (info.patch ? .5 : .66), u, ink2);
  }

  // Serial stamp, bottom left above the nameplate, foil on the numbered pulls.
  if (tier.run) {
    const stamp = tier.run === 1 ? `${info.serial} · ${words.oneOfOne}` : info.serial;
    font(ctx, 400, u * 1.05, DISPLAY, u * .06, stamp);
    const sw = measure(ctx, stamp) + u * 1;
    const sy = info.auto ? plateY - u * 3.9 : plateY - u * 2;
    const sx = area.x + u * .4;
    ctx.fillStyle = tier.id === 'black' ? '#0b0b0b' : 'rgba(0,0,0,.72)';
    roundRect(ctx, sx, sy, sw, u * 1.4, u * .25);
    ctx.fill();
    const g = ctx.createLinearGradient(sx, sy, sx + sw, sy + u * 1.4);
    g.addColorStop(0, '#b8891f');
    g.addColorStop(.5, '#fff1b8');
    g.addColorStop(1, '#c99b2c');
    ctx.fillStyle = tier.id === 'team' ? '#ffffff' : g;
    ctx.textAlign = 'left';
    ctx.fillText(stamp, sx + u * .5, sy + u * 1.08);
  }
  ctx.textAlign = 'left';
}

function cardBack(ctx, team, text, L, info) {
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

  // Header in the team colour: card number, name, team and position, crest.
  const headH = u * 6.2;
  ctx.fillStyle = fill;
  ctx.fillRect(B.x, B.y, B.w, headH);
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
  const tierLine = `${words.parallel} · ${info.name}${info.auto ? ` · ${zh ? '签字' : 'AUTO'}` : ''}${info.patch ? ` · ${zh ? '球衣碎片' : 'PATCH'}` : ''}`;
  fit(ctx, tierLine, wIn * .68, 800, u * .42, SANS, u * .06);
  ctx.fillText(tierLine, x0, fy + u * 1.05);
  ctx.globalAlpha = .6;
  const fine = `© ${new Date().getFullYear()} HOT 主场相框 · ${info.insert} · ${text.season}${text.date ? ` · ${text.date}` : ''}`;
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

function card(ctx, team, text, L) {
  const {W, H} = L;
  const info = cardInfo(team, text.seed);
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
  cardBack(ctx, team, text, L, info);
  cardFront(ctx, team, text, L, info);
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
