/* =========================================================
   ScoutHub — Sports Talent Scouting Platform
   Pure HTML/CSS/JS. All data is stored in localStorage.
   ========================================================= */

// ---------- Constants ----------
const METRICS = ["speed", "strength", "stamina", "technique", "agility", "vision"];
const SPORTS = {
  Football: ["Goalkeeper", "Defender", "Midfielder", "Forward"],
  Basketball: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"],
  Cricket: ["Batsman", "Bowler", "All-rounder", "Wicket-keeper"],
  Hockey: ["Goalkeeper", "Defender", "Midfielder", "Forward"],
  Athletics: ["Sprinter", "Middle Distance", "Long Distance", "Jumper", "Thrower"],
  Tennis: ["Singles", "Doubles"],
};
const COLORS = ["#4f8df7", "#3cc6a0", "#ff9b73"];
const SOFT = ["bg-blue", "bg-mint", "bg-peach", "bg-sun", "bg-lav", "bg-rose"];

// ---------- Storage helpers ----------
const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
};
const getUsers = () => store.get("sh_users", []);
const getSession = () => store.get("sh_session", null);
const dataKey = () => "sh_data_" + getSession().email;
const getData = () => store.get(dataKey(), { athletes: [], reports: [] });
const saveData = (d) => store.set(dataKey(), d);

// Simple (non-cryptographic) hash so plain passwords are not stored directly
function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return (h >>> 0).toString(16);
}
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const initials = (n) => n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

// ---------- Calculations ----------
const overall = (a) => Math.round(METRICS.reduce((s, m) => s + Number(a.metrics[m] || 0), 0) / METRICS.length);
function avgRating(id, reports) {
  const r = reports.filter((x) => x.athleteId === id);
  if (!r.length) return 0;
  return +(r.reduce((s, x) => s + Number(x.rating), 0) / r.length).toFixed(1);
}
const starStr = (n) => "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));
const photoClass = (a) => SOFT[a.name.length % SOFT.length];

// ---------- Theme ----------
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  $$(".theme-toggle").forEach((b) => (b.textContent = t === "dark" ? "☀️" : "🌙"));
  store.set("sh_theme", t);
}
$$(".theme-toggle").forEach((b) =>
  b.addEventListener("click", () => applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"))
);

// ---------- Toast ----------
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove("show"), 2200);
}

// ---------- Demo data ----------
function seedData() {
  const mk = (name, age, sport, position, team, nationality, height, weight, m) => ({
    id: uid(), name, age, sport, position, team, nationality, height, weight,
    metrics: Object.fromEntries(METRICS.map((k, i) => [k, m[i]])),
    notes: "", shortlisted: false, createdAt: Date.now(),
  });
  const athletes = [
    mk("Arjun Mehta", 19, "Football", "Forward", "Mumbai City U21", "India", 178, 70, [91, 72, 80, 85, 88, 79]),
    mk("Lucas Silva", 21, "Football", "Midfielder", "Santos B", "Brazil", 175, 68, [82, 70, 88, 90, 84, 92]),
    mk("Maya Thompson", 18, "Basketball", "Point Guard", "Riverside High", "USA", 172, 63, [89, 65, 84, 87, 91, 88]),
    mk("Rohan Patil", 20, "Cricket", "All-rounder", "Pune Strikers", "India", 181, 76, [76, 82, 85, 83, 78, 80]),
    mk("Kenji Sato", 22, "Athletics", "Sprinter", "Tokyo AC", "Japan", 180, 72, [97, 78, 74, 70, 90, 60]),
    mk("Emma Clarke", 20, "Hockey", "Defender", "Leeds HC", "England", 168, 61, [80, 77, 86, 81, 79, 84]),
  ];
  athletes[0].shortlisted = true; athletes[2].shortlisted = true;
  const rep = (a, scout, rating, rec, s, w, days) => ({
    id: uid(), athleteId: a.id, scout, rating, recommendation: rec, strengths: s, weaknesses: w,
    date: new Date(Date.now() - days * 864e5).toISOString().slice(0, 10),
  });
  const reports = [
    rep(athletes[0], "R. Kapoor", 5, "Sign", "Explosive pace, clinical finishing inside the box.", "Hold-up play needs work.", 3),
    rep(athletes[1], "M. Costa", 4, "Monitor", "Excellent vision and passing range.", "Lacks physical presence.", 8),
    rep(athletes[2], "J. Rivera", 5, "Sign", "Elite court vision and handles.", "Defensive consistency.", 5),
    rep(athletes[3], "S. Iyer", 4, "Monitor", "Reliable with bat and ball.", "Fielding speed.", 12),
    rep(athletes[4], "T. Mori", 3, "Monitor", "World-class top speed.", "Start reaction is inconsistent.", 20),
  ];
  return { athletes, reports };
}

