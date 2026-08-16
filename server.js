const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;
const filmsPath = path.join(__dirname, 'films.json');

let filmsCache = [];
let genresCache = [];
let qualitiesCache = [];

function loadFilmsData() {
  try {
    if (fs.existsSync(filmsPath)) {
      const rawData = fs.readFileSync(filmsPath, 'utf8');
      const allFilms = JSON.parse(rawData);
      
      const banned = ['nontondrama', 'dialihkan ke', 'redirect', 'house of the dragon', 'episode', 'season'];
      
      filmsCache = allFilms.filter(film => {
        const check = (film.title + film.slug + (film.description || '')).toLowerCase();
        for (let i = 0; i < banned.length; i++) {
          if (check.includes(banned[i])) return false;
        }
        return true;
      });

      const gSet = new Set();
      const qSet = new Set();
      for (let i = 0; i < filmsCache.length; i++) {
        const f = filmsCache[i];
        if (f.genre && f.genre !== 'Unknown') {
          const parts = f.genre.split(',');
          for (let j = 0; j < parts.length; j++) gSet.add(parts[j].trim());
        }
        if (f.quality && f.quality !== 'Unknown') qSet.add(f.quality.trim());
      }
      genresCache = Array.from(gSet).sort();
      qualitiesCache = Array.from(qSet).sort();
    }
  } catch (err) {
    filmsCache = [];
  }
}

loadFilmsData();

app.use(express.json());
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/api/genres', (req, res) => res.json(genresCache));
app.get('/api/qualities', (req, res) => res.json(qualitiesCache));

