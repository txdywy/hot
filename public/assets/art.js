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
