/*
 ╔══════════════════════════════════════════════════════════════════╗
 ║          APEX ARENA TOURNAMENT  —  Full Stack Backend           ║
 ║          Node.js + Express  |  JSON File Database               ║
 ╠══════════════════════════════════════════════════════════════════╣
 ║  DATABASE TABLES (6 tables):                                    ║
 ║  1. users        — id, firstName, lastName, email, password,   ║
 ║                    role, avatar, theme, age, createdAt          ║
 ║  2. players      — id, name, handle, game, rank, tier, score,  ║
 ║                    wins, losses, winRate, country, flag,        ║
 ║                    role, status, avatar, attackStat,            ║
 ║                    defenseStat, bio, teamId                     ║
 ║  3. tournaments  — id, name, game, status, stage, startDate,   ║
 ║                    endDate, prizePool, maxPlayers, format,      ║
 ║                    location, fee, createdAt                     ║
 ║  4. registrations— id, tournamentId, playerName, email, phone, ║
 ║                    paymentStatus, paymentRef, registeredAt      ║
 ║  5. contacts     — id, name, email, subject, message,          ║
 ║                    createdAt, read                              ║
 ║  6. teams        — id, name, tag, icon, game, region, wins,    ║
 ║                    losses, winRate, ranking, captain, members[] ║
 ╠══════════════════════════════════════════════════════════════════╣
 ║  CRUD COVERAGE:                                                 ║
 ║  users        → CREATE(signup) READ(me/admin) UPDATE DELETE     ║
 ║  players      → CREATE READ UPDATE DELETE (admin)              ║
 ║  tournaments  → CREATE READ UPDATE DELETE (admin)              ║
 ║  registrations→ CREATE READ DELETE                             ║
 ║  contacts     → CREATE READ DELETE (admin)                     ║
 ║  teams        → READ                                            ║
 ╠══════════════════════════════════════════════════════════════════╣
 ║  HOW TO RUN:                                                    ║
 ║    1. Place server.js + package.json in a folder               ║
 ║    2. npm install                                               ║
 ║    3. node server.js                                            ║
 ║    4. Open frontend with Live Server                            ║
 ╠══════════════════════════════════════════════════════════════════╣
 ║  Demo Credentials:                                              ║
 ║    Admin:  admin@apex.com  / Admin@123                         ║
 ║    Player: storm@apex.com  / Storm@123                         ║
 ╚══════════════════════════════════════════════════════════════════╝
*/

const express = require('express');
const cors    = require('cors');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const fs      = require('fs');
const path    = require('path');

const app    = express();
const PORT   = process.env.PORT || 3000;
const SECRET = 'apex_arena_secret_key_2025';
const DB     = path.join(__dirname, 'db.json');

/* ── Middleware ──────────────────────────────────────────── */
app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json());
app.use((req, _, next) => { console.log(new Date().toTimeString().slice(0,8), req.method, req.url); next(); });

/* ── Serve frontend static files ────────────────────────── */
// __dirname = /app/backend on Railway, so '..' = /app (root)
const ROOT_DIR = path.join(__dirname, '..');
app.use(express.static(ROOT_DIR));
app.use(express.static(__dirname)); // fallback: serve from backend/ itself

/* ── SPA fallback: serve index.html for non-API routes ──── */
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexPath = path.join(ROOT_DIR, 'index.html');
  const fs2 = require('fs');
  if (fs2.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});



