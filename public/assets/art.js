// Team art drawn in code: emblems (motifs), kit patterns and home venues.
// Everything is plain canvas paths so it looks the same on every phone and
// needs no image files. Motifs are drawn in a 100 × 100 box.
const TAU = Math.PI * 2;

// Runs an SVG path (M L H V C S Q Z, upper or lower case, no arcs) on the canvas.
export function svgPath(ctx, d) {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
  let i = 0;
  let cmd = '';
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  let cx = 0;
  let cy = 0;
  const num = () => parseFloat(tokens[i++]);
  ctx.beginPath();
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++];
    const rel = cmd === cmd.toLowerCase();
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;
    switch (cmd.toUpperCase()) {
      case 'M':
        x = ox + num(); y = oy + num(); sx = x; sy = y;
        ctx.moveTo(x, y);
        cmd = rel ? 'l' : 'L';
        break;
      case 'L':
        x = ox + num(); y = oy + num();
        ctx.lineTo(x, y);
        break;
      case 'H':
        x = ox + num();
        ctx.lineTo(x, y);
        break;
      case 'V':
        y = oy + num();
        ctx.lineTo(x, y);
        break;
      case 'C': {
        const a = ox + num(); const b = oy + num();
        cx = ox + num(); cy = oy + num();
        x = ox + num(); y = oy + num();
        ctx.bezierCurveTo(a, b, cx, cy, x, y);
        break;
      }
      case 'S': {
        const a = 2 * x - cx; const b = 2 * y - cy;
        cx = ox + num(); cy = oy + num();
        x = ox + num(); y = oy + num();
        ctx.bezierCurveTo(a, b, cx, cy, x, y);
        break;
      }
      case 'Q':
        cx = ox + num(); cy = oy + num();
        x = ox + num(); y = oy + num();
        ctx.quadraticCurveTo(cx, cy, x, y);
        break;
      case 'Z':
        ctx.closePath();
        x = sx; y = sy;
        break;
      default:
        i++;
    }
  }
}

function fillPath(ctx, d, colour) {
  svgPath(ctx, d);
  ctx.fillStyle = colour;
  ctx.fill();
}

function circle(ctx, x, y, r, colour) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = colour;
  ctx.fill();
}

