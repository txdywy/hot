// Draws the three frame styles (jersey, ticket, patch) on a canvas, from the
// team's colours, its real names, its history (founding year, home, titles,
// retired numbers) and its emblem, plus the words typed in. A team's logo
// file is drawn too when one has been added (see logos in teams.js).
import {drawMotif, kit, trim, luminanceOf} from './art.js?v=3';

const TAU = Math.PI * 2;
const CJK = '"PingFang SC", "HarmonyOS Sans SC", "MiSans", "Microsoft YaHei", "Noto Sans CJK SC", "Source Han Sans SC"';
const SANS = `system-ui, -apple-system, "Segoe UI", Roboto, ${CJK}, sans-serif`;
// Anton and Graduate are shipped with the page (assets/fonts), so the big type looks
// the same on iPhone, Android, HarmonyOS and computers. Both come in one weight only.
const DISPLAY = `"HOT Display", "Arial Black", Impact, ${CJK}, sans-serif`;
const VARSITY = `"HOT Varsity", Rockwell, Georgia, ${CJK}, serif`;
const PAPER = '#f4eee2';
const TABLE = '#141414';

export const fontFaces = ['400 20px "HOT Display"', '400 20px "HOT Varsity"'];

export const luminance = luminanceOf;

const readable = colour => luminance(colour) > .45 ? '#111111' : '#ffffff';
// The team colour that reads best on light paper.
const onPaper = team => luminance(team.c1) > .6 ? team.c2 : team.c1;
// The team colour to use as a solid field: the main one unless it is almost white.
const solid = team => luminance(team.c1) > .75 ? team.c2 : team.c1;

// "17× NBA CHAMPIONS", or the team's own line when it has no title count.
export function titleLine(team) {
  if (!team.titles) return '';
  return team.titles.n ? `${team.titles.n}× ${team.titles.label}` : team.titles.label;
}

function font(ctx, weight, size, family, spacing = 0) {
  ctx.font = `${weight} ${Math.max(1, Math.round(size))}px ${family}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.round(spacing)}px`;
}

