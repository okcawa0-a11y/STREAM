const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

const filmsPath = path.join(__dirname, 'films.json');
let filmsData = [];

function loadFilmsData() {
  try {
    if (fs.existsSync(filmsPath)) {
      const rawData = fs.readFileSync(filmsPath, 'utf8');
      filmsData = JSON.parse(rawData);
      console.log('[INFO] Loaded ' + filmsData.length + ' films from films.json');
    } else {
      console.log('[WARN] films.json not found in directory');
      filmsData = [];
    }
  } catch (err) {
    console.error('[ERROR] Failed to load films.json:', err.message);
    filmsData = [];
  }
}

loadFilmsData();

app.use(express.json());

app.get('/favicon.ico', (req, res) => res.status(204).end());

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

function getUniqueGenres() {
  const genresSet = new Set();
  filmsData.forEach(film => {
    if (film.genre && film.genre !== 'Unknown') {
      film.genre.split(',').forEach(g => genresSet.add(g.trim()));
    }
  });
  return Array.from(genresSet).sort();
}

app.get('/api/films', (req, res) => {
  let results = [...filmsData];
  const { q, genre, sort, quality } = req.query;

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
    results = results.filter(f =>
      f.genre && f.genre.toLowerCase().includes(genre.toLowerCase())
    );
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
    results = shuffleArray(results);
  }

  res.json(results);
});

app.get('/api/film/:slug', (req, res) => {
  const film = filmsData.find(f => f.slug === req.params.slug || f.id === req.params.slug);
  if (!film) return res.status(404).json({ error: 'Film not found' });
  res.json(film);
});

