# 🏆 APEX ARENA TOURNAMENT — Full Stack Website
### Complete Semester Project | Week 1–16 All Concepts Covered

---

## 🚀 HOW TO RUN

### Step 1 — Start Backend API
```bash
cd backend
npm install
node server.js
# API runs at http://localhost:3000
```

### Step 2 — Open Frontend
Right-click `index.html` → **Open with Live Server** (VS Code)
> ⚠️ Must use Live Server (not file://), so the JSON fallback works.

### Demo Login Credentials
| Role   | Email              | Password  |
|--------|--------------------|-----------|
| Admin  | admin@apex.com     | Admin@123 |
| Player | storm@apex.com     | Storm@123 |

---

## 📄 ALL PAGES

| Page | File | Features |
|------|------|----------|
| Home / Hero | `index.html` | Hero, stats from API, timeline, navigation |
| Players | `players.html` | Dynamic cards, search, filter, sort, flip animation |
| Tournaments | `tournament.html` | Listing, registration modal, payment simulation |
| Leaderboard | `leaderboard.html` | Podium top-3, full table, filter by game |
| Contact | `contact.html` | Form validation, DB storage, Google Maps API |
| Sign Up | `signup.html` | Full validation, password strength, DB registration |
| Login | `login.html` | JWT auth, session management, shake animation |
| Profile | `profile.html` | Logged-in user data from API, avatar/theme picker |
| Admin | `admin.html` | Full CRUD panel — all 6 tables |

---

## 🗄️ DATABASE DESIGN — 6 Tables (db.json)

### TABLE 1: users
| Field | Type |
|-------|------|
| id | INTEGER PRIMARY KEY |
| firstName | VARCHAR(50) |
| lastName | VARCHAR(50) |
| email | VARCHAR(100) UNIQUE |
| password | VARCHAR(255) bcrypt hashed |
| role | ENUM: admin \| player |
| avatar | VARCHAR(10) emoji |
| theme | VARCHAR(10) |
| age | INTEGER |
| createdAt | TIMESTAMP |

### TABLE 2: players
| Field | Type |
|-------|------|
| id | INTEGER PRIMARY KEY |
| name | VARCHAR(100) |
| handle | VARCHAR(50) |
| game | VARCHAR(50) |
| rank | VARCHAR(30) |
| tier | INTEGER |
| score | INTEGER |
| wins | INTEGER |
| losses | INTEGER |
| winRate | INTEGER % |
| country | VARCHAR(50) |
| flag | VARCHAR(10) emoji |
| role | VARCHAR(30) |
| status | VARCHAR(20) |
| avatar | VARCHAR(10) emoji |
| attackStat | INTEGER 0–100 |
| defenseStat | INTEGER 0–100 |
| bio | TEXT |
| teamId | FK → teams.id |

### TABLE 3: tournaments
| Field | Type |
|-------|------|
| id | INTEGER PRIMARY KEY |
| name | VARCHAR(100) |
| game | VARCHAR(50) |
| status | ENUM: Upcoming \| In Progress \| Completed |
| stage | VARCHAR(50) |
| startDate | DATE |
| endDate | DATE |
| prizePool | INTEGER |
| maxPlayers | INTEGER |
| format | VARCHAR(50) |
| location | VARCHAR(100) |
| fee | INTEGER |
| createdAt | TIMESTAMP |

### TABLE 4: registrations
| Field | Type |
|-------|------|
| id | INTEGER PRIMARY KEY |
| tournamentId | FK → tournaments.id |
| playerName | VARCHAR(100) |
| email | VARCHAR(100) |
| phone | VARCHAR(20) |
| paymentMethod | VARCHAR(20) |
| paymentStatus | ENUM: Paid \| Pending |
| paymentRef | VARCHAR(50) |
| registeredAt | TIMESTAMP |

### TABLE 5: contacts
| Field | Type |
|-------|------|
| id | INTEGER PRIMARY KEY |
| name | VARCHAR(100) |
| email | VARCHAR(100) |
| subject | VARCHAR(100) |
| message | TEXT |
| createdAt | TIMESTAMP |
| read | BOOLEAN |

### TABLE 6: teams
| Field | Type |
|-------|------|
| id | INTEGER PRIMARY KEY |
| name | VARCHAR(100) |
| tag | VARCHAR(10) |
| icon | VARCHAR(10) emoji |
| game | VARCHAR(50) |
| region | VARCHAR(50) |
| wins | INTEGER |
| losses | INTEGER |
| winRate | INTEGER |
| ranking | INTEGER |
| captain | VARCHAR(100) |
| members[] | FK[] → players.id |

---

## 🔁 CRUD OPERATIONS MATRIX

| Table | CREATE | READ | UPDATE | DELETE |
|-------|--------|------|--------|--------|
| users | POST /api/auth/signup | GET /api/auth/me, /api/admin/users | PUT /api/auth/me, /api/admin/users/:id | DELETE /api/admin/users/:id |
| players | POST /api/players (admin) | GET /api/players, /api/players/:id | PUT /api/players/:id (admin) | DELETE /api/players/:id (admin) |
| tournaments | POST /api/tournaments (admin) | GET /api/tournaments, /api/tournaments/:id | PUT /api/tournaments/:id (admin) | DELETE /api/tournaments/:id (admin) |
| registrations | POST /api/registrations | GET /api/registrations (auth) | — | DELETE /api/registrations/:id (admin) |
| contacts | POST /api/contacts | GET /api/contacts (admin) | — | DELETE /api/contacts/:id (admin) |
| teams | seeded | GET /api/teams, /api/teams/:id | — | — |

---

## 🌐 REST API ENDPOINTS

```
Auth:
  POST /api/auth/signup       Register new user (bcrypt + JWT)
  POST /api/auth/login        Login → JWT token
  GET  /api/auth/me           Get logged-in user (requires token)
  PUT  /api/auth/me           Update profile (requires token)

Players:
  GET    /api/players          Get all (search, game, rank, role, sort filters)
  GET    /api/players/:id      Get single + team info
  POST   /api/players          Create (admin only)
  PUT    /api/players/:id      Update (admin only)
  DELETE /api/players/:id      Delete (admin only)

Tournaments:
  GET    /api/tournaments      Get all (game, status filters)
  GET    /api/tournaments/:id  Get single + registrations
  POST   /api/tournaments      Create (admin only)
  PUT    /api/tournaments/:id  Update (admin only)
  DELETE /api/tournaments/:id  Delete (admin only)

Registrations:
  POST   /api/registrations    Register for tournament (payment ref)
  GET    /api/registrations    Get all (requires auth)
  DELETE /api/registrations/:id Delete (admin only)

Leaderboard:
  GET /api/leaderboard         Ranked players (game filter, limit)

Contacts:
  POST   /api/contacts         Submit contact form → DB
  GET    /api/contacts         Read all (admin only)
  DELETE /api/contacts/:id     Delete (admin only)

Teams:
  GET /api/teams               Get all teams + roster
  GET /api/teams/:id           Get single team

Admin:
  GET    /api/admin/users      All users (admin only)
  PUT    /api/admin/users/:id  Update user role/avatar (admin only)
  DELETE /api/admin/users/:id  Delete user (admin only)
```

---

## ✅ RUBRIC COVERAGE

| Component | Marks | Implementation |
|-----------|-------|----------------|
| Website Design & UI | 10 | Dark/light theme, amber accents, CSS animations, responsive |
| Navigation & Multi-page | 5 | 9 pages, active nav highlight, auth-aware nav links |
| Validation | 10 | Signup (5 rules + strength bar), Login, Contact, Tournament reg, all forms |
| Authentication System | 5 | JWT tokens, bcrypt passwords, session management, route guards |
| Search & Filtering | 10 | Players: name search + game filter + rank filter + sort |
| Theme System | 10 | Dark/light + 5 accent colors + font size, localStorage persist |
| Backend Development | 10 | Node.js + Express, 20+ REST endpoints, middleware, CORS |
| Database Design | 10 | 6 tables, relationships, full schema documented above |
| CRUD Operations | 10 | All 4 ops on users/players/tournaments via Admin Panel |
| Map API | 10 | Google Maps embed in contact.html with dark mode filter |
| Payment API | 10 | Payment simulation: Card/PayPal/Crypto, card formatting, 1.5s delay |

---

## 🔐 SECURITY FEATURES
- Passwords hashed with **bcryptjs** (10 salt rounds)
- **JWT tokens** signed with secret key, 7-day expiry
- **Admin routes** protected by `adminOnly` middleware
- Tokens stored in **localStorage**, sent as `Bearer` header
- Email uniqueness validation on signup

---

## 💾 BROWSER STORAGE (localStorage Keys)

| Key | Value | Used For |
|-----|-------|---------|
| `aa_token` | JWT string | Auth token |
| `aa_user` | JSON object | Logged-in user data |
| `aa_theme` | dark \| light | Theme preference |
| `aa_accent` | amber \| cyan \| green \| rose \| violet | Accent color |
| `aa_font` | sm \| md \| lg | Font size |
| `aa_pc` | JSON array | Players cache (2 min TTL) |
| `aa_pc_t` | timestamp | Cache timestamp |
| `apexArenaParticipants` | JSON array | Tournament local registrations |
| `apexArenaInventory` | JSON array | Game inventory demo |