/* ══════════════════════════════════════════════════════════
   DATABASE  (JSON file — simulates 6 relational tables)
══════════════════════════════════════════════════════════ */
const SEED = {
  users: [
    { id:1, firstName:'Admin', lastName:'Apex', email:'admin@apex.com',
      password:'$2b$10$i26hmuAhyY.ND5fbM2nZ/.TJrtA7LZ8qD5zNR9V91qzjyiTkItnEO',
      role:'admin', avatar:'👑', theme:'dark', age:28, createdAt:'2025-01-01T00:00:00Z' },
    { id:2, firstName:'Storm', lastName:'Knight', email:'storm@apex.com',
      password:'$2b$10$FL1jj0IffovcGNV3tJSZXOrqOf9c/g7C5iXSlBWs/0LHpyJB3vLIu',
      role:'player', avatar:'⚡', theme:'dark', age:24, createdAt:'2025-01-15T00:00:00Z' }
  ],
  players: [
    { id:1, name:'Storm Knight', handle:'@storm_k', game:'Valorant', rank:'Champion', tier:1, score:9850, wins:32, losses:4, winRate:88, country:'USA', flag:'🇺🇸', role:'Fragger', status:'Active', avatar:'⚡', attackStat:95, defenseStat:78, bio:'Defending champion with a relentless aggressive playstyle.', teamId:1 },
    { id:2, name:'Nova Blaze', handle:'@nova_blaze', game:'PUBG', rank:'Diamond', tier:2, score:8420, wins:28, losses:6, winRate:82, country:'Japan', flag:'🇯🇵', role:'Strategist', status:'Active', avatar:'🌊', attackStat:88, defenseStat:70, bio:'A masterful tactician from Japan.', teamId:2 },
    { id:3, name:'Frost Viper', handle:'@frost_viper', game:'Fortnite', rank:'Diamond', tier:3, score:8100, wins:25, losses:5, winRate:83, country:'South Korea', flag:'🇰🇷', role:'Support', status:'Active', avatar:'🧊', attackStat:82, defenseStat:91, bio:"South Korea's top defensive specialist.", teamId:2 },
    { id:4, name:'Titan Rush', handle:'@titan_rush', game:'Valorant', rank:'Platinum', tier:4, score:7350, wins:22, losses:8, winRate:73, country:'Brazil', flag:'🇧🇷', role:'Fragger', status:'Active', avatar:'🔥', attackStat:92, defenseStat:60, bio:"Brazil's power player.", teamId:1 },
    { id:5, name:'Shadow Rex', handle:'@shadow_rex', game:'PUBG', rank:'Platinum', tier:5, score:6900, wins:20, losses:9, winRate:69, country:'Germany', flag:'🇩🇪', role:'Strategist', status:'Active', avatar:'🌑', attackStat:75, defenseStat:85, bio:"Germany's tactical genius.", teamId:3 },
    { id:6, name:'Solar Pyre', handle:'@solar_pyre', game:'Fortnite', rank:'Gold', tier:6, score:6250, wins:18, losses:10, winRate:64, country:'South Africa', flag:'🇿🇦', role:'Wildcard', status:'Active', avatar:'☀️', attackStat:80, defenseStat:65, bio:"South Africa's rising star.", teamId:3 },
    { id:7, name:'Iron Hawk', handle:'@iron_hawk', game:'Valorant', rank:'Gold', tier:7, score:5800, wins:16, losses:11, winRate:59, country:'United Kingdom', flag:'🇬🇧', role:'Sniper', status:'Active', avatar:'🦅', attackStat:70, defenseStat:80, bio:'Championship pedigree veteran.', teamId:4 },
    { id:8, name:'Void Echo', handle:'@void_echo', game:'PUBG', rank:'Silver', tier:8, score:5100, wins:14, losses:12, winRate:54, country:'France', flag:'🇫🇷', role:'Support', status:'Active', avatar:'🌀', attackStat:77, defenseStat:68, bio:"France's wildcard entry.", teamId:4 },
    { id:9, name:'Thunder Axe', handle:'@thunder_axe', game:'Fortnite', rank:'Silver', tier:9, score:4600, wins:11, losses:13, winRate:46, country:'Australia', flag:'🇦🇺', role:'Fragger', status:'Rookie', avatar:'🌩️', attackStat:84, defenseStat:55, bio:"Australia's exciting newcomer.", teamId:null }
  ],
  tournaments: [
    { id:1, name:'Apex Arena Grand Championship', game:'All Games', status:'In Progress', stage:'Semi Finals', startDate:'2025-07-05', endDate:'2025-08-23', prizePool:50000, maxPlayers:32, format:'Single Elimination', location:'Apex Stadium, London', fee:25, createdAt:'2025-01-01T00:00:00Z' },
    { id:2, name:'Valorant Masters Cup', game:'Valorant', status:'Upcoming', stage:'Registration', startDate:'2025-09-10', endDate:'2025-10-05', prizePool:25000, maxPlayers:16, format:'Double Elimination', location:'Online — Global', fee:15, createdAt:'2025-01-01T00:00:00Z' },
    { id:3, name:'PUBG Battlegrounds Invitational', game:'PUBG', status:'Upcoming', stage:'Registration', startDate:'2025-09-20', endDate:'2025-10-12', prizePool:15000, maxPlayers:16, format:'Battle Royale Points', location:'Online — Asia Pacific', fee:10, createdAt:'2025-01-01T00:00:00Z' },
    { id:4, name:'Fortnite Storm Chasers', game:'Fortnite', status:'Completed', stage:'Finished', startDate:'2025-05-01', endDate:'2025-06-15', prizePool:10000, maxPlayers:24, format:'Solo Points System', location:'Online — Global', fee:10, createdAt:'2025-01-01T00:00:00Z' }
  ],
  registrations: [],
  contacts: [],
  teams: [
    { id:1, name:'Storm Brigade', tag:'[SB]', icon:'⚡', game:'Valorant', region:'Americas', wins:54, losses:12, winRate:82, ranking:1, captain:'Storm Knight', members:[1,4] },
    { id:2, name:'Frost Wave', tag:'[FW]', icon:'🌊', game:'PUBG', region:'Asia Pacific', wins:48, losses:11, winRate:81, ranking:2, captain:'Nova Blaze', members:[2,3] },
    { id:3, name:'Shadow Syndicate', tag:'[SS]', icon:'🌑', game:'Fortnite', region:'Europe', wins:38, losses:19, winRate:67, ranking:3, captain:'Shadow Rex', members:[5,6] },
    { id:4, name:'Iron Void', tag:'[IV]', icon:'🦅', game:'PUBG', region:'Europe', wins:30, losses:23, winRate:57, ranking:4, captain:'Iron Hawk', members:[7,8] }
  ]
};