// ---------- Auth ----------
function ensureDemoUser() {
  const users = getUsers();
  if (!users.find((u) => u.email === "demo@scout.com")) {
    users.push({ name: "Demo Scout", email: "demo@scout.com", password: hash("demo123") });
    store.set("sh_users", users);
    store.set("sh_data_demo@scout.com", seedData());
  }
}

$$(".tab").forEach((t) =>
  t.addEventListener("click", () => {
    $$(".tab").forEach((x) => x.classList.toggle("active", x === t));
    $("#loginForm").classList.toggle("hidden", t.dataset.auth !== "login");
    $("#registerForm").classList.toggle("hidden", t.dataset.auth !== "register");
    $("#authMsg").textContent = "";
  })
);

$("#loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const email = f.get("email").trim().toLowerCase();
  const user = getUsers().find((u) => u.email === email && u.password === hash(f.get("password")));
  if (!user) return ($("#authMsg").textContent = "Invalid email or password.");
  store.set("sh_session", { name: user.name, email: user.email });
  e.target.reset();
  start();
});

$("#registerForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const email = f.get("email").trim().toLowerCase();
  const users = getUsers();
  if (users.find((u) => u.email === email)) return ($("#authMsg").textContent = "An account with this email already exists.");
  users.push({ name: f.get("name").trim(), email, password: hash(f.get("password")) });
  store.set("sh_users", users);
  store.set("sh_data_" + email, seedData()); // start with sample athletes
  store.set("sh_session", { name: f.get("name").trim(), email });
  e.target.reset();
  toast("Account created — welcome!");
  start();
});

$("#logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("sh_session");
  location.hash = "";
  start();
});

// ---------- Router ----------
const TITLES = { dashboard: "Dashboard", athletes: "Athletes", reports: "Scouting Reports", shortlist: "Shortlist", compare: "Compare", athlete: "Athlete Profile" };
let compareIds = [];

function route() {
  if (!getSession()) return;
  const [page, id] = (location.hash.slice(1) || "dashboard").split("/");
  $$("[data-nav]").forEach((a) => a.classList.toggle("active", a.dataset.nav === page));
  $("#pageTitle").textContent = TITLES[page] || "Dashboard";
  $("#sidebar").classList.remove("open");
  const v = $("#view");
  v.style.animation = "none"; v.offsetHeight; v.style.animation = "";
  ({ dashboard: renderDashboard, athletes: renderAthletes, reports: renderReports, shortlist: renderShortlist, compare: renderCompare, athlete: () => renderProfile(id) }[page] || renderDashboard)();
}
window.addEventListener("hashchange", route);
$("#menuBtn").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
$("#addAthleteBtn").addEventListener("click", () => openAthleteForm());

