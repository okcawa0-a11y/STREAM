const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// ===== BACA films.json (AMAN UNTUK VERCEL) =====
const filmsPath = path.join(__dirname, 'films.json');
let filmsData = [];

try {
  // Cek apakah file ada
  if (fs.existsSync(filmsPath)) {
    const rawData = fs.readFileSync(filmsPath, 'utf8');
    filmsData = JSON.parse(rawData);
    console.log(`📊 Load ${filmsData.length} film dari films.json`);
  } else {
    console.log('⚠️ films.json tidak ditemukan!');
    // Fallback: coba baca dari path lain (buat Vercel)
    const altPath = path.join(process.cwd(), 'films.json');
    if (fs.existsSync(altPath)) {
      const rawData = fs.readFileSync(altPath, 'utf8');
      filmsData = JSON.parse(rawData);
      console.log(`📊 Load ${filmsData.length} film dari ${altPath}`);
    } else {
      console.log('❌ films.json tidak ditemukan di kedua lokasi!');
      filmsData = [];
    }
  }
} catch (err) {
  console.error('❌ Gagal load films.json:', err.message);
  filmsData = [];
}

// ===== CEGAH CRASH KALO DATA KOSONG =====
if (!Array.isArray(filmsData)) {
  filmsData = [];
}

app.use(express.json());

// ===== API =====
app.get('/api/films', (req, res) => {
  try {
    res.json(filmsData);
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat data' });
  }
});

app.get('/api/film/:slug', (req, res) => {
  try {
    const film = filmsData.find(f => f.slug === req.params.slug);
    if (!film) return res.status(404).json({ error: 'Film tidak ditemukan' });
    res.json(film);
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat film' });
  }
});

