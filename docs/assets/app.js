import {groups, teams, styles, slogans, byId} from './teams.js?v=1';
import {layout, paint, demoPhoto, luminance} from './render.js?v=1';
import {photoDate} from './photo-date.js?v=1';

const $ = id => document.getElementById(id);
const preview = $('preview');
const nameInput = $('name');
const numberInput = $('number');
const sloganInput = $('slogan');
const dateInput = $('date');

const state = {
  group: 'hoops',
  team: byId.get('lakers'),
  style: 'jersey',
  name: '',
  number: null, // null = the team's default number
  slogan: null, // null = the team's default slogan
  date: false,
  image: null,
  taken: null,
  own: false,
};

function pad(n) {
  return String(n);
}

function dateText() {
  if (!state.date) return '';
  const d = state.taken || (() => {
    const now = new Date();
    return {year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate()};
  })();
  return `${d.year}.${pad(d.month)}.${pad(d.day)}`;
}

function words() {
  return {
    name: (state.name.trim() || 'HOME').toUpperCase(),
    number: state.number ?? state.team.number,
    slogan: state.slogan ?? state.team.slogan,
    date: dateText(),
  };
}

function size(image) {
  return [image.naturalWidth || image.width, image.naturalHeight || image.height];
}

let frame = 0;
function render() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    const [w, h] = size(state.image);
    const box = preview.parentElement.getBoundingClientRect();
    const limit = Math.min(1600, Math.max(box.width, box.height) * Math.min(2, devicePixelRatio || 1));
    const L = layout(state.style, w, h, limit);
    paint(preview, state.image, state.team, state.style, words(), L);
    // Fit inside the stage while keeping the ratio.
    const scale = Math.min((box.width - 24) / L.W, (box.height - 24) / L.H);
    preview.style.width = `${Math.floor(L.W * scale)}px`;
    preview.style.height = `${Math.floor(L.H * scale)}px`;
  });
}

function theme() {
  const root = document.documentElement.style;
  const {c1, c2, ink} = state.team;
  root.setProperty('--c1', c1 === '#121212' || c1 === '#111111' ? c2 : c1);
  root.setProperty('--c2', c2);
  root.setProperty('--ink', ink);
  // The brightest team colour that still stands out on the dark page.
  const hl = [c2, state.team.c3, c1].find(c => luminance(c) > .2) || '#ffffff';
  root.setProperty('--hl', hl);
  root.setProperty('--hl-ink', luminance(hl) > .45 ? '#111111' : '#ffffff');
}

function button(tag, className, html) {
  const el = document.createElement(tag);
  el.type = 'button';
  el.className = className;
  el.innerHTML = html;
  return el;
}

