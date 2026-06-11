/* =============================================================
   players.js  —  Apex Arena Tournament
   NOW FETCHES FROM:  http://localhost:3000  (Express API)
   Falls back to players.json if server is offline
   =============================================================
   API Endpoints used:
     GET /players              → all players
     GET /players?game=X       → filter by game
     GET /players?rank=X       → filter by rank
     GET /players/:id          → single player
     GET /leaderboard          → top 10
   ============================================================= */

/* ── API BASE URL ── */
const API_BASE = (function() {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3000';
  return window.location.origin;
})();
const FALLBACK = 'players.json';   /* used if API is offline */

/* ── RANK / ROLE / GAME CONFIG ── */
const RANK_META = {
  Champion: { cls:'rank-champion', label:'Champion', icon:'👑', glow:'rgba(255,180,0,0.35)', order:1 },
  Diamond:  { cls:'rank-diamond',  label:'Diamond',  icon:'💎', glow:'rgba(52,152,219,0.35)', order:2 },
  Platinum: { cls:'rank-platinum', label:'Platinum', icon:'🔷', glow:'rgba(155,89,182,0.3)',  order:3 },
  Gold:     { cls:'rank-gold',     label:'Gold',     icon:'🌟', glow:'rgba(245,166,35,0.25)', order:4 },
  Silver:   { cls:'rank-silver',   label:'Silver',   icon:'⚪', glow:'rgba(149,165,166,0.2)', order:5 }
};
const GAME_ICONS = { 'Valorant':'🎯', 'PUBG':'🪖', 'Fortnite':'⛏️' };
const ROLE_CLS   = {
  Fragger:'role-fragger', Support:'role-support',
  Sniper:'role-sniper', Strategist:'role-strategist', Wildcard:'role-wildcard'
};

/* ── STATE ── */
const LS_CACHE_KEY = 'apexPlayersCache';
const LS_TS_KEY    = 'apexPlayersCacheTS';
const CACHE_TTL    = 2 * 60 * 1000;   /* 2 minutes for API data */

let allPlayers   = [];
let activeSearch = '';
let activeGame   = 'All';
let activeRank   = 'All';
let activeSort   = 'tier';
let _debTimer    = null;
let dataSource   = 'unknown';

/* ════════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
  loadPlayers();
  attachListeners();
});

function attachListeners() {
  var sb = document.getElementById('searchInput');
  var gf = document.getElementById('gameFilter');
  var rf = document.getElementById('rankFilter');
  var sf = document.getElementById('sortSelect');
  var cb = document.getElementById('clearFilters');
  if (sb) sb.addEventListener('input',  function() { activeSearch = this.value.trim().toLowerCase(); debouncedRender(); });
  if (gf) gf.addEventListener('change', function() { activeGame = this.value;  debouncedRender(); });
  if (rf) rf.addEventListener('change', function() { activeRank = this.value;  debouncedRender(); });
  if (sf) sf.addEventListener('change', function() { activeSort = this.value;  debouncedRender(); });
  if (cb) cb.addEventListener('click',  clearAllFilters);
}

/* ════════════════════════════════════════════════════
   LOAD  —  Try API first, fall back to JSON file
   Caches result in localStorage
   ════════════════════════════════════════════════════ */
function loadPlayers() {
  showSkeleton();

  /* Check localStorage cache first */
  var cached = localStorage.getItem(LS_CACHE_KEY);
  var ts     = parseInt(localStorage.getItem(LS_TS_KEY) || '0', 10);
  if (cached && (Date.now() - ts) < CACHE_TTL) {
    allPlayers = JSON.parse(cached);
    dataSource = 'localStorage cache';
    onLoaded();
    updateSourceBadge('cache');
    return;
  }

  /* Fetch from Express API */
  fetch(API_BASE + '/players')
    .then(function (res) {
      if (!res.ok) throw new Error('API returned ' + res.status);
      return res.json();
    })
    .then(function (json) {
      /* API wraps data in { status, data, meta } */
      allPlayers = json.data || json;
      dataSource = 'Express API (localhost:3000)';
      cacheLocally();
      onLoaded();
      updateSourceBadge('api');
    })
    .catch(function (apiErr) {
      console.warn('API offline, falling back to players.json:', apiErr.message);
      /* Fallback: fetch static JSON file */
      fetch(FALLBACK)
        .then(function (r) { return r.json(); })
        .then(function (data) {
          allPlayers = data;
          dataSource = 'players.json (fallback)';
          cacheLocally();
          onLoaded();
          updateSourceBadge('fallback');
        })
        .catch(showError);
    });
}