app.get('/api/search', (req, res) => {
  try {
    const q = req.query.q?.toLowerCase() || '';
    const results = filmsData.filter(f =>
      f.title.toLowerCase().includes(q) ||
      (f.genre && f.genre.toLowerCase().includes(q))
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mencari' });
  }
});

// ===== FRONTEND =====
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <title>NimeStream</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { 
      background:#0a0a0a; 
      color:#fff; 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: 16px;
      line-height: 1.4;
      min-height: 100vh;
    }
    
    header {
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      background: #0a0a0a;
      border-bottom: 1px solid #1a1a1a;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .logo {
      font-size: clamp(18px, 4vw, 28px);
      font-weight: 900;
      color: #e50914;
      white-space: nowrap;
    }
    .logo span { color: #fff; }
    
    .search-wrap {
      position: relative;
      flex: 1;
      min-width: 100px;
      max-width: 400px;
    }
    .search-wrap i {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #666;
      font-size: 14px;
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      padding: 8px 12px 8px 34px;
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 8px;
      color: #fff;
      font-size: clamp(13px, 1.5vw, 16px);
      outline: none;
    }
    .search-input:focus { border-color: #e50914; }
    .search-input::placeholder { color: #555; }
    
    .count {
      color: #888;
      font-size: clamp(11px, 1.2vw, 14px);
      white-space: nowrap;
      background: #141414;
      padding: 4px 14px;
      border-radius: 20px;
      border: 1px solid #222;
    }
    
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 16px;
      padding: 16px;
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .wrap { position: relative; }
    .card {
      cursor: pointer;
      background: #141414;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid #1a1a1a;
      transition: border 0.2s, transform 0.15s;
    }
    .card:hover { 
      border-color: #e50914;
      transform: scale(1.02);
    }
    .card img {
      width: 100%;
      aspect-ratio: 2/3;
      object-fit: cover;
      display: block;
      background: #1a1a1a;
    }
    .card-info {
      padding: 10px 10px 12px;
    }
    .card-title {
      font-size: clamp(14px, 1.4vw, 17px);
      font-weight: 600;
      line-height: 1.3;
      text-align: center;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      min-height: 38px;
    }
    
    .badge {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(229, 9, 20, 0.92);
      color: #fff;
      font-size: clamp(9px, 0.9vw, 11px);
      font-weight: 700;
      padding: 2px 10px;
      border-radius: 12px;
      z-index: 2;
    }
    
    .loading, .empty {
      text-align: center;
      padding: 40px 20px;
      color: #555;
      grid-column: 1 / -1;
    }
    
    .card:focus-visible {
      outline: 2px solid #e50914;
      outline-offset: 2px;
    }
    @media (pointer: coarse) {
      .card:focus-visible {
        outline: 3px solid #e50914;
        outline-offset: 4px;
        box-shadow: 0 0 30px rgba(229, 9, 20, 0.3);
      }
    }
    @media (hover: none) and (pointer: coarse) {
      .card:hover { transform: none; }
    }
    
    @media (max-width: 768px) {
      header { padding: 8px 12px; }
      .search-wrap { min-width: 80px; max-width: 100%; }
      .grid { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; padding: 12px; }
      .card-title { font-size: 13px; min-height: 32px; }
    }
    @media (max-width: 480px) {
      header { flex-wrap: wrap; padding: 6px 10px; }
      .logo { font-size: 18px; }
      .search-wrap { min-width: 60px; flex-basis: 100%; order: 3; }
      .grid { grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 8px; padding: 8px; }
      .card-title { font-size: 11px; min-height: 26px; }
      .card-info { padding: 6px 6px 8px; }
      .badge { top: 4px; right: 4px; font-size: 8px; padding: 1px 6px; border-radius: 8px; }
      .count { font-size: 10px; padding: 1px 8px; }
      .card:hover { transform: none; }
    }
    @media (min-width: 1024px) {
      .grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 24px; padding: 24px; }
      .card-title { font-size: 17px; min-height: 44px; }
      .badge { font-size: 12px; padding: 3px 14px; top: 10px; right: 10px; }
      .card:hover { transform: scale(1.04); }
      header { padding: 14px 28px; }
      .logo { font-size: 28px; }
      .search-input { padding: 10px 16px 10px 40px; font-size: 16px; }
      .count { font-size: 14px; padding: 6px 20px; }
      .card:focus-visible { outline: 3px solid #e50914; outline-offset: 3px; }
    }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #0a0a0a; }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #e50914; }
  </style>
</head>
<body>

<header>
  <div class="logo">Nime<span>Stream</span></div>
  <div class="search-wrap">
    <i>🔍</i>
    <input class="search-input" id="search" placeholder="Cari film..." oninput="search(this.value)">
  </div>
  <span class="count" id="count">0</span>
</header>

<div class="grid" id="grid"><div class="loading">⏳ Loading...</div></div>

<script>
let films = [];

async function load() {
  try {
    const res = await fetch('/api/films');
    if (!res.ok) throw new Error('Gagal load');
    films = await res.json();
    render(films);
    document.getElementById('count').textContent = films.length + ' film';
  } catch(e) {
    document.getElementById('grid').innerHTML = '<div class="empty">❌ Gagal memuat data</div>';
    console.error(e);
  }
}

function render(list) {
  const grid = document.getElementById('grid');
  if (!list || !list.length) {
    grid.innerHTML = '<div class="empty">🎬 Tidak ada film</div>';
    return;
  }
  grid.innerHTML = list.map(f => {
    const img = f.image || 'https://via.placeholder.com/200x300/1a1a1a/666?text=No+Image';
    const link = f.servers?.[0]?.url || '#';
    return \`
      <div class="wrap">
        <div class="card" onclick="openLink('\${link}')" tabindex="0" role="button" aria-label="\${f.title}">
          <img src="\${img}" alt="\${f.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/200x300/1a1a1a/666?text=Error'">
          <div class="badge">\${f.year || 'HD'}</div>
          <div class="card-info">
            <div class="card-title">\${f.title}</div>
          </div>
        </div>
      </div>
    \`;
  }).join('');
}

function search(q) {
  const s = q.toLowerCase().trim();
  if (!s) { render(films); return; }
  const filtered = films.filter(f => 
    f.title.toLowerCase().includes(s) || 
    (f.genre && f.genre.toLowerCase().includes(s))
  );
  render(filtered);
}

function openLink(url) {
  if (url && url !== '#') {
    const ua = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    const isSTB = /Samsung|SM-|SVP|Tizen|WebOS|SmartTV|Android.*TV/i.test(ua);
    const isLargeScreen = window.screen.width >= 1920 || window.screen.height >= 1080;
    
    if (isSTB || (isLargeScreen && !isMobile)) {
      window.location.href = url;
    } else {
      window.open(url, '_blank');
    }
  } else {
    alert('Link tidak tersedia');
  }
}

load();
</script>
</body>
</html>`);
});

// ===== START =====
app.listen(PORT, () => {
  console.log(`🚀 NimeStream running at http://localhost:${PORT}`);
  console.log(`📊 Total film: ${filmsData.length}`);
});

// ===== EXPORT UNTUK VERCEL =====
module.exports = app;    f.title.toLowerCase().includes(q) ||
    (f.genre && f.genre.toLowerCase().includes(q))
  );
  res.json(results);
});

// ===== FRONTEND =====
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <title>NimeStream</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { 
      background:#0a0a0a; 
      color:#fff; 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: 16px;
      line-height: 1.4;
      min-height: 100vh;
    }
    
    /* ===== HEADER ===== */
    header {
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      background: #0a0a0a;
      border-bottom: 1px solid #1a1a1a;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .logo {
      font-size: clamp(18px, 4vw, 28px);
      font-weight: 900;
      color: #e50914;
      white-space: nowrap;
    }
    .logo span { color: #fff; }
    
    .search-wrap {
      position: relative;
      flex: 1;
      min-width: 100px;
      max-width: 400px;
    }
    .search-wrap i {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #666;
      font-size: 14px;
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      padding: 8px 12px 8px 34px;
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 8px;
      color: #fff;
      font-size: clamp(13px, 1.5vw, 16px);
      outline: none;
      transition: border 0.2s;
    }
    .search-input:focus { border-color: #e50914; }
    .search-input::placeholder { color: #555; }
    
    .count {
      color: #888;
      font-size: clamp(11px, 1.2vw, 14px);
      white-space: nowrap;
      background: #141414;
      padding: 4px 14px;
      border-radius: 20px;
      border: 1px solid #222;
    }
    
    /* ===== GRID ===== */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 16px;
      padding: 16px;
      max-width: 1400px;
      margin: 0 auto;
    }
    
    /* ===== CARD ===== */
    .wrap { position: relative; }
    .card {
      cursor: pointer;
      background: #141414;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid #1a1a1a;
      transition: border 0.2s, transform 0.15s;
    }
    .card:hover { 
      border-color: #e50914;
      transform: scale(1.02);
    }
    .card img {
      width: 100%;
      aspect-ratio: 2/3;
      object-fit: cover;
      display: block;
      background: #1a1a1a;
    }
    .card-info {
      padding: 10px 10px 12px;
    }
    .card-title {
      font-size: clamp(14px, 1.4vw, 17px);
      font-weight: 600;
      line-height: 1.3;
      text-align: center;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      min-height: 38px;
    }
    
    /* ===== BADGE ===== */
    .badge {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(229, 9, 20, 0.92);
      color: #fff;
      font-size: clamp(9px, 0.9vw, 11px);
      font-weight: 700;
      padding: 2px 10px;
      border-radius: 12px;
      z-index: 2;
      letter-spacing: 0.3px;
    }
    
    /* ===== STATE ===== */
    .loading, .empty {
      text-align: center;
      padding: 40px 20px;
      color: #555;
      grid-column: 1 / -1;
      font-size: clamp(14px, 1.5vw, 18px);
    }
    
    /* ============================================================
       TABLET
    ============================================================ */
    @media (max-width: 768px) {
      header { padding: 8px 12px; gap: 6px; }
      .search-wrap { min-width: 80px; max-width: 100%; }
      .search-input { padding: 6px 10px 6px 30px; font-size: 13px; }
      .grid { 
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); 
        gap: 12px; 
        padding: 12px; 
      }
      .card-info { padding: 8px 8px 10px; }
      .card-title { 
        font-size: 13px; 
        min-height: 32px;
      }
      .badge { top: 6px; right: 6px; font-size: 9px; padding: 1px 8px; }
      .count { font-size: 11px; padding: 2px 10px; }
    }
    
    /* ============================================================
       HP
    ============================================================ */
    @media (max-width: 480px) {
      header { 
        flex-wrap: wrap; 
        padding: 6px 10px; 
        gap: 4px;
      }
      .logo { font-size: 18px; }
      .search-wrap { 
        min-width: 60px; 
        max-width: 100%; 
        flex-basis: 100%; 
        order: 3; 
      }
      .search-input { padding: 6px 8px 6px 28px; font-size: 12px; }
      .search-wrap i { font-size: 12px; left: 8px; }
      .grid { 
        grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); 
        gap: 8px; 
        padding: 8px; 
      }
      .card-info { padding: 6px 6px 8px; }
      .card-title { 
        font-size: 11px; 
        min-height: 26px;
      }
      .badge { top: 4px; right: 4px; font-size: 8px; padding: 1px 6px; border-radius: 8px; }
      .count { font-size: 10px; padding: 1px 8px; }
      .card:hover { transform: none; }
    }
    
    /* ============================================================
       STB TV (LAYAR BESAR)
    ============================================================ */
    @media (min-width: 1024px) {
      .grid { 
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); 
        gap: 24px; 
        padding: 24px; 
      }
      .card-title { 
        font-size: 17px; 
        min-height: 44px;
      }
      .card-info { padding: 12px 14px 14px; }
      .badge { font-size: 12px; padding: 3px 14px; top: 10px; right: 10px; }
      .card:hover { 
        transform: scale(1.04);
        border-color: #e50914;
      }
      header { padding: 14px 28px; }
      .logo { font-size: 28px; }
      .search-input { padding: 10px 16px 10px 40px; font-size: 16px; }
      .search-wrap i { font-size: 16px; left: 14px; }
      .count { font-size: 14px; padding: 6px 20px; }
      .card:focus-visible { outline: 3px solid #e50914; outline-offset: 3px; }
    }
    
    /* ============================================================
       TV REMOTE FRIENDLY
    ============================================================ */
    .card:focus-visible {
      outline: 2px solid #e50914;
      outline-offset: 2px;
    }
    @media (pointer: coarse) {
      .card:focus-visible {
        outline: 3px solid #e50914;
        outline-offset: 4px;
        box-shadow: 0 0 30px rgba(229, 9, 20, 0.3);
      }
    }
    @media (hover: none) and (pointer: coarse) {
      .card:hover { transform: none; }
    }
    
    /* ============================================================
       SCROLLBAR
    ============================================================ */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #0a0a0a; }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #e50914; }
  </style>
</head>
<body>

<header>
  <div class="logo">Nime<span>Stream</span></div>
  <div class="search-wrap">
    <i>🔍</i>
    <input class="search-input" id="search" placeholder="Cari film..." oninput="search(this.value)">
  </div>
  <span class="count" id="count">0</span>
</header>

<div class="grid" id="grid"><div class="loading">⏳ Loading...</div></div>

<script>
let films = [];

async function load() {
  try {
    const res = await fetch('/api/films');
    films = await res.json();
    render(films);
    document.getElementById('count').textContent = films.length + ' film';
  } catch(e) {
    document.getElementById('grid').innerHTML = '<div class="empty">❌ Gagal memuat data</div>';
  }
}

function render(list) {
  const grid = document.getElementById('grid');
  if (!list || !list.length) {
    grid.innerHTML = '<div class="empty">🎬 Tidak ada film</div>';
    return;
  }
  grid.innerHTML = list.map(f => {
    const img = f.image || 'https://via.placeholder.com/200x300/1a1a1a/666?text=No+Image';
    const link = f.servers?.[0]?.url || '#';
    return \`
      <div class="wrap">
        <div class="card" onclick="openLink('\${link}')" tabindex="0" role="button" aria-label="\${f.title}">
          <img src="\${img}" alt="\${f.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/200x300/1a1a1a/666?text=Error'">
          <div class="badge">\${f.year || 'HD'}</div>
          <div class="card-info">
            <div class="card-title">\${f.title}</div>
          </div>
        </div>
      </div>
    \`;
  }).join('');
}

function search(q) {
  const s = q.toLowerCase().trim();
  if (!s) { render(films); return; }
  const filtered = films.filter(f => 
    f.title.toLowerCase().includes(s) || 
    (f.genre && f.genre.toLowerCase().includes(s))
  );
  render(filtered);
}

// ===== FIX: Deteksi STB vs HP/PC =====
function openLink(url) {
  if (url && url !== '#') {
    // Deteksi perangkat
    const ua = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    const isSTB = /Samsung|SM-|SVP|Tizen|WebOS|SmartTV|Android.*TV/i.test(ua);
    const isLargeScreen = window.screen.width >= 1920 || window.screen.height >= 1080;
    
    // Kalo STB atau TV: redirect di tab yang sama (biar nggak about:blank)
    if (isSTB || (isLargeScreen && !isMobile)) {
      window.location.href = url;
    } else {
      // HP/PC: buka tab baru
      window.open(url, '_blank');
    }
  } else {
    alert('Link tidak tersedia');
  }
}

load();
</script>
</body>
</html>`);
});

// ===== START =====
app.listen(PORT, () => {
  console.log(`🚀 NimeStream running at http://localhost:${PORT}`);
  console.log(`📊 Total film: ${filmsData.length}`);
});    f.title.toLowerCase().includes(q) ||
    (f.genre && f.genre.toLowerCase().includes(q))
  );
  res.json(results);
});