app.get('/api/genres', (req, res) => {
  res.json(getUniqueGenres());
});

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <title>NimeStream</title>
  <style>
    :root {
      --bg-color: #07080a;
      --surface-color: #12151d;
      --card-bg: #161922;
      --card-border: #222634;
      --primary: #e50914;
      --primary-hover: #ff1e27;
      --text-main: #f9fafb;
      --text-muted: #9ca3af;
      --star-color: #fbbf24;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      background-color: var(--bg-color);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }

    header {
      background: rgba(7, 8, 10, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--card-border);
      position: sticky;
      top: 0;
      z-index: 100;
      padding: 16px 32px;
    }

    .header-container {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .logo {
      font-size: 22px;
      font-weight: 900;
      color: var(--primary);
      text-decoration: none;
      letter-spacing: -0.5px;
      display: flex;
      align-items: center;
      gap: 6px;
      text-transform: uppercase;
    }
    .logo span { color: #ffffff; }

    .brand-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .controls-group {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      max-width: 680px;
      justify-content: flex-end;
    }

    .search-wrap {
      position: relative;
      flex: 1;
      min-width: 180px;
    }
    .search-input {
      width: 100%;
      padding: 10px 16px;
      background: var(--surface-color);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      color: var(--text-main);
      font-size: 13px;
      font-weight: 500;
      outline: none;
      transition: all 0.2s ease;
    }
    .search-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.15);
    }

    .select-input {
      background: var(--surface-color);
      border: 1px solid var(--card-border);
      color: var(--text-main);
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      outline: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .select-input:hover {
      border-color: var(--text-muted);
    }

    .count-pill {
      background: var(--surface-color);
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 700;
      padding: 8px 14px;
      border-radius: 8px;
      border: 1px solid var(--card-border);
      white-space: nowrap;
    }

    .genre-bar-container {
      max-width: 1400px;
      margin: 16px auto 0;
      padding: 0 32px;
      width: 100%;
    }
    .genre-bar {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 8px;
      scrollbar-width: none;
    }
    .genre-bar::-webkit-scrollbar { display: none; }

    /* PC Scrollbar Styles */
    @media (min-width: 769px) {
      .genre-bar {
        scrollbar-width: thin;
        scrollbar-color: #4b5563 #12151d;
        padding-bottom: 12px;
      }
      .genre-bar::-webkit-scrollbar {
        display: block;
        height: 6px;
      }
      .genre-bar::-webkit-scrollbar-track {
        background: #12151d;
        border-radius: 3px;
      }
      .genre-bar::-webkit-scrollbar-thumb {
        background: #4b5563;
        border-radius: 3px;
      }
      .genre-bar::-webkit-scrollbar-thumb:hover {
        background: var(--primary);
      }
    }

    .genre-chip {
      background: var(--surface-color);
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 8px;
      border: 1px solid var(--card-border);
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
    }
    .genre-chip:hover, .genre-chip.active {
      background: var(--primary);
      color: #ffffff;
      border-color: var(--primary);
      transform: translateY(-1px);
    }

    .main-content {
      flex: 1;
      max-width: 1400px;
      width: 100%;
      margin: 0 auto;
      padding: 24px 32px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 20px;
    }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      position: relative;
      display: flex;
      flex-direction: column;
      text-decoration: none;
      color: inherit;
      outline: none;
      transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
    }
    .card:hover {
      border-color: var(--primary);
      transform: translateY(-4px);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    
    .card:focus, .card:focus-visible {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary);
      z-index: 10;
    }

    .card-poster {
      position: relative;
      width: 100%;
      aspect-ratio: 2/3;
      background: #12151d;
      overflow: hidden;
    }
    .card-poster img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    .card:hover .card-poster img {
      transform: scale(1.03);
    }

    .badge-quality {
      position: absolute;
      top: 8px;
      left: 8px;
      background: rgba(11, 12, 16, 0.85);
      backdrop-filter: blur(4px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #38bdf8;
      font-size: 10px;
      font-weight: 800;
      padding: 3px 7px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .badge-rating {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(11, 12, 16, 0.85);
      backdrop-filter: blur(4px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--star-color);
      font-size: 11px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 3px;
    }

    .card-info {
      padding: 12px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .card-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-main);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: 8px;
    }
    .card-meta {
      font-size: 11px;
      color: var(--text-muted);
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: auto;
    }

    .empty-state {
      text-align: center;
      padding: 80px 20px;
      color: var(--text-muted);
      font-weight: 600;
      font-size: 14px;
      grid-column: 1 / -1;
    }

    @media (max-width: 768px) {
      header { padding: 12px 16px; }
      .genre-bar-container, .main-content { padding-left: 16px; padding-right: 16px; }
      .header-container { flex-direction: column; align-items: stretch; gap: 12px; }
      .brand-row { width: 100%; display: flex; align-items: center; justify-content: space-between; }
      .controls-group { flex-wrap: nowrap; width: 100%; max-width: 100%; gap: 8px; }
      .select-input { max-width: 140px; font-size: 11px; padding: 8px 8px; }
      .grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px; }
    }

    @media (max-width: 480px) {
      .grid { grid-template-columns: repeat(auto-fill, minmax(105px, 1fr)); gap: 8px; }
      .card-info { padding: 8px; }
      .card-title { font-size: 11px; }
      .card-meta { font-size: 10px; }
    }

    .select-input:focus-visible, .genre-chip:focus-visible {
      outline: 2px solid var(--primary);
    }
  </style>
</head>
<body>

<header>
  <div class="header-container">
    <div class="brand-row">
      <a href="/" class="logo">
        NIME<span>STREAM</span>
      </a>
      <span class="count-pill" id="countPill">0 Film</span>
    </div>

    <div class="controls-group">
      <div class="search-wrap">
        <input class="search-input" id="search" placeholder="Cari film, genre, actor..." oninput="handleSearch()">
      </div>

      <select class="select-input" id="sortSelect" onchange="fetchAndRender()">
        <option value="default">Urutkan: Default</option>
        <option value="rating_desc">Rating Tertinggi</option>
        <option value="votes_desc">Paling Populer</option>
        <option value="year_desc">Tahun Terbaru</option>
        <option value="title_asc">Abjad A-Z</option>
      </select>
    </div>
  </div>
</header>

<div class="genre-bar-container">
  <div class="genre-bar" id="genreBar">
    <button class="genre-chip active" onclick="setGenre('All', this)">Semua Genre</button>
  </div>
</div>

<main class="main-content">
  <div class="grid" id="grid">
    <div class="empty-state">Memuat katalog film...</div>
  </div>
</main>

<script>
var currentGenre = 'All';

async function init() {
  await loadGenres();
  await fetchAndRender();
}

async function loadGenres() {
  try {
    var res = await fetch('/api/genres');
    var genres = await res.json();
    var genreBar = document.getElementById('genreBar');
    
    genres.forEach(function(g) {
      var btn = document.createElement('button');
      btn.className = 'genre-chip';
      btn.textContent = g;
      btn.onclick = function() { setGenre(g, btn); };
      genreBar.appendChild(btn);
    });
  } catch(e) {
    console.error('Failed to load genres', e);
  }
}

function setGenre(genre, element) {
  currentGenre = genre;
  document.querySelectorAll('.genre-chip').forEach(function(el) { el.classList.remove('active'); });
  element.classList.add('active');
  fetchAndRender();
}

var searchTimer;
function handleSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(function() {
    fetchAndRender();
  }, 200);
}

