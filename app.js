/* ScoutLine – Sports Talent Scouting Platform (HTML + CSS + JS, localStorage only) */
'use strict';

/* ---------- constantsnh ---------- */
const POSITIONS = {
  Football: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
  Cricket: ['Batter', 'Bowler', 'All-rounder', 'Wicketkeeper'],
  Basketball: ['Point Guard', 'Shooting Guard', 'Forward', 'Center'],
  Hockey: ['Goalkeeper', 'Defender', 'Midfielder', 'Striker'],
  Athletics: ['Sprinter', 'Middle Distance', 'Long Distance', 'Jumper', 'Thrower'],
  Badminton: ['Singles', 'Doubles'],
  Kabaddi: ['Raider', 'Defender', 'All-rounder'],
};
const METRICS = [['speed', 'Speed'], ['strength', 'Strength'], ['stamina', 'Stamina'], ['agility', 'Agility'], ['skill', 'Skill']];
const COLORS = ['#1fb5a8', '#5a9bf0', '#f0a24b', '#8d7ae6', '#e66f8a', '#3dae6f'];

const SEED = [
  ['Aarav Sharma', 19, 'Football', 'Forward', 'Punjab Youth FC', 'Jalandhar', 178, 70, [86, 72, 78, 84, 88]],
  ['Simran Kaur', 21, 'Hockey', 'Striker', 'Doaba Hockey Club', 'Phagwara', 165, 58, [90, 70, 82, 88, 85]],
  ['Rohan Mehta', 22, 'Cricket', 'All-rounder', 'City Cricket Academy', 'Ludhiana', 182, 78, [74, 80, 76, 72, 84]],
  ['Jaspreet Singh', 18, 'Athletics', 'Sprinter', 'Track Elite', 'Amritsar', 180, 72, [95, 78, 70, 80, 76]],
  ['Neha Verma', 20, 'Badminton', 'Singles', 'Smash Academy', 'Chandigarh', 168, 56, [80, 62, 85, 92, 90]],
  ['Karan Bedi', 23, 'Basketball', 'Point Guard', 'Hoops United', 'Delhi', 188, 82, [82, 75, 80, 86, 89]],
  ['Manpreet Gill', 24, 'Kabaddi', 'Raider', 'Malwa Warriors', 'Bathinda', 175, 76, [84, 88, 79, 90, 82]],
  ['Ishita Rao', 17, 'Football', 'Midfielder', 'Southside Juniors', 'Bengaluru', 164, 55, [78, 60, 90, 83, 87]],
];