function cacheLocally() {
  localStorage.setItem(LS_CACHE_KEY, JSON.stringify(allPlayers));
  localStorage.setItem(LS_TS_KEY,    String(Date.now()));
}

function onLoaded() {
  populateFilters();
  updateStats(allPlayers);
  renderFiltered(false);
}

/* ════════════════════════════════════════════════════
   SOURCE BADGE  (shows where data came from)
   ════════════════════════════════════════════════════ */
function updateSourceBadge(source) {
  var el = document.getElementById('fetchBadge');
  if (!el) return;
  var badges = {
    api:      { text:'🟢 Live API · localhost:3000/players',         color:'rgba(46,204,113,0.12)', border:'rgba(46,204,113,0.3)',  textColor:'#2ecc71' },
    cache:    { text:'⚡ localStorage cache (API data)',              color:'rgba(52,152,219,0.12)', border:'rgba(52,152,219,0.3)',  textColor:'#3498db' },
    fallback: { text:'⚠️ Fallback · players.json (start server for live data)', color:'rgba(245,166,35,0.12)', border:'rgba(245,166,35,0.3)', textColor:'#f5a623' }
  };
  var b = badges[source] || badges.fallback;
  el.textContent = b.text;
  el.style.background = b.color;
  el.style.borderColor = b.border;
  el.style.color = b.textColor;
}

/* ════════════════════════════════════════════════════
   FILTER DROPDOWNS  —  populated from loaded data
   ════════════════════════════════════════════════════ */
function populateFilters() {
  var games = ['All'].concat([...new Set(allPlayers.map(function(p){ return p.game; }))].sort());
  var gSel  = document.getElementById('gameFilter');
  if (gSel) {
    gSel.innerHTML = '';
    games.forEach(function(g) {
      var o = document.createElement('option');
      o.value = g;
      o.textContent = g === 'All' ? '🎮 All Games' : (GAME_ICONS[g]||'🎮') + ' ' + g;
      gSel.appendChild(o);
    });
  }
}

/* ════════════════════════════════════════════════════
   FILTER + SORT  (client-side, matching API params)
   ════════════════════════════════════════════════════ */
function getFiltered() {
  return allPlayers
    .filter(function(p) {
      if (activeSearch && !p.name.toLowerCase().includes(activeSearch) &&
          !p.handle.toLowerCase().includes(activeSearch)) return false;
      if (activeGame !== 'All' && p.game !== activeGame) return false;
      if (activeRank !== 'All' && p.rank !== activeRank) return false;
      return true;
    })
    .sort(function(a,b) {
      if (activeRank !== 'All') return a.tier - b.tier;
      if (activeSort === 'score')   return b.score - a.score;
      if (activeSort === 'winrate') return b.winRate - a.winRate;
      if (activeSort === 'name')    return a.name.localeCompare(b.name);
      return a.tier - b.tier;
    });
}

var _debTimer2 = null;
function debouncedRender() {
  updatePills();
  clearTimeout(_debTimer2);
  _debTimer2 = setTimeout(function() { renderFiltered(true); }, 120);
}

/* ════════════════════════════════════════════════════
   RENDER CARDS
   ════════════════════════════════════════════════════ */
