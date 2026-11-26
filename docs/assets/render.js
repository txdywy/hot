// Draws the three frame styles (jersey, ticket, patch) on a canvas.
// Everything is drawn from colours, numbers and text: no logo images.
const TAU = Math.PI * 2;
const SANS = 'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
const BLOCK = '"Arial Black", "Helvetica Neue", Impact, system-ui, -apple-system, sans-serif';
const SLAB = 'Rockwell, "Roboto Slab", Georgia, "Times New Roman", serif';
const PAPER = '#f4eee2';
const TABLE = '#141414';

export function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map(v => {
    v /= 255;
    return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
  });
  return .2126 * r + .7152 * g + .0722 * b;
}

// The team colour that reads best on light paper.
function onPaper(team) {
  return luminance(team.c1) > .6 ? team.c2 : team.c1;
}

function font(ctx, weight, size, family, spacing = 0) {
  ctx.font = `${weight} ${Math.max(1, Math.round(size))}px ${family}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.round(spacing)}px`;
}

// Shrinks the font until the text fits in maxWidth; returns the size used.
function fit(ctx, text, maxWidth, weight, size, family, spacing = 0) {
  font(ctx, weight, size, family, spacing);
  const width = ctx.measureText(text).width;
  if (width > maxWidth) {
    size *= maxWidth / width;
    font(ctx, weight, size, family, spacing * maxWidth / width);
  }
  return size;
}

function roundRect(ctx, x, y, w, h, r) {
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

// Where the photo goes, for a photo of pw × ph, and the size of the whole picture.
function box(style, pw, ph) {
  const m = Math.min(pw, ph) * .075;
  if (style === 'ticket') {
    const o = m * .45;
    const x = o + m * 1.25;
    const y = o + m;
    return {m, o, W: x + pw + m + o, H: y + ph + m * .95 + m * 2.9 + o, area: {x, y, w: pw, h: ph}};
  }
  if (style === 'patch') {
    const s = m * 1.3;
    return {m, W: pw + s * 2, H: ph + s + m * 2.7, area: {x: s, y: s, w: pw, h: ph}};
  }
  return {m, W: pw + m * 2, H: ph + m * 3.9, area: {x: m, y: m, w: pw, h: ph}};
}

// Picks the photo size so the whole picture's long edge is at most `limit`.
export function layout(style, imageWidth, imageHeight, limit) {
  const unit = box(style, imageWidth, imageHeight);
  const scale = limit / Math.max(unit.W, unit.H);
  const result = box(style, imageWidth * scale, imageHeight * scale);
  result.W = Math.round(result.W);
  result.H = Math.round(result.H);
  return result;
}

function meshPattern(ctx, m, dark) {
  const size = Math.max(4, Math.round(m * .09));
  const tile = document.createElement('canvas');
  tile.width = tile.height = size;
  const t = tile.getContext('2d');
  t.fillStyle = dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.09)';
  t.beginPath();
  t.arc(size / 2, size / 2, size * .22, 0, TAU);
  t.fill();
  return ctx.createPattern(tile, 'repeat');
}