/* ── DB helpers ──────────────────────────────────────────── */
function readDB() {
  if (!fs.existsSync(DB)) { fs.writeFileSync(DB, JSON.stringify(SEED, null, 2)); return SEED; }
  try { return JSON.parse(fs.readFileSync(DB, 'utf8')); }
  catch { return JSON.parse(JSON.stringify(SEED)); }
}
function writeDB(db) { fs.writeFileSync(DB, JSON.stringify(db, null, 2)); }
function nextId(arr) { return arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1; }

/* ── Response helpers ────────────────────────────────────── */
const ok  = (res, data, meta={}) => res.json({ status:'success', data, meta });
const err = (res, msg, code=400) => res.status(code).json({ status:'error', error:msg });

/* ── Auth middleware ─────────────────────────────────────── */
function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return err(res, 'Authentication required', 401);
  try { req.user = jwt.verify(token, SECRET); next(); }
  catch { err(res, 'Invalid or expired token', 401); }
}
function adminOnly(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  err(res, 'Admin access required', 403);
}

/* ══════════════════════════════════════════════════════════
   ROUTE: API Info
══════════════════════════════════════════════════════════ */
app.get('/api', (req, res) => {
  ok(res, {
    name: 'Apex Arena Tournament API',
    version: '2.0',
    tables: ['users','players','tournaments','registrations','contacts','teams'],
    endpoints: {
      auth: ['POST /api/auth/signup','POST /api/auth/login','GET /api/auth/me','PUT /api/auth/me'],
      players: ['GET /api/players','GET /api/players/:id','POST /api/players','PUT /api/players/:id','DELETE /api/players/:id'],
      tournaments: ['GET /api/tournaments','GET /api/tournaments/:id','POST /api/tournaments','PUT /api/tournaments/:id','DELETE /api/tournaments/:id'],
      registrations: ['POST /api/registrations','GET /api/registrations'],
      leaderboard: ['GET /api/leaderboard'],
      contacts: ['POST /api/contacts','GET /api/contacts','DELETE /api/contacts/:id'],
      admin: ['GET /api/admin/users','PUT /api/admin/users/:id','DELETE /api/admin/users/:id']
    }
  });
});

/* ══════════════════════════════════════════════════════════
   TABLE 1: USERS  —  Auth + CRUD
══════════════════════════════════════════════════════════ */

