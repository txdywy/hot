// The foil finishes of the trading card, drawn from code, after the real parallels
// collectors chase: Prizm rays, Refractor rainbow, Hyper stripes, Mojo swirl,
// Shimmer streaks, Cracked Ice shards, Disco dots, Wave lines, X-Fractor squares,
// Snakeskin scales, Tiger stripes, Atomic speckle, Scope rings, Camo, Lava, the
// Superfractor's gold spiral and the grooves of Gold Vinyl. Each painter fills a
// rectangle with its pattern in a palette {a: main, b: dark, c: light}; the caller
// clips and picks the blending. Painted foils are kept in a small cache, so typing
// a name does not repaint thousands of shards on a slow phone.

const TAU = Math.PI * 2;

// A small seeded random generator (mulberry32): the same seed gives the same card.
export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RAINBOW = ['#ff4d6d', '#ffb84d', '#fff04d', '#4dff88', '#4dc3ff', '#9b6bff', '#ff4dd2'];

// Mixes two #rrggbb colours, t from 0 (a) to 1 (b).
export function mix(a, b, t) {
  const x = parseInt(a.slice(1), 16);
  const y = parseInt(b.slice(1), 16);
  const ch = shift => Math.round(((x >> shift) & 255) * (1 - t) + ((y >> shift) & 255) * t);
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
}

function rays(ctx, x, y, w, h, rand, p, count, cx, cy) {
  const reach = (w + h) * 2;
  for (let k = 0; k < count; k++) {
    const a0 = k / count * TAU;
    const a1 = a0 + TAU / count * (.35 + rand() * .3);
    ctx.fillStyle = k % 2 ? p.c : p.b;
    ctx.globalAlpha = k % 2 ? .55 : .35;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a0) * reach, cy + Math.sin(a0) * reach);
    ctx.lineTo(cx + Math.cos(a1) * reach, cy + Math.sin(a1) * reach);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Cuts a polygon in two along the line through (px, py) at angle a.
function split(poly, px, py, a) {
  const nx = -Math.sin(a);
  const ny = Math.cos(a);
  const side = q => (q[0] - px) * nx + (q[1] - py) * ny;
  const left = [];
  const right = [];
  for (let k = 0; k < poly.length; k++) {
    const p = poly[k];
    const q = poly[(k + 1) % poly.length];
    const sp = side(p);
    const sq = side(q);
    (sp >= 0 ? left : right).push(p);
    if ((sp >= 0) !== (sq >= 0)) {
      const t = sp / (sp - sq);
      const cut = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
      left.push(cut);
      right.push(cut);
    }
  }
  return [left, right].filter(part => part.length > 2);
}

function area(poly) {
  let s = 0;
  for (let k = 0; k < poly.length; k++) {
    const p = poly[k];
    const q = poly[(k + 1) % poly.length];
    s += p[0] * q[1] - q[0] * p[1];
  }
  return Math.abs(s / 2);
}

// Shatters a rectangle into `count` shards, the biggest cut first.
export function shards(x, y, w, h, rand, count) {
  let pieces = [[[x, y], [x + w, y], [x + w, y + h], [x, y + h]]];
  while (pieces.length < count) {
    let big = 0;
    pieces.forEach((poly, k) => {
      if (area(poly) > area(pieces[big])) big = k;
    });
    const poly = pieces[big];
    let cx = 0;
    let cy = 0;
    poly.forEach(q => {
      cx += q[0];
      cy += q[1];
    });
    cx /= poly.length;
    cy /= poly.length;
    const parts = split(poly, cx + (rand() - .5) * w * .08, cy + (rand() - .5) * h * .08, rand() * Math.PI);
    if (parts.length < 2) break;
    pieces.splice(big, 1, parts[0], parts[1]);
  }
  return pieces;
}