function star(ctx, x, y, r, colour, points = 5, inner = .42) {
  ctx.beginPath();
  for (let k = 0; k < points * 2; k++) {
    const a = k * Math.PI / points - Math.PI / 2;
    const rr = k % 2 ? r * inner : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = colour;
  ctx.fill();
}

// A colour between two hex colours (t = 0 is a, 1 is b), and a hex colour with alpha.
function mixHex(a, b, t) {
  const p = c => [1, 3, 5].map(k => parseInt(c.slice(k, k + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `rgb(${x.map((v, k) => Math.round(v + (y[k] - v) * t)).join(',')})`;
}
function hexA(c, a) {
  const [r, g, b] = [1, 3, 5].map(k => parseInt(c.slice(k, k + 2), 16));
  return `rgba(${r},${g},${b},${a})`;
}

function line(ctx, colour, width, points) {
  ctx.beginPath();
  ctx.moveTo(points[0], points[1]);
  for (let k = 2; k < points.length; k += 2) ctx.lineTo(points[k], points[k + 1]);
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

const HEART = 'M50 92 C22 70 6 52 6 32 C6 17 17 7 30 7 C39 7 46 12 50 20 C54 12 61 7 70 7 C83 7 94 17 94 32 C94 52 78 70 50 92Z';
const SHIELD = 'M10 8 H90 V46 C90 72 72 88 50 96 C28 88 10 72 10 46Z';

// Each motif: (ctx, fg, bg) in a 100 × 100 box. fg is the main ink, bg the colour
// behind (used for cut-outs and details).
export const motifs = {
  ball(ctx, fg, bg) {
    circle(ctx, 50, 50, 44, fg);
    ctx.save();
    ctx.beginPath();
    ctx.arc(50, 50, 44, 0, TAU);
    ctx.clip();
    ctx.strokeStyle = bg;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(6, 50); ctx.lineTo(94, 50);
    ctx.moveTo(50, 6); ctx.lineTo(50, 94);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-4, 50, 40, -1.2, 1.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(104, 50, 40, Math.PI - 1.2, Math.PI + 1.2);
    ctx.stroke();
    ctx.restore();
  },
  shamrock(ctx, fg) {
    for (const turn of [0, TAU / 3, -TAU / 3]) {
      ctx.save();
      ctx.translate(50, 46);
      ctx.rotate(turn + Math.PI);
      ctx.scale(.42, .44);
      ctx.translate(-50, -92);
      fillPath(ctx, HEART, fg);
      ctx.restore();
    }
    line(ctx, fg, 6, [50, 50, 54, 70, 62, 90]);
  },
  bridge(ctx, fg) {
    // A suspension bridge: two towers, the deck and the swooping cables.
    ctx.fillStyle = fg;
    for (const x of [30, 70]) {
      ctx.fillRect(x - 4, 14, 3, 66);
      ctx.fillRect(x + 1, 14, 3, 66);
      ctx.fillRect(x - 4, 24, 8, 3);
      ctx.fillRect(x - 4, 40, 8, 3);
    }
    ctx.fillRect(2, 62, 96, 5);
    ctx.strokeStyle = fg;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(2, 50);
    ctx.quadraticCurveTo(16, 60, 30, 16);
    ctx.quadraticCurveTo(50, 70, 70, 16);
    ctx.quadraticCurveTo(84, 60, 98, 50);
    ctx.stroke();
    ctx.lineWidth = 1.2;
    for (let x = 6; x < 96; x += 5) {
      if (Math.abs(x - 30) < 4 || Math.abs(x - 70) < 4) continue;
      const t = x < 30 ? (x - 2) / 28 : x < 70 ? (x - 30) / 40 : (x - 70) / 28;
      const top = x < 30 ? 50 - (34 * t * t) : x < 70 ? 16 + 54 * 4 * t * (1 - t) * .5 : 16 + 34 * t * t;
      ctx.beginPath();
      ctx.moveTo(x, Math.min(top, 62));
      ctx.lineTo(x, 62);
      ctx.stroke();
    }
    // Water.
    for (let k = 0; k < 3; k++) line(ctx, fg, 2, [10 + k * 6, 78 + k * 7, 90 - k * 6, 78 + k * 7]);
  },
  bull(ctx, fg, bg) {
    fillPath(ctx, 'M4 14 C8 40 22 50 36 50 L64 50 C78 50 92 40 96 14 C88 30 78 36 66 36 L34 36 C22 36 12 30 4 14Z', fg);
    fillPath(ctx, 'M32 42 L68 42 C70 56 66 70 60 82 C57 90 43 90 40 82 C34 70 30 56 32 42Z', fg);
    // Eyes and nostrils.
    circle(ctx, 42, 56, 3.2, bg);
    circle(ctx, 58, 56, 3.2, bg);
    circle(ctx, 45, 80, 2.4, bg);
    circle(ctx, 55, 80, 2.4, bg);
  },
  flame(ctx, fg, bg) {
    fillPath(ctx, 'M50 2 C58 22 78 32 78 58 C78 80 64 96 50 96 C36 96 22 82 22 62 C22 46 32 38 36 26 C40 38 46 42 48 44 C46 30 46 16 50 2Z', fg);
    fillPath(ctx, 'M50 40 C54 52 64 58 64 72 C64 84 58 92 50 92 C42 92 36 84 36 74 C36 64 44 60 46 52 C48 58 50 58 51 58 C50 52 49 46 50 40Z', bg);
  },
  heat(ctx, fg, bg) {
    // A ball on fire, the way Miami draws it.
    ctx.save();
    ctx.translate(14, 0);
    ctx.scale(.86, .86);
    fillPath(ctx, 'M50 2 C58 22 78 32 78 58 C78 80 64 96 50 96 C36 96 22 82 22 62 C22 46 32 38 36 26 C40 38 46 42 48 44 C46 30 46 16 50 2Z', fg);
    ctx.restore();
    ctx.save();
    ctx.translate(14, 40);
    ctx.scale(.55, .55);
    motifs.ball(ctx, bg, fg);
    ctx.restore();
  },
  skyline(ctx, fg) {
    ctx.fillStyle = fg;
    const blocks = [[4, 58, 10], [15, 46, 9], [25, 62, 8], [62, 40, 10], [73, 54, 9], [83, 34, 8], [92, 60, 6]];
    for (const [x, top, w] of blocks) ctx.fillRect(x, top, w, 92 - top);
    // Empire State Building in the middle, with its spire.
    fillPath(ctx, 'M38 92 V40 H41 V30 H44 V22 H47 V10 H49 V2 H51 V10 H53 V22 H56 V30 H59 V40 H62 V92Z', fg);
    ctx.fillRect(2, 90, 96, 4);
  },
  star(ctx, fg) {
    star(ctx, 50, 52, 46, fg);
  },
  mavs(ctx, fg, bg) {
    // Lone Star inside a ring, with the "M" the Mavericks wore since 1980.
    ctx.strokeStyle = fg;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(50, 50, 44, 0, TAU);
    ctx.stroke();
    star(ctx, 50, 50, 34, fg);
    ctx.fillStyle = bg;
    ctx.font = `400 22px "HOT Display", Impact, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('M', 50, 54);
  },
  rowel(ctx, fg, bg) {
    // The spur rowel in San Antonio's logo.
    star(ctx, 50, 50, 46, fg, 10, .55);
    circle(ctx, 50, 50, 16, bg);
    circle(ctx, 50, 50, 8, fg);
  },
  trident(ctx, fg) {
    fillPath(ctx, 'M47 30 H53 V96 H47Z', fg);
    fillPath(ctx, 'M20 6 L28 20 L24 20 C24 34 34 40 47 40 L53 40 C66 40 76 34 76 20 L72 20 L80 6 L86 22 L82 22 C82 42 70 50 53 50 L47 50 C30 50 18 42 18 22 L14 22Z', fg);
    fillPath(ctx, 'M50 2 L58 18 L53 18 V36 H47 V18 H42Z', fg);
  },
  argyle(ctx, fg, bg) {
    ctx.fillStyle = fg;
    for (const [x, y] of [[50, 30], [30, 60], [70, 60]]) {
      ctx.beginPath();
      ctx.moveTo(x, y - 26); ctx.lineTo(x + 16, y); ctx.lineTo(x, y + 26); ctx.lineTo(x - 16, y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = bg;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(8, 8); ctx.lineTo(92, 92);
    ctx.moveTo(92, 8); ctx.lineTo(8, 92);
    ctx.stroke();
    ctx.setLineDash([]);
  },
  paw(ctx, fg) {
    fillPath(ctx, 'M50 48 C64 48 80 62 80 76 C80 88 70 92 62 90 C56 88 54 86 50 86 C46 86 44 88 38 90 C30 92 20 88 20 76 C20 62 36 48 50 48Z', fg);
    for (const [x, y, r] of [[22, 38, 10], [38, 20, 11], [62, 20, 11], [78, 38, 10]]) {
      ctx.beginPath();
      ctx.ellipse(x, y, r * .82, r, (x - 50) / 90, 0, TAU);
      ctx.fillStyle = fg;
      ctx.fill();
    }
  },
  wheat(ctx, fg) {
    line(ctx, fg, 3.5, [50, 98, 50, 10]);
    for (let k = 0; k < 6; k++) {
      const y = 22 + k * 11;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(50 + side * 9, y, 6, 11, side * .55, 0, TAU);
        ctx.fillStyle = fg;
        ctx.fill();
      }
    }
    ctx.beginPath();
    ctx.ellipse(50, 10, 5, 10, 0, 0, TAU);
    ctx.fill();
  },
  jayhawk(ctx, fg, bg) {
    // The Jayhawk: round body, big shoes and a sharp beak.
    circle(ctx, 50, 52, 30, fg);
    fillPath(ctx, 'M66 40 L96 50 L66 58Z', fg);
    circle(ctx, 60, 42, 8, bg);
    circle(ctx, 62, 42, 4, fg);
    fillPath(ctx, 'M30 26 L40 6 L46 26 L52 4 L58 26Z', fg);
    fillPath(ctx, 'M30 80 H48 V90 H24 C24 84 26 80 30 80Z M54 80 H72 C76 80 78 84 78 90 H54Z', fg);
  },
  tree(ctx, fg) {
    // El Palo Alto, the redwood on Stanford's seal and the Tree on the sideline.
    fillPath(ctx, 'M44 74 H56 V96 H44Z', fg);
    const tiers = [[50, 4, 16, 26], [50, 18, 24, 44], [50, 34, 32, 62], [50, 50, 40, 80]];
    for (const [x, top, half, bottom] of tiers) {
      fillPath(ctx, `M${x} ${top} L${x + half} ${bottom} H${x - half}Z`, fg);
    }
  },
  veritas(ctx, fg, bg) {
    // Harvard's shield with three open books.
    fillPath(ctx, SHIELD, fg);
    for (const [x, y] of [[30, 22], [70, 22], [50, 56]]) {
      fillPath(ctx, `M${x - 16} ${y} C${x - 10} ${y - 4} ${x - 4} ${y - 2} ${x} ${y + 2} C${x + 4} ${y - 2} ${x + 10} ${y - 4} ${x + 16} ${y} V${y + 18} C${x + 10} ${y + 14} ${x + 4} ${y + 16} ${x} ${y + 20} C${x - 4} ${y + 16} ${x - 10} ${y + 14} ${x - 16} ${y + 18}Z`, bg);
      line(ctx, fg, 1.4, [x, y + 3, x, y + 19]);
    }
  },
  book(ctx, fg, bg) {
    // Yale's open book under a shield.
    fillPath(ctx, SHIELD, fg);
    fillPath(ctx, 'M18 34 C30 28 42 30 50 38 C58 30 70 28 82 34 V70 C70 64 58 66 50 74 C42 66 30 64 18 70Z', bg);
    line(ctx, fg, 2, [50, 40, 50, 72]);
    for (let k = 0; k < 4; k++) {
      line(ctx, fg, 1.4, [24, 42 + k * 6, 44, 44 + k * 6]);
      line(ctx, fg, 1.4, [56, 44 + k * 6, 76, 42 + k * 6]);
    }
  },
  bulldog(ctx, fg, bg) {
    // Handsome Dan: a heavy jowled head.
    fillPath(ctx, 'M20 30 C20 14 34 8 50 8 C66 8 80 14 80 30 C88 36 92 48 88 62 C84 78 70 92 50 92 C30 92 16 78 12 62 C8 48 12 36 20 30Z', fg);
    fillPath(ctx, 'M14 18 L28 6 L32 24Z M86 18 L72 6 L68 24Z', fg);
    circle(ctx, 36, 40, 5, bg);
    circle(ctx, 64, 40, 5, bg);
    fillPath(ctx, 'M40 56 C44 52 56 52 60 56 C58 62 54 64 50 64 C46 64 42 62 40 56Z', bg);
    line(ctx, bg, 2.4, [30, 72, 40, 78, 50, 74, 60, 78, 70, 72]);
  },
  campanile(ctx, fg, bg) {
    // Sather Tower, the Campanile at Berkeley.
    fillPath(ctx, 'M40 30 H60 V96 H40Z', fg);
    fillPath(ctx, 'M38 30 L50 4 L62 30Z', fg);
    ctx.fillRect(36, 28, 28, 4);
    ctx.fillRect(34, 92, 32, 6);
    circle(ctx, 50, 44, 6, bg);
    line(ctx, fg, 1.6, [50, 44, 50, 40]);
    for (let k = 0; k < 3; k++) {
      ctx.fillStyle = bg;
      ctx.fillRect(43 + k * 5.5, 56, 3, 30);
    }
    star(ctx, 82, 18, 9, fg);
  },
  helmet(ctx, fg, bg, accent) {
    // Michigan's winged helmet, seen from the side.
    fillPath(ctx, 'M14 66 C8 36 30 12 58 12 C82 12 96 30 96 52 V70 H70 L64 82 H24 C18 78 16 72 14 66Z', fg);
    const wing = accent || bg;
    fillPath(ctx, 'M18 62 C20 40 34 22 56 16 C46 26 40 40 40 62 C36 56 30 54 18 62Z', wing);
    fillPath(ctx, 'M56 16 C70 16 84 22 90 34 C80 28 68 28 60 34 C58 28 58 22 56 16Z', wing);
    fillPath(ctx, 'M46 60 C48 46 54 38 66 34 C62 44 60 52 62 62Z', wing);
    line(ctx, wing, 3, [70, 70, 92, 70, 92, 82, 74, 82]);
  },
  buckeye(ctx, fg, bg) {
    // The buckeye leaf on Ohio State's helmet stickers.
    ctx.save();
    ctx.translate(50, 70);
    for (let k = -3; k <= 3; k++) {
      ctx.save();
      ctx.rotate(k * .42);
      ctx.beginPath();
      ctx.ellipse(0, -30 + Math.abs(k) * 3, 7 - Math.abs(k) * .7, 30 - Math.abs(k) * 4, 0, 0, TAU);
      ctx.fillStyle = fg;
      ctx.fill();
      ctx.strokeStyle = bg;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(0, -54 + Math.abs(k) * 6);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    circle(ctx, 50, 76, 12, fg);
    circle(ctx, 50, 76, 9, bg);
    circle(ctx, 50, 76, 7.5, '#6b3a1e');
    circle(ctx, 52, 73, 3, '#d9b48a');
  },
  hat(ctx, fg, bg) {
    // Bear Bryant's houndstooth hat.
    ctx.save();
    svgPath(ctx, 'M8 70 C8 62 26 58 50 58 C74 58 92 62 92 70 C92 76 74 78 50 78 C26 78 8 76 8 70Z M26 62 C24 44 30 22 50 22 C70 22 76 44 74 62 C66 64 34 64 26 62Z');
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.clip();
    houndstooth(ctx, 0, 0, 100, 100, 6, fg);
    ctx.restore();
    ctx.fillStyle = fg;
    ctx.fillRect(26, 52, 48, 7);
  },
  longhorn(ctx, fg) {
    fillPath(ctx, 'M1 28 C10 31 22 29 32 33 C38 35 42 37 44 39 H56 C58 37 62 35 68 33 C78 29 90 31 99 28 C93 37 80 42 68 44 C62 46 60 48 58 52 L56 72 C55 78 52 82 50 82 C48 82 45 78 44 72 L42 52 C40 48 38 46 32 44 C20 42 7 37 1 28Z', fg);
  },
  milan(ctx, fg, bg) {
    // Milan's crest: the city's red cross on white beside red and black stripes.
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(50, 50, 44, 46, 0, 0, TAU);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = '#d6001c';
    ctx.fillRect(16, 4, 12, 92);
    ctx.fillRect(4, 44, 46, 12);
    for (let k = 0; k < 5; k++) {
      ctx.fillStyle = k % 2 ? '#111111' : '#d6001c';
      ctx.fillRect(50 + k * 10, 0, 10, 100);
    }
    ctx.restore();
    ctx.lineWidth = 4;
    ctx.strokeStyle = fg;
    ctx.beginPath();
    ctx.ellipse(50, 50, 44, 46, 0, 0, TAU);
    ctx.stroke();
    void bg;
  },
  ship(ctx, fg, bg) {
    // The ship from Manchester's coat of arms, on United's crest.
    fillPath(ctx, 'M8 64 H92 L82 86 H18Z', fg);
    ctx.fillStyle = fg;
    ctx.fillRect(30, 18, 3, 46);
    ctx.fillRect(52, 8, 3, 56);
    ctx.fillRect(72, 22, 3, 42);
    fillPath(ctx, 'M34 22 C42 28 44 40 34 50Z M56 12 C68 20 70 40 56 56Z M76 26 C84 32 84 44 76 52Z M28 24 C20 32 20 44 28 52Z', fg);
    fillPath(ctx, 'M55 8 L66 4 L55 2Z', fg);
    for (let k = 0; k < 3; k++) line(ctx, fg, 2, [10, 90 + k * 4, 90, 90 + k * 4]);
    void bg;
  },
  devil(ctx, fg, bg) {
    // United's Red Devil with his trident.
    fillPath(ctx, 'M38 30 C34 22 34 14 40 6 C40 14 44 18 48 20 C52 18 56 14 56 6 C62 14 62 22 58 30 C64 36 64 46 58 52 L62 70 L72 92 H58 L50 74 L42 92 H28 L38 70 L40 52 C32 46 32 36 38 30Z', fg);
    fillPath(ctx, 'M60 50 L80 40 L84 44 L64 56Z', fg);
    fillPath(ctx, 'M78 30 L84 22 L88 30 L92 20 L94 32 L86 46 L80 44Z', fg);
    fillPath(ctx, 'M58 72 C72 76 80 84 76 96 C70 86 64 82 56 80Z', fg);
    void bg;
  },
  crown(ctx, fg, bg) {
    // The royal crown over Real Madrid's crest.
    fillPath(ctx, 'M10 70 L14 30 L30 48 L40 20 L50 40 L60 20 L70 48 L86 30 L90 70Z', fg);
    ctx.fillStyle = fg;
    ctx.fillRect(10, 72, 80, 12);
    for (const [x, y] of [[14, 28], [40, 18], [60, 18], [86, 28]]) circle(ctx, x, y, 4.5, fg);
    fillPath(ctx, 'M46 10 H54 V4 H46Z M44 12 H56 V16 H44Z', fg);
    for (const x of [26, 42, 58, 74]) circle(ctx, x, 78, 2.6, bg);
  },
  eiffel(ctx, fg, bg) {
    // The Eiffel Tower, as on Paris Saint-Germain's crest.
    fillPath(ctx, 'M49 2 H51 L52 14 H54 L57 40 H61 L64 56 H68 L84 96 H66 C64 86 58 78 50 78 C42 78 36 86 34 96 H16 L32 56 H36 L39 40 H43 L46 14 H48Z', fg);
    ctx.fillStyle = bg;
    ctx.fillRect(40, 44, 20, 3);
    ctx.fillRect(34, 60, 32, 3);
    fillPath(ctx, 'M46 20 H54 L56 38 H44Z', bg);
    fillPath(ctx, 'M47 24 H53 L54 36 H46Z', fg);
  },
  barca(ctx) {
    // Barça's crest: St George's cross, the Senyera, the ball over blaugrana.
    const shape = 'M8 10 H92 C94 40 90 66 50 96 C10 66 6 40 8 10Z';
    ctx.save();
    svgPath(ctx, shape);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = '#da291c';
    ctx.fillRect(24, 8, 6, 26);
    ctx.fillRect(8, 18, 42, 6);
    ctx.fillStyle = '#edbb00';
    ctx.fillRect(50, 8, 44, 26);
    ctx.fillStyle = '#da291c';
    for (let k = 0; k < 4; k++) ctx.fillRect(54 + k * 10, 8, 5, 26);
    ctx.fillStyle = '#edbb00';
    ctx.fillRect(0, 34, 100, 8);
    for (let k = 0; k < 6; k++) {
      ctx.fillStyle = k % 2 ? '#004d98' : '#a50044';
      ctx.fillRect(k * 17, 42, 17, 60);
    }
    ctx.restore();
    circle(ctx, 50, 68, 10, '#edbb00');
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 3;
    svgPath(ctx, shape);
    ctx.stroke();
  },
  lozenge(ctx, fg, bg) {
    // The blue and white Bavarian lozenges inside Bayern's crest.
    ctx.save();
    ctx.beginPath();
    ctx.arc(50, 50, 44, 0, TAU);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.clip();
    lozenges(ctx, 0, 0, 100, 100, 14, '#0066b2', .35);
    ctx.restore();
    ctx.strokeStyle = fg;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(50, 50, 45, 0, TAU);
    ctx.stroke();
    void bg;
  },
  gates(ctx, fg) {
    // The Shankly Gates at Anfield.
    ctx.fillStyle = fg;
    ctx.fillRect(6, 20, 12, 76);
    ctx.fillRect(82, 20, 12, 76);
    ctx.fillRect(4, 14, 16, 6);
    ctx.fillRect(80, 14, 16, 6);
    ctx.strokeStyle = fg;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(18, 34);
    ctx.quadraticCurveTo(50, 8, 82, 34);
    ctx.moveTo(18, 42);
    ctx.quadraticCurveTo(50, 18, 82, 42);
    ctx.stroke();
    ctx.lineWidth = 2;
    for (let x = 24; x < 80; x += 6) {
      const top = 42 - 22 * (1 - Math.pow((x - 50) / 32, 2));
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, 96);
      ctx.stroke();
    }
    ctx.fillRect(18, 64, 64, 3);
    star(ctx, 50, 22, 5, fg);
  },
  liverbird(ctx, fg) {
    // The Liver bird, wings up, a sprig in its beak.
    fillPath(ctx, 'M44 30 C40 22 42 14 50 12 C56 10 60 14 62 18 L70 20 L62 24 C64 32 62 38 58 42 C66 46 70 56 68 66 L76 92 H64 L58 74 L54 92 H44 L48 70 C40 66 36 58 38 48 C30 44 20 36 14 22 C24 30 32 32 40 34 C38 28 40 24 44 30Z', fg);
    fillPath(ctx, 'M70 20 C76 24 80 30 80 38 C76 32 72 28 66 24Z', fg);
  },
  juve(ctx, fg, bg) {
    // Juventus: the J split black and white, three stars for 30-plus titles.
    ctx.save();
    svgPath(ctx, 'M30 26 H70 V70 C70 84 60 94 46 94 C36 94 28 88 26 78 L40 74 C42 79 44 80 47 80 C53 80 56 76 56 70 V40 H30Z');
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = fg;
    ctx.fillRect(0, 0, 50, 100);
    ctx.restore();
    ctx.strokeStyle = fg;
    ctx.lineWidth = 2.4;
    svgPath(ctx, 'M30 26 H70 V70 C70 84 60 94 46 94 C36 94 28 88 26 78 L40 74 C42 79 44 80 47 80 C53 80 56 76 56 70 V40 H30Z');
    ctx.stroke();
    for (const x of [30, 50, 70]) star(ctx, x, 12, 8, fg);
  },
  guoan(ctx, fg, bg) {
    // Beijing Guoan: the Workers' Stadium bowl, green and gold.
    ctx.fillStyle = fg;
    svgPath(ctx, 'M6 54 C6 40 26 30 50 30 C74 30 94 40 94 54 V70 C94 82 74 90 50 90 C26 90 6 82 6 70Z');
    ctx.fill();
    ctx.fillStyle = bg;
    svgPath(ctx, 'M16 56 C16 46 32 40 50 40 C68 40 84 46 84 56 C84 64 68 70 50 70 C32 70 16 64 16 56Z');
    ctx.fill();
    ctx.strokeStyle = fg;
    ctx.lineWidth = 1.6;
    for (let k = 0; k < 9; k++) {
      const x = 18 + k * 8;
      ctx.beginPath();
      ctx.moveTo(x, 72);
      ctx.lineTo(x, 86);
      ctx.stroke();
    }
    // A palace gate tower over the bowl: the imperial guard (御林军).
    ctx.fillStyle = fg;
    svgPath(ctx, 'M14 20 C30 18 40 10 50 4 C60 10 70 18 86 20 L80 24 H20Z');
    ctx.fill();
    ctx.fillRect(28, 24, 44, 3);
    for (const x of [32, 42, 54, 64]) ctx.fillRect(x, 27, 4, 9);
    ctx.fillRect(24, 36, 52, 3);
  },
  waves(ctx, fg, bg) {
    // Dalian, the football city by the sea: a ball rising over three waves.
    circle(ctx, 50, 26, 21, fg);
    ctx.fillStyle = bg;
    svgPath(ctx, 'M50 17 L59 23.5 L55.5 34 H44.5 L41 23.5Z');
    ctx.fill();
    ctx.strokeStyle = fg;
    ctx.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      ctx.lineWidth = 7;
      ctx.beginPath();
      const y = 56 + k * 14;
      ctx.moveTo(6, y);
      for (let x = 6; x <= 94; x += 2) ctx.lineTo(x, y + Math.sin((x - 6) / 88 * TAU * 1.5) * 5);
      ctx.stroke();
    }
    void bg;
  },
  jacket(ctx, fg, bg) {
    // Buzz, Georgia Tech's yellow jacket, seen from above with its wings spread.
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(50 + side * 22, 38, 20, 10, side * -.5, 0, TAU);
      ctx.globalAlpha = .55;
      ctx.fillStyle = fg;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = fg;
      ctx.lineWidth = 2.4;
      ctx.stroke();
    }
    line(ctx, fg, 2.4, [45, 16, 37, 4]);
    line(ctx, fg, 2.4, [55, 16, 63, 4]);
    circle(ctx, 50, 22, 9, fg);
    circle(ctx, 50, 42, 12, fg);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(50, 70, 15, 22, 0, 0, TAU);
    ctx.fillStyle = fg;
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = bg;
    for (const y of [59, 69, 79]) ctx.fillRect(30, y, 40, 4);
    ctx.restore();
    fillPath(ctx, 'M45 90 L50 99 L55 90Z', fg);
  },
  hokiebird(ctx, fg, bg) {
    // The HokieBird: a fanned turkey tail behind a round body.
    ctx.save();
    ctx.translate(50, 66);
    for (let k = -4; k <= 4; k++) {
      ctx.save();
      ctx.rotate(k * .32);
      ctx.beginPath();
      ctx.ellipse(0, -36, 8, 26, 0, 0, TAU);
      ctx.fillStyle = fg;
      ctx.fill();
      ctx.strokeStyle = bg;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    circle(ctx, 50, 70, 23, bg);
    circle(ctx, 50, 70, 20, fg);
    circle(ctx, 50, 44, 12, bg);
    circle(ctx, 50, 44, 10, fg);
    circle(ctx, 53, 42, 2.4, bg);
    fillPath(ctx, 'M58 43 L69 46 L58 50Z', fg);
    fillPath(ctx, 'M47 52 C49 58 47 64 44 64 C42 60 43 55 47 52Z', fg);
    line(ctx, fg, 4, [42, 88, 40, 98]);
    line(ctx, fg, 4, [58, 88, 60, 98]);
  },
  pine(ctx, fg) {
    // The Lone Pine, Dartmouth's oldest symbol: a tall trunk with wind-swept clumps.
    fillPath(ctx, 'M46 96 C48 70 46 46 50 6 C52 40 54 70 56 96Z', fg);
    for (const [x, y, w, h, side] of [[34, 30, 22, 7, -1], [66, 22, 18, 6, 1], [29, 48, 28, 8, -1], [70, 42, 24, 7, 1], [34, 66, 22, 7, -1], [66, 60, 22, 7, 1]]) {
      ctx.beginPath();
      ctx.ellipse(x, y, w / 2 + 4, h, side * .12, 0, TAU);
      ctx.fillStyle = fg;
      ctx.fill();
      line(ctx, fg, 2.4, [50, y + 5, x - side * (w / 2 - 2), y]);
    }
    ctx.fillStyle = fg;
    ctx.fillRect(26, 94, 48, 4);
  },
  vcat(ctx, fg, bg) {
    // Villanova's V with a wildcat's head set in it.
    fillPath(ctx, 'M4 10 H36 L50 52 L64 10 H96 L58 94 H42Z', fg);
    ctx.save();
    svgPath(ctx, 'M34 30 L39 12 L48 24 H52 L61 12 L66 30 C70 42 64 54 50 60 C36 54 30 42 34 30Z');
    ctx.strokeStyle = bg;
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.fillStyle = fg;
    ctx.fill();
    ctx.restore();
    fillPath(ctx, 'M38 34 L47 38 L40 41Z M62 34 L53 38 L60 41Z', bg);
    fillPath(ctx, 'M46 46 H54 L50 51Z', bg);
  },
  cyclone(ctx, fg) {
    // A cyclone funnel, after the 1895 headline "Struck by a Cyclone".
    const rings = 8;
    ctx.strokeStyle = fg;
    for (let k = 0; k < rings; k++) {
      const t = k / (rings - 1);
      ctx.beginPath();
      ctx.ellipse(50 + Math.sin(t * 3.2) * 8, 12 + t * 72, 42 - t * 34, 5 + (1 - t) * 3, 0, 0, TAU);
      ctx.lineWidth = 5.5 - t * 2.5;
      ctx.stroke();
    }
    fillPath(ctx, 'M53 84 C55 91 51 96 46 99 C48 94 47 90 49 84Z', fg);
  },
  powercat(ctx, fg, bg) {
    // An angular wildcat head in profile, in the spirit of K-State's Powercat.
    fillPath(ctx, 'M10 42 L28 10 L40 30 L58 22 L70 34 L95 44 L80 52 L92 60 L70 64 L60 86 L34 92 L16 76Z', fg);
    fillPath(ctx, 'M28 22 L35 32 L26 33Z', bg);
    fillPath(ctx, 'M55 39 L73 44 L57 47Z', bg);
    line(ctx, bg, 2, [72, 62, 60, 70]);
  },
  iu(ctx, fg, bg) {
    // Indiana's interlocking IU: the I standing in front of the U.
    fillPath(ctx, 'M16 18 H40 V24 H36 V64 C36 76 64 76 64 64 V24 H60 V18 H84 V24 H80 V66 C80 86 66 94 50 94 C34 94 20 86 20 66 V24 H16Z', fg);
    ctx.save();
    svgPath(ctx, 'M38 4 H62 V12 H56 V86 H62 V96 H38 V86 H44 V12 H38Z');
    ctx.strokeStyle = bg;
    ctx.lineWidth = 5;
    ctx.lineJoin = 'miter';
    ctx.stroke();
    ctx.fillStyle = fg;
    ctx.fill();
    ctx.restore();
  },
  schooner(ctx, fg, bg) {
    // The Sooner Schooner, the covered wagon that runs onto Owen Field.
    fillPath(ctx, 'M18 56 C14 34 20 16 30 16 C38 16 42 22 50 22 C58 22 62 16 70 16 C80 16 86 34 82 56Z', fg);
    for (const x of [34, 50, 66]) line(ctx, bg, 2.2, [x, 23, x, 55]);
    ctx.fillStyle = fg;
    ctx.fillRect(10, 56, 80, 12);
    for (const x of [26, 74]) {
      ctx.beginPath();
      ctx.arc(x, 80, 14, 0, TAU);
      ctx.strokeStyle = fg;
      ctx.lineWidth = 4;
      ctx.stroke();
      for (let k = 0; k < 6; k++) {
        const a = k * Math.PI / 3;
        line(ctx, fg, 2, [x, 80, x + Math.cos(a) * 13, 80 + Math.sin(a) * 13]);
      }
      circle(ctx, x, 80, 3.5, fg);
    }
    line(ctx, fg, 3, [90, 62, 99, 72]);
  },
  pokeball(ctx, fg, bg) {
    // A Poké Ball: red top, white foot, the black band and button.
    ctx.save();
    ctx.beginPath();
    ctx.arc(50, 50, 44, 0, TAU);
    ctx.clip();
    ctx.fillStyle = '#e3350d';
    ctx.fillRect(0, 0, 100, 50);
    ctx.fillStyle = '#f4f4f4';
    ctx.fillRect(0, 50, 100, 50);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 45, 100, 10);
    ctx.restore();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(50, 50, 44, 0, TAU);
    ctx.stroke();
    circle(ctx, 50, 50, 15, '#1a1a1a');
    circle(ctx, 50, 50, 9, '#f4f4f4');
  },
  flower(ctx, fg, bg) {
    // A five-petal flower, round and soft, with a centre dot.
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + k * TAU / 5;
      circle(ctx, 50 + Math.cos(a) * 24, 50 + Math.sin(a) * 24, 21, fg);
    }
    circle(ctx, 50, 50, 15, bg);
    circle(ctx, 50, 50, 9, fg);
  },
  palm(ctx, fg, bg) {
    // A sunset disc with a palm tree against it.
    circle(ctx, 56, 46, 36, fg);
    ctx.fillStyle = bg;
    for (let k = 0; k < 4; k++) ctx.fillRect(16, 52 + k * 9, 80, 3 + k);
    ctx.strokeStyle = bg;
    ctx.lineCap = 'round';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(34, 96);
    ctx.quadraticCurveTo(30, 60, 40, 28);
    ctx.stroke();
    ctx.lineWidth = 5;
    for (const [dx, dy, cx, cy] of [[-30, 2, -16, -14], [26, -2, 12, -16], [-22, 20, -18, 2], [24, 18, 18, 0], [-4, -26, -6, -18]]) {
      ctx.beginPath();
      ctx.moveTo(40, 28);
      ctx.quadraticCurveTo(40 + cx, 28 + cy, 40 + dx, 28 + dy);
      ctx.stroke();
    }
  },
  colortimer(ctx, fg, bg) {
    // The Color Timer on an Ultra hero's chest: a glowing blue lens in a silver ring.
    circle(ctx, 50, 50, 46, '#c9d2dc');
    circle(ctx, 50, 50, 38, '#7d8a96');
    const g = ctx.createRadialGradient(42, 40, 2, 50, 50, 34);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(.35, '#8fe7ff');
    g.addColorStop(1, '#1366d6');
    circle(ctx, 50, 50, 33, g);
    fillPath(ctx, 'M34 30 C40 24 52 22 60 26 C50 26 40 30 36 38Z', 'rgba(255,255,255,.8)');
  },
  dragonball(ctx, fg, bg) {
    // The four-star Dragon Ball.
    const g = ctx.createRadialGradient(38, 34, 4, 50, 50, 46);
    g.addColorStop(0, '#fff3c2');
    g.addColorStop(.45, '#ffb020');
    g.addColorStop(1, '#e06a00');
    circle(ctx, 50, 50, 45, g);
    for (const [x, y] of [[40, 40], [60, 40], [40, 60], [60, 60]]) star(ctx, x, y, 9, '#e3241b', 5, .45);
    fillPath(ctx, 'M24 30 C30 18 44 12 56 13 C44 18 34 24 28 36Z', 'rgba(255,255,255,.75)');
  },
  jollyroger(ctx, fg, bg) {
    // The Straw Hat Pirates' flag: a skull in a straw hat over crossed bones.
    line(ctx, fg, 9, [18, 78, 82, 30]);
    line(ctx, fg, 9, [18, 30, 82, 78]);
    for (const [x, y] of [[14, 80], [14, 28], [86, 80], [86, 28]]) circle(ctx, x, y, 6, fg);
    fillPath(ctx, 'M50 30 C68 30 76 42 76 54 C76 64 70 70 64 72 V80 H36 V72 C30 70 24 64 24 54 C24 42 32 30 50 30Z', fg);
    circle(ctx, 40, 56, 7, bg);
    circle(ctx, 60, 56, 7, bg);
    fillPath(ctx, 'M50 62 L45 70 H55Z', bg);
    fillPath(ctx, 'M14 40 C20 34 30 32 34 32 C34 16 42 8 50 8 C58 8 66 16 66 32 C70 32 80 34 86 40 C74 44 26 44 14 40Z', '#f2c94c');
    ctx.fillStyle = '#d0312d';
    ctx.fillRect(34, 26, 32, 6);
  },
  konoha(ctx, fg) {
    // The Hidden Leaf's mark: a spiral with a leaf tip, as on the forehead protector.
    ctx.strokeStyle = fg;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let t = 0; t <= 3.6 * Math.PI; t += .1) {
      const r = 3 + t * 3.1;
      ctx.lineTo(50 + Math.cos(t) * r, 54 + Math.sin(t) * r);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(18, 50);
    ctx.quadraticCurveTo(8, 28, 30, 8);
    ctx.quadraticCurveTo(34, 26, 34, 34);
    ctx.stroke();
  },
  millennium(ctx, fg) {
    // The Millennium Puzzle's eye inside its inverted pyramid.
    fillPath(ctx, 'M6 10 H94 L50 94Z', fg);
    fillPath(ctx, 'M24 30 C34 20 66 20 76 30 C66 40 34 40 24 30Z', '#1a1a1a');
    circle(ctx, 50, 30, 6, fg);
    line(ctx, '#1a1a1a', 3, [44, 37, 40, 50, 46, 50]);
    line(ctx, '#1a1a1a', 3, [56, 37, 64, 52]);
  },
  vision(ctx, fg, bg, accent) {
    // A Vision: a gem set in a gold four-point frame.
    star(ctx, 50, 50, 48, '#e9c46a', 4, .55);
    star(ctx, 50, 50, 40, '#b8862b', 4, .55);
    const g = ctx.createRadialGradient(42, 40, 2, 50, 50, 26);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(.4, accent || fg);
    g.addColorStop(1, bg);
    circle(ctx, 50, 50, 22, g);
  },
  snake(ctx, fg, bg) {
    // Slytherin's serpent, coiled into an S.
    ctx.strokeStyle = fg;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(30, 88);
    ctx.bezierCurveTo(80, 88, 82, 56, 52, 52);
    ctx.bezierCurveTo(22, 48, 20, 16, 64, 16);
    ctx.stroke();
    fillPath(ctx, 'M60 6 C74 6 84 12 84 18 C84 24 74 28 62 26Z', fg);
    circle(ctx, 72, 15, 2.6, bg);
    line(ctx, '#d0312d', 2.4, [84, 18, 94, 16, 98, 12]);
    line(ctx, '#d0312d', 2.4, [94, 16, 98, 20]);
  },
  eagle(ctx, fg, bg) {
    // Ravenclaw's eagle, wings spread.
    fillPath(ctx, 'M50 30 C40 20 22 18 4 26 C16 30 22 36 26 44 C18 44 12 48 8 54 C22 52 34 54 42 60 L50 92 L58 60 C66 54 78 52 92 54 C88 48 82 44 74 44 C78 36 84 30 96 26 C78 18 60 20 50 30Z', fg);
    fillPath(ctx, 'M44 18 C44 10 56 10 56 18 C56 24 52 28 50 30 C48 28 44 24 44 18Z', fg);
    fillPath(ctx, 'M54 16 L62 20 L55 22Z', '#e9b949');
    circle(ctx, 51, 16, 1.8, bg);
  },
  badger(ctx, fg, bg) {
    // Hufflepuff's badger: a white blaze down a dark head.
    fillPath(ctx, 'M50 12 C78 12 92 40 90 62 C88 82 70 92 50 92 C30 92 12 82 10 62 C8 40 22 12 50 12Z', '#1a1a1a');
    fillPath(ctx, 'M50 14 C58 30 60 60 56 92 H44 C40 60 42 30 50 14Z', '#f4f4f4');
    fillPath(ctx, 'M18 40 C26 52 30 62 30 72 C22 66 16 56 18 40Z M82 40 C74 52 70 62 70 72 C78 66 84 56 82 40Z', '#f4f4f4');
    circle(ctx, 36, 54, 3.4, fg);
    circle(ctx, 64, 54, 3.4, fg);
    circle(ctx, 50, 84, 5, '#1a1a1a');
    fillPath(ctx, 'M14 26 L22 10 L30 22Z M86 26 L78 10 L70 22Z', '#1a1a1a');
  },
  lionhead(ctx, fg, bg) {
    // Roar-ee: a lion's head inside a spiked mane.
    star(ctx, 50, 50, 48, fg, 14, .72);
    circle(ctx, 50, 52, 26, bg);
    circle(ctx, 50, 52, 22, fg);
    fillPath(ctx, 'M28 34 L33 21 L41 31Z M72 34 L67 21 L59 31Z', fg);
    circle(ctx, 41, 46, 3.5, bg);
    circle(ctx, 59, 46, 3.5, bg);
    fillPath(ctx, 'M44 55 H56 L50 62Z', bg);
    line(ctx, bg, 2, [50, 62, 50, 67, 43, 71]);
    line(ctx, bg, 2, [50, 67, 57, 71]);
  },
  duck(ctx, fg, bg) {
    // The Beijing Ducks: a duck's head and broad bill.
    fillPath(ctx, 'M20 94 C16 72 22 56 34 47 C24 40 22 24 32 14 C42 4 62 6 70 18 C74 24 74 30 72 34 L96 40 C99 46 93 52 84 52 L70 52 C66 60 64 72 70 94Z', fg);
    circle(ctx, 54, 24, 6, bg);
    circle(ctx, 56, 24, 3, fg);
    line(ctx, bg, 2.4, [73, 45, 92, 46]);
  },
  tiger(ctx, fg, bg) {
    // The Southern Tiger's face, with stripes on the brow and cheeks.
    fillPath(ctx, 'M16 24 L32 30 L20 6Z M84 24 L68 30 L80 6Z', fg);
    fillPath(ctx, 'M50 12 C76 12 90 30 90 52 C90 76 72 94 50 94 C28 94 10 76 10 52 C10 30 24 12 50 12Z', fg);
    fillPath(ctx, 'M50 15 L44 30 L50 26 L56 30Z M39 18 L36 32 L44 26Z M61 18 L64 32 L56 26Z', bg);
    fillPath(ctx, 'M11 48 L28 53 L13 58Z M13 64 L28 64 L17 71Z M89 48 L72 53 L87 58Z M87 64 L72 64 L83 71Z', bg);
    fillPath(ctx, 'M29 43 L44 46 L34 52Z M71 43 L56 46 L66 52Z', bg);
    fillPath(ctx, 'M42 62 H58 L50 70Z', bg);
    line(ctx, bg, 2.4, [50, 70, 50, 76, 42, 82]);
    line(ctx, bg, 2.4, [50, 76, 58, 82]);
  },
  tsinghua(ctx, fg, bg) {
    // Tsinghua's Second Gate (二校门): a white arch under a pediment.
    fillPath(ctx, 'M8 92 V40 H92 V92 H64 V62 C64 52 58 46 50 46 C42 46 36 52 36 62 V92Z', fg);
    fillPath(ctx, 'M12 38 L50 12 L88 38Z', fg);
    circle(ctx, 50, 29, 5, bg);
    ctx.fillStyle = bg;
    for (const x of [16, 26, 74, 84]) ctx.fillRect(x - 1.5, 50, 3, 38);
    ctx.fillRect(10, 38, 80, 2);
    ctx.fillStyle = fg;
    ctx.fillRect(4, 92, 92, 5);
  },
  boya(ctx, fg) {
    // Boya Pagoda over Weiming Lake, Peking University.
    ctx.fillStyle = fg;
    for (let k = 0; k < 9; k++) {
      const y = 70 - k * 6.4;
      const half = 14 - k * 1.1;
      fillPath(ctx, `M${50 - half - 3} ${y} H${50 + half + 3} L${50 + half} ${y - 3} H${50 - half}Z`, fg);
      ctx.fillRect(50 - half + 2, y - 6.4, (half - 2) * 2, 3.6);
    }
    fillPath(ctx, 'M47 14 L50 2 L53 14Z', fg);
    ctx.fillRect(38, 70, 24, 6);
    for (const [y, w] of [[82, 40], [89, 30], [95, 18]]) line(ctx, fg, 2.4, [50 - w, y, 50 + w, y]);
  },
  shuttle(ctx, fg, bg) {
    // A shuttlecock, for the 2008 Olympic badminton hall on campus.
    ctx.save();
    ctx.translate(50, 50);
    ctx.rotate(-.5);
    ctx.translate(-50, -50);
    fillPath(ctx, 'M28 6 H72 L60 66 H40Z', fg);
    for (const x of [37, 46, 54, 63]) line(ctx, bg, 1.6, [x, 9, 50 + (x - 50) * .45, 63]);
    line(ctx, bg, 2, [32, 28, 68, 28]);
    line(ctx, bg, 2, [36, 47, 64, 47]);
    fillPath(ctx, 'M38 66 H62 V72 C62 86 56 94 50 94 C44 94 38 86 38 72Z', fg);
    ctx.restore();
  },
  laurel(ctx, fg, bg) {
    // Capital Normal University: an open book inside a laurel branch.
    ctx.strokeStyle = fg;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(50, 50, 40, Math.PI * .55, Math.PI * 1.75);
    ctx.stroke();
    for (let k = 0; k < 9; k++) {
      const a = Math.PI * (.6 + k * .13);
      const x = 50 + Math.cos(a) * 40;
      const y = 50 + Math.sin(a) * 40;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a + Math.PI * .75);
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.ellipse(0, -6, 3.2, 7.5, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    fillPath(ctx, 'M22 62 C34 56 44 58 50 64 C56 58 66 56 78 62 V72 C66 66 56 68 50 74 C44 68 34 66 22 72Z', fg);
    line(ctx, bg, 1.6, [50, 64, 50, 73]);
    ctx.fillStyle = fg;
    ctx.fillRect(30, 30, 40, 20);
    ctx.fillStyle = bg;
    ctx.fillRect(33, 33, 34, 14);
    fillPath(ctx, 'M36 44 V36 H41 L47 42 V36 H50 V44 H45 L39 38 V44Z M53 36 H56 V42 H61 V36 H64 V44 H53Z', fg);
  },
  renda(ctx, fg) {
    // Renmin University: three seal-script 人 standing side by side.
    ctx.strokeStyle = fg;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    for (const x of [28, 50, 72]) {
      ctx.beginPath();
      ctx.moveTo(x, 16);
      ctx.bezierCurveTo(x - 9, 30, x + 9, 42, x, 56);
      ctx.bezierCurveTo(x - 6, 66, x - 10, 76, x - 9, 88);
      ctx.moveTo(x, 56);
      ctx.bezierCurveTo(x + 6, 66, x + 10, 76, x + 9, 88);
      ctx.stroke();
    }
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(22, 16);
    ctx.bezierCurveTo(34, 8, 66, 8, 78, 16);
    ctx.stroke();
  },
  peaks(ctx, fg, bg) {
    // Northeastern University: snow mountains over the river's waves.
    circle(ctx, 50, 50, 46, fg);
    circle(ctx, 50, 50, 41, bg);
    ctx.save();
    ctx.beginPath();
    ctx.arc(50, 50, 38, 0, TAU);
    ctx.clip();
    fillPath(ctx, 'M8 62 L36 24 L44 34 L56 18 L92 62Z', fg);
    fillPath(ctx, 'M30 32 L36 24 L42 32 L38 30 L36 34 L33 30Z M50 26 L56 18 L63 28 L59 26 L56 31 L53 27Z', bg);
    ctx.strokeStyle = fg;
    ctx.lineWidth = 4;
    for (const y of [68, 76, 84]) {
      ctx.beginPath();
      ctx.moveTo(8, y);
      for (let x = 8; x <= 92; x += 12) ctx.quadraticCurveTo(x + 3, y - 4, x + 6, y), ctx.quadraticCurveTo(x + 9, y + 4, x + 12, y);
      ctx.stroke();
    }
    ctx.restore();
  },
  sizhong(ctx, fg, bg) {
    // Beijing No.4 High School: the character 四 cut into a round seal.
    circle(ctx, 50, 50, 47, fg);
    circle(ctx, 50, 50, 42, bg);
    circle(ctx, 50, 50, 39, fg);
    ctx.fillStyle = bg;
    ctx.fillRect(25, 28, 50, 6);
    ctx.fillRect(25, 28, 6, 44);
    ctx.fillRect(69, 28, 6, 44);
    ctx.fillRect(25, 66, 50, 6);
    fillPath(ctx, 'M41 34 H47 C47 46 44 54 34 60 L31 55 C39 50 41 44 41 34Z', bg);
    fillPath(ctx, 'M54 34 H60 V52 C60 55 61 56 64 56 H69 V61 H62 C56 61 54 58 54 53Z', bg);
  },
  rdfz(ctx, fg, bg, accent) {
    // RDFZ: the dark blade and the bright peak of its 1950 badge.
    fillPath(ctx, 'M10 84 L58 14 L70 26 L30 84Z', fg);
    fillPath(ctx, 'M46 84 L68 46 L92 84 H82 C80 70 72 64 64 64 C56 64 50 72 50 84Z', accent || fg);
  },
  bj8(ctx, fg, bg, accent) {
    // Beijing No.8 High School: the 八 standing over a 人 in a round seal.
    circle(ctx, 50, 50, 47, fg);
    circle(ctx, 50, 50, 42, bg);
    fillPath(ctx, 'M46 10 L46 30 L36 42 H22Z M54 10 L54 30 L64 42 H78Z', accent || fg);
    fillPath(ctx, 'M38 48 H62 L86 74 H14Z', accent || fg);
    fillPath(ctx, 'M34 60 H42 L39 66 H31Z M58 60 H66 L69 66 H61Z', bg);
  },
  cnuhs(ctx, fg, bg) {
    // Capital Normal University High School: a wheat wreath round an open book, 1914.
    ctx.save();
    ctx.strokeStyle = fg;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(50, 52, 40, Math.PI * .45, Math.PI * 1.55);
    ctx.stroke();
    ctx.fillStyle = fg;
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (.5 + i * .12);
      ctx.save();
      ctx.translate(50 + 40 * Math.cos(a), 52 + 40 * Math.sin(a));
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, -5, 3, 7, .6, 0, TAU);
      ctx.ellipse(0, 5, 3, 7, -.6, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    fillPath(ctx, 'M28 58 C38 52 46 54 50 60 C54 54 62 52 72 58 V68 C62 62 54 64 50 70 C46 64 38 62 28 68Z', fg);
    fillPath(ctx, 'M40 46 C44 34 56 30 66 32 C58 36 52 40 50 50 C48 44 44 44 40 46Z', fg);
  },
  puckman(ctx, fg, bg) {
    // RPI's Puckman: a hockey puck in an engineer's hard hat, crossed sticks behind.
    ctx.save();
    ctx.lineCap = 'round';
    line(ctx, fg, 6, [14, 92, 70, 22]);
    line(ctx, fg, 6, [86, 92, 30, 22]);
    fillPath(ctx, 'M8 92 L14 92 L22 82 L16 80Z M92 92 L86 92 L78 82 L84 80Z', fg);
    ctx.restore();
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.ellipse(50, 66, 28, 9, 0, 0, TAU);
    ctx.fill();
    ctx.fillRect(22, 52, 56, 14);
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.ellipse(50, 52, 28, 9, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.ellipse(50, 52, 25, 7, 0, 0, TAU);
    ctx.fill();
    fillPath(ctx, 'M24 44 C24 26 36 18 50 18 C64 18 76 26 76 44 H84 V48 H16 V44Z', fg);
    ctx.fillStyle = bg;
    ctx.fillRect(47, 20, 6, 24);
    circle(ctx, 41, 58, 3, bg);
    circle(ctx, 59, 58, 3, bg);
  },
  im(ctx, fg, bg) {
    // Inter's round IM badge: the I down the middle, the M's legs bending round it.
    circle(ctx, 50, 50, 48, fg);
    circle(ctx, 50, 50, 41, bg);
    circle(ctx, 50, 50, 37, fg);
    ctx.fillStyle = bg;
    ctx.fillRect(45, 18, 10, 64);
    ctx.strokeStyle = bg;
    ctx.lineWidth = 7;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(50 + side * 22, 78);
      ctx.bezierCurveTo(50 + side * 30, 56, 50 + side * 28, 30, 50 + side * 12, 22);
      ctx.stroke();
    }
  },
  yanan(ctx, fg, bg) {
    // Pagoda Hill and the Yan River bridge, from BIT's emblem and its 1940 start in Yan'an.
    fillPath(ctx, 'M2 62 C20 44 34 40 50 40 C66 40 80 44 98 62Z', fg);
    ctx.fillStyle = fg;
    for (let k = 0; k < 6; k++) {
      const y = 41 - k * 5;
      const half = 7 - k * .7;
      ctx.fillRect(50 - half, y - 5, half * 2, 3.6);
      fillPath(ctx, `M${50 - half - 2.5} ${y - 1.4} H${50 + half + 2.5} L${50 + half} ${y - 4} H${50 - half}Z`, fg);
    }
    fillPath(ctx, 'M48 12 L50 3 L52 12Z', fg);
    ctx.fillStyle = fg;
    ctx.fillRect(2, 66, 96, 28);
    ctx.fillStyle = bg;
    ctx.fillRect(2, 72, 96, 1.6);
    for (const x of [18, 50, 82]) {
      ctx.beginPath();
      ctx.moveTo(x - 12, 95);
      ctx.lineTo(x - 12, 88);
      ctx.arc(x, 88, 12, Math.PI, 0);
      ctx.lineTo(x + 12, 95);
      ctx.closePath();
      ctx.fill();
    }
  },
};

// Draws `motif` scaled into a square of `size` centred on (cx, cy).
export function drawMotif(ctx, name, cx, cy, size, fg, bg, accent) {
  const draw = motifs[name];
  if (!draw) return;
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(size / 100, size / 100);
  ctx.lineCap = 'butt';
  draw(ctx, fg, bg, accent);
  ctx.restore();
}

// ---------- Patterns ----------

export function houndstooth(ctx, x, y, w, h, s, colour) {
  ctx.fillStyle = colour;
  for (let py = y - s; py < y + h + s; py += s) {
    for (let px = x - s; px < x + w + s; px += s) {
      // One tooth: a square with two pointed tabs.
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + s / 2, py);
      ctx.lineTo(px + s, py - s / 2);
      ctx.lineTo(px + s, py);
      ctx.lineTo(px + s / 2, py + s / 2);
      ctx.lineTo(px + s / 2, py + s);
      ctx.lineTo(px, py + s / 2);
      ctx.lineTo(px - s / 2, py + s);
      ctx.lineTo(px - s / 2, py + s / 2);
      ctx.closePath();
      ctx.fill();
    }
  }
}

export function lozenges(ctx, x, y, w, h, s, colour, skew = .3) {
  ctx.fillStyle = colour;
  const dy = s * .8;
  for (let row = -1, py = y - dy; py < y + h + dy; row++, py += dy) {
    for (let px = x - s + (row % 2 ? s / 2 : 0); px < x + w + s; px += s) {
      ctx.beginPath();
      ctx.moveTo(px, py - dy * (1 - skew));
      ctx.lineTo(px + s / 2, py);
      ctx.lineTo(px, py + dy * (1 - skew));
      ctx.lineTo(px - s / 2, py);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function argyle(ctx, x, y, w, h, s, fill, alt, thread) {
  for (let row = 0, py = y; py < y + h + s; row++, py += s) {
    for (let col = 0, px = x; px < x + w + s / 2; col++, px += s * .66) {
      ctx.fillStyle = (row + col) % 2 ? fill : alt;
      ctx.beginPath();
      ctx.moveTo(px, py - s / 2);
      ctx.lineTo(px + s * .33, py);
      ctx.lineTo(px, py + s / 2);
      ctx.lineTo(px - s * .33, py);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.strokeStyle = thread;
  ctx.lineWidth = Math.max(1, s * .04);
  ctx.setLineDash([s * .1, s * .08]);
  for (let px = x - h; px < x + w + h; px += s * .66) {
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(px + h * .66, y + h);
    ctx.moveTo(px, y);
    ctx.lineTo(px - h * .66, y + h);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function parquet(ctx, x, y, w, h, s, light, dark) {
  // The Garden's parquet: squares of five boards, turned every other square.
  for (let row = 0, py = y; py < y + h; row++, py += s) {
    for (let col = 0, px = x; px < x + w; col++, px += s) {
      const across = (row + col) % 2;
      for (let k = 0; k < 5; k++) {
        ctx.fillStyle = k % 2 ? light : dark;
        if (across) ctx.fillRect(px, py + k * s / 5, s, s / 5);
        else ctx.fillRect(px + k * s / 5, py, s / 5, s);
      }
    }
  }
}

function hardwood(ctx, x, y, w, h, s, base, seed = 7) {
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, h);
  let n = seed;
  for (let px = x, col = 0; px < x + w; px += s, col++) {
    for (let py = y - ((col * 37) % 5) * s; py < y + h;) {
      n = (n * 1103515245 + 12345) & 0x7fffffff;
      const len = s * (5 + n % 7);
      ctx.fillStyle = `rgba(${n % 2 ? '255,230,190' : '60,30,10'},${.04 + (n % 5) * .018})`;
      ctx.fillRect(px, py, s, len);
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      ctx.fillRect(px, py, Math.max(1, s * .05), len);
      ctx.fillRect(px, py, s, Math.max(1, s * .04));
      py += len;
    }
  }
}

// Fills a rectangle with a team's kit pattern.
export function kit(ctx, team, x, y, w, h, m) {
  const p = team.kit || 'mesh';
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = team.c1;
  ctx.fillRect(x, y, w, h);
  if (p === 'stripes') {
    const n = team.stripes || 9;
    const sw = w / n;
    ctx.fillStyle = team.stripe || team.c2;
    for (let k = 1; k < n; k += 2) ctx.fillRect(x + k * sw, y, sw, h);
  } else if (p === 'hechter') {
    // Paris: navy, a red band down the middle edged in white.
    const band = w * .22;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + w / 2 - band / 2 - w * .025, y, band + w * .05, h);
    ctx.fillStyle = team.c2;
    ctx.fillRect(x + w / 2 - band / 2, y, band, h);
  } else if (p === 'pinstripe') {
    ctx.fillStyle = team.pin || team.c2;
    ctx.globalAlpha = .55;
    for (let px = x + m * .4; px < x + w; px += m * .55) ctx.fillRect(px, y, Math.max(1, m * .035), h);
    ctx.globalAlpha = 1;
  } else if (p === 'lozenge') {
    ctx.globalAlpha = .13;
    lozenges(ctx, x, y, w, h, m * .9, '#ffffff', .25);
    ctx.globalAlpha = 1;
  } else if (p === 'parquet') {
    ctx.globalAlpha = .12;
    parquet(ctx, x, y, w, h, m * .9, '#ffffff', 'rgba(0,0,0,0)');
    ctx.globalAlpha = 1;
  } else if (p === 'tone') {
    // Tone-on-tone stripes, the way many modern kits are woven.
    ctx.fillStyle = 'rgba(255,255,255,.07)';
    for (let px = x; px < x + w; px += m * 1.2) ctx.fillRect(px, y, m * .6, h);
  } else if (p === 'waves') {
    ctx.strokeStyle = 'rgba(255,255,255,.1)';
    ctx.lineWidth = m * .14;
    for (let py = y; py < y + h + m; py += m * .7) {
      ctx.beginPath();
      for (let px = x; px <= x + w; px += m * .2) ctx.lineTo(px, py + Math.sin(px / (m * 1.4)) * m * .2);
      ctx.stroke();
    }
  }
  // Fine mesh over everything, like jersey fabric.
  const dark = luminanceOf(team.c1) < .3;
  const size = Math.max(4, Math.round(m * .09));
  ctx.fillStyle = dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.07)';
  if (size * 30 < w) {
    const tile = makeTile(size, dark);
    if (tile) {
      ctx.fillStyle = ctx.createPattern(tile, 'repeat');
      ctx.fillRect(x, y, w, h);
    }
  }
  ctx.restore();
}

const tiles = new Map();
function makeTile(size, dark) {
  const key = `${size}${dark}`;
  if (tiles.has(key)) return tiles.get(key);
  if (typeof document === 'undefined') return null;
  const tile = document.createElement('canvas');
  tile.width = tile.height = size;
  const t = tile.getContext('2d');
  t.fillStyle = dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.08)';
  t.beginPath();
  t.arc(size / 2, size / 2, size * .22, 0, TAU);
  t.fill();
  tiles.set(key, tile);
  return tile;
}

export function luminanceOf(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map(v => {
    v /= 255;
    return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4);
  });
  return .2126 * r + .7152 * g + .0722 * b;
}

// A band of trim: argyle, houndstooth, fiesta stripes, rugby hoops and so on.
export function trim(ctx, team, x, y, w, h) {
  const t = team.trim || 'bars';
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (t === 'argyle') {
    argyle(ctx, x, y, w, h, h * 1.2, team.c1, team.c2, '#ffffff');
  } else if (t === 'houndstooth') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, w, h);
    houndstooth(ctx, x, y, w, h, h / 3, team.c1);
  } else if (t === 'fiesta') {
    const colours = ['#00b2a9', '#ef426f', '#ff8200'];
    colours.forEach((colour, k) => {
      ctx.fillStyle = colour;
      ctx.fillRect(x, y + k * h / 3, w, h / 3);
    });
  } else if (t === 'lozenge') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, w, h);
    lozenges(ctx, x, y, w, h, h * .6, '#0066b2', .3);
  } else if (t === 'checker') {
    const s = h / 2;
    for (let px = x, k = 0; px < x + w; px += s, k++) {
      for (let row = 0; row < 2; row++) {
        ctx.fillStyle = (k + row) % 2 ? team.c1 : team.c2;
        ctx.fillRect(px, y + row * s, s, s);
      }
    }
  } else if (t === 'candystripe') {
    // Indiana's candy-striped warm-up pants: crimson and white upright stripes.
    const s = Math.max(2, h * .45);
    for (let px = x, k = 0; px < x + w; px += s, k++) {
      ctx.fillStyle = k % 2 ? '#ffffff' : team.c1;
      ctx.fillRect(px, y, s, h);
    }
  } else if (t === 'senyera') {
    ctx.fillStyle = '#edbb00';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#da291c';
    for (let k = 0; k < 4; k++) ctx.fillRect(x, y + h * (k * 2 + 1) / 9, w, h / 9);
  } else if (t === 'tricolore') {
    ['#002395', '#ffffff', '#ed2939'].forEach((colour, k) => {
      ctx.fillStyle = colour;
      ctx.fillRect(x + k * w / 3, y, w / 3, h);
    });
  } else {
    // Bars: c2, c3, c2, like sleeve stripes on a football or rugby shirt.
    ctx.fillStyle = team.c2;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = team.c3;
    ctx.fillRect(x, y + h * .36, w, h * .28);
  }
  ctx.restore();
}

// ---------- Venues ----------

// The home floor, pitch or field, for the page behind the preview and for cards.
export function venue(ctx, team, w, h) {
  const kind = team.floor || 'hardwood';
  const u = Math.min(w, h) / 100;
  ctx.save();
  if (kind === 'parquet') {
    ctx.fillStyle = '#b5773e';
    ctx.fillRect(0, 0, w, h);
    parquet(ctx, 0, 0, w, h, u * 14, 'rgba(255,220,170,.22)', 'rgba(80,40,10,.18)');
    courtLines(ctx, team, w, h, u);
  } else if (kind === 'hardwood') {
    hardwood(ctx, 0, 0, w, h, u * 4.2, '#c08a52');
    courtLines(ctx, team, w, h, u);
  } else if (kind === 'pitch') {
    const band = Math.max(u * 12, 30);
    for (let y = 0, k = 0; y < h; y += band, k++) {
      ctx.fillStyle = k % 2 ? '#2f7d36' : '#3a8c40';
      ctx.fillRect(0, y, w, band);
    }
    ctx.strokeStyle = 'rgba(255,255,255,.85)';
    ctx.lineWidth = Math.max(2, u * .7);
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, Math.min(w, h) * .2, 0, TAU);
    ctx.stroke();
    circle(ctx, w / 2, h / 2, Math.max(3, u), 'rgba(255,255,255,.9)');
    const box = Math.min(w * .6, u * 70);
    ctx.strokeRect(w / 2 - box / 2, -2, box, h * .14);
    ctx.strokeRect(w / 2 - box / 2, h - h * .14 + 2, box, h * .14);
  } else if (kind === 'ice') {
    // A hockey rink: white ice, red centre line, blue lines, the logo circle in the team colour.
    ctx.fillStyle = '#eef4f8';
    ctx.fillRect(0, 0, w, h);
    for (let k = 0; k < 60; k++) {
      ctx.strokeStyle = `rgba(150,180,200,${.08 + (k % 5) * .02})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const y = (k * 37 % 100) / 100 * h;
      ctx.moveTo(0, y);
      ctx.lineTo(w, y + (k % 7 - 3) * u * 4);
      ctx.stroke();
    }
    const bar = Math.max(4, u * 1.6);
    ctx.fillStyle = '#c8102e';
    ctx.fillRect(0, h / 2 - bar / 2, w, bar);
    ctx.fillStyle = '#1f4fa3';
    ctx.fillRect(0, h * .3 - bar / 2, w, bar);
    ctx.fillRect(0, h * .7 - bar / 2, w, bar);
    ctx.lineWidth = Math.max(2, u * .5);
    ctx.strokeStyle = '#1f4fa3';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, Math.min(w, h) * .16, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = '#c8102e';
    for (const [x, y] of [[.25, .14], [.75, .14], [.25, .86], [.75, .86]]) {
      ctx.beginPath();
      ctx.arc(w * x, h * y, Math.min(w, h) * .12, 0, TAU);
      ctx.stroke();
      circle(ctx, w * x, h * y, Math.max(3, u * 1.2), '#c8102e');
    }
    ctx.fillStyle = team.c1;
    ctx.globalAlpha = .9;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, Math.min(w, h) * .1, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (kind === 'track') {
    // A school field: the red running track round a green pitch, lanes and the name in white.
    ctx.fillStyle = '#b7412e';
    ctx.fillRect(0, 0, w, h);
    const lanes = 6;
    const lane = Math.max(u * 2.6, 8);
    ctx.strokeStyle = 'rgba(255,255,255,.8)';
    ctx.lineWidth = Math.max(1.5, u * .35);
    const inset = lane * lanes;
    for (let k = 0; k <= lanes; k++) {
      const d = k * lane;
      const r = Math.max(10, w / 2 - inset + d);
      ctx.beginPath();
      ctx.moveTo(w / 2 - r, h * .28);
      ctx.lineTo(w / 2 - r, h * .72);
      ctx.arc(w / 2, h * .72, r, Math.PI, 0, true);
      ctx.lineTo(w / 2 + r, h * .28);
      ctx.arc(w / 2, h * .28, r, 0, Math.PI, true);
      ctx.stroke();
    }
    const r0 = Math.max(10, w / 2 - inset);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(w / 2 - r0, h * .28);
    ctx.lineTo(w / 2 - r0, h * .72);
    ctx.arc(w / 2, h * .72, r0, Math.PI, 0, true);
    ctx.lineTo(w / 2 + r0, h * .28);
    ctx.arc(w / 2, h * .28, r0, 0, Math.PI, true);
    ctx.clip();
    const band = Math.max(u * 10, 26);
    for (let y = 0, k = 0; y < h; y += band, k++) {
      ctx.fillStyle = k % 2 ? '#2f7d36' : '#3a8c40';
      ctx.fillRect(0, y, w, band);
    }
    ctx.strokeStyle = 'rgba(255,255,255,.8)';
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, Math.min(w, h) * .14, 0, TAU);
    ctx.stroke();
    ctx.restore();
  } else if (kind === 'cosmos' || kind === 'hall' || kind === 'teyvat') {
    // Space for the Ultra heroes (the Land of Light glowing below), the Great Hall's
    // enchanted ceiling with floating candles, or Teyvat's night sky with its
    // constellations.
    const dark = mixHex(team.c1, '#03030c', .78);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#03030c');
    g.addColorStop(.55, dark);
    g.addColorStop(1, mixHex(team.c1, '#03030c', kind === 'hall' ? .7 : .45));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // Nebulae in the team's colours.
    for (const [x, y, r, c, a] of [[.2, .3, .5, team.c1, .35], [.8, .55, .45, team.c2, .22], [.5, .85, .6, team.accent || team.c3, .18]]) {
      const n = ctx.createRadialGradient(w * x, h * y, 0, w * x, h * y, Math.max(w, h) * r);
      n.addColorStop(0, hexA(c, a));
      n.addColorStop(1, hexA(c, 0));
      ctx.fillStyle = n;
      ctx.fillRect(0, 0, w, h);
    }
    // Stars, the same every time.
    for (let k = 0; k < 160; k++) {
      const x = (k * 73.13 % 100) / 100 * w;
      const y = (k * 41.71 % 100) / 100 * h;
      const r = Math.max(.6, u * (.12 + (k % 7) * .05));
      circle(ctx, x, y, r, `rgba(255,255,255,${.35 + (k % 5) * .13})`);
    }
    if (kind === 'cosmos') {
      // The planet's rim of light at the foot.
      const R = Math.max(w, h) * 1.4;
      const rim = ctx.createRadialGradient(w / 2, h + R * .86, R * .9, w / 2, h + R * .86, R);
      rim.addColorStop(0, hexA(team.c2, .0));
      rim.addColorStop(.85, hexA(team.accent || team.c2, .55));
      rim.addColorStop(1, hexA('#ffffff', 0));
      ctx.fillStyle = rim;
      ctx.fillRect(0, 0, w, h);
      star(ctx, w * .82, h * .18, u * 3, 'rgba(255,255,255,.9)', 4, .18);
    } else if (kind === 'hall') {
      for (let k = 0; k < 18; k++) {
        const x = ((k * 37 + 11) % 100) / 100 * w;
        const y = ((k * 59 + 7) % 70) / 100 * h + u * 4;
        const s = u * (1.1 + (k % 3) * .35);
        const glow = ctx.createRadialGradient(x, y - s * 1.6, 0, x, y - s * 1.6, s * 5);
        glow.addColorStop(0, 'rgba(255,214,120,.55)');
        glow.addColorStop(1, 'rgba(255,214,120,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(x - s * 5, y - s * 6.6, s * 10, s * 10);
        ctx.fillStyle = '#f3ead2';
        ctx.fillRect(x - s * .45, y - s * .6, s * .9, s * 3.4);
        ctx.fillStyle = '#ffcf5a';
        ctx.beginPath();
        ctx.ellipse(x, y - s * 1.3, s * .4, s * .8, 0, 0, TAU);
        ctx.fill();
      }
    } else {
      // A constellation: stars joined by fine golden lines round a ring.
      ctx.strokeStyle = 'rgba(240,215,150,.5)';
      ctx.lineWidth = Math.max(1, u * .2);
      const cx = w / 2;
      const cy = h * .42;
      const R = Math.min(w, h) * .34;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.08, 0, TAU);
      ctx.stroke();
      const pts = [[-.6, -.2], [-.25, -.55], [.15, -.3], [.55, -.5], [.4, .1], [-.05, .35], [-.45, .25]];
      ctx.beginPath();
      pts.forEach(([x, y], k) => (k ? ctx.lineTo : ctx.moveTo).call(ctx, cx + x * R, cy + y * R));
      ctx.stroke();
      for (const [x, y] of pts) star(ctx, cx + x * R, cy + y * R, u * 1.6, '#fff4cf', 4, .25);
    }
  } else if (kind === 'meadow') {
    // A picnic meadow: pastel grass, little flowers and a checked picnic cloth.
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#dff3d8');
    g.addColorStop(1, '#bfe3b0');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const cloth = Math.min(w, h) * .5;
    const cell = cloth / 6;
    ctx.save();
    ctx.translate(w / 2, h * .55);
    ctx.rotate(-.12);
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 6; x++) {
        ctx.fillStyle = (x + y) % 2 ? '#ffffff' : hexA(team.accent || team.c1, .55);
        ctx.fillRect(-cloth / 2 + x * cell, -cloth / 2 + y * cell, cell, cell);
      }
    }
    ctx.restore();
    for (let k = 0; k < 60; k++) {
      const x = (k * 61.7 % 100) / 100 * w;
      const y = (k * 37.3 % 100) / 100 * h;
      const r = u * (1 + (k % 3) * .4);
      const c = ['#ffffff', '#ffd6e0', '#fff2a8', '#cfe6ff'][k % 4];
      for (let p = 0; p < 5; p++) {
        const a = p * TAU / 5;
        circle(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, r * .8, c);
      }
      circle(ctx, x, y, r * .55, '#ffcf5a');
    }
  } else if (kind === 'vice') {
    // A neon beach at sunset: the sun sinking into a striped sea, palms on the shore.
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#2a0b4a');
    g.addColorStop(.45, '#ff2d95');
    g.addColorStop(.62, '#ffb347');
    g.addColorStop(.62, '#123a6b');
    g.addColorStop(1, '#0a1a3a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const sea = h * .62;
    const R = Math.min(w, h) * .24;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, sea);
    ctx.clip();
    const sun = ctx.createLinearGradient(0, sea - R * 2, 0, sea);
    sun.addColorStop(0, '#fff176');
    sun.addColorStop(1, '#ff6f61');
    circle(ctx, w / 2, sea, R * 1.2, sun);
    ctx.fillStyle = '#ff2d95';
    for (let k = 1; k < 6; k++) ctx.fillRect(0, sea - R * 1.2 + k * R * .22, w, Math.max(2, k * u * .35));
    ctx.restore();
    ctx.strokeStyle = 'rgba(45,226,230,.55)';
    ctx.lineWidth = Math.max(1, u * .3);
    for (let y = sea + u * 3, k = 1; y < h; y += u * 2 * k, k++) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let k = 0; k < 9; k++) {
      const x = w / 2 + (k - 4) * w * .14;
      ctx.beginPath();
      ctx.moveTo(w / 2 + (k - 4) * u * 2, sea);
      ctx.lineTo(x * 1.8 - w * .4, h);
      ctx.stroke();
    }
    const palm = (x, s, flip) => {
      ctx.save();
      ctx.translate(x, sea);
      ctx.scale(flip ? -s : s, s);
      ctx.strokeStyle = '#14082a';
      ctx.lineCap = 'round';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-4, -30, 6, -60);
      ctx.stroke();
      ctx.lineWidth = 2.5;
      for (const [dx, dy, cx, cy] of [[-26, -50, -14, -72], [28, -54, 16, -74], [-20, -38, -18, -56], [24, -40, 20, -58], [2, -82, 0, -76]]) {
        ctx.beginPath();
        ctx.moveTo(6, -60);
        ctx.quadraticCurveTo(cx, cy, dx, dy);
        ctx.stroke();
      }
      ctx.restore();
    };
    palm(w * .1, u * .9, false);
    palm(w * .9, u * 1.1, true);
    palm(w * .2, u * .6, true);
  } else if (kind === 'battle') {
    // A battle field: mown grass, the halfway line and a Poké Ball at the centre.
    const band = Math.max(u * 11, 28);
    for (let y = 0, k = 0; y < h; y += band, k++) {
      ctx.fillStyle = k % 2 ? '#5fb043' : '#6cbd4e';
      ctx.fillRect(0, y, w, band);
    }
    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.lineWidth = Math.max(2, u * .8);
    const m = u * 6;
    ctx.strokeRect(m, m, w - m * 2, h - m * 2);
    ctx.beginPath();
    ctx.moveTo(m, h / 2);
    ctx.lineTo(w - m, h / 2);
    ctx.stroke();
    const r = Math.min(w, h) * .2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, r, 0, TAU);
    ctx.clip();
    ctx.fillStyle = '#e3350d';
    ctx.fillRect(w / 2 - r, h / 2 - r, r * 2, r);
    ctx.fillStyle = '#f4f4f4';
    ctx.fillRect(w / 2 - r, h / 2, r * 2, r);
    ctx.restore();
    ctx.lineWidth = Math.max(3, r * .1);
    ctx.strokeStyle = '#222222';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, r, 0, TAU);
    ctx.moveTo(w / 2 - r, h / 2);
    ctx.lineTo(w / 2 + r, h / 2);
    ctx.stroke();
    circle(ctx, w / 2, h / 2, r * .3, '#222222');
    circle(ctx, w / 2, h / 2, r * .2, '#f4f4f4');
  } else if (kind === 'duel') {
    // A duel field: a dark mat, glowing card zones and a hexagon grid.
    ctx.fillStyle = '#0b0614';
    ctx.fillRect(0, 0, w, h);
    const s = Math.max(u * 6, 16);
    ctx.strokeStyle = hexA(team.accent || team.c2, .14);
    ctx.lineWidth = 1;
    for (let y = 0, row = 0; y < h + s; y += s * .87, row++) {
      for (let x = (row % 2) * s * .75; x < w + s; x += s * 1.5) {
        ctx.beginPath();
        for (let k = 0; k < 6; k++) ctx.lineTo(x + Math.cos(k * Math.PI / 3) * s / 2, y + Math.sin(k * Math.PI / 3) * s / 2);
        ctx.closePath();
        ctx.stroke();
      }
    }
    const zw = Math.min(w / 6.4, u * 16);
    const zh = zw * 1.45;
    ctx.lineWidth = Math.max(2, u * .5);
    for (const row of [h * .2, h * .8 - zh]) {
      for (let k = 0; k < 5; k++) {
        const x = w / 2 + (k - 2.5) * zw * 1.18 + zw * .09;
        ctx.fillStyle = hexA(team.c1, .25);
        ctx.fillRect(x, row, zw, zh);
        ctx.strokeStyle = hexA(team.accent || '#ffd36b', .75);
        ctx.strokeRect(x, row, zw, zh);
      }
    }
    const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * .5);
    glow.addColorStop(0, hexA(team.c1, .45));
    glow.addColorStop(1, hexA(team.c1, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  } else if (kind === 'arena') {
    // A stone ring: square tiles with worn grout, like a tournament stage.
    ctx.fillStyle = '#c9c2b2';
    ctx.fillRect(0, 0, w, h);
    const t = Math.max(u * 12, 30);
    for (let y = 0; y < h; y += t) {
      for (let x = 0; x < w; x += t) {
        const n = (Math.floor(x * 7 + y * 13) & 255) / 255;
        ctx.fillStyle = `hsl(42, ${8 + n * 8}%, ${70 + n * 10}%)`;
        ctx.fillRect(x + 1.5, y + 1.5, t - 3, t - 3);
      }
    }
    ctx.fillStyle = hexA(team.c1, .85);
    const edge = Math.max(u * 3, 8);
    ctx.fillRect(0, 0, w, edge);
    ctx.fillRect(0, h - edge, w, edge);
  } else if (kind === 'ocean') {
    // The open sea: deep blue, swell lines and a compass rose.
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0a5c9e');
    g.addColorStop(1, '#063a66');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,.16)';
    ctx.lineWidth = Math.max(1.5, u * .5);
    for (let y = u * 4, k = 0; y < h; y += u * 7, k++) {
      ctx.beginPath();
      for (let x = -u * 8 + (k % 2) * u * 6; x < w + u * 8; x += u * 12) {
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + u * 3, y - u * 2.2, x + u * 6, y);
      }
      ctx.stroke();
    }
    const R = Math.min(w, h) * .2;
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.strokeStyle = 'rgba(255,240,200,.45)';
    ctx.lineWidth = Math.max(1.5, u * .4);
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,240,200,.4)';
    for (let k = 0; k < 8; k++) {
      ctx.rotate(Math.PI / 4);
      ctx.beginPath();
      ctx.moveTo(0, -R * (k % 2 ? .7 : 1.15));
      ctx.lineTo(R * .1, 0);
      ctx.lineTo(-R * .1, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  } else if (kind === 'canyon') {
    // The canyon map: jungle green, a river across, and the lanes from base to base.
    ctx.fillStyle = '#1f3b2a';
    ctx.fillRect(0, 0, w, h);
    for (let k = 0; k < 70; k++) {
      const x = (k * 61.7 % 100) / 100 * w;
      const y = (k * 37.3 % 100) / 100 * h;
      ctx.fillStyle = k % 2 ? 'rgba(60,110,70,.5)' : 'rgba(20,45,30,.6)';
      ctx.beginPath();
      ctx.ellipse(x, y, u * 5, u * 3.5, k, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(70,160,220,.55)';
    ctx.lineWidth = Math.max(8, u * 5);
    ctx.beginPath();
    ctx.moveTo(0, h * .15);
    ctx.bezierCurveTo(w * .4, h * .35, w * .6, h * .65, w, h * .85);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(214,190,140,.7)';
    ctx.lineWidth = Math.max(5, u * 3);
    const a = [w * .12, h * .88];
    const b = [w * .88, h * .12];
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
    ctx.moveTo(a[0], a[1]); ctx.lineTo(a[0], b[1]); ctx.lineTo(b[0], b[1]);
    ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], a[1]); ctx.lineTo(b[0], b[1]);
    ctx.stroke();
    circle(ctx, a[0], a[1], u * 6, '#2f7be0');
    circle(ctx, b[0], b[1], u * 6, '#d8383a');
    circle(ctx, a[0], a[1], u * 3, '#bfe0ff');
    circle(ctx, b[0], b[1], u * 3, '#ffc2c2');
  } else if (kind === 'gridiron') {
    ctx.fillStyle = '#2e7a34';
    ctx.fillRect(0, 0, w, h);
    const step = Math.max(u * 10, 26);
    for (let y = 0, k = 0; y < h; y += step, k++) {
      ctx.fillStyle = k % 2 ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.05)';
      ctx.fillRect(0, y, w, step);
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      ctx.fillRect(0, y, w, Math.max(2, u * .5));
      for (const hx of [w * .38, w * .62]) {
        for (let t = 1; t < 5; t++) ctx.fillRect(hx - u, y + t * step / 5, u * 2, Math.max(1, u * .3));
      }
      if (k % 2 === 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        ctx.font = `400 ${Math.round(step * .5)}px "HOT Display", Impact, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const yard = String(Math.min(50, 10 + k * 5)).replace(/^(\d)$/, '$1');
        ctx.fillText(yard, w * .1, y + step * .5);
        ctx.fillText(yard, w * .9, y + step * .5);
        ctx.restore();
      }
    }
    // End zone painted in the team colour with the name.
    ctx.fillStyle = team.c1;
    ctx.fillRect(0, h - step * 1.6, w, step * 1.6);
    ctx.fillStyle = team.ink;
    ctx.font = `400 ${Math.round(step * 1.1)}px "HOT Display", Impact, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(team.short, w / 2, h - step * .8);
  } else {
    // Campus: old brick with ivy shadows.
    ctx.fillStyle = '#5d2e22';
    ctx.fillRect(0, 0, w, h);
    const bh = Math.max(u * 4, 10);
    const bw = bh * 2.4;
    for (let y = 0, row = 0; y < h; y += bh, row++) {
      for (let x = -(row % 2) * bw / 2; x < w; x += bw) {
        const n = (Math.floor(x * 13 + y * 7) & 255) / 255;
        ctx.fillStyle = `hsl(${10 + n * 10}, ${34 + n * 12}%, ${26 + n * 9}%)`;
        ctx.fillRect(x + 1, y + 1, bw - 2, bh - 2);
      }
    }
    ctx.fillStyle = 'rgba(20,60,28,.5)';
    for (let k = 0; k < 40; k++) {
      const x = (k * 97 % 100) / 100 * w;
      const y = (k * 53 % 100) / 100 * h * .5;
      ctx.beginPath();
      ctx.ellipse(x, y, u * 6, u * 4, k, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

function courtLines(ctx, team, w, h, u) {
  // The key painted in the team colour, the three-point arc and centre circle.
  const cx = w / 2;
  const laneW = Math.min(w * .34, u * 40);
  const laneH = h * .34;
  ctx.fillStyle = team.paint || team.c1;
  ctx.globalAlpha = .92;
  ctx.fillRect(cx - laneW / 2, h - laneH, laneW, laneH);
  ctx.fillRect(cx - laneW / 2, 0, laneW, laneH);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(255,255,255,.9)';
  ctx.lineWidth = Math.max(2, u * .6);
  ctx.strokeRect(cx - laneW / 2, h - laneH, laneW, laneH);
  ctx.strokeRect(cx - laneW / 2, -2, laneW, laneH + 2);
  for (const [y, dir] of [[h - laneH, -1], [laneH, 1]]) {
    ctx.beginPath();
    ctx.arc(cx, y, laneW / 2, dir < 0 ? Math.PI : 0, dir < 0 ? TAU : Math.PI);
    ctx.stroke();
  }
  const three = Math.min(w * .46, u * 60);
  ctx.beginPath();
  ctx.arc(cx, h, three, Math.PI, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, 0, three, 0, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, h / 2, laneW / 2, 0, TAU);
  ctx.fillStyle = team.paint || team.c1;
  ctx.fill();
  ctx.stroke();
}