// ===== FRONTEND =====
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <title>NimeStream</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { 
      background:#0a0a0a; 
      color:#fff; 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: 16px;
      line-height: 1.4;
      min-height: 100vh;
    }
    
    /* ===== HEADER ===== */
    header {
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      background: #0a0a0a;
      border-bottom: 1px solid #1a1a1a;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .logo {
      font-size: clamp(18px, 4vw, 28px);
      font-weight: 900;
      color: #e50914;
      white-space: nowrap;
    }
    .logo span { color: #fff; }
    
    .search-wrap {
      position: relative;
      flex: 1;
      min-width: 100px;
      max-width: 400px;
    }
    .search-wrap i {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #666;
      font-size: 14px;
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      padding: 8px 12px 8px 34px;
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 8px;
      color: #fff;
      font-size: clamp(13px, 1.5vw, 16px);
      outline: none;
      transition: border 0.2s;
    }
    .search-input:focus { border-color: #e50914; }
    .search-input::placeholder { color: #555; }
    
    .count {
      color: #888;
      font-size: clamp(11px, 1.2vw, 14px);
      white-space: nowrap;
      background: #141414;
      padding: 4px 14px;
      border-radius: 20px;
      border: 1px solid #222;
    }
    
    /* ===== GRID ===== */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 16px;
      padding: 16px;
      max-width: 1400px;
      margin: 0 auto;
    }
    
    /* ===== CARD ===== */
    .wrap { position: relative; }
    .card {
      cursor: pointer;
      background: #141414;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid #1a1a1a;
      transition: border 0.2s, transform 0.15s;
    }
    .card:hover { 
      border-color: #e50914;
      transform: scale(1.02);
    }
    .card img {
      width: 100%;
      aspect-ratio: 2/3;
      object-fit: cover;
      display: block;
      background: #1a1a1a;
    }
    .card-info {
      padding: 10px 10px 12px;
    }
    .card-title {
      font-size: clamp(14px, 1.4vw, 17px);
      font-weight: 600;
      line-height: 1.3;
      text-align: center;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      min-height: 38px;
    }
    
    /* ===== BADGE ===== */
    .badge {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(229, 9, 20, 0.92);
      color: #fff;
      font-size: clamp(9px, 0.9vw, 11px);
      font-weight: 700;
      padding: 2px 10px;
      border-radius: 12px;
      z-index: 2;
      letter-spacing: 0.3px;
    }
    
    /* ===== STATE ===== */
    .loading, .empty {
      text-align: center;
      padding: 40px 20px;
      color: #555;
      grid-column: 1 / -1;
      font-size: clamp(14px, 1.5vw, 18px);
    }
    
    /* ============================================================
       TABLET
    ============================================================ */
    @media (max-width: 768px) {
      header { padding: 8px 12px; gap: 6px; }
      .search-wrap { min-width: 80px; max-width: 100%; }
      .search-input { padding: 6px 10px 6px 30px; font-size: 13px; }
      .grid { 
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); 
        gap: 12px; 
        padding: 12px; 
      }
      .card-info { padding: 8px 8px 10px; }
      .card-title { 
        font-size: 13px; 
        min-height: 32px;
      }
      .badge { top: 6px; right: 6px; font-size: 9px; padding: 1px 8px; }
      .count { font-size: 11px; padding: 2px 10px; }
    }
    
    /* ============================================================
       HP
    ============================================================ */
    @media (max-width: 480px) {
      header { 
        flex-wrap: wrap; 
        padding: 6px 10px; 
        gap: 4px;
      }
      .logo { font-size: 18px; }
      .search-wrap { 
        min-width: 60px; 
        max-width: 100%; 
        flex-basis: 100%; 
        order: 3; 
      }
      .search-input { padding: 6px 8px 6px 28px; font-size: 12px; }
      .search-wrap i { font-size: 12px; left: 8px; }
      .grid { 
        grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); 
        gap: 8px; 
        padding: 8px; 
      }
      .card-info { padding: 6px 6px 8px; }
      .card-title { 
        font-size: 11px; 
        min-height: 26px;
      }
      .badge { top: 4px; right: 4px; font-size: 8px; padding: 1px 6px; border-radius: 8px; }
      .count { font-size: 10px; padding: 1px 8px; }
      .card:hover { transform: none; }
    }
    
    /* ============================================================
       STB TV (LAYAR BESAR)
    ============================================================ */
    @media (min-width: 1024px) {
      .grid { 
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); 
        gap: 24px; 
        padding: 24px; 
      }
      .card-title { 
        font-size: 17px; 
        min-height: 44px;
      }
      .card-info { padding: 12px 14px 14px; }
      .badge { font-size: 12px; padding: 3px 14px; top: 10px; right: 10px; }
      .card:hover { 
        transform: scale(1.04);
        border-color: #e50914;
      }
      header { padding: 14px 28px; }
      .logo { font-size: 28px; }
      .search-input { padding: 10px 16px 10px 40px; font-size: 16px; }
      .search-wrap i { font-size: 16px; left: 14px; }
      .count { font-size: 14px; padding: 6px 20px; }
      .card:focus-visible { outline: 3px solid #e50914; outline-offset: 3px; }
    }
    
    /* ============================================================
       TV REMOTE FRIENDLY
    ============================================================ */
    .card:focus-visible {
      outline: 2px solid #e50914;
      outline-offset: 2px;
    }
    @media (pointer: coarse) {
      .card:focus-visible {
        outline: 3px solid #e50914;
        outline-offset: 4px;
        box-shadow: 0 0 30px rgba(229, 9, 20, 0.3);
      }
    }
    @media (hover: none) and (pointer: coarse) {
      .card:hover { transform: none; }
    }
    
    /* ============================================================
       SCROLLBAR
    ============================================================ */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #0a0a0a; }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #e50914; }
  </style>