/* CREATE — POST /api/auth/signup */
app.post('/api/auth/signup', (req, res) => {
  const { firstName, lastName, email, password, age } = req.body;
  if (!firstName || !lastName || !email || !password)
    return err(res, 'firstName, lastName, email and password are required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return err(res, 'Invalid email format');
  if (password.length < 8)
    return err(res, 'Password must be at least 8 characters');

  const db = readDB();
  if (db.users.find(u => u.email.toLowerCase() === email.toLowerCase()))
    return err(res, 'Email already registered');

  const user = {
    id: nextId(db.users),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.toLowerCase().trim(),
    password: bcrypt.hashSync(password, 10),
    role: 'player',
    avatar: '🎮',
    theme: 'dark',
    age: parseInt(age) || null,
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  writeDB(db);

  const token = jwt.sign({ id:user.id, email:user.email, role:user.role }, SECRET, { expiresIn:'7d' });
  const { password:_, ...safe } = user;
  ok(res, { user: safe, token });
});

/* READ (authenticate) — POST /api/auth/login */
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return err(res, 'Email and password are required');

  const db   = readDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) return err(res, 'Invalid email or password', 401);
  if (!bcrypt.compareSync(password, user.password)) return err(res, 'Invalid email or password', 401);

  const token = jwt.sign({ id:user.id, email:user.email, role:user.role }, SECRET, { expiresIn:'7d' });
  const { password:_, ...safe } = user;
  ok(res, { user: safe, token });
});

/* READ — GET /api/auth/me */
app.get('/api/auth/me', auth, (req, res) => {
  const db   = readDB();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return err(res, 'User not found', 404);
  const { password:_, ...safe } = user;
  ok(res, safe);
});

/* UPDATE — PUT /api/auth/me */
app.put('/api/auth/me', auth, (req, res) => {
  const db  = readDB();
  const idx = db.users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return err(res, 'User not found', 404);
  const allow = ['firstName','lastName','avatar','theme','age'];
  allow.forEach(k => { if (req.body[k] !== undefined) db.users[idx][k] = req.body[k]; });
  writeDB(db);
  const { password:_, ...safe } = db.users[idx];
  ok(res, safe);
});

/* ══════════════════════════════════════════════════════════
   TABLE 2: PLAYERS  —  Full CRUD
══════════════════════════════════════════════════════════ */

/* READ all — GET /api/players */
app.get('/api/players', (req, res) => {
  const db = readDB();
  let result = [...db.players];

  // Search + Filter
  if (req.query.search) {
    const q = req.query.search.toLowerCase();
    result = result.filter(p =>
      p.name.toLowerCase().includes(q) || p.handle.toLowerCase().includes(q) || p.country.toLowerCase().includes(q)
    );
  }
  if (req.query.game && req.query.game !== 'All')
    result = result.filter(p => p.game.toLowerCase() === req.query.game.toLowerCase());
  if (req.query.rank && req.query.rank !== 'All')
    result = result.filter(p => p.rank.toLowerCase() === req.query.rank.toLowerCase());
  if (req.query.role && req.query.role !== 'All')
    result = result.filter(p => p.role.toLowerCase() === req.query.role.toLowerCase());

  // Sort
  const sort = req.query.sort || 'tier';
  result.sort((a, b) => {
    if (sort === 'score')   return b.score   - a.score;
    if (sort === 'winRate') return b.winRate  - a.winRate;
    if (sort === 'name')    return a.name.localeCompare(b.name);
    return a.tier - b.tier;
  });

  ok(res, result, { total: result.length, allCount: db.players.length });
});

/* READ single — GET /api/players/:id */
app.get('/api/players/:id', (req, res) => {
  const db = readDB();
  const p  = db.players.find(p => p.id === parseInt(req.params.id));
  if (!p) return err(res, 'Player not found', 404);
  const team = db.teams.find(t => t.id === p.teamId) || null;
  ok(res, { ...p, team });
});