function renderFiltered(animate) {
  var players   = getFiltered();
  var container = document.getElementById('playersContainer');
  var countEl   = document.getElementById('playerCountLabel');
  if (countEl) countEl.textContent = players.length + ' / ' + allPlayers.length + ' players  ·  source: ' + dataSource;

  updateStats(players.length ? players : allPlayers);

  if (players.length === 0) {
    container.innerHTML =
      '<div class="fetch-empty"><div class="empty-icon">🔍</div>' +
      '<p>No players match your filters.</p>' +
      '<button onclick="clearAllFilters()" style="margin-top:14px;padding:8px 20px;background:var(--amber);color:var(--navy);border:none;border-radius:6px;font-weight:700;cursor:pointer;font-size:13px;">Clear Filters</button>' +
      '</div>';
    return;
  }

  if (animate) {
    container.querySelectorAll('.player-card-fetch:not(.skeleton-card)').forEach(function(c){ c.classList.add('flipping-out'); });
    setTimeout(function(){ buildCards(players, container); }, 210);
  } else {
    buildCards(players, container);
  }
}

function buildCards(players, container) {
  container.innerHTML = '';
  players.forEach(function(p, idx) {
    var rm   = RANK_META[p.rank] || RANK_META.Silver;
    var isTop = p.tier <= 3;
    var card  = document.createElement('div');
    card.className = 'player-card-fetch' + (isTop ? ' top-ranked' : '');
    card.style.animationDelay = (idx * 60) + 'ms';
    var glowCss = isTop ? 'background:radial-gradient(ellipse 90% 55% at 50% 0%,'+rm.glow+' 0%,transparent 70%);' : '';

    card.innerHTML =
      '<div class="card-glow-overlay" style="'+glowCss+'"></div>' +
      '<div class="fetch-card-top">' +
        '<div class="rank-diamond-badge '+rm.cls+'">' +
          '<span class="rdb-icon">'+rm.icon+'</span>' +
          '<span class="rdb-text">'+rm.label+'</span>' +
        '</div>' +
        '<div class="fetch-pos">#'+p.tier+'</div>' +
        (isTop ? '<div class="top-ring"></div>' : '') +
        '<div class="fetch-avatar">'+p.avatar+'</div>' +
        '<div class="fetch-game-chip">'+(GAME_ICONS[p.game]||'🎮')+' '+p.game+'</div>' +
      '</div>' +
      '<div class="fetch-card-body">' +
        '<div class="fetch-name">'+esc(p.name)+'</div>' +
        '<div class="fetch-handle">'+esc(p.handle)+' &nbsp;'+p.flag+' '+esc(p.country)+'</div>' +
        '<div class="fetch-tags">' +
          '<span class="fetch-role '+(ROLE_CLS[p.role]||'')+'">'+p.role+'</span>' +
          (p.status==='Rookie'
            ? '<span class="fetch-status status-rookie">🌱 Rookie</span>'
            : '<span class="fetch-status status-active">✅ Active</span>') +
        '</div>' +
        '<div class="fetch-bio">'+esc(p.bio)+'</div>' +
        '<div class="fetch-stats">' +
          sc(p.score.toLocaleString(),'Score') +
          sc(p.wins+'W / '+p.losses+'L','Record') +
          sc(p.winRate+'%','Win Rate') +
        '</div>' +
        '<div class="fetch-skills">' +
          sb2('ATK',p.attackStat) + sb2('DEF',p.defenseStat) +
        '</div>' +
      '</div>';
    container.appendChild(card);
  });
  setTimeout(function(){
    container.querySelectorAll('.skill-fill').forEach(function(el){ el.style.width = el.dataset.w; });
  }, 80);
}

function sc(val,label){ return '<div class="fetch-stat-item"><span class="fetch-stat-val">'+val+'</span><span class="fetch-stat-label">'+label+'</span></div>'; }
function sb2(label,val){ return '<div class="fetch-skill-row"><span class="fetch-skill-label">'+label+'</span><div class="fetch-skill-track"><div class="skill-fill" style="width:0%" data-w="'+val+'%"></div></div><span class="fetch-skill-val">'+val+'</span></div>'; }

