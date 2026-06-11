(function () {
  const history = [];

  const widget = document.createElement('div');
  widget.innerHTML = `
    <div id="apex-chat-btn" style="position:fixed;bottom:24px;right:24px;z-index:9999;cursor:pointer;
      background:#f59e0b;border-radius:50%;width:56px;height:56px;display:flex;
      align-items:center;justify-content:center;font-size:24px;box-shadow:0 4px 12px rgba(0,0,0,0.4)">
      💬
    </div>
    <div id="apex-chat-box" style="display:none;position:fixed;bottom:90px;right:24px;z-index:9999;
      width:340px;background:#1a1a2e;border:1px solid #f59e0b;border-radius:12px;
      box-shadow:0 8px 24px rgba(0,0,0,0.5);font-family:sans-serif;overflow:hidden">
      <div style="background:#f59e0b;padding:12px 16px;color:#000;font-weight:bold;font-size:14px;display:flex;justify-content:space-between;align-items:center">
        <span>⚡ ApexBot</span>
        <span style="display:flex;gap:10px;align-items:center">
          <span id="apex-chat-reset" title="New chat" style="cursor:pointer;font-size:16px">🔄</span>
          <span id="apex-chat-close" style="cursor:pointer">✕</span>
        </span>
      </div>
      <div id="apex-chat-messages" style="height:320px;overflow-y:auto;padding:12px;
        display:flex;flex-direction:column;gap:8px;"></div>
      <div style="display:flex;border-top:1px solid #333;padding:8px;">
        <input id="apex-chat-input" type="text" placeholder="Ask about tournaments, players..."
          style="flex:1;background:#0d0d1a;border:1px solid #333;color:#fff;padding:8px;
          border-radius:6px;font-size:13px;outline:none" />
        <button id="apex-chat-send" style="background:#f59e0b;border:none;color:#000;
          padding:8px 12px;margin-left:6px;border-radius:6px;cursor:pointer;font-weight:bold">
          ➤
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(widget);

  const btn = document.getElementById('apex-chat-btn');
  const box = document.getElementById('apex-chat-box');
  const closeBtn = document.getElementById('apex-chat-close');
  const resetBtn = document.getElementById('apex-chat-reset');
  const input = document.getElementById('apex-chat-input');
  const sendBtn = document.getElementById('apex-chat-send');
  const messages = document.getElementById('apex-chat-messages');

  btn.onclick = () => box.style.display = box.style.display === 'none' ? 'block' : 'none';
  closeBtn.onclick = () => box.style.display = 'none';

  resetBtn.onclick = () => {
    history.length = 0;
    messages.innerHTML = '';
    welcome();
  };

  function addMessage(text, role) {
    const div = document.createElement('div');
    div.style.cssText = `padding:8px 10px;border-radius:8px;font-size:13px;max-width:85%;line-height:1.45;white-space:pre-wrap;
      ${role === 'user'
        ? 'background:#f59e0b;color:#000;align-self:flex-end'
        : 'background:#2a2a4a;color:#e0e0e0;align-self:flex-start'}`;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addMessage(text, 'user');

    const typing = document.createElement('div');
    typing.textContent = '…';
    typing.style.cssText = 'background:#2a2a4a;color:#aaa;padding:8px 10px;border-radius:8px;font-size:13px;align-self:flex-start';
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    try {
      const BASE = (location.hostname === '127.0.0.1' || location.hostname === 'localhost')
        ? 'http://localhost:3000'
        : '';
      const res = await fetch(BASE + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // send the prior conversation so the bot remembers context
        body: JSON.stringify({ message: text, history: history })
      });
      const data = await res.json();
      messages.removeChild(typing);
      const reply = data.reply || 'Sorry, something went wrong.';
      addMessage(reply, 'assistant');
      // store both turns AFTER a successful round trip
      history.push({ role: 'user', content: text });
      history.push({ role: 'assistant', content: reply });
    } catch {
      messages.removeChild(typing);
      addMessage('Sorry, I could not connect. Is the server running?', 'assistant');
    }
  }

  sendBtn.onclick = sendMessage;
  input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

  function welcome() {
    addMessage("👋 Hey! I'm ApexBot. Ask me about tournaments, prize pools, players, or the leaderboard!", 'assistant');
  }
  setTimeout(welcome, 400);
})();