// ---------- Views ----------
function renderDashboard() {
  const { athletes, reports } = getData();
  const top = [...athletes].sort((a, b) => overall(b) - overall(a)).slice(0, 5);
  const sportsCount = {};
  athletes.forEach((a) => (sportsCount[a.sport] = (sportsCount[a.sport] || 0) + 1));
  const avgOvr = athletes.length ? Math.round(athletes.reduce((s, a) => s + overall(a), 0) / athletes.length) : 0;
  const recent = [...reports].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);

  $("#view").innerHTML = `
    <div class="stats">
      ${stat("👤", "bg-blue", athletes.length, "Athletes")}
      ${stat("📝", "bg-mint", reports.length, "Scouting reports")}
      ${stat("★", "bg-sun", athletes.filter((a) => a.shortlisted).length, "Shortlisted")}
      ${stat("📈", "bg-peach", avgOvr, "Avg. overall")}
    </div>
    <div class="panels">
      <div class="card panel">
        <h3>🏆 Top rated athletes</h3>
        ${top.length ? top.map((a) => `
          <div class="list-row" onclick="location.hash='athlete/${a.id}'">
            <div class="a-photo ${photoClass(a)}" style="width:40px;height:40px;border-radius:12px;font-size:.9rem">${initials(a.name)}</div>
            <div class="grow"><b>${esc(a.name)}</b><br><small>${esc(a.sport)} · ${esc(a.position)}</small></div>
            <b>${overall(a)}</b>
          </div>`).join("") : emptyHtml("No athletes yet")}
      </div>
      <div class="card panel">
        <h3>🏅 Athletes by sport</h3>
        ${Object.keys(sportsCount).length ? Object.entries(sportsCount).map(([s, c]) => `
          <div class="bar-row"><span>${s}</span><div class="bar"><i style="width:${(c / athletes.length) * 100}%"></i></div><b>${c}</b></div>`).join("") : emptyHtml("No data")}
        <h3 style="margin-top:1.4rem">🕒 Recent reports</h3>
        ${recent.length ? recent.map((r) => {
          const a = athletes.find((x) => x.id === r.athleteId);
          return a ? `<div class="list-row" onclick="location.hash='athlete/${a.id}'"><div class="grow"><b>${esc(a.name)}</b><br><small>${esc(r.scout)} · ${r.date}</small></div><span class="stars">${starStr(r.rating)}</span></div>` : "";
        }).join("") : emptyHtml("No reports yet")}
      </div>
    </div>`;
}
const stat = (ico, bg, val, label) => `<div class="card stat"><div class="ico ${bg}">${ico}</div><div><b>${val}</b><small>${label}</small></div></div>`;
const emptyHtml = (msg, icon = "🔍") => `<div class="empty"><div>${icon}</div>${msg}</div>`;

let filters = { q: "", sport: "", position: "", sort: "ovr" };

function renderAthletes(onlyShortlist = false) {
  const { athletes, reports } = getData();
  const positions = filters.sport ? SPORTS[filters.sport] : [...new Set(Object.values(SPORTS).flat())];
  let list = athletes.filter((a) =>
    (!onlyShortlist || a.shortlisted) &&
    (!filters.sport || a.sport === filters.sport) &&
    (!filters.position || a.position === filters.position) &&
    (a.name + a.team + a.nationality).toLowerCase().includes(filters.q.toLowerCase())
  );
  const sorters = { ovr: (a, b) => overall(b) - overall(a), rating: (a, b) => avgRating(b.id, reports) - avgRating(a.id, reports), name: (a, b) => a.name.localeCompare(b.name), age: (a, b) => a.age - b.age };
  list.sort(sorters[filters.sort]);

  $("#view").innerHTML = `
    <div class="toolbar">
      <input id="fq" placeholder="Search by name, team or country…" value="${esc(filters.q)}" />
      <select id="fs"><option value="">All sports</option>${Object.keys(SPORTS).map((s) => `<option ${s === filters.sport ? "selected" : ""}>${s}</option>`).join("")}</select>
      <select id="fp"><option value="">All positions</option>${positions.map((p) => `<option ${p === filters.position ? "selected" : ""}>${p}</option>`).join("")}</select>
      <select id="fo">
        <option value="ovr" ${filters.sort === "ovr" ? "selected" : ""}>Sort: Overall</option>
        <option value="rating" ${filters.sort === "rating" ? "selected" : ""}>Sort: Rating</option>
        <option value="name" ${filters.sort === "name" ? "selected" : ""}>Sort: Name</option>
        <option value="age" ${filters.sort === "age" ? "selected" : ""}>Sort: Age</option>
      </select>
    </div>
    <div class="cards">${list.length ? list.map((a) => athleteCard(a, reports)).join("") : ""}</div>
    ${list.length ? "" : emptyHtml(onlyShortlist ? "Your shortlist is empty. Tap ☆ on any athlete to add them." : "No athletes match your filters.", onlyShortlist ? "★" : "🔍")}`;

  const rerender = () => (onlyShortlist ? renderShortlist() : renderAthletes());
  $("#fq").addEventListener("input", (e) => { filters.q = e.target.value; rerender(); const i = $("#fq"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); });
  $("#fs").addEventListener("change", (e) => { filters.sport = e.target.value; filters.position = ""; rerender(); });
  $("#fp").addEventListener("change", (e) => { filters.position = e.target.value; rerender(); });
  $("#fo").addEventListener("change", (e) => { filters.sort = e.target.value; rerender(); });
}
const renderShortlist = () => renderAthletes(true);