</head>
<body>

<header>
  <div class="logo">Nime<span>Stream</span></div>
  <div class="search-wrap">
    <i>🔍</i>
    <input class="search-input" id="search" placeholder="Cari film..." oninput="search(this.value)">
  </div>
  <span class="count" id="count">0</span>
</header>

<div class="grid" id="grid"><div class="loading">⏳ Loading...</div></div>

<script>
let films = [];

async function load() {
  try {
    const res = await fetch('/api/films');
    films = await res.json();
    render(films);
    document.getElementById('count').textContent = films.length + ' film';
  } catch(e) {
    document.getElementById('grid').innerHTML = '<div class="empty">❌ Gagal memuat data</div>';
  }
}

function render(list) {
  const grid = document.getElementById('grid');
  if (!list || !list.length) {
    grid.innerHTML = '<div class="empty">🎬 Tidak ada film</div>';
    return;
  }
  grid.innerHTML = list.map(f => {
    const img = f.image || 'https://via.placeholder.com/200x300/1a1a1a/666?text=No+Image';
    const link = f.servers?.[0]?.url || '#';
    return \`
      <div class="wrap">
        <div class="card" onclick="openLink('\${link}')" tabindex="0" role="button" aria-label="\${f.title}">
          <img src="\${img}" alt="\${f.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/200x300/1a1a1a/666?text=Error'">
          <div class="badge">\${f.year || 'HD'}</div>
          <div class="card-info">
            <div class="card-title">\${f.title}</div>
          </div>
        </div>
      </div>
    \`;
  }).join('');
}

function search(q) {
  const s = q.toLowerCase().trim();
  if (!s) { render(films); return; }
  const filtered = films.filter(f => 
    f.title.toLowerCase().includes(s) || 
    (f.genre && f.genre.toLowerCase().includes(s))
  );
  render(filtered);
}

function openLink(url) {
  if (url && url !== '#') window.open(url, '_blank');
}

load();
</script>
</body>
</html>`);
});

// ===== START =====
app.listen(PORT, () => {
  console.log(`🚀 NimeStream running at http://localhost:${PORT}`);
  console.log(`📊 Total film: ${filmsData.length}`);
});