app.get('/api/films', (req, res) => {
  const { q, genre, sort, quality, page = 1, limit = 20 } = req.query;
  let results = [...filmsCache];

  if (q) {
    const query = q.toLowerCase().trim();
    results = results.filter(f =>
      (f.title && f.title.toLowerCase().includes(query)) ||
      (f.genre && f.genre.toLowerCase().includes(query)) ||
      (f.director && f.director.toLowerCase().includes(query)) ||
      (f.actors && f.actors.some(actor => actor.toLowerCase().includes(query)))
    );
  }

  if (genre && genre !== 'All') {
    results = results.filter(f => f.genre && f.genre.toLowerCase().includes(genre.toLowerCase()));
  }

  if (quality && quality !== 'All') {
    results = results.filter(f => f.quality === quality);
  }

  if (sort === 'rating_desc') {
    results.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
  } else if (sort === 'votes_desc') {
    results.sort((a, b) => (parseInt(b.votes) || 0) - (parseInt(a.votes) || 0));
  } else if (sort === 'year_desc') {
    results.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
  } else if (sort === 'title_asc') {
    results.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  } else {
    results.sort(() => Math.random() - 0.5);
  }

  const p = parseInt(page) || 1;
  const l = parseInt(limit) || 20;
  const totalItems = results.length;
  const totalPages = Math.ceil(totalItems / l) || 1;
  const startIndex = (p - 1) * l;
  const endIndex = p * l;
  
  res.json({
    data: results.slice(startIndex, endIndex),
    currentPage: p,
    totalPages: totalPages,
    totalItems: totalItems
  });
});

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NimeLite - Ultra Turbo Lite</title>
  <style>
    :root {
      --bg: #000;
      --surface: #111;
      --card: #161616;
      --border: #222;
      --primary: #e50914;
      --text: #fff;
      --muted: #999;
      --star: #fbbf24;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body { background: var(--bg); color: var(--text); font-family: sans-serif; min-height: 100vh; display: flex; flex-direction: column; }
    header { background: #000; border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; padding: 12px 20px; }
    .h-container { max-width: 1250px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .brand { display: flex; align-items: center; gap: 10px; }
    .logo { font-size: 18px; font-weight: 900; color: var(--primary); text-decoration: none; text-transform: uppercase; }
    .logo span { color: #fff; }
    .counter { background: var(--surface); border: 1px solid var(--border); color: var(--muted); font-size: 10px; font-weight: bold; padding: 3px 8px; border-radius: 4px; }
    .controls { display: flex; align-items: center; gap: 6px; flex: 1; max-width: 550px; justify-content: flex-end; }
    .search-input, .select-input { padding: 7px 10px; background: #1a1a1a; border: 1px solid #333; border-radius: 4px; color: #fff; font-size: 11px; outline: none; cursor: pointer; }
    .search-input { flex: 1; }
    .search-input:focus, .select-input:focus { border-color: var(--primary); }
    
    .genre-container { max-width: 1250px; margin: 12px auto 0; padding: 0 20px; width: 100%; display: flex; align-items: center; gap: 6px; }
    .scroll-btn { background: var(--surface); color: var(--text); border: 1px solid var(--border); width: 28px; height: 28px; border-radius: 4px; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .scroll-btn:hover { background: var(--primary); border-color: var(--primary); }
    .genre-bar { display: flex; gap: 5px; overflow-x: auto; padding-bottom: 4px; scroll-behavior: smooth; scrollbar-width: thin; scrollbar-color: #444 var(--surface); flex: 1; }
    .genre-bar::-webkit-scrollbar { height: 4px; }
    .genre-bar::-webkit-scrollbar-thumb { background: #444; border-radius: 2px; }
    .chip { background: var(--surface); color: var(--muted); font-size: 10px; font-weight: 600; padding: 5px 10px; border-radius: 4px; border: 1px solid var(--border); cursor: pointer; white-space: nowrap; flex-shrink: 0; }
    .chip.active, .chip:hover { background: var(--primary); color: #fff; border-color: var(--primary); }
    
    .main { flex: 1; max-width: 1250px; width: 100%; margin: 0 auto; padding: 16px 20px; }
    
    .grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; }
    @media (max-width: 1024px) { .grid { grid-template-columns: repeat(4, 1fr); } }
    @media (max-width: 768px) { .grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 480px) { .grid { grid-template-columns: repeat(2, 1fr); } }

    .card { background: var(--card); border: 1px solid var(--border); border-radius: 6px; overflow: hidden; cursor: pointer; display: flex; flex-direction: column; }
    .card:hover { border-color: var(--primary); }
    .poster-wrap { position: relative; width: 100%; aspect-ratio: 2/3; background: #0a0a0a; }
    .poster-wrap img { width: 100%; height: 100%; object-fit: cover; content-visibility: auto; }
    .badge-q { position: absolute; top: 4px; left: 4px; background: rgba(0,0,0,0.85); color: #38bdf8; font-size: 9px; font-weight: bold; padding: 2px 5px; border-radius: 2px; }
    .badge-r { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.85); color: var(--star); font-size: 9px; font-weight: bold; padding: 2px 5px; border-radius: 2px; }
    .card-body { padding: 8px; display: flex; flex-direction: column; flex: 1; }
    .card-title { font-size: 11px; font-weight: bold; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 4px; }
    .card-meta { font-size: 10px; color: var(--muted); display: flex; justify-content: space-between; margin-top: auto; }
    
    .pagination { display: flex; justify-content: center; align-items: center; gap: 6px; margin: 20px 0; flex-wrap: wrap; }
    .p-btn { background: var(--surface); color: var(--text); border: 1px solid var(--border); padding: 6px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; cursor: pointer; }
    .p-btn:hover:not(:disabled), .p-btn.active { background: var(--primary); border-color: var(--primary); }
    .p-btn:disabled { opacity: 0.3; cursor: not-allowed; }

    /* Modal Pop-up Diperbesar & Proporsional di PC/Debian/Windows/HP */
    .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.88); z-index: 1000; display: none; align-items: center; justify-content: center; padding: 16px; }
    .modal.open { display: flex; }
    .modal-box { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; max-width: 650px; width: 100%; max-height: 85vh; overflow-y: auto; position: relative; padding: 24px; box-shadow: 0 15px 30px rgba(0,0,0,0.8); }
    .modal-close { position: absolute; top: 14px; right: 16px; background: none; border: none; color: #fff; font-size: 22px; cursor: pointer; }
    .modal-content { display: flex; gap: 20px; flex-wrap: wrap; }
    .modal-img { width: 180px; aspect-ratio: 2/3; border-radius: 6px; overflow: hidden; background: #000; flex-shrink: 0; border: 1px solid var(--border); }
    .modal-img img { width: 100%; height: 100%; object-fit: cover; }
    .modal-info { flex: 1; display: flex; flex-direction: column; gap: 10px; min-width: 220px; }
    .modal-h { font-size: 18px; font-weight: bold; line-height: 1.3; }
    .modal-desc { font-size: 12px; color: var(--muted); line-height: 1.5; max-height: 180px; overflow-y: auto; padding-right: 4px; }
    .btn-play { background: var(--primary); color: #fff; border: none; padding: 10px 18px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; margin-top: 6px; align-self: flex-start; transition: background 0.2s; }
    .btn-play:hover { background: #ff1e27; }
  </style>
</head>
<body>

<header>
  <div class="h-container">
    <div class="brand">
      <a href="/" class="logo">Nime<span>Lite</span></a>
      <div class="counter" id="totalCounter">0 Film</div>
    </div>
    <div class="controls">
      <input class="search-input" id="search" placeholder="Cari film, genre, aktor..." oninput="handleSearch()">
      <select class="select-input" id="qualitySelect" onchange="changePage(1)">
        <option value="All">Kualitas</option>
      </select>
      <select class="select-input" id="sortSelect" onchange="changePage(1)">
        <option value="default">Acak (Default)</option>
        <option value="rating_desc">Rating</option>
        <option value="votes_desc">Populer</option>
        <option value="year_desc">Tahun</option>
        <option value="title_asc">A-Z</option>
      </select>
    </div>
  </div>
</header>

<div class="genre-container">
  <button class="scroll-btn" onclick="scrollGenre(-200)">‹</button>
  <div class="genre-bar" id="genreBar">
    <button class="chip active" onclick="setGenre('All', this)">Semua</button>
  </div>
  <button class="scroll-btn" onclick="scrollGenre(200)">›</button>
</div>

<main class="main">
  <div class="pagination" id="pagTop"></div>
  <div class="grid" id="grid"></div>
  <div class="pagination" id="pagBot"></div>
</main>

<div class="modal" id="modal" onclick="closeModalBg(event)">
  <div class="modal-box">
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <div class="modal-content">
      <div class="modal-img"><img id="mImg" src=""></div>
      <div class="modal-info">
        <div class="modal-h" id="mTitle"></div>
        <div style="font-size: 12px; color: #38bdf8; font-weight: 600;" id="mMeta"></div>
        <div class="modal-desc" id="mDesc"></div>
        <button class="btn-play" id="mBtn">Nonton Film</button>
      </div>
    </div>
  </div>
</div>

<script>
let curGenre = 'All';
let curPage = 1;
let searchTimer;

async function init() {
  await loadFilters();
  await fetchFilms();
}

function scrollGenre(offset) {
  document.getElementById('genreBar').scrollBy({ left: offset, behavior: 'smooth' });
}

async function loadFilters() {
  try {
    const [gRes, qRes] = await Promise.all([fetch('/api/genres'), fetch('/api/qualities')]);
    const genres = await gRes.json();
    const qualities = await qRes.json();

    const bar = document.getElementById('genreBar');
    genres.forEach(g => {
      const btn = document.createElement('button');
      btn.className = 'chip';
      btn.textContent = g;
      btn.onclick = () => setGenre(g, btn);
      bar.appendChild(btn);
    });

    const qSelect = document.getElementById('qualitySelect');
    qualities.forEach(q => {
      const opt = document.createElement('option');
      opt.value = q;
      opt.textContent = q;
      qSelect.appendChild(opt);
    });
  } catch(e) {}
}

function setGenre(g, el) {
  curGenre = g;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  changePage(1);
}

function handleSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => changePage(1), 200);
}

function changePage(p) {
  curPage = p;
  fetchFilms();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function fetchFilms() {
  const q = document.getElementById('search').value.trim();
  const sort = document.getElementById('sortSelect').value;
  const quality = document.getElementById('qualitySelect').value;

  const params = new URLSearchParams({ page: curPage, limit: 20 });
  if (q) params.append('q', q);
  if (curGenre !== 'All') params.append('genre', curGenre);
  if (quality !== 'All') params.append('quality', quality);
  if (sort !== 'default') params.append('sort', sort);

  try {
    const res = await fetch('/api/films?' + params.toString());
    const json = await res.json();
    
    document.getElementById('totalCounter').textContent = json.totalItems + ' Film';

    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    const frag = document.createDocumentFragment();

    if (json.data.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #777; padding: 40px;">Film tidak ditemukan</div>';
      document.getElementById('pagTop').innerHTML = '';
      document.getElementById('pagBot').innerHTML = '';
      return;
    }

    json.data.forEach(f => {
      const card = document.createElement('div');
      card.className = 'card';
      card.onclick = () => openModal(f);

      card.innerHTML = \`
        <div class="poster-wrap">
          <img src="\${f.image || ''}" loading="lazy" alt="">
          <span class="badge-q">\${f.quality || 'HD'}</span>
          <span class="badge-r">\${f.rating ? '★ ' + f.rating : ''}</span>
        </div>
        <div class="card-body">
          <div class="card-title">\${f.title}</div>
          <div class="card-meta">
            <span>\${f.year || ''}</span>
            <span>\${f.duration || ''}</span>
          </div>
        </div>
      \`;
      frag.appendChild(card);
    });

    grid.appendChild(frag);
    renderPags(json.currentPage, json.totalPages);
  } catch(e) {}
}

function renderPags(curr, total) {
  const top = document.getElementById('pagTop');
  const bot = document.getElementById('pagBot');
  top.innerHTML = '';
  bot.innerHTML = '';
  if (total <= 1) return;

  const html = buildPagHTML(curr, total);
  top.innerHTML = html;
  bot.innerHTML = html;
}

function buildPagHTML(curr, total) {
  let html = \`<button class="p-btn" \${curr === 1 ? 'disabled' : ''} onclick="changePage(\${curr - 1})">«</button>\`;
  let start = Math.max(1, curr - 2);
  let end = Math.min(total, curr + 2);

  if (start > 1) {
    html += \`<button class="p-btn" onclick="changePage(1)">1</button>\`;
    if (start > 2) html += \`<span style="color:#555">..</span>\`;
  }
  for (let i = start; i <= end; i++) {
    html += \`<button class="p-btn \${i === curr ? 'active' : ''}" onclick="changePage(\${i})">\${i}</button>\`;
  }
  if (end < total) {
    if (end < total - 1) html += \`<span style="color:#555">..</span>\`;
    html += \`<button class="p-btn" onclick="changePage(\${total})">\${total}</button>\`;
  }
  html += \`<button class="p-btn" \${curr === total ? 'disabled' : ''} onclick="changePage(\${curr + 1})">»</button>\`;
  return html;
}

function openModal(f) {
  document.getElementById('mImg').src = f.image || '';
  document.getElementById('mTitle').textContent = f.title || '';
  document.getElementById('mMeta').textContent = \`Genre: \${f.genre || '-'} | Tahun: \${f.year || '-'}\`;
  document.getElementById('mDesc').textContent = f.description || 'Tidak ada deskripsi.';
  
  const btn = document.getElementById('mBtn');
  const url = f.url || (f.servers && f.servers[0] ? f.servers[0].url : '#');
  btn.onclick = () => { if (url !== '#') window.open(url, '_blank'); };
  document.getElementById('modal').classList.add('open');
}

function closeModal() { document.getElementById('modal').classList.remove('open'); }
function closeModalBg(e) { if (e.target.id === 'modal') closeModal(); }

init();
</script>
</body>
</html>`);
});

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});