function athleteCard(a, reports) {
  const r = avgRating(a.id, reports);
  return `
  <div class="card a-card">
    <div class="ovr"><b>${overall(a)}</b><small>OVR</small></div>
    <div class="a-head">
      <div class="a-photo ${photoClass(a)}">${initials(a.name)}</div>
      <div><h4>${esc(a.name)}</h4><small>${esc(a.team || "Free agent")} · ${a.age} yrs</small></div>
    </div>
    <div class="tags"><span class="tag blue">${esc(a.sport)}</span><span class="tag mint">${esc(a.position)}</span><span class="tag peach">${esc(a.nationality)}</span></div>
    ${METRICS.slice(0, 3).map((m) => `<div class="bar-row"><span style="text-transform:capitalize">${m}</span><div class="bar"><i style="width:${a.metrics[m]}%"></i></div><b>${a.metrics[m]}</b></div>`).join("")}
    <div style="margin-top:.6rem"><span class="stars">${starStr(r)}</span> <small style="color:var(--muted)">${r ? r + " / 5" : "Not rated"}</small></div>
    <div class="a-actions">
      <a class="btn primary sm" href="#athlete/${a.id}">View</a>
      <button class="star-btn ${a.shortlisted ? "on" : ""}" onclick="toggleShortlist('${a.id}')">${a.shortlisted ? "★ Shortlisted" : "☆ Shortlist"}</button>
      <button class="btn ghost sm" onclick="addToCompare('${a.id}')">⇄</button>
    </div>
  </div>`;
}

function renderProfile(id) {
  const { athletes, reports } = getData();
  const a = athletes.find((x) => x.id === id);
  if (!a) return ($("#view").innerHTML = emptyHtml("Athlete not found."));
  const reps = reports.filter((r) => r.athleteId === id).sort((x, y) => y.date.localeCompare(x.date));
  const r = avgRating(id, reports);
  $("#view").innerHTML = `
    <button class="btn ghost sm back" onclick="history.back()">← Back</button>
    <div class="profile">
      <div class="card profile-side">
        <div class="a-photo ${photoClass(a)}">${initials(a.name)}</div>
        <h3>${esc(a.name)}</h3>
        <div class="tags" style="justify-content:center;margin-top:.6rem"><span class="tag blue">${esc(a.sport)}</span><span class="tag mint">${esc(a.position)}</span></div>
        <div class="stars" style="font-size:1.2rem">${starStr(r)}</div>
        <small style="color:var(--muted)">${r ? r + " avg from " + reps.length + " report(s)" : "No ratings yet"}</small>
        <div class="info-list">
          <div><span>Overall</span><b>${overall(a)}</b></div>
          <div><span>Age</span><b>${a.age}</b></div>
          <div><span>Team</span><b>${esc(a.team || "—")}</b></div>
          <div><span>Nationality</span><b>${esc(a.nationality || "—")}</b></div>
          <div><span>Height</span><b>${a.height || "—"} cm</b></div>
          <div><span>Weight</span><b>${a.weight || "—"} kg</b></div>
        </div>
        ${a.notes ? `<p style="margin-top:1rem;font-size:.9rem;color:var(--muted);text-align:left">${esc(a.notes)}</p>` : ""}
        <div class="a-actions" style="justify-content:center">
          <button class="star-btn ${a.shortlisted ? "on" : ""}" onclick="toggleShortlist('${a.id}')">${a.shortlisted ? "★ Shortlisted" : "☆ Shortlist"}</button>
          <button class="btn ghost sm" onclick="openAthleteForm('${a.id}')">Edit</button>
          <button class="btn danger sm" onclick="deleteAthlete('${a.id}')">Delete</button>
        </div>
      </div>
      <div style="display:grid;gap:1rem;align-content:start">
        <div class="card panel">
          <h3>📊 Performance metrics</h3>
          <div class="grid2" style="align-items:center">
            <div>${METRICS.map((m) => `<div class="bar-row"><span style="text-transform:capitalize">${m}</span><div class="bar"><i style="width:${a.metrics[m]}%"></i></div><b>${a.metrics[m]}</b></div>`).join("")}</div>
            <div class="radar-wrap">${radarSvg([a])}</div>
          </div>
        </div>
        <div class="card panel">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem"><h3 style="margin:0">📝 Scouting reports</h3><button class="btn primary sm" onclick="openReportForm('${a.id}')">+ Add report</button></div>
          ${reps.length ? reps.map(reportHtml).join("") : emptyHtml("No reports yet for this athlete.", "📝")}
        </div>
      </div>
    </div>`;
}

