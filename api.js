/* api.js — shared API helper & auth manager
   Auto-detects local vs Railway deployment */

/* ── API Base URL ──────────────────────────────────────────
   - On Railway:  same origin (window.location.origin/api)
   - Locally:     http://localhost:3000/api
   ──────────────────────────────────────────────────────── */
const API = (function() {
  const host = window.location.hostname;
  // If running on localhost or 127.0.0.1 → use local server
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:3000/api';
  }
  // On Railway / any live domain → use same origin
  return window.location.origin + '/api';
})();

/* ── Token management ── */
const Auth = {
  getToken:  ()    => localStorage.getItem('aa_token'),
  getUser:   ()    => { try{ return JSON.parse(localStorage.getItem('aa_user')); }catch{return null;} },
  setSession:(u,t) => { localStorage.setItem('aa_token',t); localStorage.setItem('aa_user',JSON.stringify(u)); },
  clear:     ()    => { localStorage.removeItem('aa_token'); localStorage.removeItem('aa_user'); },
  isLoggedIn:()    => !!localStorage.getItem('aa_token'),
  isAdmin:   ()    => { const u=Auth.getUser(); return u && u.role==='admin'; }
};

/* ── HTTP helpers ── */
async function apiFetch(path, options={}) {
  const headers = { 'Content-Type':'application/json' };
  const token = Auth.getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  try {
    const res  = await fetch(API + path, { ...options, headers: { ...headers, ...(options.headers||{}) } });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Request failed');
    return json;
  } catch(e) {
    console.error('API Error:', path, e.message);
    throw e;
  }
}

const GET    = (path)        => apiFetch(path);
const POST   = (path, body)  => apiFetch(path, { method:'POST',   body: JSON.stringify(body) });
const PUT    = (path, body)  => apiFetch(path, { method:'PUT',    body: JSON.stringify(body) });
const DELETE = (path)        => apiFetch(path, { method:'DELETE' });

/* ── Nav user indicator ── */
function updateNavAuth() {
  const user = Auth.getUser();
  const authEl = document.getElementById('navAuth');
  if (!authEl) return;
  if (user) {
    authEl.innerHTML =
      `<span class="nav-user">${user.avatar||'🎮'} <strong>${user.firstName}</strong></span>` +
      (user.role==='admin' ? `<a href="admin.html" class="btn btn-sm" style="background:rgba(231,76,60,.15);color:#e74c3c;border:1px solid rgba(231,76,60,.3);">Admin</a>` : '') +
      `<a href="profile.html" class="btn btn-sm btn-outline">Profile</a>` +
      `<button onclick="logout()" class="btn btn-sm" style="background:transparent;border:1px solid var(--border);color:var(--text-muted);">Logout</button>`;
  } else {
    authEl.innerHTML =
      `<a href="login.html"  class="btn btn-sm btn-outline">Login</a>` +
      `<a href="signup.html" class="btn btn-sm btn-primary">Sign Up</a>`;
  }
}

function logout() {
  Auth.clear();
  showToastGlobal('👋','Logged out successfully','amber');
  setTimeout(()=>{ window.location.href='index.html'; },1200);
}

/* ── Toast ── */
let _tt=null;
function showToastGlobal(icon, msg, type='green') {
  let t=document.getElementById('globalToast');
  if (!t){ t=document.createElement('div'); t.id='globalToast'; t.className='toast'; document.body.appendChild(t); }
  t.innerHTML=`<span style="font-size:18px">${icon}</span><span>${msg}</span>`;
  t.className='toast '+type+' show';
  clearTimeout(_tt);
  _tt=setTimeout(()=>t.classList.remove('show'),3000);
}

document.addEventListener('DOMContentLoaded', updateNavAuth);