function jersey(ctx, team, text, L) {
  const {m, W, H, area} = L;
  const dark = luminance(team.c1) < .3;
  ctx.fillStyle = team.c1;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = meshPattern(ctx, m, dark);
  ctx.fillRect(0, 0, W, H);

  // Side trims, like the piping down a jersey.
  for (const side of [0, 1]) {
    const x = side ? W - m * .32 : m * .18;
    ctx.fillStyle = team.c2;
    ctx.fillRect(x, 0, m * .14, H);
    ctx.fillStyle = team.c3;
    ctx.fillRect(side ? x - m * .1 : x + m * .2, 0, m * .05, H);
  }

  // Photo with a thin trim.
  ctx.fillStyle = team.c2;
  ctx.fillRect(area.x - m * .1, area.y - m * .1, area.w + m * .2, area.h + m * .2);
  text.drawPhoto(area);

  // V-neck collar sitting over the top edge.
  ctx.lineJoin = 'miter';
  ctx.strokeStyle = team.c2;
  ctx.lineWidth = m * .26;
  ctx.beginPath();
  ctx.moveTo(W / 2 - m * 1.3, -m * .2);
  ctx.lineTo(W / 2, m * .9);
  ctx.lineTo(W / 2 + m * 1.3, -m * .2);
  ctx.stroke();
  ctx.strokeStyle = team.c3;
  ctx.lineWidth = m * .06;
  ctx.stroke();

  const y0 = area.y + area.h;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  // Name across the shoulders, number underneath.
  ctx.fillStyle = team.ink;
  fit(ctx, text.name, W * .56, 900, m * .58, BLOCK, m * .14);
  ctx.fillText(text.name, W / 2, y0 + m * .88);

  const outline = team.ink === team.c2 ? team.c3 : team.c2;
  fit(ctx, text.number, W * .4, 900, m * 1.75, BLOCK, m * .02);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = outline;
  ctx.lineWidth = m * .2;
  ctx.strokeText(text.number, W / 2, y0 + m * 2.7);
  ctx.fillStyle = team.ink;
  ctx.fillText(text.number, W / 2, y0 + m * 2.7);
  const numberHalf = ctx.measureText(text.number).width / 2 + m * .35;

  // City on the left, slogan or date on the right.
  const side = W / 2 - numberHalf - m * .7;
  ctx.textAlign = 'left';
  ctx.fillStyle = team.ink;
  fit(ctx, team.city, side, 900, m * .46, SANS);
  ctx.fillText(team.city, m * .7, y0 + m * 1.85);
  ctx.globalAlpha = .8;
  fit(ctx, team.en, side, 800, m * .24, SANS, m * .06);
  ctx.fillText(team.en, m * .7, y0 + m * 2.3);
  ctx.globalAlpha = 1;

  ctx.textAlign = 'right';
  const right = W - m * .7;
  if (text.date) {
    fit(ctx, text.date, side, 900, m * .3, SANS, m * .03);
    ctx.fillText(text.date, right, y0 + m * 1.6);
  }
  fit(ctx, text.slogan, side, 900, m * .36, SANS);
  ctx.fillText(text.slogan, right, y0 + m * (text.date ? 2.15 : 1.95));
}