function reportHtml(r, showName) {
  const a = showName ? getData().athletes.find((x) => x.id === r.athleteId) : null;
  return `<div class="report">
    <div class="report-head">
      <div>${a ? `<a href="#athlete/${a.id}"><b>${esc(a.name)}</b></a> · ` : ""}<b>${esc(r.scout)}</b> <small style="color:var(--muted)">· ${r.date}</small></div>
      <div><span class="stars">${starStr(r.rating)}</span> <span class="rec ${r.recommendation}">${r.recommendation}</span></div>
    </div>
    ${r.strengths ? `<p><b>Strengths:</b> ${esc(r.strengths)}</p>` : ""}
    ${r.weaknesses ? `<p><b>Weaknesses:</b> ${esc(r.weaknesses)}</p>` : ""}
    <div style="text-align:right;margin-top:.4rem"><button class="btn danger sm" onclick="deleteReport('${r.id}')">Delete</button></div>
  </div>`;
}

let reportFilter = "";
function renderReports() {
  const { athletes, reports } = getData();
  const list = reports.filter((r) => !reportFilter || r.recommendation === reportFilter).sort((a, b) => b.date.localeCompare(a.date));
  $("#view").innerHTML = `
    <div class="toolbar">
      <select id="rf"><option value="">All recommendations</option>${["Sign", "Monitor", "Pass"].map((x) => `<option ${x === reportFilter ? "selected" : ""}>${x}</option>`).join("")}</select>
      <button class="btn primary" ${athletes.length ? "" : "disabled"} onclick="openReportForm()">+ New report</button>
    </div>
    <div class="card panel">${list.length ? list.map((r) => reportHtml(r, true)).join("") : emptyHtml("No scouting reports found.", "📝")}</div>`;
  $("#rf").addEventListener("change", (e) => { reportFilter = e.target.value; renderReports(); });
}

function renderCompare() {
  const { athletes, reports } = getData();
  compareIds = compareIds.filter((id) => athletes.some((a) => a.id === id));
  const opts = (sel) => `<option value="">— Select athlete —</option>` + athletes.map((a) => `<option value="${a.id}" ${a.id === sel ? "selected" : ""}>${esc(a.name)} (${a.sport})</option>`).join("");
  const chosen = compareIds.map((id) => athletes.find((a) => a.id === id)).filter(Boolean);
  const rows = [
    ["Sport", (a) => a.sport], ["Position", (a) => a.position], ["Age", (a) => a.age], ["Height (cm)", (a) => a.height, true], ["Weight (kg)", (a) => a.weight],
    ...METRICS.map((m) => [m[0].toUpperCase() + m.slice(1), (a) => Number(a.metrics[m]), true]),
    ["Overall", overall, true], ["Avg rating", (a) => avgRating(a.id, reports), true],
  ];
  $("#view").innerHTML = `
    <div class="compare-pick">${[0, 1, 2].map((i) => `<select data-slot="${i}" style="border-left:5px solid ${COLORS[i]}">${opts(compareIds[i])}</select>`).join("")}</div>
    ${chosen.length < 2 ? emptyHtml("Select at least two athletes to compare.", "⇄") : `
    <div class="panels">
      <div class="card panel" style="overflow:auto">
        <table class="cmp-table">
          <tr><th>Attribute</th>${chosen.map((a) => `<th style="color:${COLORS[compareIds.indexOf(a.id)]}">${esc(a.name)}</th>`).join("")}</tr>
          ${rows.map(([label, fn, num]) => {
            const vals = chosen.map(fn);
            const max = num ? Math.max(...vals) : null;
            return `<tr><td>${label}</td>${vals.map((v) => `<td class="${num && v === max ? "best" : ""}">${esc(v ?? "—")}</td>`).join("")}</tr>`;
          }).join("")}
        </table>
      </div>
      <div class="card panel"><h3>Metric radar</h3><div class="radar-wrap">${radarSvg(chosen, chosen.map((a) => COLORS[compareIds.indexOf(a.id)]))}</div>
        <div class="legend">${chosen.map((a) => `<span><i style="background:${COLORS[compareIds.indexOf(a.id)]}"></i>${esc(a.name)}</span>`).join("")}</div>
      </div>
    </div>`}`;
  $$("[data-slot]").forEach((s) => s.addEventListener("change", (e) => { compareIds[+e.target.dataset.slot] = e.target.value; renderCompare(); }));
}

