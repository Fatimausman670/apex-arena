/* chatbot.js — Apex Arena AI Assistant Widget */
(function () {
  const API = (function () {
    const h = window.location.hostname;
    return (h === 'localhost' || h === '127.0.0.1')
      ? 'http://localhost:3000/api'
      : window.location.origin + '/api';
  })();

  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    #apex-chat-btn {
      position: fixed; bottom: 28px; right: 28px; z-index: 9999;
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, #f5a623, #e8860a);
      border: none; cursor: pointer; font-size: 24px;
      box-shadow: 0 4px 20px rgba(245,166,35,.5);
      transition: transform .2s, box-shadow .2s;
      display: flex; align-items: center; justify-content: center;
    }
    #apex-chat-btn:hover { transform: scale(1.1); box-shadow: 0 6px 28px rgba(245,166,35,.7); }
    #apex-chat-box {
      position: fixed; bottom: 96px; right: 28px; z-index: 9998;
      width: 340px; max-height: 480px;
      background: #0d1117; border: 1px solid rgba(245,166,35,.3);
      border-radius: 16px; display: flex; flex-direction: column;
      box-shadow: 0 8px 40px rgba(0,0,0,.6);
      transform: scale(0) translateY(20px); transform-origin: bottom right;
      opacity: 0; pointer-events: none; transition: all .25s cubic-bezier(.34,1.56,.64,1);
    }
    #apex-chat-box.open {
      transform: scale(1) translateY(0); opacity: 1; pointer-events: all;
    }
    #apex-chat-head {
      padding: 14px 16px; background: linear-gradient(135deg,rgba(245,166,35,.15),rgba(245,166,35,.05));
      border-bottom: 1px solid rgba(245,166,35,.2); border-radius: 16px 16px 0 0;
      display: flex; align-items: center; gap: 10px;
    }
    #apex-chat-head .avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg,#f5a623,#e8860a);
      display: flex; align-items: center; justify-content: center; font-size: 18px;
    }
    #apex-chat-head .info .name { font-weight: 700; font-size: 14px; color: #fff; }
    #apex-chat-head .info .status { font-size: 11px; color: #2ecc71; }
    #apex-chat-head .close-btn {
      margin-left: auto; background: transparent; border: none;
      color: #666; cursor: pointer; font-size: 18px; padding: 4px;
    }
    #apex-chat-head .close-btn:hover { color: #fff; }
    #apex-chat-msgs {
      flex: 1; overflow-y: auto; padding: 14px; display: flex;
      flex-direction: column; gap: 10px; min-height: 200px; max-height: 300px;
    }
    #apex-chat-msgs::-webkit-scrollbar { width: 4px; }
    #apex-chat-msgs::-webkit-scrollbar-track { background: transparent; }
    #apex-chat-msgs::-webkit-scrollbar-thumb { background: rgba(245,166,35,.3); border-radius: 2px; }
    .chat-msg { display: flex; gap: 8px; animation: msgIn .2s ease; }
    @keyframes msgIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    .chat-msg.user { flex-direction: row-reverse; }
    .chat-msg .bubble {
      max-width: 75%; padding: 9px 13px; border-radius: 12px;
      font-size: 13px; line-height: 1.5; color: #fff;
    }
    .chat-msg.bot .bubble { background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.08); border-radius: 4px 12px 12px 12px; }
    .chat-msg.user .bubble { background: linear-gradient(135deg,#f5a623,#e8860a); border-radius: 12px 4px 12px 12px; }
    .chat-msg .msg-avatar { width: 28px; height: 28px; border-radius: 50%; background: rgba(245,166,35,.2); display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; margin-top: 2px; }
    .chat-msg.user .msg-avatar { background: rgba(245,166,35,.3); }
    .typing-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #f5a623; margin: 0 2px; animation: typingBounce .8s infinite; }
    .typing-dot:nth-child(2) { animation-delay: .15s; }
    .typing-dot:nth-child(3) { animation-delay: .3s; }
    @keyframes typingBounce { 0%,60%,100% { transform:translateY(0); } 30% { transform:translateY(-6px); } }
    #apex-chat-input-row {
      padding: 12px; border-top: 1px solid rgba(255,255,255,.07);
      display: flex; gap: 8px;
    }
    #apex-chat-input {
      flex: 1; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1);
      border-radius: 20px; color: #fff; font-size: 13px; padding: 9px 14px;
      outline: none; font-family: inherit; resize: none;
      transition: border-color .2s;
    }
    #apex-chat-input:focus { border-color: rgba(245,166,35,.5); }
    #apex-chat-send {
      width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg,#f5a623,#e8860a);
      border: none; cursor: pointer; font-size: 16px;
      display: flex; align-items: center; justify-content: center;
      transition: transform .2s; align-self: flex-end;
    }
    #apex-chat-send:hover { transform: scale(1.1); }
    #apex-chat-send:disabled { opacity: .5; cursor: not-allowed; transform: none; }
  `;
  document.head.appendChild(style);

  // Build HTML
  const btn = document.createElement('button');
  btn.id = 'apex-chat-btn';
  btn.title = 'Chat with Apex AI';
  btn.textContent = '⚡';

  const box = document.createElement('div');
  box.id = 'apex-chat-box';
  box.innerHTML = `
    <div id="apex-chat-head">
      <div class="avatar">⚡</div>
      <div class="info">
        <div class="name">Apex AI Assistant</div>
        <div class="status">● Online</div>
      </div>
      <button class="close-btn" id="apexChatClose">✕</button>
    </div>
    <div id="apex-chat-msgs">
      <div class="chat-msg bot">
        <div class="msg-avatar">⚡</div>
        <div class="bubble">Hey! I'm Apex, your tournament assistant. Ask me about players, tournaments, or game tips! 🎮</div>
      </div>
    </div>
    <div id="apex-chat-input-row">
      <input id="apex-chat-input" type="text" placeholder="Ask me anything…" maxlength="300"/>
      <button id="apex-chat-send">➤</button>
    </div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(box);

  // Logic
  const msgs = document.getElementById('apex-chat-msgs');
  const input = document.getElementById('apex-chat-input');
  const send  = document.getElementById('apex-chat-send');

  btn.addEventListener('click', () => { box.classList.toggle('open'); if(box.classList.contains('open')) input.focus(); });
  document.getElementById('apexChatClose').addEventListener('click', () => box.classList.remove('open'));
  input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg(); });
  send.addEventListener('click', sendMsg);

  function addMsg(text, who) {
    const d = document.createElement('div');
    d.className = 'chat-msg ' + who;
    d.innerHTML = `<div class="msg-avatar">${who==='bot'?'⚡':'🎮'}</div><div class="bubble">${text}</div>`;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }

  function showTyping() {
    const d = document.createElement('div');
    d.className = 'chat-msg bot'; d.id = 'typingIndicator';
    d.innerHTML = `<div class="msg-avatar">⚡</div><div class="bubble"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>`;
    msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight;
  }

  async function sendMsg() {
    const text = input.value.trim();
    if (!text) return;
    input.value = ''; send.disabled = true;
    addMsg(text, 'user');
    showTyping();
    try {
      const r = await fetch(API + '/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: text }) });
      const data = await r.json();
      document.getElementById('typingIndicator')?.remove();
      addMsg(data.reply || 'Sorry, I could not get a response.', 'bot');
    } catch {
      document.getElementById('typingIndicator')?.remove();
      addMsg('Sorry, I am offline right now. Please try again later.', 'bot');
    }
    send.disabled = false; input.focus();
  }
})();