/* CREATE — POST /api/players  [admin] */
app.post('/api/players', auth, adminOnly, (req, res) => {
  const db = readDB();
  const required = ['name','handle','game','rank'];
  for (const f of required) {
    if (!req.body[f]) return err(res, `Field "${f}" is required`);
  }
  const player = {
    id: nextId(db.players),
    name: req.body.name, handle: req.body.handle, game: req.body.game,
    rank: req.body.rank, tier: req.body.tier || 99,
    score: parseInt(req.body.score) || 1000, wins: parseInt(req.body.wins) || 0,
    losses: parseInt(req.body.losses) || 0, winRate: parseInt(req.body.winRate) || 0,
    country: req.body.country || 'Unknown', flag: req.body.flag || '🌍',
    role: req.body.role || 'Fragger', status: req.body.status || 'Active',
    avatar: req.body.avatar || '🎮', attackStat: parseInt(req.body.attackStat) || 50,
    defenseStat: parseInt(req.body.defenseStat) || 50,
    bio: req.body.bio || '', teamId: req.body.teamId || null,
    createdAt: new Date().toISOString()
  };
  db.players.push(player);
  writeDB(db);
  ok(res, player);
});

/* UPDATE — PUT /api/players/:id  [admin] */
app.put('/api/players/:id', auth, adminOnly, (req, res) => {
  const db  = readDB();
  const idx = db.players.findIndex(p => p.id === parseInt(req.params.id));
  if (idx === -1) return err(res, 'Player not found', 404);
  db.players[idx] = { ...db.players[idx], ...req.body, id: db.players[idx].id };
  writeDB(db);
  ok(res, db.players[idx]);
});

/* DELETE — DELETE /api/players/:id  [admin] */
app.delete('/api/players/:id', auth, adminOnly, (req, res) => {
  const db  = readDB();
  const idx = db.players.findIndex(p => p.id === parseInt(req.params.id));
  if (idx === -1) return err(res, 'Player not found', 404);
  const deleted = db.players.splice(idx, 1)[0];
  writeDB(db);
  ok(res, { deleted: deleted.id, name: deleted.name });
});

/* ══════════════════════════════════════════════════════════
   TABLE 3: TOURNAMENTS  —  Full CRUD
══════════════════════════════════════════════════════════ */

/* READ all — GET /api/tournaments */
app.get('/api/tournaments', (req, res) => {
  const db = readDB();
  let t = [...db.tournaments];
  if (req.query.game   && req.query.game   !== 'All') t = t.filter(x => x.game.toLowerCase()   === req.query.game.toLowerCase());
  if (req.query.status && req.query.status !== 'All') t = t.filter(x => x.status.toLowerCase() === req.query.status.toLowerCase());
  // Attach live registration count
  t = t.map(x => ({
    ...x,
    regCount: db.registrations.filter(r => r.tournamentId === x.id).length
  }));
  ok(res, t, { total: t.length });
});

/* READ single — GET /api/tournaments/:id */
app.get('/api/tournaments/:id', (req, res) => {
  const db = readDB();
  const t  = db.tournaments.find(x => x.id === parseInt(req.params.id));
  if (!t) return err(res, 'Tournament not found', 404);
  const regs = db.registrations.filter(r => r.tournamentId === t.id);
  ok(res, { ...t, registrations: regs, regCount: regs.length });
});

/* CREATE — POST /api/tournaments  [admin] */
app.post('/api/tournaments', auth, adminOnly, (req, res) => {
  const db = readDB();
  const required = ['name','game','startDate','endDate','prizePool','maxPlayers'];
  for (const f of required) {
    if (!req.body[f]) return err(res, `Field "${f}" is required`);
  }
  const t = {
    id: nextId(db.tournaments),
    name: req.body.name, game: req.body.game,
    status: req.body.status || 'Upcoming', stage: req.body.stage || 'Registration',
    startDate: req.body.startDate, endDate: req.body.endDate,
    prizePool: parseInt(req.body.prizePool),
    maxPlayers: parseInt(req.body.maxPlayers),
    format: req.body.format || 'Single Elimination',
    location: req.body.location || 'Online',
    fee: parseInt(req.body.fee) || 0,
    createdAt: new Date().toISOString()
  };
  db.tournaments.push(t);
  writeDB(db);
  ok(res, t);
});