// Shrinks the font until the text fits in maxWidth; returns the size used.
function fit(ctx, text, maxWidth, weight, size, family, spacing = 0) {
  font(ctx, weight, size, family, spacing);
  const width = ctx.measureText(text).width;
  if (width > maxWidth && width > 0) {
    const scale = maxWidth / width;
    size *= scale;
    font(ctx, weight, size, family, spacing * scale);
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
    const o = m * .45;
    const x = o + m * 1.25;
    const y = o + m * 1.55;
    return {m, o, W: x + pw + m + o, H: y + ph + m * 1.55 + m * 3.1 + o, area: {x, y, w: pw, h: ph}};
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

// The team's emblem in a round badge: the logo file when there is one, else the
// drawn motif. ring is the badge colour, ink the emblem colour.
function badge(ctx, team, logo, cx, cy, r, ring, ink, m) {
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.fill();
  if (logo) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, r * .9, 0, TAU);
    ctx.fill();
    drawLogo(ctx, logo, cx, cy, r * 1.4);
    return;
  }
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
  upText(ctx, `EST. ${team.est} · ${team.city}`, panel + gap / 2, area.y + area.h / 2, sideLength, 800, m * .24, SANS, m * .08, ink);
  upText(ctx, `HOME · ${team.home}`, W - panel - gap / 2, area.y + area.h / 2, sideLength, 800, m * .24, SANS, m * .08, ink);

  // Photo with a two-colour trim.
  const edge = team.c2 === team.c1 ? team.c3 : team.c2;
  ctx.fillStyle = team.c3;
  ctx.fillRect(area.x - m * .16, area.y - m * .16, area.w + m * .32, area.h + m * .32);
  ctx.fillStyle = edge;
  ctx.fillRect(area.x - m * .1, area.y - m * .1, area.w + m * .2, area.h + m * .2);
  text.drawPhoto(area);
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
    ctx.beginPath();
    ctx.arc(area.x + m * .55, topY, m * .58, 0, TAU);
    ctx.fill();
  }

  // Top corners: the emblem on the left, stars or the title count on the right.
  drawMotif(ctx, team.motif, area.x + m * .55, topY, m * .95, ink, team.c1, team.accent);
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

  const y0 = area.y + area.h;
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
function foil(ctx, team, cx, cy, r, m) {
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
  const small = team.titles && team.titles.n ? (team.titles.short || 'TITLES') : 'EST.';
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
  const {m, o, W, H, area} = L;
  const ink = onPaper(team);
  const strip = solid(team);
  const stripInk = readable(strip);
  ctx.fillStyle = TABLE;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  roundRect(ctx, o, o, W - o * 2, H - o * 2, m * .3);
  ctx.clip();
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = .1;
  guilloche(ctx, o, o, W, H, m, ink);
  ctx.globalAlpha = 1;
  // Colour strip down the left with the team written sideways, a thin trim beside it.
  ctx.fillStyle = strip;
  ctx.fillRect(o, o, m * 1.1, H);
  trim(ctx, team, o + m * 1.1, o, m * .14, H);
  ctx.restore();

  const stripX = o + m * .55;
  const perforation = area.y + area.h + m * 1.55;
  const discY = o + m * .78;
  const r = m * .46;
  if (text.logo) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(stripX, discY, r, 0, TAU);
    ctx.fill();
    drawLogo(ctx, text.logo, stripX, discY, r * 1.45);
  } else {
    drawMotif(ctx, team.motif, stripX, discY, r * 1.9, stripInk, strip, team.accent);
  }
  const stripTop = discY + r + m * .1;
  const name = team.name.toUpperCase();
  upText(ctx, name, stripX, (stripTop + perforation) / 2, perforation - stripTop - m * .6, 400, m * .64, DISPLAY, m * .14, stripInk);

  // Header: admit one and the season, the venue and the ticket number.
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = ink;
  ctx.textAlign = 'left';
  const admit = `ADMIT ONE · ${text.season}`;
  fit(ctx, admit, area.w * .6, 400, m * .44, DISPLAY, m * .05);
  ctx.fillText(admit, area.x, o + m * .78);
  ctx.globalAlpha = .75;
  const venue = `${team.home} · ${team.city}`;
  fit(ctx, venue, area.w * .62, 800, m * .2, SANS, m * .06);
  ctx.fillText(venue, area.x, o + m * 1.12);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'right';
  const serial = String(hash(team.id + text.number) % 1000000).padStart(6, '0');
  font(ctx, 800, m * .24, SANS, m * .06);
  ctx.fillText(`No. ${serial}`, area.x + area.w, o + m * .72);
  ctx.globalAlpha = .75;
  fit(ctx, `EST. ${team.est}`, area.w * .3, 800, m * .2, SANS, m * .06);
  ctx.fillText(`EST. ${team.est}`, area.x + area.w, o + m * 1.12);
  ctx.globalAlpha = 1;

  ctx.fillStyle = ink;
  ctx.fillRect(area.x - m * .06, area.y - m * .06, area.w + m * .12, area.h + m * .12);
  text.drawPhoto(area);

  // Rubber stamp on the photo's top-left corner, foil sticker on its bottom-right.
  stamp(ctx, 'HOME GAME', text.date || team.city, area.x + m * 1.05, area.y + m * 1.05, m * .82, m);
  foil(ctx, team, area.x + area.w - m * .62, area.y + area.h - m * .5, m * .78, m);

  // Event line under the photo, with nickname and titles.
  const below = area.y + area.h;
  ctx.textAlign = 'left';
  ctx.fillStyle = ink;
  fit(ctx, text.slogan, area.w - m * 1.9, 400, m * .64, DISPLAY, m * .02);
  ctx.fillText(text.slogan, area.x, below + m * .86);
  ctx.globalAlpha = .7;
  const tag = [team.nick.toUpperCase(), titleLine(team)].filter(Boolean).join(' · ');
  fit(ctx, tag, area.w - m * 1.9, 800, m * .21, SANS, m * .06);
  ctx.fillText(tag, area.x, below + m * 1.22);
  ctx.globalAlpha = 1;

  // Tear line with the two half-moon notches.
  ctx.strokeStyle = 'rgba(0,0,0,.35)';
  ctx.lineWidth = Math.max(1, m * .035);
  ctx.setLineDash([m * .12, m * .1]);
  ctx.beginPath();
  ctx.moveTo(o + m * .4, perforation);
  ctx.lineTo(W - o - m * .4, perforation);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = TABLE;
  for (const x of [o, W - o]) {
    ctx.beginPath();
    ctx.arc(x, perforation, m * .32, 0, TAU);
    ctx.fill();
  }

  // Stub: gate, section, row, seat, holder and date, with a barcode.
  const stubTop = perforation + m * .35;
  const left = area.x;
  const barWidth = Math.min(m * 2.4, area.w * .3);
  const fieldsWidth = area.w - barWidth - m * .5;
  const fields = [['GATE', team.gate || team.letter], ['SEC', team.sec || '101'], ['ROW', team.row || '12'], ['SEAT', text.number]];
  const step = fieldsWidth / fields.length;
  fields.forEach(([label, value], k) => {
    const x = left + step * k;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    font(ctx, 800, m * .2, SANS, m * .05);
    ctx.fillText(label, x, stubTop + m * .3);
    ctx.fillStyle = ink;
    fit(ctx, value, step - m * .2, 400, m * .66, DISPLAY);
    ctx.fillText(value, x, stubTop + m * .98);
  });
  ctx.fillStyle = 'rgba(0,0,0,.5)';
  font(ctx, 800, m * .2, SANS, m * .05);
  ctx.textAlign = 'left';
  ctx.fillText('HOLDER', left, stubTop + m * 1.45);
  ctx.fillText('DATE', left + fieldsWidth / 2, stubTop + m * 1.45);
  ctx.fillStyle = ink;
  fit(ctx, text.name, fieldsWidth / 2 - m * .2, 400, m * .52, DISPLAY, m * .04);
  ctx.fillText(text.name, left, stubTop + m * 2);
  const when = text.date || 'TONIGHT';
  fit(ctx, when, fieldsWidth / 2 - m * .1, 400, m * .52, DISPLAY, m * .02);
  ctx.fillText(when, left + fieldsWidth / 2, stubTop + m * 2);
  const legends = retiredLine(team);
  if (legends) {
    ctx.globalAlpha = .6;
    fit(ctx, legends, fieldsWidth, 800, m * .17, SANS, m * .06);
    ctx.fillText(legends, left, stubTop + m * 2.42);
    ctx.globalAlpha = 1;
  }

  const bx = area.x + area.w - barWidth;
  const by = stubTop + m * .1;
  const bh = m * 1.75;
  let seed = hash(team.id + text.name + text.number);
  ctx.fillStyle = '#1b1b1b';
  for (let x = bx; x < bx + barWidth;) {
    seed = Math.imul(seed ^ (seed >>> 13), 1274126177) >>> 0;
    const w = m * (.025 + (seed % 4) * .022);
    if (x + w > bx + barWidth) break;
    ctx.fillRect(x, by, w, bh);
    x += w + m * (.03 + ((seed >>> 4) % 3) * .02);
  }
  ctx.textAlign = 'center';
  font(ctx, 700, m * .2, SANS, m * .08);
  ctx.fillText(serial, bx + barWidth / 2, by + bh + m * .32);
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
  wool(ctx, felt, W, H, m);
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
  const pennant = `EST. ${team.est}`;
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
  font(ctx, 900, m * .2, SANS, m * .06);
  ctx.fillText('HELLO · 我是', 0, -m * .34);
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
  ctx.fillText('NO.', cx, cy - r * .3);
  fit(ctx, text.number, r * 1.15, 400, m * .9, DISPLAY);
  ctx.fillText(text.number, cx, cy + r * .5);

  // Top left: the team's emblem as an embroidered patch.
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
  badge(ctx, team, text.logo, 0, 0, m * .86, felt, emblemInk, m);
  ctx.restore();

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
    fit(ctx, team.titles.short || 'TITLES', sw * .8, 900, m * .16, SANS, m * .03);
    ctx.fillText(team.titles.short || 'TITLES', 0, sw * .38);
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
  font(ctx, 400, m * 2.3, VARSITY);
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
  const line1 = `${team.nick.toUpperCase()} · ${text.date || team.city}`;
  fit(ctx, line1, textWidth, 800, m * .28, SANS, m * .08);
  ctx.globalAlpha = .88;
  ctx.fillText(line1, textLeft, y0 + m * 1.84);
  fit(ctx, team.home, textWidth, 800, m * .22, SANS, m * .08);
  ctx.globalAlpha = .7;
  ctx.fillText(team.home, textLeft, y0 + m * 2.24);
  ctx.globalAlpha = 1;
}

const painters = {jersey, ticket, patch};

// The season printed on the ticket: "2026-27 SEASON" for winter leagues,
// "2026 SEASON" for the Chinese league and college football.
export function seasonText(team, now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (team.season === 'year') return `${year} SEASON`;
  const start = month >= 8 ? year : year - 1;
  return `${start}-${String(start + 1).slice(2)} SEASON`;
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