async function fetchAndRender() {
  var q = document.getElementById('search').value.trim();
  var sort = document.getElementById('sortSelect').value;
  
  var params = new URLSearchParams();
  if (q) params.append('q', q);
  if (currentGenre !== 'All') params.append('genre', currentGenre);
  if (sort !== 'default') params.append('sort', sort);

  try {
    var res = await fetch('/api/films?' + params.toString());
    var films = await res.json();
    renderGrid(films);
  } catch (err) {
    document.getElementById('grid').innerHTML = '<div class="empty-state">Gagal terhubung ke server</div>';
  }
}

function renderGrid(list) {
  var grid = document.getElementById('grid');
  document.getElementById('countPill').textContent = (list ? list.length : 0) + ' Film';

  if (!list || list.length === 0) {
    grid.innerHTML = '<div class="empty-state">Film tidak ditemukan</div>';
    return;
  }

  grid.innerHTML = '';

  for (var i = 0; i < list.length; i++) {
    (function(f) {
      var poster = f.image || 'https://via.placeholder.com/200x300/181a24/9ca3af?text=No+Poster';
      var rating = (f.rating && f.rating !== '0' && f.rating !== 0) ? f.rating : '-';
      var quality = f.quality || 'HD';
      var year = f.year || '-';
      var duration = f.duration || 'N/A';
      
      var targetUrl = f.url || (f.servers && f.servers[0] ? f.servers[0].url : '#');

      var card = document.createElement('div');
      card.className = 'card';
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', f.title || 'Film');

      card.onclick = function() {
        if (targetUrl && targetUrl !== '#') {
          window.open(targetUrl, '_blank', 'noopener,noreferrer');
        }
      };

      card.onkeydown = function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (targetUrl && targetUrl !== '#') {
            window.open(targetUrl, '_blank', 'noopener,noreferrer');
          }
        }
      };

      card.onfocus = function() {
        card.scrollIntoView({ behavior: 'auto', block: 'nearest' });
      };

      var posterDiv = document.createElement('div');
      posterDiv.className = 'card-poster';

      var img = document.createElement('img');
      img.src = poster;
      img.alt = f.title || '';
      img.loading = 'lazy';
      img.onerror = function() {
        this.src = 'https://via.placeholder.com/200x300/181a24/9ca3af?text=Error';
      };

      var qualitySpan = document.createElement('span');
      qualitySpan.className = 'badge-quality';
      qualitySpan.textContent = quality;

      var ratingSpan = document.createElement('span');
      ratingSpan.className = 'badge-rating';
      ratingSpan.textContent = rating;

      posterDiv.appendChild(img);
      posterDiv.appendChild(qualitySpan);
      posterDiv.appendChild(ratingSpan);

      var infoDiv = document.createElement('div');
      infoDiv.className = 'card-info';

      var titleDiv = document.createElement('div');
      titleDiv.className = 'card-title';
      titleDiv.textContent = f.title || 'Untitled';

      var metaDiv = document.createElement('div');
      metaDiv.className = 'card-meta';

      var yearSpan = document.createElement('span');
      yearSpan.textContent = year;

      var durationSpan = document.createElement('span');
      durationSpan.textContent = duration;

      metaDiv.appendChild(yearSpan);
      metaDiv.appendChild(durationSpan);

      infoDiv.appendChild(titleDiv);
      infoDiv.appendChild(metaDiv);

      card.appendChild(posterDiv);
      card.appendChild(infoDiv);

      grid.appendChild(card);
    })(list[i]);
  }
}

init();
</script>
</body>
</html>`);
});

app.listen(PORT, () => {
  console.log('[SERVER] NimeStream Server running on http://localhost:' + PORT);
  console.log('[API] Endpoints available:');
  console.log('  - GET /api/films');
  console.log('  - GET /api/genres');
});