// SVG radar chart for performance metrics
function radarSvg(list, colors = COLORS) {
  const size = 260, c = size / 2, R = 95, n = METRICS.length;
  const pt = (i, v) => { const ang = (Math.PI * 2 * i) / n - Math.PI / 2; return [c + Math.cos(ang) * R * v, c + Math.sin(ang) * R * v]; };
  let svg = `<svg viewBox="0 0 ${size} ${size}" width="100%" style="max-width:280px">`;
  [0.25, 0.5, 0.75, 1].forEach((lv) => (svg += `<polygon points="${METRICS.map((_, i) => pt(i, lv).join(",")).join(" ")}" fill="none" stroke="var(--border)"/>`));
  METRICS.forEach((m, i) => {
    const [x, y] = pt(i, 1); const [lx, ly] = pt(i, 1.2);
    svg += `<line x1="${c}" y1="${c}" x2="${x}" y2="${y}" stroke="var(--border)"/><text x="${lx}" y="${ly}" font-size="10" fill="var(--muted)" text-anchor="middle" dominant-baseline="middle" style="text-transform:capitalize">${m}</text>`;
  });
  list.forEach((a, k) => {
    const col = colors[k] || COLORS[0];
    svg += `<polygon points="${METRICS.map((m, i) => pt(i, a.metrics[m] / 100).join(",")).join(" ")}" fill="${col}" fill-opacity=".2" stroke="${col}" stroke-width="2"/>`;
  });
  return svg + "</svg>";
}

// ---------- Actions (global for inline handlers) ----------
function toggleShortlist(id) {
  const d = getData();
  const a = d.athletes.find((x) => x.id === id);
  a.shortlisted = !a.shortlisted;
  saveData(d);
  toast(a.shortlisted ? "Added to shortlist ★" : "Removed from shortlist");
  route();
}
function addToCompare(id) {
  if (compareIds.includes(id)) return (location.hash = "compare");
  compareIds = compareIds.filter(Boolean);
  if (compareIds.length >= 3) compareIds.shift();
  compareIds.push(id);
  toast("Added to comparison");
  location.hash = "compare";
}
function deleteAthlete(id) {
  if (!confirm("Delete this athlete and all their reports?")) return;
  const d = getData();
  d.athletes = d.athletes.filter((a) => a.id !== id);
  d.reports = d.reports.filter((r) => r.athleteId !== id);
  saveData(d);
  toast("Athlete deleted");
  location.hash = "athletes";
}
function deleteReport(id) {
  if (!confirm("Delete this report?")) return;
  const d = getData();
  d.reports = d.reports.filter((r) => r.id !== id);
  saveData(d);
  toast("Report deleted");
  route();
}

// ---------- Modal forms ----------
const openModal = (html) => { $("#modalBody").innerHTML = html; $("#modal").classList.remove("hidden"); };
const closeModal = () => $("#modal").classList.add("hidden");
$("#modalClose").addEventListener("click", closeModal);
$("#modal").addEventListener("click", (e) => e.target.id === "modal" && closeModal());
document.addEventListener("keydown", (e) => e.key === "Escape" && closeModal());