/* ---------- tiny helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const initials = n => n.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
const colorFor = n => COLORS[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
const hash = s => { let h = 5381; for (const c of s) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return h.toString(16); };
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

/* ---------- state ---------- */
let user = null, athletes = [], view = 'dashboard', compare = [];
const filters = { q: '', sport: '', sort: 'overall' };
const dataKey = () => 'sl_data_' + user.email;
const save = () => { write(dataKey(), { athletes, compare }); };
const overall = a => Math.round(METRICS.reduce((s, [k]) => s + a.metrics[k], 0) / METRICS.length);
const rating = a => a.reports.length ? a.reports.reduce((s, r) => s + r.rating, 0) / a.reports.length : 0;
const stars = (n, r = Math.round(n)) => `<span class="stars" aria-label="${n.toFixed(1)} of 5">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= r ? 'on' : ''}">★</i>`).join('')}</span>`;
const avatar = (n, c = '') => `<span class="avatar ${c}" style="background:${colorFor(n)}">${esc(initials(n))}</span>`;
const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2200); };

/* ---------- theme ---------- */
function setTheme(t) {
  document.documentElement.dataset.theme = t; localStorage.setItem('sl_theme', t);
  $('#themeBtn').textContent = t === 'dark' ? '☀️' : '🌙';
}
const toggleTheme = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
setTheme(localStorage.getItem('sl_theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
$('#themeBtn').onclick = $('#themeAuth').onclick = toggleTheme;

/* ---------- auth ---------- */
let registering = false;
function authMode(reg) {
  registering = reg;
  $('#authTitle').textContent = reg ? 'Create your account' : 'Welcome back';
  $('#authSub').textContent = reg ? 'Start building your scouting board.' : 'Log in to open your scouting board.';
  $('#authBtn').textContent = reg ? 'Create account' : 'Log in';
  $('#authSwitchText').textContent = reg ? 'Already a scout?' : 'New scout?';
  $('#authSwitch').textContent = reg ? 'Log in' : 'Create an account';
  $('.reg-only').classList.toggle('hidden', !reg);
  $('#authErr').textContent = '';
}
$('#authSwitch').onclick = e => { e.preventDefault(); authMode(!registering); };
$('#authForm').onsubmit = e => {
  e.preventDefault();
  const name = $('#aName').value.trim(), email = $('#aEmail').value.trim().toLowerCase(), pass = $('#aPass').value;
  const err = m => $('#authErr').textContent = m;
  if (!/^\S+@\S+\.\S+$/.test(email)) return err('Enter a valid email address.');
  if (pass.length < 6) return err('Password must be at least 6 characters.');
  const users = read('sl_users', {});
  if (registering) {
    if (!name) return err('Enter your full name.');
    if (users[email]) return err('An account with this email already exists. Log in instead.');
    users[email] = { name, email, pass: hash(pass) }; write('sl_users', users);
    write('sl_data_' + email, { athletes: seedData(), compare: [] });
  } else if (!users[email] || users[email].pass !== hash(pass)) return err('Email or password is incorrect.');
  write('sl_session', email); $('#authForm').reset(); start(users[email]);
};
$('#logout').onclick = () => { localStorage.removeItem('sl_session'); location.reload(); };

function seedData() {
  return SEED.map(([name, age, sport, position, team, city, height, weight, m]) => ({
    id: uid(), name, age, sport, position, team, city, height, weight, shortlisted: false,
    metrics: Object.fromEntries(METRICS.map(([k], i) => [k, m[i]])), reports: [],
  }));
}

/* ---------- boot ---------- */
function start(u) {
  user = u; const d = read(dataKey(), { athletes: [], compare: [] });
  athletes = d.athletes; compare = d.compare.filter(id => athletes.some(a => a.id === id));
  $('#auth').classList.add('hidden'); $('#app').classList.remove('hidden');
  $('#uName').textContent = u.name; $('#uEmail').textContent = u.email;
  $('#uAvatar').textContent = initials(u.name); $('#uAvatar').style.background = colorFor(u.name);
  go('dashboard');
}
const sess = read('sl_session', null), users0 = read('sl_users', {});
if (sess && users0[sess]) start(users0[sess]); else { $('#auth').classList.remove('hidden'); authMode(false); }

/* ---------- navigation ---------- */
const TITLES = { dashboard: 'Dashboard', athletes: 'Athletes', shortlist: 'Shortlist', compare: 'Compare athletes' };
function go(v) {
  view = v; $('#viewTitle').textContent = TITLES[v];
  $$('#nav button').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  $('#side').classList.remove('open'); render();
}
$('#nav').onclick = e => { const b = e.target.closest('button'); if (b) go(b.dataset.view); };
$('#menuBtn').onclick = () => $('#side').classList.toggle('open');

function render() {
  $('#slCount').textContent = athletes.filter(a => a.shortlisted).length;
  $('#cmpCount').textContent = compare.length;
  $('#view').innerHTML = { dashboard: rDashboard, athletes: rAthletes, shortlist: rAthletes, compare: rCompare }[view]();
  if (view === 'athletes' || view === 'shortlist') bindToolbar();
}

/* ---------- dashboard ---------- */
function rDashboard() {
  const all = athletes, reports = all.flatMap(a => a.reports.map(r => ({ ...r, a })));
  const rated = all.filter(a => a.reports.length);
  const avg = rated.length ? (rated.reduce((s, a) => s + rating(a), 0) / rated.length).toFixed(1) : '–';
  const top = [...all].sort((x, y) => overall(y) - overall(x)).slice(0, 5);
  const recent = reports.sort((x, y) => y.date.localeCompare(x.date)).slice(0, 4);
  const sports = {}; all.forEach(a => sports[a.sport] = (sports[a.sport] || 0) + 1);
  return `
  <div class="stats">
    <div class="stat"><span>Athletes tracked</span><strong>${all.length}</strong></div>
    <div class="stat"><span>On shortlist</span><strong>${all.filter(a => a.shortlisted).length}</strong></div>
    <div class="stat"><span>Scouting reports</span><strong>${reports.length}</strong></div>
    <div class="stat"><span>Average scout rating</span><strong>${avg}</strong></div>
  </div>
  <div class="cols">
    <div class="panel"><h3>Top performers</h3>${top.length ? top.map(a => `
      <div class="li" data-open="${a.id}">${avatar(a.name, 'sm')}<div class="grow"><strong>${esc(a.name)}</strong><small>${esc(a.sport)} · ${esc(a.position)}</small></div><span class="score">${overall(a)}</span></div>`).join('') : '<p class="muted">No athletes yet. Add your first one.</p>'}</div>
    <div class="panel"><h3>Latest scouting reports</h3>${recent.length ? recent.map(r => `
      <div class="li" data-open="${r.a.id}"><div class="grow"><strong>${esc(r.a.name)}</strong><small>${esc(r.text.slice(0, 70))}${r.text.length > 70 ? '…' : ''}</small></div>${stars(r.rating)}</div>`).join('') : '<p class="muted">Open an athlete and write a scouting report.</p>'}
      <h3 style="margin-top:1.2rem">Athletes by sport</h3>
      ${Object.entries(sports).map(([s, n]) => `<div class="bar"><span>${esc(s)}</span><div class="track"><div class="fill" style="width:${n / all.length * 100}%"></div></div><b>${n}</b></div>`).join('')}
    </div>
  </div>`;
}

/* ---------- athletes + shortlist ---------- */
function list() {
  const q = filters.q.toLowerCase();
  let l = athletes.filter(a => (view !== 'shortlist' || a.shortlisted) && (!filters.sport || a.sport === filters.sport) &&
    [a.name, a.sport, a.position, a.team, a.city].join(' ').toLowerCase().includes(q));
  const s = { overall: (a, b) => overall(b) - overall(a), rating: (a, b) => rating(b) - rating(a), name: (a, b) => a.name.localeCompare(b.name), age: (a, b) => a.age - b.age }[filters.sort];
  return l.sort(s);
}
function rAthletes() {
  const l = list(), sports = [...new Set(athletes.map(a => a.sport))].sort();
  return `<div class="toolbar">
    <input id="fq" type="search" placeholder="Search name, sport, team or city" value="${esc(filters.q)}" aria-label="Search">
    <select id="fs" aria-label="Filter by sport"><option value="">All sports</option>${sports.map(s => `<option ${filters.sport === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select>
    <select id="fo" aria-label="Sort"><option value="overall">Sort: Overall score</option><option value="rating" ${filters.sort === 'rating' ? 'selected' : ''}>Sort: Scout rating</option><option value="name" ${filters.sort === 'name' ? 'selected' : ''}>Sort: Name</option><option value="age" ${filters.sort === 'age' ? 'selected' : ''}>Sort: Youngest first</option></select>
  </div>
  <div id="cards">${cards(l)}</div>`;
}
function cards(l) {
  if (!l.length) return view === 'shortlist'
    ? `<div class="empty"><h3>Your shortlist is empty</h3>Tap the star on any athlete to add them here.</div>`
    : `<div class="empty"><h3>No athletes found</h3>Try a different search or add a new athlete.</div>`;
  return `<div class="grid">${l.map(a => `
    <article class="card">
      <div class="card-head" data-open="${a.id}" tabindex="0" role="button" aria-label="Open ${esc(a.name)}">
        ${avatar(a.name)}<div><h3>${esc(a.name)}</h3><small>${esc(a.team || 'Independent')} · ${a.age} yrs</small></div>
        <div class="ovr"><b>${overall(a)}</b><small>Overall</small></div>
      </div>
      <div class="row"><span class="tag">${esc(a.sport)}</span><span class="tag">${esc(a.position)}</span></div>
      <div class="row">${a.reports.length ? stars(rating(a)) + `<small class="muted">${rating(a).toFixed(1)} · ${a.reports.length} report${a.reports.length > 1 ? 's' : ''}</small>` : '<small class="muted">Not rated yet</small>'}</div>
      <div class="card-foot">
        <button class="fav ${a.shortlisted ? 'on' : ''}" data-fav="${a.id}" aria-pressed="${a.shortlisted}" aria-label="Toggle shortlist">⭐</button>
        <button class="btn sm" data-open="${a.id}">View profile</button>
        <label><input type="checkbox" data-cmp="${a.id}" ${compare.includes(a.id) ? 'checked' : ''}> Compare</label>
      </div>
    </article>`).join('')}</div>`;
}
function bindToolbar() {
  const upd = () => { $('#cards').innerHTML = cards(list()); };
  $('#fq').oninput = e => { filters.q = e.target.value; upd(); };
  $('#fs').onchange = e => { filters.sport = e.target.value; upd(); };
  $('#fo').onchange = e => { filters.sort = e.target.value; upd(); };
}

/* ---------- compare ---------- */
function rCompare() {
  const l = compare.map(id => athletes.find(a => a.id === id)).filter(Boolean);
  if (l.length < 2) return `<div class="empty"><h3>Pick at least two athletes</h3>Tick “Compare” on up to three athletes in the Athletes tab (${l.length} selected).
    <div style="margin-top:1rem"><button class="btn primary" data-go="athletes">Choose athletes</button></div></div>`;
  const rows = [
    ...METRICS.map(([k, n]) => [n, a => a.metrics[k]]),
    ['Overall score', overall], ['Scout rating', a => +rating(a).toFixed(1)],
  ];
  const info = [['Sport', a => a.sport], ['Position', a => a.position], ['Age', a => a.age], ['Height', a => a.height ? a.height + ' cm' : '–'], ['Weight', a => a.weight ? a.weight + ' kg' : '–']];
  return `<div class="panel tbl-wrap"><table>
    <thead><tr><th></th>${l.map(a => `<th><div class="cmp-head">${avatar(a.name)}<strong>${esc(a.name)}</strong>
      <button class="btn sm" data-open="${a.id}">Profile</button><button class="btn sm ghost" data-cmp-remove="${a.id}">Remove</button></div></th>`).join('')}</tr></thead>
    <tbody>${info.map(([n, f]) => `<tr><th>${n}</th>${l.map(a => `<td>${esc(f(a))}</td>`).join('')}</tr>`).join('')}
    ${rows.map(([n, f]) => { const v = l.map(f), best = Math.max(...v); return `<tr><th>${n}</th>${v.map(x => `<td class="${x === best && x > 0 ? 'best' : ''}">${x || '–'}${x === best && x > 0 ? ' ▲' : ''}</td>`).join('')}</tr>`; }).join('')}
    </tbody></table><p class="muted" style="margin-top:.8rem">▲ highlights the best value in each row.</p></div>`;
}

/* ---------- detail modal ---------- */
let openId = null, pickRating = 0;
function openDetail(id) {
  const a = athletes.find(x => x.id === id); if (!a) return;
  openId = id; pickRating = 0;
  $('#detail').innerHTML = `
    <div class="hero">${avatar(a.name, 'lg')}<div><h2>${esc(a.name)}</h2>
      <div class="row"><span class="tag">${esc(a.sport)}</span><span class="tag">${esc(a.position)}</span></div>
      <div class="row" style="margin-top:.3rem">${a.reports.length ? stars(rating(a)) + `<small class="muted">${rating(a).toFixed(1)} / 5</small>` : '<small class="muted">Not rated yet</small>'}</div></div>
      <div class="ovr" style="margin-left:auto"><b>${overall(a)}</b><small>Overall</small></div></div>
    <div class="facts">
      <div><small>Age</small>${a.age}</div><div><small>Team</small>${esc(a.team || '–')}</div><div><small>City</small>${esc(a.city || '–')}</div>
      <div><small>Height</small>${a.height ? a.height + ' cm' : '–'}</div><div><small>Weight</small>${a.weight ? a.weight + ' kg' : '–'}</div></div>
    <h4>Performance metrics</h4>
    ${METRICS.map(([k, n]) => `<div class="bar"><span>${n}</span><div class="track"><div class="fill" style="width:${a.metrics[k]}%"></div></div><b>${a.metrics[k]}</b></div>`).join('')}
    <h4>Scouting reports (${a.reports.length})</h4>
    ${a.reports.length ? [...a.reports].reverse().map(r => `<div class="report"><div class="row between">${stars(r.rating)}<small>${esc(r.author)} · ${esc(r.date)}</small></div>
      <p>${esc(r.text)}</p><button class="btn sm ghost danger" data-del-report="${r.id}">Delete</button></div>`).join('') : '<p class="muted">No reports yet. Add the first one below.</p>'}
    <form id="repForm"><h4>New scouting report</h4>
      <div class="starpick" id="starpick" role="radiogroup" aria-label="Rating">${[1, 2, 3, 4, 5].map(i => `<button type="button" data-star="${i}" aria-label="${i} star">★</button>`).join('')}</div>
      <textarea id="repText" placeholder="Strengths, weaknesses, potential, match observations…" required></textarea>
      <p class="error" id="repErr"></p>
      <div class="row between" style="margin-top:.4rem">
        <div class="row"><button type="button" class="btn sm" data-edit="${a.id}">Edit</button><button type="button" class="btn sm danger" data-del="${a.id}">Delete athlete</button></div>
        <div class="row"><button type="button" class="btn" data-close>Close</button><button class="btn primary" type="submit">Save report</button></div>
      </div></form>`;
  $('#detail').showModal();
}
document.addEventListener('submit', e => {
  if (e.target.id !== 'repForm') return; e.preventDefault();
  const text = $('#repText').value.trim();
  if (!pickRating) return $('#repErr').textContent = 'Choose a star rating.';
  if (!text) return $('#repErr').textContent = 'Write a few notes for the report.';
  const a = athletes.find(x => x.id === openId);
  a.reports.push({ id: uid(), text, rating: pickRating, author: user.name, date: new Date().toISOString().slice(0, 10) });
  save(); render(); openDetail(openId); toast('Report saved');
});

/* ---------- add / edit form ---------- */
let editId = null;
function fillPositions(sel) { $('#fPos').innerHTML = (POSITIONS[$('#fSport').value] || []).map(p => `<option ${p === sel ? 'selected' : ''}>${p}</option>`).join(''); }
$('#fSport').innerHTML = Object.keys(POSITIONS).map(s => `<option>${s}</option>`).join('');
$('#fSport').onchange = () => fillPositions();
$('#metricInputs').innerHTML = METRICS.map(([k, n]) => `<label class="field">${n}<input name="m_${k}" type="number" min="0" max="100" required></label>`).join('');

function openForm(id) {
  editId = id || null; const a = athletes.find(x => x.id === id), f = $('#athForm');
  f.reset(); $('#formErr').textContent = ''; $('#formTitle').textContent = a ? 'Edit athlete' : 'Add athlete';
  if (a) {
    ['name', 'age', 'sport', 'team', 'city', 'height', 'weight'].forEach(k => f.elements[k].value = a[k] ?? '');
    fillPositions(a.position); METRICS.forEach(([k]) => f.elements['m_' + k].value = a.metrics[k]);
  } else fillPositions();
  $('#detail').close(); $('#formDlg').showModal();
}
$('#athForm').onsubmit = e => {
  e.preventDefault(); const f = e.target.elements, v = k => f[k].value.trim();
  const m = Object.fromEntries(METRICS.map(([k]) => [k, +f['m_' + k].value]));
  if (!v('name') || !v('age')) return $('#formErr').textContent = 'Name and age are required.';
  if (Object.values(m).some(x => isNaN(x) || x < 0 || x > 100) || METRICS.some(([k]) => f['m_' + k].value === ''))
    return $('#formErr').textContent = 'Every metric needs a value from 0 to 100.';
  const data = { name: v('name'), age: +v('age'), sport: v('sport'), position: f.position.value, team: v('team'), city: v('city'), height: +v('height') || 0, weight: +v('weight') || 0, metrics: m };
  if (editId) Object.assign(athletes.find(a => a.id === editId), data);
  else athletes.push({ id: uid(), shortlisted: false, reports: [], ...data });
  save(); $('#formDlg').close(); render(); toast(editId ? 'Athlete updated' : 'Athlete added');
};
$('#addBtn').onclick = () => openForm();

/* ---------- global click handling ---------- */
document.addEventListener('click', e => {
  const t = e.target, c = a => t.closest(`[${a}]`);
  if (c('data-close')) return t.closest('dialog').close();
  if (t.tagName === 'DIALOG') return t.close();
  let el;
  if ((el = c('data-fav'))) { const a = athletes.find(x => x.id === el.dataset.fav); a.shortlisted = !a.shortlisted; save(); render(); toast(a.shortlisted ? 'Added to shortlist' : 'Removed from shortlist'); }
  else if ((el = c('data-open'))) openDetail(el.dataset.open);
  else if ((el = c('data-go'))) go(el.dataset.go);
  else if ((el = c('data-cmp-remove'))) { compare = compare.filter(i => i !== el.dataset.cmpRemove); save(); render(); }
  else if ((el = c('data-star'))) { pickRating = +el.dataset.star; $$('#starpick button').forEach((b, i) => b.classList.toggle('on', i < pickRating)); }
  else if ((el = c('data-edit'))) openForm(el.dataset.edit);
  else if ((el = c('data-del-report'))) { const a = athletes.find(x => x.id === openId); a.reports = a.reports.filter(r => r.id !== el.dataset.delReport); save(); render(); openDetail(openId); }
  else if ((el = c('data-del'))) {
    if (!confirm('Delete this athlete and all their reports?')) return;
    athletes = athletes.filter(a => a.id !== el.dataset.del); compare = compare.filter(i => i !== el.dataset.del);
    save(); $('#detail').close(); render(); toast('Athlete deleted');
  }
});
document.addEventListener('change', e => {
  const id = e.target.dataset?.cmp; if (!id) return;
  if (e.target.checked) {
    if (compare.length >= 3) { e.target.checked = false; return toast('You can compare up to 3 athletes'); }
    compare.push(id);
  } else compare = compare.filter(i => i !== id);
  save(); $('#cmpCount').textContent = compare.length;
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('.card-head')) openDetail(e.target.dataset.open); });