/* UPDATE — PUT /api/tournaments/:id  [admin] */
app.put('/api/tournaments/:id', auth, adminOnly, (req, res) => {
  const db  = readDB();
  const idx = db.tournaments.findIndex(x => x.id === parseInt(req.params.id));
  if (idx === -1) return err(res, 'Tournament not found', 404);
  db.tournaments[idx] = { ...db.tournaments[idx], ...req.body, id: db.tournaments[idx].id };
  writeDB(db);
  ok(res, db.tournaments[idx]);
});

/* DELETE — DELETE /api/tournaments/:id  [admin] */
app.delete('/api/tournaments/:id', auth, adminOnly, (req, res) => {
  const db  = readDB();
  const idx = db.tournaments.findIndex(x => x.id === parseInt(req.params.id));
  if (idx === -1) return err(res, 'Tournament not found', 404);
  const deleted = db.tournaments.splice(idx, 1)[0];
  writeDB(db);
  ok(res, { deleted: deleted.id, name: deleted.name });
});

/* ══════════════════════════════════════════════════════════
   TABLE 4: REGISTRATIONS  —  CREATE + READ
══════════════════════════════════════════════════════════ */

/* CREATE — POST /api/registrations */
app.post('/api/registrations', (req, res) => {
  const { tournamentId, playerName, email, phone, paymentRef, paymentMethod } = req.body;
  if (!tournamentId || !playerName || !email)
    return err(res, 'tournamentId, playerName and email are required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return err(res, 'Invalid email format');

  const db = readDB();
  const t  = db.tournaments.find(x => x.id === parseInt(tournamentId));
  if (!t) return err(res, 'Tournament not found', 404);
  if (t.status === 'Completed') return err(res, 'Tournament is already completed');

  const regs = db.registrations.filter(r => r.tournamentId === parseInt(tournamentId));
  if (regs.length >= t.maxPlayers) return err(res, 'Tournament is full');
  if (db.registrations.find(r => r.email.toLowerCase() === email.toLowerCase() && r.tournamentId === parseInt(tournamentId)))
    return err(res, 'This email is already registered for this tournament');

  const reg = {
    id: nextId(db.registrations),
    tournamentId: parseInt(tournamentId),
    playerName: playerName.trim(),
    email: email.toLowerCase().trim(),
    phone: phone || '',
    paymentMethod: paymentMethod || 'card',
    paymentStatus: paymentRef ? 'Paid' : 'Pending',
    paymentRef: paymentRef || null,
    registeredAt: new Date().toISOString()
  };
  db.registrations.push(reg);
  writeDB(db);
  ok(res, reg);
});

/* READ — GET /api/registrations  [auth] */
app.get('/api/registrations', auth, (req, res) => {
  const db = readDB();
  let r = [...db.registrations];
  if (req.query.tournamentId) r = r.filter(x => x.tournamentId === parseInt(req.query.tournamentId));
  ok(res, r, { total: r.length });
});

/* DELETE — DELETE /api/registrations/:id  [admin] */
app.delete('/api/registrations/:id', auth, adminOnly, (req, res) => {
  const db  = readDB();
  const idx = db.registrations.findIndex(x => x.id === parseInt(req.params.id));
  if (idx === -1) return err(res, 'Registration not found', 404);
  db.registrations.splice(idx, 1);
  writeDB(db);
  ok(res, { deleted: parseInt(req.params.id) });
});

/* ══════════════════════════════════════════════════════════
   TABLE 5: CONTACTS  —  CREATE + READ + DELETE
══════════════════════════════════════════════════════════ */

/* CREATE — POST /api/contacts */
app.post('/api/contacts', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message)
    return err(res, 'Name, email and message are required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return err(res, 'Invalid email format');
  if (message.trim().length < 10)
    return err(res, 'Message must be at least 10 characters');

  const db = readDB();
  const c  = {
    id: nextId(db.contacts),
    name: name.trim(), email: email.toLowerCase().trim(),
    subject: subject || 'General Inquiry',
    message: message.trim(),
    createdAt: new Date().toISOString(),
    read: false
  };
  db.contacts.push(c);
  writeDB(db);
  ok(res, c);
});