function openAthleteForm(id) {
  const a = id ? getData().athletes.find((x) => x.id === id) : null;
  const v = a || { name: "", age: 18, sport: "Football", position: "Forward", team: "", nationality: "", height: "", weight: "", notes: "", metrics: Object.fromEntries(METRICS.map((m) => [m, 70])) };
  openModal(`
    <h3>${a ? "Edit athlete" : "Add new athlete"}</h3>
    <form id="athleteForm" class="form">
      <div class="grid2">
        <label>Full name<input name="name" required value="${esc(v.name)}" /></label>
        <label>Age<input type="number" name="age" min="10" max="50" required value="${v.age}" /></label>
      </div>
      <div class="grid2">
        <label>Sport<select name="sport" id="sportSel">${Object.keys(SPORTS).map((s) => `<option ${s === v.sport ? "selected" : ""}>${s}</option>`).join("")}</select></label>
        <label>Position<select name="position" id="posSel"></select></label>
      </div>
      <div class="grid2">
        <label>Team / Club<input name="team" value="${esc(v.team)}" /></label>
        <label>Nationality<input name="nationality" value="${esc(v.nationality)}" /></label>
      </div>
      <div class="grid2">
        <label>Height (cm)<input type="number" name="height" min="100" max="250" value="${v.height}" /></label>
        <label>Weight (kg)<input type="number" name="weight" min="30" max="200" value="${v.weight}" /></label>
      </div>
      <div class="section-label">Performance metrics (0–100)</div>
      ${METRICS.map((m) => `<div class="metric-input"><span style="text-transform:capitalize">${m}</span><input type="range" name="m_${m}" min="0" max="100" value="${v.metrics[m]}" oninput="this.nextElementSibling.textContent=this.value"/><b>${v.metrics[m]}</b></div>`).join("")}
      <label>Notes<textarea name="notes">${esc(v.notes)}</textarea></label>
      <button class="btn primary full">${a ? "Save changes" : "Add athlete"}</button>
    </form>`);
  const fillPos = () => ($("#posSel").innerHTML = SPORTS[$("#sportSel").value].map((p) => `<option ${p === v.position ? "selected" : ""}>${p}</option>`).join(""));
  fillPos();
  $("#sportSel").addEventListener("change", fillPos);
  $("#athleteForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const obj = {
      name: f.get("name").trim(), age: +f.get("age"), sport: f.get("sport"), position: f.get("position"),
      team: f.get("team").trim(), nationality: f.get("nationality").trim(), height: f.get("height"), weight: f.get("weight"),
      notes: f.get("notes").trim(), metrics: Object.fromEntries(METRICS.map((m) => [m, +f.get("m_" + m)])),
    };
    const d = getData();
    if (a) Object.assign(d.athletes.find((x) => x.id === a.id), obj);
    else d.athletes.push({ id: uid(), shortlisted: false, createdAt: Date.now(), ...obj });
    saveData(d);
    closeModal();
    toast(a ? "Athlete updated" : "Athlete added");
    a ? route() : (location.hash = "athletes", route());
  });
}

function openReportForm(athleteId) {
  const { athletes } = getData();
  let rating = 4;
  openModal(`
    <h3>New scouting report</h3>
    <form id="reportForm" class="form">
      <label>Athlete<select name="athleteId" required>${athletes.map((a) => `<option value="${a.id}" ${a.id === athleteId ? "selected" : ""}>${esc(a.name)} — ${a.sport}</option>`).join("")}</select></label>
      <div class="grid2">
        <label>Scout name<input name="scout" required value="${esc(getSession().name)}" /></label>
        <label>Date<input type="date" name="date" required value="${new Date().toISOString().slice(0, 10)}" /></label>
      </div>
      <label>Rating<div class="rating-input" id="ratingInput">${[1, 2, 3, 4, 5].map((i) => `<span data-v="${i}">★</span>`).join("")}</div></label>
      <label>Recommendation<select name="recommendation"><option>Sign</option><option selected>Monitor</option><option>Pass</option></select></label>
      <label>Strengths<textarea name="strengths" placeholder="What stood out?"></textarea></label>
      <label>Weaknesses<textarea name="weaknesses" placeholder="Areas to improve"></textarea></label>
      <button class="btn primary full">Save report</button>
    </form>`);
  const paint = () => $$("#ratingInput span").forEach((s) => s.classList.toggle("on", +s.dataset.v <= rating));
  paint();
  $$("#ratingInput span").forEach((s) => s.addEventListener("click", () => { rating = +s.dataset.v; paint(); }));
  $("#reportForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const d = getData();
    d.reports.push({
      id: uid(), athleteId: f.get("athleteId"), scout: f.get("scout").trim(), date: f.get("date"), rating,
      recommendation: f.get("recommendation"), strengths: f.get("strengths").trim(), weaknesses: f.get("weaknesses").trim(),
    });
    saveData(d);
    closeModal();
    toast("Report saved");
    route();
  });
}

// ---------- Boot ----------
function start() {
  const s = getSession();
  $("#auth").classList.toggle("hidden", !!s);
  $("#app").classList.toggle("hidden", !s);
  if (s) {
    $("#userName").textContent = s.name;
    $("#userEmail").textContent = s.email;
    $("#userAvatar").textContent = initials(s.name);
    route();
  }
}
applyTheme(store.get("sh_theme", "light"));
ensureDemoUser();
start();