function escape(text) {
  return text.replace(/[&<>"]/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[ch]));
}

function drawGroups() {
  const box = $('groups');
  box.textContent = '';
  for (const [id, label, tag] of groups) {
    const chip = button('button', 'chip', `${escape(label)}<small>${escape(tag)}</small>`);
    chip.setAttribute('role', 'tab');
    chip.setAttribute('aria-selected', String(id === state.group));
    chip.addEventListener('click', () => {
      state.group = id;
      // Show the group's first team straight away.
      if (state.team.group !== id) pickTeam(teams.find(t => t.group === id));
      drawGroups();
      drawTeams();
    });
    box.append(chip);
  }
}

function drawTeams() {
  const box = $('teams');
  box.textContent = '';
  for (const t of teams.filter(t => t.group === state.group)) {
    const card = button('button', 'team', `<span class="swatch"></span><b>${escape(t.short)}</b><small>${escape(t.cn)}</small>`);
    card.title = t.name;
    card.setAttribute('aria-label', `${t.name} ${t.cn}`);
    card.setAttribute('role', 'radio');
    card.setAttribute('aria-checked', String(t === state.team));
    const swatch = card.querySelector('.swatch');
    swatch.style.setProperty('--a', t.c1);
    swatch.style.setProperty('--b', t.c2);
    swatch.style.setProperty('--c', t.c3);
    card.addEventListener('click', () => {
      pickTeam(t);
      drawTeams();
    });
    box.append(card);
  }
}

function pickTeam(t) {
  state.team = t;
  numberInput.placeholder = t.number;
  sloganInput.placeholder = t.slogan;
  if (state.number === null) numberInput.value = '';
  if (state.slogan === null) sloganInput.value = '';
  theme();
  drawSlogans();
  render();
}

function drawStyles() {
  const box = $('styles');
  box.textContent = '';
  for (const [id, label, note] of styles) {
    const card = button('button', 'style', `<b>${escape(label)}</b><small>${escape(note)}</small>`);
    card.setAttribute('role', 'radio');
    card.setAttribute('aria-checked', String(id === state.style));
    card.addEventListener('click', () => {
      state.style = id;
      drawStyles();
      render();
    });
    box.append(card);
  }
}

function drawSlogans() {
  const box = $('slogans');
  box.textContent = '';
  const current = state.slogan ?? state.team.slogan;
  for (const text of [state.team.slogan, ...slogans]) {
    const chip = button('button', 'chip', escape(text));
    chip.setAttribute('aria-pressed', String(text === current));
    if (text === current) chip.setAttribute('aria-selected', 'true');
    chip.addEventListener('click', () => {
      state.slogan = text === state.team.slogan ? null : text;
      sloganInput.value = state.slogan ?? '';
      drawSlogans();
      render();
    });
    box.append(chip);
  }
}

nameInput.addEventListener('input', () => {
  state.name = nameInput.value;
  render();
});
numberInput.addEventListener('input', () => {
  numberInput.value = numberInput.value.replace(/\D/g, '').slice(0, 2);
  state.number = numberInput.value || null;
  render();
});
sloganInput.addEventListener('input', () => {
  state.slogan = sloganInput.value.trim() || null;
  drawSlogans();
  render();
});
dateInput.addEventListener('change', () => {
  state.date = dateInput.checked;
  updateDateNote();
  render();
});

function updateDateNote() {
  const note = $('date-note');
  if (!state.own) note.textContent = '印上拍照那天';
  else if (state.taken) note.textContent = `照片是 ${state.taken.year}.${state.taken.month}.${state.taken.day} 拍的`;
  else note.textContent = '照片里没有拍摄日期，印今天';
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Cannot open'));
    };
    img.src = url;
  });
}

$('file').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const [img, taken] = await Promise.all([loadImage(file), photoDate(file)]);
    state.image = img;
    state.taken = taken;
    state.own = true;
    $('pick-text').textContent = '换照片';
    $('stage-note').textContent = '照片只在这台设备上处理，不会上传。';
    updateDateNote();
    render();
  } catch {
    $('stage-note').textContent = '这张照片打不开，换一张试试。';
  }
  event.target.value = '';
});

let resultUrl = '';
$('save').addEventListener('click', () => {
  const [w, h] = size(state.image);
  const L = layout(state.style, w, h, Math.min(3200, Math.max(w, h) * 1.25));
  const canvas = document.createElement('canvas');
  paint(canvas, state.image, state.team, state.style, words(), L);
  canvas.toBlob(blob => {
    if (!blob) return;
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = URL.createObjectURL(blob);
    const name = `HOT-${state.team.id}-${state.style}.jpg`;
    $('result-image').src = resultUrl;
    const download = $('download');
    download.href = resultUrl;
    download.download = name;
    const file = new File([blob], name, {type: 'image/jpeg'});
    // The design preview page can't download or share; press-and-hold still saves.
    const embedded = window.HOT_PREVIEW === true;
    download.hidden = embedded;
    $('result-hint').textContent = embedded ? '预览页里请按住图片（电脑上右键）保存。' : '按住照片可以保存或发给朋友。';
    const share = $('share');
    share.hidden = embedded || !(navigator.canShare && navigator.canShare({files: [file]}));
    share.onclick = () => navigator.share({files: [file]}).catch(() => {});
    $('result').showModal();
  }, 'image/jpeg', .93);
});
$('close').addEventListener('click', () => $('result').close());

// Drag a photo onto the page on a computer.
addEventListener('dragover', event => event.preventDefault());
addEventListener('drop', event => {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  if (!file) return;
  const input = $('file');
  const list = new DataTransfer();
  list.items.add(file);
  input.files = list.files;
  input.dispatchEvent(new Event('change'));
});

state.image = demoPhoto();
drawGroups();
drawTeams();
drawStyles();
pickTeam(state.team);
addEventListener('resize', render);
