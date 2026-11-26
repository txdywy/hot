// The day a photo was taken, from its EXIF data. JPEG, HEIC, WebP and PNG all keep
// EXIF as a TIFF block near the start of the file, so only the first 256 KB is read.
// The date is the camera's local day, kept as plain numbers: turning it into a Date
// would shift it by the time zone and could move it to the day before.
const scanBytes = 256 * 1024;

function readDate(view, start, little, entry) {
  const count = view.getUint32(entry + 4, little);
  if (view.getUint16(entry + 2, little) !== 2 || count < 10) return null;
  const at = start + view.getUint32(entry + 8, little);
  let text = '';
  for (let i = 0; i < 10; i++) text += String.fromCharCode(view.getUint8(at + i));
  const match = /^(\d{4})[:\-](\d{2})[:\-](\d{2})$/.exec(text);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  // Cameras without a set clock write 0000:00:00 or the 1970s.
  if (year < 1980 || year > new Date().getFullYear() + 1 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return {year, month, day};
}

// Tags: 0x9003 taken, 0x9004 digitised (scans), 0x0132 last changed.
function readTiff(view, start) {
  const order = view.getUint16(start);
  const little = order === 0x4949;
  if ((!little && order !== 0x4d4d) || view.getUint16(start + 2, little) !== 42) return null;
  const found = {};
  const walk = offset => {
    const at = start + offset;
    const count = view.getUint16(at, little);
    if (count > 500) return 0;
    let exif = 0;
    for (let i = 0; i < count; i++) {
      const entry = at + 2 + i * 12;
      const tag = view.getUint16(entry, little);
      if (tag === 0x8769) exif = view.getUint32(entry + 8, little);
      else if (tag === 0x0112 && view.getUint16(entry + 2, little) === 3) found.turn = view.getUint16(entry + 8, little);
      else if (tag === 0x9003 || tag === 0x9004 || tag === 0x0132) found[tag] = readDate(view, start, little, entry);
    }
    return exif;
  };
  const exif = walk(view.getUint32(start + 4, little));
  if (exif) walk(exif);
  return {date: found[0x9003] || found[0x9004] || found[0x0132] || null, turn: found.turn || 1};
}

// iOS 12 and 13 have no Blob arrayBuffer; FileReader works everywhere.
export function readStart(file, size = scanBytes) {
  const part = file.slice(0, size);
  if (part.arrayBuffer) return part.arrayBuffer(); // old-ok: checked on the line itself
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(part);
  });
}

// Finds the first TIFF block and reads the date and the EXIF orientation (1 to 8).
async function photoFacts(file) {
  const facts = {date: null, turn: 1};
  try {
    const buffer = await readStart(file);
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i + 8 < bytes.length; i++) {
      // "II*\0" or "MM\0*": the start of a TIFF block.
      const tiff = (bytes[i] === 0x49 && bytes[i + 1] === 0x49 && bytes[i + 2] === 42 && bytes[i + 3] === 0)
        || (bytes[i] === 0x4d && bytes[i + 1] === 0x4d && bytes[i + 2] === 0 && bytes[i + 3] === 42);
      if (!tiff) continue;
      try {
        const found = readTiff(view, i);
        if (!found) continue;
        if (found.turn > 1 && facts.turn === 1) facts.turn = found.turn;
        if (found.date) {
          facts.date = found.date;
          break;
        }
      } catch {
        // A stray match, or a block cut off at the end of what was read: look further.
      }
    }
  } catch {
    // Reading the file failed; the caller falls back to today and upright.
  }
  return facts;
}

export async function photoDate(file) {
  return (await photoFacts(file)).date;
}

// How the camera says the photo should be turned: 1 upright, 3 upside down,
// 6 and 8 a quarter turn, 2/4/5/7 the same mirrored.
export async function photoTurn(file) {
  const turn = (await photoFacts(file)).turn;
  return turn >= 1 && turn <= 8 ? turn : 1;
}