/* ════════════════════════════════════════════════════
   STATS BANNER
   ════════════════════════════════════════════════════ */
function updateStats(players) {
  if (!players||!players.length) return;
  setEl('statTotal',     players.length);
  setEl('statTopScore',  Math.max.apply(null,players.map(function(p){return p.score;})).toLocaleString());
  setEl('statAvgWR',     Math.round(players.reduce(function(s,p){return s+p.winRate;},0)/players.length)+'%');
  setEl('statCountries', new Set(players.map(function(p){return p.country;})).size);
}

/* ════════════════════════════════════════════════════
   ACTIVE FILTER PILLS
   ════════════════════════════════════════════════════ */
function updatePills() {
  var wrap = document.getElementById('activePills');
  if (!wrap) return;
  var pills = [];
  if (activeSearch)         pills.push({l:'🔍 "'+activeSearch+'"', k:'search'});
  if (activeGame !== 'All') pills.push({l:(GAME_ICONS[activeGame]||'🎮')+' '+activeGame, k:'game'});
  if (activeRank !== 'All') pills.push({l:(RANK_META[activeRank]?.icon||'')+' '+activeRank, k:'rank'});
  if (!pills.length){ wrap.innerHTML='<span class="pill-hint">No filters active — showing all players</span>'; return; }
  wrap.innerHTML = pills.map(function(pl){
    return '<span class="active-pill">'+pl.l+' <button onclick="clearFilter(\''+pl.k+'\')" title="Remove">×</button></span>';
  }).join('');
}

function clearFilter(key) {
  if (key==='search'){activeSearch=''; var sb=document.getElementById('searchInput'); if(sb) sb.value='';}
  if (key==='game')  {activeGame='All'; var gf=document.getElementById('gameFilter'); if(gf) gf.value='All';}
  if (key==='rank')  {activeRank='All'; var rf=document.getElementById('rankFilter'); if(rf) rf.value='All';}
  debouncedRender();
}

function clearAllFilters() {
  activeSearch=''; activeGame='All'; activeRank='All';
  var sb=document.getElementById('searchInput'); var gf=document.getElementById('gameFilter'); var rf=document.getElementById('rankFilter');
  if(sb) sb.value=''; if(gf) gf.value='All'; if(rf) rf.value='All';
  debouncedRender();
}

/* ════════════════════════════════════════════════════
   SKELETON / ERROR
   ════════════════════════════════════════════════════ */
function showSkeleton() {
  var c = document.getElementById('playersContainer'); if(!c) return;
  var h='';
  for(var i=0;i<9;i++) h+='<div class="player-card-fetch skeleton-card"><div class="fetch-card-top"><div class="skel skel-avatar"></div></div><div class="fetch-card-body"><div class="skel skel-line" style="width:60%;margin-bottom:8px"></div><div class="skel skel-line" style="width:40%;margin-bottom:16px"></div><div class="skel skel-line" style="width:90%;margin-bottom:6px"></div><div class="skel skel-line" style="width:75%"></div></div></div>';
  c.innerHTML=h;
}

function showError(err) {
  var c = document.getElementById('playersContainer'); if(!c) return;
  c.innerHTML='<div class="fetch-error"><div style="font-size:48px;margin-bottom:16px">⚠️</div><h3 style="font-family:var(--font-display);letter-spacing:2px;margin-bottom:8px">DATA LOAD FAILED</h3><p style="color:var(--gray-300);margin-bottom:8px">'+(err&&err.message||'Unknown error')+'</p><p style="font-size:12px;color:var(--gray-500)">Start the API: <code>cd backend && node server.js</code><br>Then open this page via Live Server.</p><button onclick="loadPlayers()" style="margin-top:20px;padding:10px 24px;background:var(--amber);color:var(--navy);border:none;border-radius:6px;font-weight:700;cursor:pointer">↻ Retry</button></div>';
}

function setEl(id,val){ var el=document.getElementById(id); if(el) el.textContent=val; }
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }