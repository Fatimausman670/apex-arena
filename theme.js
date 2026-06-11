/* theme.js — Preferences engine (dark/light + accent + font) */
const PREF_THEME='aa_theme',PREF_ACCENT='aa_accent',PREF_FONT='aa_font';
const DEF_THEME='dark',DEF_ACCENT='amber',DEF_FONT='md';
const ACCENTS={amber:'#f5a623',cyan:'#00b4d8',green:'#2ecc71',rose:'#e74c8b',violet:'#9b59b6'};

(function(){
  var h=document.documentElement;
  h.setAttribute('data-theme', localStorage.getItem(PREF_THEME)||DEF_THEME);
  h.setAttribute('data-accent',localStorage.getItem(PREF_ACCENT)||DEF_ACCENT);
  h.setAttribute('data-font',  localStorage.getItem(PREF_FONT)||DEF_FONT);
})();

document.addEventListener('DOMContentLoaded',function(){
  injectToggle(); injectPanel(); injectToast(); syncPanel(); markNav();
});

function injectToggle(){
  var nav=document.querySelector('nav'); if(!nav||document.getElementById('themeToggle'))return;
  var b=document.createElement('button'); b.id='themeToggle'; b.title='Preferences';
  b.innerHTML='<div class="toggle-track"><div class="toggle-thumb"></div></div><span id="tgLabel" style="font-size:12px;font-weight:600;color:var(--text-muted)"></span><span id="tgIcon" style="font-size:14px"></span>';
  b.onclick=function(e){e.stopPropagation();togglePanel();};
  nav.appendChild(b); updateLabel();
}

function injectPanel(){
  if(document.getElementById('prefPanel'))return;
  var p=document.createElement('div'); p.id='prefPanel';
  var sw=Object.keys(ACCENTS).map(k=>'<div class="accent-swatch" data-accent="'+k+'" style="background:'+ACCENTS[k]+'" onclick="setAccent(\''+k+'\')" title="'+k+'"></div>').join('');
  p.innerHTML=
    '<div class="pref-header"><span class="pref-title">⚙️ PREFERENCES</span><button class="pref-close" onclick="closePanel()">✕</button></div>'+
    '<div class="pref-body">'+
      '<div class="pref-section"><div class="pref-section-title">🌓 Theme</div><div class="theme-options">'+
        '<div class="theme-option" id="opt-dark" onclick="setTheme(\'dark\')"><div class="theme-option-icon">🌙</div><div class="theme-option-label">Dark</div></div>'+
        '<div class="theme-option" id="opt-light" onclick="setTheme(\'light\')"><div class="theme-option-icon">☀️</div><div class="theme-option-label">Light</div></div>'+
      '</div></div>'+
      '<div class="pref-section"><div class="pref-section-title">🎨 Accent</div><div class="accent-options" id="accentOpts">'+sw+'</div></div>'+
      '<div class="pref-section"><div class="pref-section-title">🔠 Font Size</div><div class="font-options">'+
        '<div class="font-option" id="font-sm" onclick="setFont(\'sm\')"><span style="font-size:11px">Aa</span><br><span style="font-size:9px">Small</span></div>'+
        '<div class="font-option" id="font-md" onclick="setFont(\'md\')"><span style="font-size:14px">Aa</span><br><span style="font-size:9px">Med</span></div>'+
        '<div class="font-option" id="font-lg" onclick="setFont(\'lg\')"><span style="font-size:17px">Aa</span><br><span style="font-size:9px">Large</span></div>'+
      '</div></div>'+
      '<div style="font-size:11px;color:var(--text-faint);line-height:1.5;padding-top:8px;">💾 Saved in localStorage — persists across all pages</div>'+
    '</div>'+
    '<div class="pref-footer"><button class="pref-reset" onclick="resetPrefs()">↺ Reset Defaults</button></div>';
  document.body.appendChild(p);
  document.addEventListener('click',function(e){var p=document.getElementById('prefPanel'),b=document.getElementById('themeToggle');if(p&&!p.contains(e.target)&&b&&!b.contains(e.target))p.classList.remove('open');});
}

function injectToast(){if(!document.getElementById('themeToast')){var t=document.createElement('div');t.id='themeToast';document.body.appendChild(t);}}

function setTheme(t){document.documentElement.setAttribute('data-theme',t);localStorage.setItem(PREF_THEME,t);syncPanel();updateLabel();toast(t==='dark'?'🌙':'☀️',t==='dark'?'Dark Mode':'Light Mode');}
function setAccent(a){document.documentElement.setAttribute('data-accent',a);localStorage.setItem(PREF_ACCENT,a);syncPanel();toast('🎨',a.charAt(0).toUpperCase()+a.slice(1)+' accent');}
function setFont(f){document.documentElement.setAttribute('data-font',f);localStorage.setItem(PREF_FONT,f);syncPanel();toast('🔠',{sm:'Small',md:'Medium',lg:'Large'}[f]+' text');}
function resetPrefs(){localStorage.removeItem(PREF_THEME);localStorage.removeItem(PREF_ACCENT);localStorage.removeItem(PREF_FONT);document.documentElement.setAttribute('data-theme',DEF_THEME);document.documentElement.setAttribute('data-accent',DEF_ACCENT);document.documentElement.setAttribute('data-font',DEF_FONT);syncPanel();updateLabel();toast('↺','Reset to defaults');}
function togglePanel(){document.getElementById('prefPanel')?.classList.toggle('open');}
function closePanel(){document.getElementById('prefPanel')?.classList.remove('open');}

function syncPanel(){
  var h=document.documentElement;
  var th=h.getAttribute('data-theme')||DEF_THEME;
  var ac=h.getAttribute('data-accent')||DEF_ACCENT;
  var fn=h.getAttribute('data-font')||DEF_FONT;
  ['dark','light'].forEach(t=>{var el=document.getElementById('opt-'+t);if(el)el.classList.toggle('selected',t===th);});
  document.querySelectorAll('.accent-swatch').forEach(s=>s.classList.toggle('selected',s.dataset.accent===ac));
  ['sm','md','lg'].forEach(f=>{var el=document.getElementById('font-'+f);if(el)el.classList.toggle('selected',f===fn);});
}

function updateLabel(){
  var t=document.documentElement.getAttribute('data-theme')||DEF_THEME;
  var l=document.getElementById('tgLabel'),i=document.getElementById('tgIcon');
  if(l)l.textContent=t==='dark'?'Dark':'Light';
  if(i)i.textContent=t==='dark'?'🌙':'☀️';
}

var _tt2=null;
function toast(icon,msg){
  var t=document.getElementById('themeToast');if(!t)return;
  t.innerHTML='<span style="font-size:16px">'+icon+'</span><span style="font-size:13px;font-weight:600">'+msg+'</span>';
  t.classList.add('show');clearTimeout(_tt2);_tt2=setTimeout(()=>t.classList.remove('show'),2500);
}

function markNav(){
  var page=window.location.pathname.split('/').pop()||'index.html';
  document.querySelectorAll('.nav-links a').forEach(a=>{
    var h=a.getAttribute('href')||'';
    a.classList.toggle('active',h===page||(page===''&&h==='index.html'));
  });
}