function ticket(ctx, team, text, L) {
  const {m, o, W, H, area} = L;
  const ink = onPaper(team);
  ctx.fillStyle = TABLE;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  roundRect(ctx, o, o, W - o * 2, H - o * 2, m * .3);
  ctx.clip();
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  // Faint guilloche lines, like the background print on a real ticket.
  ctx.strokeStyle = 'rgba(0,0,0,.035)';
  ctx.lineWidth = Math.max(1, m * .02);
  for (let x = -H; x < W; x += m * .22) {
    ctx.beginPath();
    ctx.moveTo(x, H);
    ctx.lineTo(x + H, 0);
    ctx.stroke();
  }
  // Colour strip down the left with the city written sideways.
  ctx.fillStyle = team.c1 === '#f6f6f2' ? team.c2 : team.c1;
  ctx.fillRect(o, o, m * 1.25 - m * .15, H);
  ctx.restore();

  const stripX = o + (m * 1.1) / 2;
  const perforation = area.y + area.h + m * .95;
  ctx.save();
  ctx.translate(stripX, (o + perforation) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = team.c1 === '#f6f6f2' ? '#ffffff' : team.ink;
  fit(ctx, team.en, perforation - o - m, 900, m * .52, BLOCK, m * .16);
  ctx.fillText(team.en, 0, 0);
  ctx.restore();

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = ink;
  ctx.textAlign = 'left';
  font(ctx, 800, m * .26, SANS, m * .06);
  ctx.fillText('GAME DAY · 比赛日', area.x, o + m * .68);
  ctx.textAlign = 'right';
  const serial = String(hash(team.id + text.number) % 1000000).padStart(6, '0');
  ctx.fillText(`No. ${serial}`, area.x + area.w, o + m * .68);

  ctx.fillStyle = ink;
  ctx.fillRect(area.x - m * .05, area.y - m * .05, area.w + m * .1, area.h + m * .1);
  text.drawPhoto(area);

  // Event line under the photo.
  ctx.fillStyle = ink;
  ctx.textAlign = 'left';
  fit(ctx, text.slogan, area.w * .68, 900, m * .5, SANS);
  ctx.fillText(text.slogan, area.x, area.y + area.h + m * .72);
  ctx.textAlign = 'right';
  const tag = `${team.city} · ${team.colour}`;
  fit(ctx, tag, area.w * .3, 700, m * .26, SANS);
  ctx.globalAlpha = .7;
  ctx.fillText(tag, area.x + area.w, area.y + area.h + m * .7);
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
  const fields = [['GATE', 'H'], ['SEC', '101'], ['ROW', '12'], ['SEAT', text.number]];
  const step = fieldsWidth / fields.length;
  fields.forEach(([label, value], i) => {
    const x = left + step * i;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    font(ctx, 800, m * .2, SANS, m * .05);
    ctx.fillText(label, x, stubTop + m * .3);
    ctx.fillStyle = ink;
    fit(ctx, value, step - m * .2, 900, m * .62, BLOCK);
    ctx.fillText(value, x, stubTop + m * .95);
  });
  ctx.fillStyle = 'rgba(0,0,0,.5)';
  font(ctx, 800, m * .2, SANS, m * .05);
  ctx.textAlign = 'left';
  ctx.fillText('HOLDER', left, stubTop + m * 1.45);
  ctx.fillText('DATE', left + fieldsWidth / 2, stubTop + m * 1.45);
  ctx.fillStyle = ink;
  fit(ctx, text.name, fieldsWidth / 2 - m * .2, 900, m * .46, BLOCK, m * .04);
  ctx.fillText(text.name, left, stubTop + m * 1.98);
  const when = text.date || '今夜 TONIGHT';
  fit(ctx, when, fieldsWidth / 2 - m * .1, 900, m * .46, SANS);
  ctx.fillText(when, left + fieldsWidth / 2, stubTop + m * 1.98);

  const bx = area.x + area.w - barWidth;
  const by = stubTop + m * .1;
  const bh = m * 1.6;
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

function starburst(ctx, x, y, r, points, fill) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = i * Math.PI / points - Math.PI / 2;
    const rr = i % 2 ? r * .74 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function shadow(ctx, m, on) {
  ctx.shadowColor = on ? 'rgba(0,0,0,.45)' : 'transparent';
  ctx.shadowBlur = on ? m * .18 : 0;
  ctx.shadowOffsetY = on ? m * .06 : 0;
}

function patch(ctx, team, text, L) {
  const {m, W, H, area} = L;
  const felt = luminance(team.c1) < .04 ? team.c2 : team.c1;
  const trim = luminance(team.c2) < .04 || team.c2 === felt ? team.c3 : team.c2;
  ctx.fillStyle = '#151515';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,.04)';
  ctx.lineWidth = m * .14;
  for (let x = -H; x < W; x += m * .42) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + H, H);
    ctx.stroke();
  }
  // Checkerboard band along the top.
  const sq = m * .34;
  for (let i = 0, x = 0; x < W; i++, x += sq) {
    for (let row = 0; row < 2; row++) {
      ctx.fillStyle = (i + row) % 2 ? felt : '#f3ead7';
      ctx.fillRect(x, row * sq, sq, sq);
    }
  }

  // Photo stuck on like a print, white edge and soft shadow.
  shadow(ctx, m, true);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(area.x - m * .16, area.y - m * .16, area.w + m * .32, area.h + m * .32);
  shadow(ctx, m, false);
  text.drawPhoto(area);

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
  ctx.fillStyle = luminance(felt) > .6 ? '#111111' : '#ffffff';
  font(ctx, 900, m * .2, SANS, m * .06);
  ctx.fillText('HELLO · 我是', 0, -m * .34);
  ctx.fillStyle = '#111111';
  fit(ctx, text.name, tagW - m * .3, 900, m * .52, BLOCK);
  ctx.fillText(text.name, 0, m * .42);
  ctx.restore();

  // Round embroidered number patch, top right.
  const r = m * .98;
  const cx = W - m * 1.15;
  const cy = m * 1.25;
  shadow(ctx, m, true);
  ctx.fillStyle = trim;
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
  ctx.fillStyle = luminance(felt) > .45 ? '#111111' : '#ffffff';
  font(ctx, 900, m * .17, SANS, m * .06);
  ctx.fillText('NO.', cx, cy - r * .32);
  fit(ctx, text.number, r * 1.2, 900, m * .82, BLOCK);
  ctx.fillText(text.number, cx, cy + r * .42);

  // Starburst sticker, top left.
  ctx.save();
  ctx.translate(m * 1.1, m * 1.2);
  ctx.rotate(-.2);
  shadow(ctx, m, true);
  starburst(ctx, 0, 0, m * .92, 12, '#ffe14d');
  shadow(ctx, m, false);
  ctx.fillStyle = '#111111';
  ctx.textAlign = 'center';
  font(ctx, 900, m * .42, BLOCK);
  ctx.fillText('HOT', 0, m * .15);
  ctx.restore();

  // Slogan sticker over the photo's bottom-right corner.
  ctx.save();
  fit(ctx, text.slogan, Math.min(area.w * .55, m * 6), 900, m * .4, SANS);
  const sw = ctx.measureText(text.slogan).width + m * .6;
  ctx.translate(area.x + area.w - sw / 2 + m * .2, area.y + area.h - m * .1);
  ctx.rotate(.06);
  shadow(ctx, m, true);
  roundRect(ctx, -sw / 2, -m * .4, sw, m * .8, m * .4);
  ctx.fillStyle = trim;
  ctx.fill();
  shadow(ctx, m, false);
  ctx.fillStyle = luminance(trim) > .45 ? '#111111' : '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.slogan, 0, m * .02);
  ctx.restore();
  ctx.textBaseline = 'alphabetic';

  // Chenille varsity letter, bottom left.
  const letter = team.en.replace(/^THE /, '')[0];
  font(ctx, 900, m * 2.3, SLAB);
  const letterWidth = ctx.measureText(letter).width;
  const letterX = m * .75 + letterWidth / 2;
  ctx.save();
  ctx.translate(letterX, H - m * .7);
  ctx.rotate(-.12);
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  shadow(ctx, m, true);
  ctx.strokeStyle = '#f3ead7';
  ctx.lineWidth = m * .62;
  ctx.strokeText(letter, 0, 0);
  shadow(ctx, m, false);
  ctx.strokeStyle = trim;
  ctx.lineWidth = m * .32;
  ctx.strokeText(letter, 0, 0);
  ctx.fillStyle = felt;
  ctx.fillText(letter, 0, 0);
  ctx.restore();

  // City across the bottom.
  const y0 = area.y + area.h + m * .16;
  const textLeft = letterX + letterWidth / 2 + m * .55;
  const textWidth = W - textLeft - m * .6;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  fit(ctx, team.city, textWidth, 900, m * .82, SANS);
  ctx.fillText(team.city, textLeft, y0 + m * 1.32);
  ctx.strokeStyle = felt === '#f6f6f2' ? team.c2 : felt;
  ctx.lineWidth = Math.max(1, m * .035);
  const line = text.date ? `${team.en} · ${text.date}` : `${team.en} · ${team.colour}`;
  fit(ctx, line, textWidth, 900, m * .36, BLOCK, m * .08);
  ctx.fillStyle = luminance(felt) < .5 ? '#ffffff' : felt;
  ctx.globalAlpha = .85;
  ctx.fillText(line, textLeft, y0 + m * 1.95);
  ctx.globalAlpha = 1;
}

const painters = {jersey, ticket, patch};

// Fills `area` with the image (already cropped to the same ratio).
export function paint(canvas, image, team, style, text, L) {
  canvas.width = L.W;
  canvas.height = L.H;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  const words = {
    ...text,
    drawPhoto(area) {
      ctx.drawImage(image, area.x, area.y, area.w, area.h);
    },
  };
  painters[style](ctx, team, words, L);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
}

// A stand-in photo (night game, lights on) until the user picks their own.
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
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.arc(width * x + (i % 3 - 1) * 26, height * y + (Math.floor(i / 3) - 1) * 22, 8, 0, TAU);
      ctx.fill();
    }
  }
  // Crowd as rows of soft dots.
  let seed = 7;
  for (let row = 0; row < 14; row++) {
    for (let i = 0; i < 46; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      ctx.fillStyle = `hsla(${seed % 360}, 45%, ${30 + seed % 25}%, .55)`;
      ctx.beginPath();
      ctx.arc(i * width / 45 + (row % 2) * 12, height * .42 + row * 18, 7, 0, TAU);
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