function path(ctx, poly) {
  ctx.beginPath();
  poly.forEach((q, k) => (k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
  ctx.closePath();
}

const painters = {
  prizm(ctx, x, y, w, h, rand, p) {
    ctx.fillStyle = p.a;
    ctx.fillRect(x, y, w, h);
    rays(ctx, x, y, w, h, rand, p, 64, x + w * (.3 + rand() * .4), y + h * 1.1);
  },
  refractor(ctx, x, y, w, h, rand, p) {
    ctx.fillStyle = p.a;
    ctx.fillRect(x, y, w, h);
    const g = ctx.createLinearGradient(x, y + h, x + w, y);
    RAINBOW.concat(RAINBOW).forEach((c, k, all) => g.addColorStop(k / (all.length - 1), c));
    ctx.globalAlpha = .45;
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;
    rays(ctx, x, y, w, h, rand, {b: p.a, c: '#ffffff'}, 90, x + w / 2, y + h / 2);
  },
  hyper(ctx, x, y, w, h, rand, p) {
    ctx.fillStyle = p.b;
    ctx.fillRect(x, y, w, h);
    const step = Math.max(w, h) / 26;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(-.55);
    const reach = w + h;
    for (let k = -reach; k < reach; k += step) {
      ctx.fillStyle = p.a;
      ctx.fillRect(k, -reach, step * .55, reach * 2);
      ctx.fillStyle = p.c;
      ctx.globalAlpha = .8;
      ctx.fillRect(k + step * .55, -reach, step * .12, reach * 2);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  },
  mojo(ctx, x, y, w, h, rand, p) {
    ctx.fillStyle = p.a;
    ctx.fillRect(x, y, w, h);
    const cx = x + w * (.35 + rand() * .3);
    const cy = y + h * (.35 + rand() * .3);
    const reach = (w + h) * 1.2;
    const n = 48;
    for (let k = 0; k < n; k++) {
      const a = k / n * TAU;
      const bend = .9;
      ctx.fillStyle = k % 2 ? p.c : p.b;
      ctx.globalAlpha = k % 2 ? .6 : .45;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(cx + Math.cos(a + bend) * reach * .4, cy + Math.sin(a + bend) * reach * .4,
        cx + Math.cos(a) * reach, cy + Math.sin(a) * reach);
      ctx.lineTo(cx + Math.cos(a + TAU / n * .6) * reach, cy + Math.sin(a + TAU / n * .6) * reach);
      ctx.quadraticCurveTo(cx + Math.cos(a + bend + TAU / n * .6) * reach * .4, cy + Math.sin(a + bend + TAU / n * .6) * reach * .4, cx, cy);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
  shimmer(ctx, x, y, w, h, rand, p) {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, p.b);
    g.addColorStop(.5, p.a);
    g.addColorStop(1, p.b);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    const lines = Math.round(h / Math.max(1, h / 220));
    for (let k = 0; k < lines * 2; k++) {
      const ly = y + rand() * h;
      const len = w * (.08 + rand() * .45);
      ctx.globalAlpha = .25 + rand() * .55;
      ctx.fillStyle = rand() < .7 ? p.c : '#ffffff';
      ctx.fillRect(x + rand() * w - len / 2, ly, len, Math.max(1, h / 400));
    }
    ctx.globalAlpha = 1;
  },
  ice(ctx, x, y, w, h, rand, p) {
    shards(x, y, w, h, rand, 70).forEach(poly => {
      const t = rand();
      const g = ctx.createLinearGradient(poly[0][0], poly[0][1], poly[poly.length >> 1][0], poly[poly.length >> 1][1]);
      g.addColorStop(0, t < .33 ? p.c : p.a);
      g.addColorStop(1, t > .66 ? p.b : mix(p.a, '#ffffff', .35));
      ctx.fillStyle = g;
      path(ctx, poly);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.75)';
      ctx.lineWidth = Math.max(1, w / 500);
      ctx.stroke();
    });
  },
  disco(ctx, x, y, w, h, rand, p) {
    ctx.fillStyle = p.b;
    ctx.fillRect(x, y, w, h);
    const r = Math.max(w, h) / 34;
    let row = 0;
    for (let py = y; py < y + h + r; py += r * 1.75, row++) {
      for (let px = x + (row % 2) * r; px < x + w + r; px += r * 2) {
        const s = r * (.45 + rand() * .45);
        const g = ctx.createRadialGradient(px - s * .3, py - s * .3, 0, px, py, s);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(.35, rand() < .5 ? p.c : p.a);
        g.addColorStop(1, p.a);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, s, 0, TAU);
        ctx.fill();
      }
    }
  },
  wave(ctx, x, y, w, h, rand, p) {
    ctx.fillStyle = p.a;
    ctx.fillRect(x, y, w, h);
    const step = h / 40;
    const amp = h / 30;
    const len = w / (1.2 + rand());
    ctx.lineWidth = step * .5;
    for (let k = -2; k < 44; k++) {
      ctx.strokeStyle = k % 2 ? p.c : p.b;
      ctx.globalAlpha = k % 2 ? .75 : .5;
      ctx.beginPath();
      for (let px = x; px <= x + w + 8; px += w / 60) {
        const py = y + k * step + Math.sin((px - x) / len * TAU + k * .2) * amp;
        if (px === x) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },
  xfractor(ctx, x, y, w, h, rand, p) {
    const s = Math.max(w, h) / 22;
    for (let py = y, row = 0; py < y + h; py += s, row++) {
      for (let px = x, col = 0; px < x + w; px += s, col++) {
        const flip = (row + col) % 2;
        const g = flip ? ctx.createLinearGradient(px, py, px + s, py + s) : ctx.createLinearGradient(px + s, py, px, py + s);
        g.addColorStop(0, flip ? p.c : p.b);
        g.addColorStop(.5, p.a);
        g.addColorStop(1, flip ? p.b : '#ffffff');
        ctx.fillStyle = g;
        ctx.fillRect(px, py, s + 1, s + 1);
      }
    }
  },
  snake(ctx, x, y, w, h, rand, p) {
    ctx.fillStyle = p.b;
    ctx.fillRect(x, y, w, h);
    const r = Math.max(w, h) / 26;
    for (let py = y - r, row = 0; py < y + h + r; py += r * .7, row++) {
      for (let px = x - r + (row % 2) * r; px < x + w + r; px += r * 2) {
        const g = ctx.createLinearGradient(px, py - r, px, py + r);
        g.addColorStop(0, p.c);
        g.addColorStop(.6, p.a);
        g.addColorStop(1, p.b);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.35)';
        ctx.lineWidth = Math.max(1, r * .06);
        ctx.stroke();
      }
    }
  },
  tiger(ctx, x, y, w, h, rand, p) {
    ctx.fillStyle = p.a;
    ctx.fillRect(x, y, w, h);
    const n = 16;
    for (let k = 0; k < n; k++) {
      const y0 = y + (k + rand() * .6) / n * h * 1.2 - h * .1;
      const thick = h / n * (.25 + rand() * .3);
      ctx.fillStyle = k % 3 ? p.b : '#111111';
      ctx.globalAlpha = .85;
      ctx.beginPath();
      const fromLeft = k % 2;
      const sx = fromLeft ? x - w * .05 : x + w * 1.05;
      const ex = fromLeft ? x + w * (.45 + rand() * .45) : x + w * (.55 - rand() * .45);
      ctx.moveTo(sx, y0 - thick);
      ctx.bezierCurveTo(sx + (ex - sx) * .3, y0 - thick * 1.6, sx + (ex - sx) * .7, y0 + thick, ex, y0 + thick * .2);
      ctx.bezierCurveTo(sx + (ex - sx) * .7, y0 + thick * 1.4, sx + (ex - sx) * .3, y0 + thick * .6, sx, y0 + thick);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
  atomic(ctx, x, y, w, h, rand, p) {
    ctx.fillStyle = p.a;
    ctx.fillRect(x, y, w, h);
    const n = Math.round(w * h / Math.pow(Math.max(w, h) / 70, 2));
    for (let k = 0; k < Math.min(n, 2600); k++) {
      const r = Math.max(w, h) / 700 * (1 + rand() * rand() * 7);
      ctx.globalAlpha = .4 + rand() * .6;
      ctx.fillStyle = rand() < .5 ? p.c : rand() < .5 ? '#ffffff' : p.b;
      ctx.beginPath();
      ctx.arc(x + rand() * w, y + rand() * h, r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
  scope(ctx, x, y, w, h, rand, p) {
    ctx.fillStyle = p.a;
    ctx.fillRect(x, y, w, h);
    const cx = x + w * (.3 + rand() * .4);
    const cy = y + h * (.3 + rand() * .4);
    const step = Math.max(w, h) / 40;
    ctx.lineWidth = step * .45;
    for (let r = step; r < (w + h); r += step) {
      ctx.strokeStyle = (r / step) % 2 < 1 ? p.c : p.b;
      ctx.globalAlpha = .6;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },
  camo(ctx, x, y, w, h, rand, p) {
    ctx.fillStyle = p.a;
    ctx.fillRect(x, y, w, h);
    const shades = [p.b, p.c, mix(p.a, p.b, .5), mix(p.a, '#000000', .55)];
    const size = Math.max(w, h) / 8;
    for (let k = 0; k < 70; k++) {
      ctx.fillStyle = shades[k % shades.length];
      ctx.beginPath();
      const cx = x + rand() * w;
      const cy = y + rand() * h;
      const pts = 7;
      for (let n = 0; n <= pts; n++) {
        const a = n / pts * TAU;
        const r = size * (.35 + rand() * .45);
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r * .7;
        if (n) ctx.quadraticCurveTo(cx + Math.cos(a - .4) * r * 1.2, cy + Math.sin(a - .4) * r * .9, px, py);
        else ctx.moveTo(px, py);
      }
      ctx.fill();
    }
  },
  lava(ctx, x, y, w, h, rand, p) {
    ctx.fillStyle = p.b;
    ctx.fillRect(x, y, w, h);
    for (let k = 0; k < 26; k++) {
      const cx = x + rand() * w;
      const cy = y + rand() * h;
      const r = Math.max(w, h) * (.08 + rand() * .18);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, k % 3 ? p.c : '#ffffff');
      g.addColorStop(.45, p.a);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = .75;
      ctx.fillStyle = g;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
  },
  // The 1/1: a gold whirl over the whole card.
  super(ctx, x, y, w, h, rand, p) {
    ctx.fillStyle = '#8f6a14';
    ctx.fillRect(x, y, w, h);
    const cx = x + w / 2;
    const cy = y + h / 2;
    const reach = Math.hypot(w, h) * .75;
    const rings = 40;
    for (let ring = rings; ring > 0; ring--) {
      const r = reach * ring / rings;
      const turn = ring * .22;
      for (let k = 0; k < 18; k++) {
        const a = k / 18 * TAU + turn;
        ctx.fillStyle = k % 2 ? '#fff1b8' : (ring % 2 ? '#d4a73a' : '#b8891f');
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, a, a + TAU / 18);
        ctx.closePath();
        ctx.fill();
      }
    }
  },
  // Gold Vinyl: a record's grooves in black over gold.
  vinyl(ctx, x, y, w, h, rand, p) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    ['#7a5a12', '#f7d774', '#b8891f', '#fff1b8', '#8f6a14'].forEach((c, k) => g.addColorStop(k / 4, c));
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    const cx = x + w / 2;
    const cy = y + h * .62;
    ctx.fillStyle = '#0b0b0b';
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(w, h) * .62, 0, TAU);
    ctx.fill();
    ctx.lineWidth = Math.max(1, w / 400);
    for (let r = w * .04; r < Math.max(w, h) * .62; r += w / 120) {
      ctx.strokeStyle = `rgba(255,255,255,${.04 + rand() * .07})`;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.stroke();
    }
    const shine = ctx.createLinearGradient(cx - w, cy, cx + w, cy);
    shine.addColorStop(.38, 'rgba(255,241,184,0)');
    shine.addColorStop(.5, 'rgba(255,241,184,.35)');
    shine.addColorStop(.62, 'rgba(255,241,184,0)');
    ctx.fillStyle = shine;
    ctx.fillRect(x, y, w, h);
  },
};

export const patterns = Object.keys(painters);

const cache = [];

// The finish `kind` for a w × h rectangle, as a canvas, painted once per seed.
export function foilCanvas(kind, w, h, seed, p) {
  const W = Math.max(1, Math.round(w));
  const H = Math.max(1, Math.round(h));
  const key = `${kind} ${W} ${H} ${seed} ${p.a} ${p.b} ${p.c}`;
  const hit = cache.find(item => item.key === key);
  if (hit) return hit.canvas;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  (painters[kind] || painters.prizm)(ctx, 0, 0, W, H, seeded(seed), p);
  cache.unshift({key, canvas});
  if (cache.length > 6) cache.length = 6;
  return canvas;
}

// A rainbow sheen, as on a refractor tilted under a light.
export function holo(ctx, x, y, w, h, alpha, turn = 0) {
  const dx = Math.cos(turn) * w;
  const dy = Math.sin(turn) * h;
  const g = ctx.createLinearGradient(x + w / 2 - dx, y + h / 2 - dy, x + w / 2 + dx, y + h / 2 + dy);
  RAINBOW.concat(RAINBOW.slice(0, 3)).forEach((c, k, all) => g.addColorStop(k / (all.length - 1), c));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

// Four-pointed glints, the light catching the foil.
export function sparkles(ctx, rand, x, y, w, h, count, size, colour = '#ffffff') {
  ctx.save();
  for (let k = 0; k < count; k++) {
    const px = x + rand() * w;
    const py = y + rand() * h;
    const s = size * (.4 + rand() * .8);
    const g = ctx.createRadialGradient(px, py, 0, px, py, s * 1.2);
    g.addColorStop(0, 'rgba(255,255,255,.9)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(px - s * 1.2, py - s * 1.2, s * 2.4, s * 2.4);
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.moveTo(px, py - s);
    ctx.quadraticCurveTo(px, py, px + s * .9, py);
    ctx.quadraticCurveTo(px, py, px, py + s);
    ctx.quadraticCurveTo(px, py, px - s * .9, py);
    ctx.quadraticCurveTo(px, py, px, py - s);
    ctx.fill();
  }
  ctx.restore();
}