/* READ — GET /api/contacts  [admin] */
app.get('/api/contacts', auth, adminOnly, (req, res) => {
  const db = readDB();
  ok(res, [...db.contacts].reverse(), { total: db.contacts.length });
});

/* DELETE — DELETE /api/contacts/:id  [admin] */
app.delete('/api/contacts/:id', auth, adminOnly, (req, res) => {
  const db  = readDB();
  const idx = db.contacts.findIndex(c => c.id === parseInt(req.params.id));
  if (idx === -1) return err(res, 'Contact not found', 404);
  db.contacts.splice(idx, 1);
  writeDB(db);
  ok(res, { deleted: parseInt(req.params.id) });
});

/* ══════════════════════════════════════════════════════════
   TABLE 6: TEAMS  —  READ
══════════════════════════════════════════════════════════ */
app.get('/api/teams', (req, res) => {
  const db = readDB();
  let t = [...db.teams];
  if (req.query.game)   t = t.filter(x => x.game.toLowerCase() === req.query.game.toLowerCase());
  if (req.query.region) t = t.filter(x => x.region.toLowerCase().includes(req.query.region.toLowerCase()));
  t = t.map(team => ({
    ...team,
    roster: team.members.map(mid => db.players.find(p => p.id === mid)).filter(Boolean)
  }));
  ok(res, t, { total: t.length });
});

/* ══════════════════════════════════════════════════════════
   LEADERBOARD  (derived from players table)
══════════════════════════════════════════════════════════ */
app.get('/api/leaderboard', (req, res) => {
  const db  = readDB();
  const limit = parseInt(req.query.limit) || 20;
  const game  = req.query.game;
  let players = [...db.players];
  if (game && game !== 'All') players = players.filter(p => p.game === game);
  const ranked = players
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((p, i) => ({ ...p, leaderboardRank: i + 1 }));
  ok(res, ranked, { total: ranked.length });
});

/* ══════════════════════════════════════════════════════════
   ADMIN  —  User management CRUD
══════════════════════════════════════════════════════════ */

/* READ all users — GET /api/admin/users  [admin] */
app.get('/api/admin/users', auth, adminOnly, (req, res) => {
  const db   = readDB();
  const safe = db.users.map(({ password:_, ...u }) => u);
  ok(res, safe, { total: safe.length });
});

/* UPDATE user — PUT /api/admin/users/:id  [admin] */
app.put('/api/admin/users/:id', auth, adminOnly, (req, res) => {
  const db  = readDB();
  const idx = db.users.findIndex(u => u.id === parseInt(req.params.id));
  if (idx === -1) return err(res, 'User not found', 404);
  const allow = ['firstName','lastName','role','avatar','theme','age'];
  allow.forEach(k => { if (req.body[k] !== undefined) db.users[idx][k] = req.body[k]; });
  writeDB(db);
  const { password:_, ...safe } = db.users[idx];
  ok(res, safe);
});

/* DELETE user — DELETE /api/admin/users/:id  [admin] */
app.delete('/api/admin/users/:id', auth, adminOnly, (req, res) => {
  const db  = readDB();
  const idx = db.users.findIndex(u => u.id === parseInt(req.params.id));
  if (idx === -1) return err(res, 'User not found', 404);
  if (db.users[idx].role === 'admin') return err(res, 'Cannot delete admin account');
  const deleted = db.users.splice(idx, 1)[0];
  writeDB(db);
  ok(res, { deleted: deleted.id, email: deleted.email });
});

/* ── Start server ─────────────────────────────────────── */
app.listen(PORT, '0.0.0.0', () => {
  readDB(); // ensure db.json exists on first run
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║      APEX ARENA TOURNAMENT API v2.0          ║
  ║      http://localhost:${PORT}  (Railway: auto-URL) ║
  ╠═══════════════════════════════════════════════╣
  ║  6 Tables: users, players, tournaments,      ║
  ║            registrations, contacts, teams    ║
  ╠═══════════════════════════════════════════════╣
  ║  Admin:   admin@apex.com  /  Admin@123       ║
  ║  Player:  storm@apex.com  /  Storm@123       ║
  ╚═══════════════════════════════════════════════╝`);
});